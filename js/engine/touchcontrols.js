// ============================================================
// On-screen touch controls for mobile: mirrors keyboard actions
// (d-pad -> up/down/left/right, buttons -> confirm/cancel/inventory).
// ============================================================
(function () {
  const input = window.BONO_INPUT;
  const buttons = document.querySelectorAll('#touch-controls [data-action]');

  buttons.forEach((btn) => {
    const action = btn.dataset.action;

    const start = (e) => {
      e.preventDefault();
      if (btn.setPointerCapture) {
        try { btn.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
      input.press(action);
      btn.classList.add('active');
    };
    const end = (e) => {
      e.preventDefault();
      input.release(action);
      btn.classList.remove('active');
    };

    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', end);
    btn.addEventListener('pointercancel', end);
    btn.addEventListener('pointerleave', end);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  });
})();
