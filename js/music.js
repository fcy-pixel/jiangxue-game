/**
 * music.js
 * 背景音樂 — HTML5 Audio，循環播放古風 MP3
 * 默認播放：頁面第一次互動後自動開始，按鈕切換靜音
 */

const AmbientMusic = (() => {
  let audio = null;
  let muted = false;
  let started = false;

  function getAudio() {
    if (!audio) {
      audio = new Audio('audio/bgm.mp3');
      audio.loop = true;
      audio.volume = 0.45;
    }
    return audio;
  }

  function setBtn(playing) {
    const btn = document.getElementById('music-toggle');
    if (!btn) return;
    if (playing) {
      btn.innerHTML = '&#9835;';
      btn.classList.add('playing');
      btn.title = '點擊靜音';
    } else {
      btn.innerHTML = '&#128263;';
      btn.classList.remove('playing');
      btn.title = '點擊播放音樂';
    }
  }

  function startOnce() {
    if (started || muted) return;
    started = true;
    getAudio().play().then(() => setBtn(true)).catch(() => {});
  }

  function init() {
    // 嘗試立即自動播放
    getAudio().play().then(() => {
      started = true;
      setBtn(true);
    }).catch(() => {
      // 被攔截：等第一次用戶互動
      const events = ['click', 'keydown', 'touchstart', 'pointerdown'];
      function onInteract() {
        startOnce();
        events.forEach(e => document.removeEventListener(e, onInteract));
      }
      events.forEach(e => document.addEventListener(e, onInteract, { once: true }));
    });
  }

  function toggle() {
    const a = getAudio();
    if (!a.paused) {
      muted = true;
      a.pause();
      setBtn(false);
    } else {
      muted = false;
      started = true;
      a.play().catch(() => {});
      setBtn(true);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { toggle };
})();
