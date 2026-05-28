/**
 * game.js
 * 江雪·問天 — 主遊戲引擎（含自由對話功能）
 */

const GameEngine = (() => {
  /* ---------- 狀態 ---------- */
  let state = {
    fate: 50,
    flags: new Set(),
    currentNodeId: 'start',
    apiKey: '',
    isTyping: false,
    history: [],        // 全局對話歷史 { speaker, text }
    nodeMessages: [],   // 當前節點的多輪對話 [{ role, content }]
    currentChar: null,  // 當前節點的角色資料
    isSending: false,   // 防止重複送出
  };

  /* ---------- DOM 快取 ---------- */
  const $ = id => document.getElementById(id);

  /* ---------- 切換畫面 ---------- */
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.remove('active');
      s.style.display = 'none';
    });
    const screen = $(id);
    screen.style.display = 'flex';
    requestAnimationFrame(() => screen.classList.add('active'));
  }

  /* ---------- 開始遊戲 ---------- */
  function startGame() {
    state.fate = 50;
    state.flags = new Set();
    state.currentNodeId = 'start';
    state.history = [];
    state.nodeMessages = [];
    state.currentChar = null;

    showScreen('screen-game');
    renderNode('start');
  }

  /* ---------- 建立 system prompt（加書面語要求）---------- */
  function buildSystemPrompt(char) {
    return char.systemPrompt +
      '\n\n【重要語言要求】必須使用現代書面語作答，絕對不可使用文言文。' +
      '禁止使用「吾」「汝」「乃」「豈」「焉」「固」「然」（作轉折語）等文言字詞，' +
      '一律改用「我」「你」「是」「但是」「確實」等現代書面語。' +
      '保持文雅風格，每次回應不超過100字，語氣符合角色性格。';
  }

  /* ---------- 渲染節點 ---------- */
  async function renderNode(nodeId) {
    const node = STORY[nodeId];
    if (!node) { console.error('找不到節點：', nodeId); return; }
    state.currentNodeId = nodeId;
    state.nodeMessages = [];
    state.currentChar = CHARACTERS[node.speaker] || null;
    hideChatArea();

    // 更新頂欄
    $('chapter-title').textContent = node.chapter || '';
    updateFateBar();

    // 更新場景
    if (node.scene) {
      $('scene-icon').textContent = node.scene.icon;
      $('scene-title').textContent = node.scene.title;
    }

    // 更新角色肖像
    if (state.currentChar) {
      $('portrait-icon').textContent = state.currentChar.icon;
      $('portrait-name').textContent = state.currentChar.name;
      $('portrait-frame').style.borderColor = state.currentChar.color;
    }

    // 清空選項與按鈕
    $('choices-area').innerHTML = '';
    $('btn-continue').style.display = 'none';
    $('ai-badge').style.display = 'none';

    // 取得初始對話文字
    let text = node.text;
    if (node.useAI) {
      $('ai-badge').style.display = 'block';
      text = await fetchInitialDialogue(node);
      $('ai-badge').style.display = 'none';
    }

    // 建立節點 messages 基礎（給後續自由對話用）
    if (state.currentChar) {
      state.nodeMessages = [
        { role: 'system', content: buildSystemPrompt(state.currentChar) },
        { role: 'assistant', content: text },
      ];
    }

    // 打字機顯示文字
    await typeText(text);

    // 顯示下方控件
    if (node.choices && node.choices.length > 0) {
      renderChoices(node.choices);
      if (node.useAI) showChatArea();
    } else if (node.next === '__ending__') {
      if (node.useAI) showChatArea();
      $('btn-continue').textContent = '揭曉命運 ›';
      $('btn-continue').style.display = 'block';
      $('btn-continue').onclick = triggerEnding;
    } else if (node.next) {
      if (node.useAI) showChatArea();
      $('btn-continue').textContent = '繼續故事 ›';
      $('btn-continue').style.display = 'block';
      $('btn-continue').onclick = () => renderNode(node.next);
    } else if (node.ending) {
      $('btn-continue').textContent = '揭曉命運 ›';
      $('btn-continue').style.display = 'block';
      $('btn-continue').onclick = () => showEnding(ENDINGS[node.ending]);
    }
  }

  /* ---------- 顯示 / 隱藏自由對話區 ---------- */
  function showChatArea() {
    const area = $('chat-area');
    $('chat-history').innerHTML = '';
    $('chat-input').value = '';
    area.style.display = 'flex';
    $('chat-input').onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChat();
      }
    };
  }

  function hideChatArea() {
    $('chat-area').style.display = 'none';
    $('chat-history').innerHTML = '';
    if ($('chat-input')) $('chat-input').value = '';
  }

  /* ---------- 自由對話：發送訊息 ---------- */
  async function sendChat() {
    if (state.isSending) return;
    const input = $('chat-input');
    const userText = input.value.trim();
    if (!userText) return;

    state.isSending = true;
    const sendBtn = $('btn-send');
    sendBtn.disabled = true;
    input.value = '';

    // 顯示玩家氣泡
    appendBubble('player', null, userText);
    state.nodeMessages.push({ role: 'user', content: userText });

    // 顯示「正在回應」loading 氣泡
    const loadingBubble = appendLoadingBubble();

    // 呼叫 AI
    const reply = await fetchChatReply();

    // 移除 loading 氣泡，顯示回應
    loadingBubble.remove();
    appendBubble('character', state.currentChar?.name || '角色', reply);
    state.nodeMessages.push({ role: 'assistant', content: reply });

    // 同時更新主對話框（打字機）
    await typeText(reply);

    state.isSending = false;
    sendBtn.disabled = false;
    input.focus();
  }

  /* ---------- 追加氣泡到對話紀錄 ---------- */
  function appendBubble(type, name, text) {
    const history = $('chat-history');
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${type}`;
    if (type === 'character' && name) {
      const nameEl = document.createElement('span');
      nameEl.className = 'bubble-name';
      nameEl.textContent = name + '：';
      bubble.appendChild(nameEl);
    }
    bubble.appendChild(document.createTextNode(text));
    history.appendChild(bubble);
    history.scrollTop = history.scrollHeight;
    return bubble;
  }

  function appendLoadingBubble() {
    const history = $('chat-history');
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble character';
    bubble.innerHTML = '<span class="bubble-name">' +
      (state.currentChar?.name || '角色') + '：</span>' +
      '<span style="color:#6b6b5a;font-style:italic">正在回應……</span>';
    history.appendChild(bubble);
    history.scrollTop = history.scrollHeight;
    return bubble;
  }

  /* ---------- 節點初始 AI 對話 ---------- */
  async function fetchInitialDialogue(node) {
    showLoading(true);
    const char = state.currentChar;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const messages = [
        { role: 'system', content: buildSystemPrompt(char) },
        { role: 'user', content: node.aiPrompt || node.text },
      ];
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          apiKey: state.apiKey,
          messages,
          characterId: char?.id || '',
        }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      return data.choices?.[0]?.message?.content || node.text;
    } catch (e) {
      if (e.name === 'AbortError') return node.text;
      console.error('Initial dialogue error:', e);
      return node.text;
    } finally {
      clearTimeout(timer);
      showLoading(false);
    }
  }

  /* ---------- 自由對話 AI 請求 ---------- */
  async function fetchChatReply() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          apiKey: state.apiKey,
          messages: state.nodeMessages,
          characterId: state.currentChar?.id || '',
        }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      return data.choices?.[0]?.message?.content || '（角色沉默不語……）';
    } catch (e) {
      if (e.name === 'AbortError') return '（回應逾時，請再試一次。）';
      console.error('Chat error:', e);
      return '（暫時無法取得回應，請稍後再試。）';
    } finally {
      clearTimeout(timer);
    }
  }

  /* ---------- 打字機效果 ---------- */
  function typeText(text) {
    return new Promise(resolve => {
      state.isTyping = true;
      const el = $('dialogue-text');
      const cursor = $('typing-cursor');
      el.textContent = '';
      cursor.style.display = 'inline';
      let i = 0;
      const speed = 30;
      function tick() {
        if (i < text.length) {
          el.textContent += text[i++];
          setTimeout(tick, speed);
        } else {
          cursor.style.display = 'none';
          state.isTyping = false;
          resolve();
        }
      }
      tick();
    });
  }

  /* ---------- 渲染選項 ---------- */
  function renderChoices(choices) {
    const area = $('choices-area');
    area.innerHTML = '';
    choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = choice.text;
      btn.onclick = () => selectChoice(choice);
      area.appendChild(btn);
    });
  }

  /* ---------- 選擇選項 ---------- */
  function selectChoice(choice) {
    // 更新命運值
    if (choice.fateDelta) {
      state.fate = Math.max(0, Math.min(100, state.fate + choice.fateDelta));
    }
    // 設置旗標
    if (choice.flag) {
      state.flags.add(choice.flag);
    }
    // 清空選項
    $('choices-area').innerHTML = '';
    // 前往下一節點
    renderNode(choice.nextId);
  }

  /* ---------- 繼續（無選項） ---------- */
  function nextNode() {
    const node = STORY[state.currentNodeId];
    if (node && node.next && node.next !== '__ending__') {
      renderNode(node.next);
    }
  }

  /* ---------- 觸發結局 ---------- */
  function triggerEnding() {
    const ending = determineEnding(state.fate, state.flags);
    showEnding(ending);
  }

  /* ---------- 顯示結局畫面 ---------- */
  function showEnding(ending) {
    $('ending-seal').textContent = ending.seal;
    $('ending-title').textContent = ending.title;
    $('ending-poem').innerHTML = ending.poem.replace(/\n/g, '<br>');
    $('ending-desc').innerHTML = ending.desc.replace(/\n/g, '<br>');
    $('ending-history').textContent = ending.history;

    const tagsEl = $('ending-tags');
    tagsEl.innerHTML = '';
    ending.tags.forEach(tag => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = tag;
      tagsEl.appendChild(span);
    });

    showScreen('screen-ending');
  }

  /* ---------- 更新命運指數條 ---------- */
  function updateFateBar() {
    $('fate-fill').style.width = state.fate + '%';
    $('fate-value').textContent = state.fate;
  }

  /* ---------- 重新開始 ---------- */
  function restart() {
    showScreen('screen-intro');
    document.querySelector('#screen-intro').style.opacity = '1';
  }

  /* ---------- Qwen AI 對話 ---------- */
  /* ---------- 載入動畫 ---------- */
  function showLoading(show) {
    const el = $('loading-overlay');
    el.style.display = show ? 'flex' : 'none';
  }

  /* ---------- Toast 提示 ---------- */
  function showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.style.cssText = `
        position:fixed; bottom:5rem; left:50%; transform:translateX(-50%);
        background:rgba(26,16,8,0.95); border:1px solid #c8960c;
        color:#e8b84b; padding:0.5em 1.5em; font-size:0.85rem;
        letter-spacing:0.1em; z-index:9999; border-radius:2px;
        transition:opacity 0.4s;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
  }

  /* ---------- 公開介面 ---------- */
  return { startGame, nextNode, restart, sendChat };
})();

/* ---------- 頁面載入初始化 ---------- */
window.addEventListener('DOMContentLoaded', () => {
  // 雪花
  (function initSnow() {
    const container = document.getElementById('snow-container');
    const chars = ['❄', '❅', '❆', '·', '∘'];
    for (let i = 0; i < 40; i++) {
      const el = document.createElement('span');
      el.className = 'snowflake';
      el.textContent = chars[Math.floor(Math.random() * chars.length)];
      el.style.left = Math.random() * 100 + 'vw';
      el.style.fontSize = (0.6 + Math.random() * 0.8) + 'em';
      const dur = 8 + Math.random() * 14;
      const delay = Math.random() * 15;
      el.style.animation = `snowfall ${dur}s ${delay}s linear infinite`;
      container.appendChild(el);
    }
  })();

  // 詩句 delay
  document.querySelectorAll('.poem-line, .poem-author').forEach(el => {
    const delay = parseInt(el.dataset.delay || 0);
    el.style.animationDelay = delay + 'ms';
  });


});
