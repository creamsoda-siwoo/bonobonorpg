// ============================================================
// Keyboard input: tracks held keys + "just pressed" edge events.
// ============================================================
(function () {
  const held = new Set();
  const justPressed = new Set();

  const KEYMAP = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
    Space: 'confirm', Enter: 'confirm',
    KeyI: 'inventory', Escape: 'cancel',
  };

  window.addEventListener('keydown', (e) => {
    const action = KEYMAP[e.code];
    if (!action) return;
    e.preventDefault();
    if (!held.has(action)) justPressed.add(action);
    held.add(action);
  });

  window.addEventListener('keyup', (e) => {
    const action = KEYMAP[e.code];
    if (!action) return;
    held.delete(action);
  });

  window.BONO_INPUT = {
    isHeld(action) { return held.has(action); },
    isPressed(action) { return justPressed.has(action); },
    // call once per frame, after all systems have read this frame's input
    endFrame() { justPressed.clear(); },
  };
})();
