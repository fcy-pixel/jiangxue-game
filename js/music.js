/**
 * music.js
 * 古典氛圍音樂 — 純 Web Audio API，五聲音階琴音
 * 模擬古琴撥弦效果，無需外部音訊檔案
 */

const AmbientMusic = (() => {
  let ctx = null;
  let playing = false;
  let scheduleTimer = null;

  /* 五聲音階（G 宮調）：G3 A3 B3 D4 E4 G4 A4 B4 D5 E5 G5 */
  const NOTES = [
    196.00, 220.00, 246.94,
    293.66, 329.63,
    392.00, 440.00, 493.88,
    587.33, 659.25,
    783.99,
  ];

  /* 低音基礎持音（宮音 G2/G3） */
  const DRONES = [98.00, 196.00];

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  /* 撥弦音：正弦波 + 泛音，指數衰減 */
  function pluck(freq, startTime, duration, vol) {
    const c = getCtx();
    const masterGain = c.createGain();
    masterGain.gain.setValueAtTime(0, startTime);
    masterGain.gain.linearRampToValueAtTime(vol, startTime + 0.008);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    masterGain.connect(c.destination);

    [1, 2, 3, 4].forEach((h, i) => {
      const osc = c.createOscillator();
      const hGain = c.createGain();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq * h;
      hGain.gain.value = 1 / Math.pow(2, i + 1);
      osc.connect(hGain);
      hGain.connect(masterGain);
      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  /* 隨機五聲音階短句（2~4 音） */
  function schedulePhrase() {
    if (!playing) return;
    const c = getCtx();
    const now = c.currentTime;

    const count = 2 + Math.floor(Math.random() * 3);
    let t = now + 0.05;

    for (let i = 0; i < count; i++) {
      const freq = NOTES[Math.floor(Math.random() * NOTES.length)];
      const dur  = 2.8 + Math.random() * 2.2;
      const vol  = 0.06 + Math.random() * 0.05;
      const gap  = 0.5 + Math.random() * 1.2;
      pluck(freq, t, dur, vol);
      t += gap;
    }

    /* 偶爾加入低音持音 */
    if (Math.random() < 0.35) {
      const drone = DRONES[Math.floor(Math.random() * DRONES.length)];
      pluck(drone, now + 0.02, 4 + Math.random() * 2, 0.04);
    }

    /* 下一個短句間隔 2~5 秒靜默 */
    const nextIn = (t - now + 1.5 + Math.random() * 3.5) * 1000;
    scheduleTimer = setTimeout(schedulePhrase, nextIn);
  }

  function start() {
    if (playing) return;
    const c = getCtx();
    if (c.state === 'suspended') c.resume();
    playing = true;
    schedulePhrase();
  }

  function stop() {
    playing = false;
    if (scheduleTimer) { clearTimeout(scheduleTimer); scheduleTimer = null; }
    if (ctx && ctx.state === 'running') ctx.suspend();
  }

  /* btn 為觸發的按鈕元素，切換樣式 */
  function toggle(btn) {
    if (playing) {
      stop();
      if (btn) { btn.innerHTML = '&#9834;'; btn.classList.remove('playing'); }
    } else {
      start();
      if (btn) { btn.innerHTML = '&#9835;'; btn.classList.add('playing'); }
    }
    return playing;
  }

  return { start, stop, toggle };
})();
