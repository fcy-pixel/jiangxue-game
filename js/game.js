/**
 * game.js
 * 江雪·問天 — 主遊戲引擎
 */

const GameEngine = (() => {
  /* ---------- 狀態 ---------- */
  let state = {
    fate: 50,
    flags: new Set(),
    currentNodeId: 'start',
    apiKey: '',
    isTyping: false,
    history: [], // { speaker, text }
  };

  /* ---------- DOM 快取 ---------- */
  const $ = id => document.getElementById(id);

  /* ---------- 初始化雪花 ---------- */
  function initSnow() {
    const container = $('snow-container');
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
  }

  /* ---------- 詩句動畫 ---------- */
  function animatePoem() {
    const lines = document.querySelectorAll('.poem-line, .poem-author');
    lines.forEach(el => {
      const delay = parseInt(el.dataset.delay || 0);
      el.style.animationDelay = delay + 'ms';
    });
  }

  /* ---------- 儲存 API Key ---------- */
  function saveApiKey() {
    const val = $('api-key-input').value.trim();
    if (!val) { showToast('請輸入 API Key'); return; }
    state.apiKey = val;
    showToast('API Key 已儲存 ✓');
  }

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
    // 讀取 localStorage 的 API key（如有）
    const stored = localStorage.getItem('qwen_api_key');
    if (stored) state.apiKey = stored;
    const inputVal = $('api-key-input').value.trim();
    if (inputVal) {
      state.apiKey = inputVal;
      localStorage.setItem('qwen_api_key', inputVal);
    }

    state.fate = 50;
    state.flags = new Set();
    state.currentNodeId = 'start';
    state.history = [];

    showScreen('screen-game');
    renderNode('start');
  }

  /* ---------- 渲染節點 ---------- */
  async function renderNode(nodeId) {
    const node = STORY[nodeId];
    if (!node) { console.error('找不到節點：', nodeId); return; }
    state.currentNodeId = nodeId;

    // 更新章節欄
    $('chapter-title').textContent = node.chapter || '';
    updateFateBar();

    // 更新場景
    if (node.scene) {
      $('scene-icon').textContent = node.scene.icon;
      $('scene-title').textContent = node.scene.title;
    }

    // 更新角色肖像
    const char = CHARACTERS[node.speaker];
    if (char) {
      $('portrait-icon').textContent = char.icon;
      $('portrait-name').textContent = char.name;
      $('portrait-frame').style.borderColor = char.color;
    }

    // 清空選項與按鈕
    $('choices-area').innerHTML = '';
    $('btn-continue').style.display = 'none';
    $('ai-badge').style.display = 'none';

    // 取得對話文字
    let text = node.text;

    if (node.useAI && state.apiKey) {
      $('ai-badge').style.display = 'block';
      text = await fetchAIDialogue(node);
    }

    // 打字機效果顯示文字
    await typeText(text);

    // 顯示選項或繼續按鈕
    if (node.choices && node.choices.length > 0) {
      renderChoices(node.choices);
    } else if (node.next === '__ending__') {
      $('btn-continue').textContent = '揭曉命運 ›';
      $('btn-continue').style.display = 'block';
      $('btn-continue').onclick = triggerEnding;
    } else if (node.next) {
      $('btn-continue').style.display = 'block';
      $('btn-continue').onclick = () => renderNode(node.next);
    } else if (node.ending) {
      $('btn-continue').textContent = '揭曉命運 ›';
      $('btn-continue').style.display = 'block';
      $('btn-continue').onclick = () => showEnding(ENDINGS[node.ending]);
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
  async function fetchAIDialogue(node) {
    showLoading(true);
    const char = CHARACTERS[node.speaker];
    if (!char) { showLoading(false); return node.text; }

    // 構建歷史上下文
    const messages = [
      { role: 'system', content: char.systemPrompt },
    ];

    // 加入之前的對話歷史（最多5條）
    const recentHistory = state.history.slice(-5);
    recentHistory.forEach(h => {
      messages.push({ role: 'assistant', content: h.text });
    });

    messages.push({
      role: 'user',
      content: `[場景：${node.scene?.title || ''}] [命運指數：${state.fate}] [旗標：${[...state.flags].join(',')}]\n${node.aiPrompt}`,
    });

    // 8 秒超時：避免 loading 一直卡住
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          apiKey: state.apiKey,
          messages,
          characterId: node.speaker,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }

      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content || node.text;
      state.history.push({ speaker: node.speaker, text });
      return text;
    } catch (e) {
      if (e.name === 'AbortError') {
        showToast('⏱ AI 回應逾時，顯示預設文字');
      } else {
        console.error('Qwen API 錯誤：', e);
        showToast('AI 對話暫時無法使用，顯示預設文字');
      }
      return node.text;
    } finally {
      clearTimeout(timer);
      showLoading(false);
    }
  }

  /* ---------- 載入動畫 ---------- */
  function showLoading(show) {
    $('loading-overlay').style.display = show ? 'flex' : 'none';
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
  return { startGame, saveApiKey, nextNode, restart };
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

  // 從 localStorage 讀取 API key
  const stored = localStorage.getItem('qwen_api_key');
  if (stored) {
    document.getElementById('api-key-input').value = stored;
  }
});
