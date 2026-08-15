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

  function press(action) {
    if (!held.has(action)) justPressed.add(action);
    held.add(action);
  }

  function release(action) {
    held.delete(action);
  }

  window.addEventListener('keydown', (e) => {
    const action = KEYMAP[e.code];
    if (!action) return;
    e.preventDefault();
    press(action);
  });

  window.addEventListener('keyup', (e) => {
    const action = KEYMAP[e.code];
    if (!action) return;
    release(action);
  });

  window.BONO_INPUT = {
    isHeld(action) { return held.has(action); },
    isPressed(action) { return justPressed.has(action); },
    // used by on-screen touch controls to mirror keyboard actions
    press,
    release,
    // call once per frame, after all systems have read this frame's input
    endFrame() { justPressed.clear(); },
  };
})();
