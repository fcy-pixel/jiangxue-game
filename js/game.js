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

  /* ---------- 建立 system prompt（語言規則置頂）---------- */
  /* 語言提醒短句，附加到每條 user message 末尾 */
  const LANG_REMINDER = '\n\n（請用現代書面中文回答，不可用文言文，不可說「吾」「汝」「乃」「矣」等文言詞。）';

  function buildSystemPrompt(char) {
    const LANG_RULE =
      '【語言規定 — 這是最重要的規定，必須百分之百遵守】\n' +
      '本遊戲供中學生使用。雖然你扮演古代歷史人物，但你必須全程使用【現代書面中文（白話文）】交談，絕對禁止使用文言文。\n\n' +
      '禁止使用的文言詞（括號內是必須改用的現代詞）：\n' +
      '• 吾、余 → 改說「我」\n' +
      '• 汝、爾、卿 → 改說「你」\n' +
      '• 乃 → 改說「是」或「就是」\n' +
      '• 亦 → 改說「也」\n' +
      '• 豈 → 改說「難道」\n' +
      '• 焉、哉、矣、也（語氣詞）→ 刪去或換現代語氣詞\n' +
      '• 與爾 → 改說「跟你」或「和你」\n\n' +
      '正確與錯誤示範：\n' +
      '❌ 錯誤：「吾乃柳宗元，願與爾共議天下大計。」\n' +
      '✅ 正確：「我是柳宗元，很高興跟你討論這些問題。」\n' +
      '❌ 錯誤：「此事豈能輕言放棄？吾心甚痛矣。」\n' +
      '✅ 正確：「這件事怎麼能輕易放棄呢？我心裡非常難受。」\n\n' +
      '說話風格：像受過良好教育的現代人，用正式清晰的書面中文，學生一看就能明白。每次回應不超過80字。\n\n' +
      '【角色代入規定 — 必須嚴格遵守】\n' +
      '你必須完全代入角色，任何情況下都不能說「我是AI」「我不知道」「這超出我的認識範圍」。\n\n' +
      '當學生問到角色不可能知道的事情（例如：現代科技、未來事件、角色身後發生的歷史），你要用角色的性格和處境，婉轉地回應：\n' +
      '• 柳宗元：用詩意或哲理轉移，感嘆自己身處逆境所見有限，或用永州的山水作比喻\n' +
      '• 王叔文：充滿激情地把話題帶回改革理想，說那些事情跟天下大義比起來微不足道\n' +
      '• 劉禹錫：樂觀地說自己雖然被貶、見識有限，但相信未來總有人會明白\n' +
      '• 韓愈：以儒家道理作答，說君子應專注於當下能做的事，其餘不必多慮\n' +
      '• 江上漁翁：用禪意反問，暗示答案本來就在學生心中\n' +
      '• 唐憲宗：以帝王口吻說此事不在今日議題之內，或把焦點轉回朝廷大事\n\n' +
      '示範：\n' +
      '學生問：「你知道手機是什麼嗎？」\n' +
      '✅ 柳宗元正確回應：「我不太明白你說的是什麼，但在永州的日子，我最常用的，不過是一支毛筆。也許你說的那樣東西，跟我的筆一樣，都是傳遞心意的工具吧？」\n' +
      '❌ 錯誤回應：「我是古代人，不知道手機是什麼。」\n\n' +
      '【對話對象說明 — 非常重要】\n' +
      '現在跟你說話的人就是【柳宗元（字子厚）】本人。學生扮演柳宗元，用第一人稱「我」向你提問。\n' +
      '• 王叔文、劉禹錫應稱呼對方「子厚」，以老友的口吻交談\n' +
      '• 韓愈應稱呼對方「子厚賢弟」或「子厚」，以文壇前輩身份交談\n' +
      '• 江上漁翁應稱呼對方「年輕人」或「你這位詩人」\n' +
      '• 唐憲宗應稱呼對方「柳宗元」或「愛卿」，保持帝王與臣子的關係\n' +
      '絕對不可以把對方當成不認識的陌生人或學生，要完全沉浸在你們的歷史關係之中。\n\n' +
      '【角色背景】\n';
    return LANG_RULE + char.systemPrompt;
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
      const imgEl = $('portrait-img');
      const charEl = $('portrait-char');
      if (state.currentChar.portrait) {
        imgEl.src = state.currentChar.portrait;
        imgEl.alt = state.currentChar.name;
        imgEl.style.display = 'block';
        charEl.style.display = 'none';
      } else {
        imgEl.style.display = 'none';
        charEl.style.display = 'block';
        charEl.textContent = state.currentChar.char || state.currentChar.name[0];
      }
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
      const initUserPrompt = node.useAI
        ? (node.aiPrompt || node.text)
        : node.text;
      state.nodeMessages = [
        { role: 'system',    content: buildSystemPrompt(state.currentChar) },
        { role: 'user',      content: initUserPrompt + LANG_REMINDER },
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

    // 建議問題 chips
    const suggestEl = $('chat-suggestions');
    suggestEl.innerHTML = '';
    const suggestions = state.currentChar?.suggestions;
    if (suggestions && suggestions.length > 0) {
      suggestEl.style.display = 'flex';
      suggestions.forEach(q => {
        const btn = document.createElement('button');
        btn.className = 'suggestion-chip';
        btn.textContent = q;
        btn.onclick = () => { $('chat-input').value = q; sendChat(); };
        suggestEl.appendChild(btn);
      });
    } else {
      suggestEl.style.display = 'none';
    }

    $('chat-input').onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChat();
      }
    };
    setupMicButton();
  }

  function hideChatArea() {
    $('chat-area').style.display = 'none';
    $('chat-history').innerHTML = '';
    if ($('chat-input')) $('chat-input').value = '';
    const suggestEl = $('chat-suggestions');
    if (suggestEl) { suggestEl.innerHTML = ''; suggestEl.style.display = 'none'; }
    stopMic();
  }

  /* ---------- 廣東話語音輸入 ---------- */
  let _recognition = null;
  let _micListening = false;

  function stopMic() {
    if (_recognition && _micListening) { try { _recognition.stop(); } catch(e) {} }
  }

  function setupMicButton() {
    const micBtn = $('btn-mic');
    if (!micBtn) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { micBtn.style.display = 'none'; return; }

    micBtn.onclick = () => {
      if (_micListening) { stopMic(); return; }
      _recognition = new SR();
      _recognition.lang = 'zh-HK';
      _recognition.interimResults = true;
      _recognition.maxAlternatives = 1;
      _recognition.continuous = false;

      _recognition.onstart = () => {
        _micListening = true;
        micBtn.classList.add('listening');
        micBtn.title = '點擊停止錄音';
      };
      _recognition.onresult = (ev) => {
        const t = ev.results[0][0].transcript;
        $('chat-input').value = t;
      };
      _recognition.onend = () => {
        _micListening = false;
        micBtn.classList.remove('listening');
        micBtn.title = '廣東話語音輸入';
      };
      _recognition.onerror = (ev) => {
        console.warn('語音識別錯誤:', ev.error);
        _micListening = false;
        micBtn.classList.remove('listening');
      };
      _recognition.start();
    };
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
    state.nodeMessages.push({ role: 'user', content: userText + LANG_REMINDER });

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
        { role: 'user', content: (node.aiPrompt || node.text) + LANG_REMINDER },
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
