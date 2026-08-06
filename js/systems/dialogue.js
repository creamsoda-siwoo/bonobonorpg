// ============================================================
// Dialogue box (DOM-based overlay).
// ============================================================
(function () {
  const boxEl = document.getElementById('dialogue-box');
  const nameEl = document.getElementById('dialogue-name');
  const textEl = document.getElementById('dialogue-text');

  let active = false;
  let lines = [];
  let index = 0;
  let onComplete = null;

  function start(name, linesArr, cb) {
    if (!linesArr || linesArr.length === 0) linesArr = [''];
    lines = linesArr;
    index = 0;
    onComplete = cb || null;
    active = true;
    nameEl.textContent = name || '';
    textEl.textContent = lines[0];
    boxEl.classList.remove('hidden');
  }

  function advance() {
    if (!active) return;
    index++;
    if (index >= lines.length) {
      active = false;
      boxEl.classList.add('hidden');
      const cb = onComplete;
      onComplete = null;
      if (cb) cb();
      return;
    }
    textEl.textContent = lines[index];
  }

  function isActive() { return active; }

  window.BONO_DIALOGUE = { start, advance, isActive };
})();
