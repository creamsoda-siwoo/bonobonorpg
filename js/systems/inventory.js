// ============================================================
// Full-screen inventory overlay (opened with "I" while walking).
// ============================================================
(function () {
  const screenEl = document.getElementById('inventory-screen');
  const listEl = document.getElementById('inventory-list');
  const msgEl = document.getElementById('inventory-msg');

  let active = false;
  let player = null;
  let selected = 0;

  function itemsWithQty() {
    return player.inventory.filter((s) => s.qty > 0);
  }

  function render() {
    const slots = itemsWithQty();
    if (slots.length === 0) {
      listEl.innerHTML = '<div class="item-row"><span class="item-desc">가방이 비어있다.</span></div>';
      return;
    }
    if (selected >= slots.length) selected = slots.length - 1;
    listEl.innerHTML = slots.map((s, i) => {
      const def = window.BONO_ITEMS[s.itemId];
      const cls = 'item-row' + (i === selected ? ' selected' : '');
      return `<div class="${cls}"><span><span class="item-name">${def.name}</span> x${s.qty}<br><span class="item-desc">${def.desc}</span></span></div>`;
    }).join('');
  }

  function open(playerRef) {
    player = playerRef;
    msgEl.textContent = '';
    selected = 0;
    active = true;
    screenEl.classList.remove('hidden');
    render();
  }

  function close() {
    active = false;
    screenEl.classList.add('hidden');
  }

  function isActive() { return active; }

  function handleInput(input) {
    if (!active) return;
    const slots = itemsWithQty();
    if (input.isPressed('down') && slots.length) { selected = (selected + 1) % slots.length; render(); }
    if (input.isPressed('up') && slots.length) { selected = (selected - 1 + slots.length) % slots.length; render(); }
    if (input.isPressed('cancel')) { close(); return; }
    if (input.isPressed('confirm') && slots.length) {
      const slot = slots[selected];
      const def = window.BONO_ITEMS[slot.itemId];
      if (def.usable && !def.keyItem) {
        const msg = def.use(player);
        player.removeItem(slot.itemId, 1);
        msgEl.textContent = msg;
        render();
      }
    }
  }

  window.BONO_INVENTORY = { open, close, isActive, handleInput };
})();
