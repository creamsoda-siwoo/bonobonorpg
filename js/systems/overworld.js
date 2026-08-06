// ============================================================
// Overworld: map rendering, grid movement, collision, warps,
// NPC/chest/boss interaction, random encounters.
// ============================================================
(function () {
  const TS = window.BONO_TILE_SIZE;
  const TILES = window.BONO_TILES;
  const DIR_OFFSET = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };

  let state = null; // { player, flags }
  let pendingEvent = null;

  function currentMap() { return window.BONO_MAPS[state.player.map]; }
  function npcsOnMap() { return window.BONO_NPCS[state.player.map] || []; }

  function tileAt(map, x, y) {
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) return null;
    return map.grid[y][x];
  }

  function entityBlockingAt(map, x, y) {
    for (const n of npcsOnMap()) if (n.x === x && n.y === y) return n;
    if (map.objects) for (const o of map.objects) if (o.x === x && o.y === y) return o;
    return null;
  }

  function isWalkable(map, x, y) {
    const t = tileAt(map, x, y);
    if (!t) return false;
    const def = TILES[t];
    if (!def || !def.walkable) return false;
    if (entityBlockingAt(map, x, y)) return false;
    return true;
  }

  function facingTile() {
    const [dx, dy] = DIR_OFFSET[state.player.dir];
    return { x: state.player.tileX + dx, y: state.player.tileY + dy };
  }

  function pickWeighted(table) {
    const total = table.reduce((s, e) => s + e.weight, 0);
    let r = Math.random() * total;
    for (const e of table) { r -= e.weight; if (r <= 0) return e.id; }
    return table[0].id;
  }

  function startNpcDialogue(npc) {
    const lines = npc.getLines(state);
    window.BONO_DIALOGUE.start(npc.name, lines, () => {
      if (npc.onTalk) npc.onTalk(state);
      if (npc.shop) window.BONO_SHOP.open(npc.shop, state.player);
    });
  }

  function startChestDialogue(obj) {
    if (obj.opened) {
      window.BONO_DIALOGUE.start('', ['빈 상자였다.']);
      return;
    }
    const def = window.BONO_ITEMS[obj.itemId];
    obj.opened = true;
    state.player.addItem(obj.itemId, 1);
    window.BONO_DIALOGUE.start('', [`상자를 열었다!`, `[${def.name}]을(를) 손에 넣었다!`]);
  }

  function startBossDialogue(obj) {
    if (obj.defeated) {
      window.BONO_DIALOGUE.start('', ['텅 빈 왕게의 둥지다.']);
      return;
    }
    const mdef = window.BONO_MONSTERS[obj.monsterId];
    window.BONO_DIALOGUE.start('', [`${mdef.name}이(가) 반짝이는 조개를 움켜쥐고 있다!`, '전투 시작!'], () => {
      pendingEvent = { type: 'battle', boss: true, monsterIds: [obj.monsterId], obj };
    });
  }

  function tryInteract() {
    const { x, y } = facingTile();
    const npc = npcsOnMap().find((n) => n.x === x && n.y === y);
    if (npc) { startNpcDialogue(npc); return; }
    const map = currentMap();
    const obj = map.objects && map.objects.find((o) => o.x === x && o.y === y);
    if (obj) {
      if (obj.type === 'chest') startChestDialogue(obj);
      else if (obj.type === 'boss') startBossDialogue(obj);
    }
  }

  function handleArrival() {
    const map = currentMap();
    const { tileX: x, tileY: y } = state.player;
    const warp = map.warps.find((w) => w.x === x && w.y === y);
    if (warp) {
      state.player.map = warp.toMap;
      state.player.setPosition(warp.toX, warp.toY);
      return null;
    }
    const t = tileAt(map, x, y);
    const def = TILES[t];
    if (def && def.encounter && map.encounterTable.length && Math.random() < map.encounterRate) {
      const monsterId = pickWeighted(map.encounterTable);
      return { type: 'battle', boss: false, monsterIds: [monsterId] };
    }
    return null;
  }

  function setState(s) { state = s; }

  function update(dt, input) {
    if (!state) return null;

    if (window.BONO_DIALOGUE.isActive()) {
      pendingEvent = null;
      if (input.isPressed('confirm')) window.BONO_DIALOGUE.advance();
      const ev = pendingEvent; pendingEvent = null;
      return ev;
    }
    if (window.BONO_SHOP.isActive()) { window.BONO_SHOP.handleInput(input); return null; }
    if (window.BONO_INVENTORY.isActive()) { window.BONO_INVENTORY.handleInput(input); return null; }

    if (input.isPressed('inventory')) { window.BONO_INVENTORY.open(state.player); return null; }

    const player = state.player;
    const map = currentMap();
    let arrived = false;

    if (!player.moving) {
      let dx = 0, dy = 0;
      if (input.isHeld('up')) { dx = 0; dy = -1; }
      else if (input.isHeld('down')) { dx = 0; dy = 1; }
      else if (input.isHeld('left')) { dx = -1; dy = 0; }
      else if (input.isHeld('right')) { dx = 1; dy = 0; }

      if (dx !== 0 || dy !== 0) {
        const nx = player.tileX + dx, ny = player.tileY + dy;
        if (isWalkable(map, nx, ny)) player.startMove(dx, dy);
        else player.dir = dx < 0 ? 'left' : dx > 0 ? 'right' : dy < 0 ? 'up' : 'down';
      } else if (input.isPressed('confirm')) {
        tryInteract();
      }
    }

    arrived = player.update(dt);
    if (arrived) {
      const ev = handleArrival();
      if (ev) return ev;
    }
    return null;
  }

  // ---------------- rendering ----------------
  function drawTile(ctx, ch, px, py, x, y) {
    const def = TILES[ch];
    const checker = (x + y) % 2 === 0;
    ctx.fillStyle = (checker && def.color2) ? def.color2 : def.color;
    ctx.fillRect(px, py, TS, TS);

    if (def.deco === 'tree') {
      ctx.fillStyle = '#6b4a2a';
      ctx.fillRect(px + TS / 2 - 3, py + TS - 10, 6, 10);
      ctx.fillStyle = '#2f6b2a';
      ctx.beginPath(); ctx.arc(px + TS / 2, py + TS / 2 - 4, TS / 2 - 2, 0, Math.PI * 2); ctx.fill();
    } else if (def.deco === 'water') {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px + 4, py + TS / 2); ctx.quadraticCurveTo(px + TS / 2, py + TS / 2 - 6, px + TS - 4, py + TS / 2); ctx.stroke();
    } else if (def.deco === 'rock') {
      ctx.fillStyle = '#6f6f6f';
      ctx.beginPath(); ctx.ellipse(px + TS / 2, py + TS / 2 + 4, TS / 2 - 4, TS / 2 - 8, 0, 0, Math.PI * 2); ctx.fill();
    } else if (def.deco === 'house') {
      ctx.fillStyle = '#8a5a35'; ctx.fillRect(px + 4, py + 12, TS - 8, TS - 14);
      ctx.fillStyle = '#c94a3a';
      ctx.beginPath(); ctx.moveTo(px, py + 12); ctx.lineTo(px + TS / 2, py - 4); ctx.lineTo(px + TS, py + 12); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#4a3020'; ctx.fillRect(px + TS / 2 - 4, py + TS - 14, 8, 12);
    } else if (def.deco === 'caveWall') {
      ctx.fillStyle = '#171420';
      ctx.fillRect(px + 2, py + 2, TS - 4, TS - 4);
    }

    if (def.tall) {
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const bx = px + 6 + i * 8;
        ctx.beginPath(); ctx.moveTo(bx, py + TS - 4); ctx.lineTo(bx + 2, py + TS - 16); ctx.stroke();
      }
    }
  }

  function drawNpc(ctx, npc) {
    const cx = npc.x * TS + TS / 2, cy = npc.y * TS + TS / 2;
    window.BONO_RENDER.shadow(ctx, cx, cy + 12, 12, 4);
    ctx.fillStyle = npc.color;
    ctx.beginPath(); ctx.ellipse(cx, cy + 6, 12, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy - 10, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(cx - 3, cy - 11, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 3, cy - 11, 1.6, 0, Math.PI * 2); ctx.fill();
  }

  function drawObject(ctx, obj, t) {
    const cx = obj.x * TS + TS / 2, cy = obj.y * TS + TS / 2;
    if (obj.type === 'chest') {
      window.BONO_RENDER.shadow(ctx, cx, cy + 10, 12, 4);
      ctx.fillStyle = obj.opened ? '#5a4a35' : '#a9772f';
      ctx.fillRect(cx - 12, cy - 4, 24, 14);
      ctx.fillStyle = obj.opened ? '#3f3323' : '#7a5322';
      ctx.fillRect(cx - 12, cy - 12, 24, 10);
      if (!obj.opened) { ctx.fillStyle = '#ffd75e'; ctx.fillRect(cx - 2, cy - 4, 4, 4); }
    } else if (obj.type === 'boss' && !obj.defeated) {
      const mdef = window.BONO_MONSTERS[obj.monsterId];
      const bob = Math.sin(t / 260) * 3;
      window.BONO_RENDER.shadow(ctx, cx, cy + 24, 30, 8);
      mdef.draw(ctx, cx, cy, bob);
    }
  }

  function render(ctx, t) {
    if (!state) return;
    const map = currentMap();
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        drawTile(ctx, map.grid[y][x], x * TS, y * TS, x, y);
      }
    }

    const entities = [];
    for (const npc of npcsOnMap()) entities.push({ y: npc.y, draw: () => drawNpc(ctx, npc) });
    if (map.objects) for (const obj of map.objects) entities.push({ y: obj.y, draw: () => drawObject(ctx, obj, t) });
    entities.push({ y: state.player.py / TS, draw: () => state.player.draw(ctx, window.BONO_PLAYER_IMG) });
    entities.sort((a, b) => a.y - b.y);
    for (const e of entities) e.draw();
  }

  window.BONO_OVERWORLD = { setState, update, render, isWalkable, tileAt, currentMap, getState: () => state };
})();
