// ============================================================
// Shop overlay: buy items with gold.
// ============================================================
(function () {
  const SHOPS = {
    village_shop: { name: '시마리스 잡화점', items: ['potion', 'hipotion', 'ether'] },
  };

  const screenEl = document.getElementById('shop-screen');
  const titleEl = document.getElementById('shop-title');
  const listEl = document.getElementById('shop-list');
  const goldEl = document.getElementById('shop-gold');
  const msgEl = document.getElementById('shop-msg');

  let active = false;
  let player = null;
  let shop = null;
  let selected = 0;

  function render() {
    titleEl.textContent = shop.name;
    goldEl.textContent = `소지금: ${player.gold} G`;
    listEl.innerHTML = shop.items.map((id, i) => {
      const def = window.BONO_ITEMS[id];
      const cls = 'item-row' + (i === selected ? ' selected' : '');
      return `<div class="${cls}" data-index="${i}"><span><span class="item-name">${def.name}</span><br><span class="item-desc">${def.desc}</span></span><span>${def.price} G</span></div>`;
    }).join('');
  }

  function buySelected() {
    const id = shop.items[selected];
    const def = window.BONO_ITEMS[id];
    if (player.gold >= def.price) {
      player.gold -= def.price;
      player.addItem(id, 1);
      msgEl.textContent = `${def.name}을(를) 구매했다!`;
    } else {
      msgEl.textContent = '돈이 부족하다...';
    }
    render();
  }

  listEl.addEventListener('click', (e) => {
    const row = e.target.closest('.item-row');
    if (!row || !active) return;
    selected = Number(row.dataset.index);
    buySelected();
  });

  function open(shopId, playerRef) {
    shop = SHOPS[shopId];
    player = playerRef;
    msgEl.textContent = '';
    selected = 0;
    active = true;
    screenEl.classList.remove('hidden');
    render();
  }

  function close() { active = false; screenEl.classList.add('hidden'); }
  function isActive() { return active; }

  function handleInput(input) {
    if (!active) return;
    if (input.isPressed('down')) { selected = (selected + 1) % shop.items.length; render(); }
    if (input.isPressed('up')) { selected = (selected - 1 + shop.items.length) % shop.items.length; render(); }
    if (input.isPressed('cancel')) { close(); return; }
    if (input.isPressed('confirm')) buySelected();
  }

  window.BONO_SHOP = { open, close, isActive, handleInput };
})();
