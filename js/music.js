/**
 * music.js
 * 背景音樂 — HTML5 Audio，循環播放古風 MP3
 */

const AmbientMusic = (() => {
  let audio = null;
  let playing = false;

  function getAudio() {
    if (!audio) {
      audio = new Audio('audio/bgm.mp3');
      audio.loop = true;
      audio.volume = 0.45;
    }
    return audio;
  }

  function start() {
    const a = getAudio();
    a.play().catch(() => {});
    playing = true;
  }

  function stop() {
    if (audio) {
      audio.pause();
    }
    playing = false;
  }

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
