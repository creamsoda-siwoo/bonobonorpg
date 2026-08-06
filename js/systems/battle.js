// ============================================================
// Turn-based battle system.
// ============================================================
(function () {
  const logEl = document.getElementById('battle-log');
  const menuEl = document.getElementById('battle-menu');
  const subEl = document.getElementById('battle-submenu');
  const uiEl = document.getElementById('battle-ui');

  const ACTIONS = ['attack', 'skill', 'item', 'run'];
  const MSG_MS = 850;

  const PLAYER_CRIT_CHANCE = 0.15;
  const MONSTER_CRIT_CHANCE = 0.08;
  const CRIT_MULT = 1.75;
  const SHAKE_MS = 260;

  let active = false;
  let state = null; // {player, flags}
  let encounter = null;
  let monster = null; // single-monster battles
  let bgBiome = 'forest';

  let phase = 'menu'; // menu | submenu | resolve | done
  let menuIndex = 0;
  let subItems = []; // {label, disabled, run()}
  let subIndex = 0;
  let msgQueue = [];
  let msgTimer = 0;
  let pendingResult = null; // 'win' | 'lose' | 'run'
  let onEndCb = null;
  let shakeTimer = 0;
  let shakeTarget = null; // 'monster' | 'player'

  function rollCrit(chance) { return Math.random() < chance; }

  function log(text) {
    logEl.textContent = text;
    logEl.classList.remove('crit-flash', 'crit-flash-enemy');
    if (text.startsWith('\u{1F4A5}')) {
      void logEl.offsetWidth; // restart animation if same class re-applied
      logEl.classList.add('crit-flash');
      shakeTimer = SHAKE_MS; shakeTarget = 'monster';
    } else if (text.startsWith('⚡')) {
      void logEl.offsetWidth;
      logEl.classList.add('crit-flash-enemy');
      shakeTimer = SHAKE_MS; shakeTarget = 'player';
    }
  }

  function pushMenu() {
    menuEl.classList.remove('hidden');
    subEl.classList.add('hidden');
    menuEl.innerHTML = ACTIONS.map((a, i) => {
      const labels = { attack: '싸운다', skill: '기술', item: '아이템', run: '도망친다' };
      return `<div class="battle-btn${i === menuIndex ? ' selected' : ''}">${labels[a]}</div>`;
    }).join('');
  }

  function renderSub() {
    subEl.classList.remove('hidden');
    menuEl.classList.add('hidden');
    if (subItems.length === 0) {
      subEl.innerHTML = '<div class="sub-row">없음 (Esc로 취소)</div>';
      return;
    }
    subEl.innerHTML = subItems.map((it, i) => `<div class="sub-row${i === subIndex ? ' selected' : ''}">${it.label}</div>`).join('');
    const selected = subEl.querySelector('.sub-row.selected');
    if (selected) selected.scrollIntoView({ block: 'nearest' });
  }

  function start(gameState, enc, onEnd) {
    state = gameState;
    encounter = enc;
    monster = { ...window.BONO_MONSTERS[enc.monsterIds[0]] };
    monster.maxHp = monster.hp;
    onEndCb = onEnd;
    bgBiome = state.player.map;
    active = true;
    phase = 'menu';
    menuIndex = 0;
    pendingResult = null;
    msgQueue = [];
    shakeTimer = 0;
    shakeTarget = null;
    uiEl.classList.remove('hidden');
    log(`${monster.name}이(가) 나타났다!`);
    pushMenu();
  }

  function isActive() { return active; }

  function endBattle(result) {
    active = false;
    uiEl.classList.add('hidden');
    const cb = onEndCb; onEndCb = null;
    if (cb) cb(result, monster);
  }

  function queueAndResolve(lines) {
    msgQueue = lines.slice();
    phase = 'resolve';
    menuEl.classList.add('hidden');
    subEl.classList.add('hidden');
    if (msgQueue.length) log(msgQueue[0]);
    msgTimer = MSG_MS;
  }

  function enemyTurnLines() {
    const lines = [];
    if (monster.hp > 0) {
      let dmg = Math.max(1, monster.atk - state.player.def + Math.floor(Math.random() * 5) - 2);
      const crit = rollCrit(MONSTER_CRIT_CHANCE);
      if (crit) dmg = Math.round(dmg * CRIT_MULT);
      state.player.hp = Math.max(0, state.player.hp - dmg);
      lines.push(crit
        ? `⚡ 치명타! ${monster.name}의 일격이 급소에 꽂혔다! ${dmg}의 피해를 입었다.`
        : `${monster.name}의 공격! ${dmg}의 피해를 입었다.`);
      if (state.player.hp <= 0) {
        lines.push('보노보노는 쓰러지고 말았다...');
        pendingResult = 'lose';
      }
    }
    return lines;
  }

  function victoryLines() {
    const lines = [`${monster.name}을(를) 쓰러뜨렸다!`];
    const expMsgs = state.player.gainExp(monster.exp);
    state.player.gold += monster.gold;
    lines.push(...expMsgs);
    lines.push(`${monster.gold} G를 주웠다.`);
    if (monster.id === 'acornbug') {
      state.flags.acornKills = (state.flags.acornKills || 0) + 1;
    }
    if (monster.id === 'crab' && Math.random() < 0.6) {
      state.player.addItem('shell_piece', 1);
      lines.push('[부서진 조개껍질]을(를) 주웠다!');
    }
    if (encounter.boss && encounter.obj) {
      encounter.obj.defeated = true;
      state.player.addItem(encounter.obj.itemId, 1);
      state.flags.hasShell = true;
      const idef = window.BONO_ITEMS[encounter.obj.itemId];
      lines.push('"...헛소리 하지 마! 이 조개는 할아버지 거야!!"');
      lines.push('평소엔 좀처럼 화내는 법이 없던 보노보노의 우렁찬 목소리에, 동굴 전체가 조용해졌다.');
      lines.push(`[${idef.name}]을(를) 손에 넣었다!`);
    }
    pendingResult = 'win';
    return lines;
  }

  function doAttack() {
    let dmg = Math.max(1, state.player.atk - monster.def + Math.floor(Math.random() * 5) - 2);
    const crit = rollCrit(PLAYER_CRIT_CHANCE);
    if (crit) dmg = Math.round(dmg * CRIT_MULT);
    monster.hp = Math.max(0, monster.hp - dmg);
    const lines = [crit
      ? `\u{1F4A5} 치명타!! 급소를 찔렀다! ${monster.name}에게 ${dmg}의 피해!`
      : `보노보노의 공격! ${monster.name}에게 ${dmg}의 피해!`];
    if (monster.hp <= 0) lines.push(...victoryLines());
    else lines.push(...enemyTurnLines());
    queueAndResolve(lines);
  }

  function doSkill(skillId) {
    const sdef = window.BONO_SKILLS.find((s) => s.id === skillId);
    state.player.mp -= sdef.mpCost;
    let lines;
    if (sdef.type === 'heal') {
      const before = state.player.hp;
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + sdef.healAmount);
      const healed = state.player.hp - before;
      lines = [`보노보노의 [${sdef.name}]! HP가 ${healed} 회복됐다!`];
      lines.push(...enemyTurnLines());
    } else {
      let dmg = Math.max(1, Math.round(state.player.atk * sdef.power) - monster.def);
      const crit = rollCrit(PLAYER_CRIT_CHANCE);
      if (crit) dmg = Math.round(dmg * CRIT_MULT);
      monster.hp = Math.max(0, monster.hp - dmg);
      lines = [crit
        ? `\u{1F4A5} 치명타!! [${sdef.name}]이(가) 급소를 찔렀다! ${monster.name}에게 ${dmg}의 피해!`
        : `보노보노의 [${sdef.name}]! ${monster.name}에게 ${dmg}의 피해!`];
      if (monster.hp <= 0) lines.push(...victoryLines());
      else lines.push(...enemyTurnLines());
    }
    queueAndResolve(lines);
  }

  function doItem(itemId) {
    const idef = window.BONO_ITEMS[itemId];
    const msg = idef.use(state.player);
    state.player.removeItem(itemId, 1);
    const lines = [msg, ...enemyTurnLines()];
    queueAndResolve(lines);
  }

  function doRun() {
    if (Math.random() < 0.55) {
      queueAndResolve(['무사히 도망쳤다!']);
      pendingResult = 'run';
    } else {
      queueAndResolve(['당황한 보노보노! "뾰뾰뾰뾰옹~"', '도망치지 못했다!', ...enemyTurnLines()]);
    }
  }

  function openSkillMenu() {
    subItems = state.player.skills.map((id) => {
      const sdef = window.BONO_SKILLS.find((s) => s.id === id);
      const canUse = state.player.mp >= sdef.mpCost;
      return {
        label: `${sdef.name} (MP${sdef.mpCost})${canUse ? '' : ' - MP부족'}`,
        run() { if (canUse) doSkill(id); else log('MP가 부족하다...'); },
      };
    });
    subIndex = 0;
    phase = 'submenu';
    renderSub();
  }

  function openItemMenu() {
    subItems = state.player.inventory
      .filter((s) => s.qty > 0 && window.BONO_ITEMS[s.itemId].battleUsable)
      .map((s) => {
        const idef = window.BONO_ITEMS[s.itemId];
        return { label: `${idef.name} x${s.qty}`, run() { doItem(s.itemId); } };
      });
    subIndex = 0;
    phase = 'submenu';
    renderSub();
  }

  function update(dt, input) {
    if (!active) return;
    if (shakeTimer > 0) shakeTimer = Math.max(0, shakeTimer - dt);

    if (phase === 'resolve') {
      msgTimer -= dt;
      if (msgTimer <= 0) {
        msgQueue.shift();
        if (msgQueue.length) { log(msgQueue[0]); msgTimer = MSG_MS; }
        else {
          if (pendingResult) { endBattle(pendingResult); return; }
          phase = 'menu'; menuIndex = 0; log('다음 행동을 선택하세요.'); pushMenu();
        }
      }
      return;
    }

    if (phase === 'menu') {
      if (input.isPressed('down')) { menuIndex = (menuIndex + 1) % ACTIONS.length; pushMenu(); }
      if (input.isPressed('up')) { menuIndex = (menuIndex - 1 + ACTIONS.length) % ACTIONS.length; pushMenu(); }
      if (input.isPressed('confirm')) {
        const action = ACTIONS[menuIndex];
        if (action === 'attack') doAttack();
        else if (action === 'skill') openSkillMenu();
        else if (action === 'item') openItemMenu();
        else if (action === 'run') doRun();
      }
      return;
    }

    if (phase === 'submenu') {
      if (input.isPressed('down') && subItems.length) { subIndex = (subIndex + 1) % subItems.length; renderSub(); }
      if (input.isPressed('up') && subItems.length) { subIndex = (subIndex - 1 + subItems.length) % subItems.length; renderSub(); }
      if (input.isPressed('cancel')) { phase = 'menu'; pushMenu(); }
      if (input.isPressed('confirm') && subItems.length) { subItems[subIndex].run(); }
      return;
    }
  }

  const BIOME_BG = {
    village: ['#bfe6a0', '#8fcf6a'],
    forest: ['#2f5a2a', '#1f3d1c'],
    beach: ['#bfe3f2', '#8fc7de'],
    cave: ['#2a2438', '#161320'],
  };

  function render(ctx, t) {
    if (!active) return;
    const [c1, c2] = BIOME_BG[bgBiome] || BIOME_BG.forest;
    const grad = ctx.createLinearGradient(0, 0, 0, 480);
    grad.addColorStop(0, c1); grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 480);

    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, 300, 640, 180);

    // crit shake offsets
    let mShakeX = 0, mShakeY = 0, pShakeX = 0, pShakeY = 0;
    if (shakeTimer > 0) {
      const s = 7 * (shakeTimer / SHAKE_MS);
      const ox = (Math.random() - 0.5) * 2 * s;
      const oy = (Math.random() - 0.5) * 2 * s;
      if (shakeTarget === 'monster') { mShakeX = ox; mShakeY = oy; }
      else { pShakeX = ox; pShakeY = oy; }
    }

    // monster
    const mx = 420 + mShakeX, my = 190 + mShakeY;
    const bob = Math.sin(t / 260) * 4;
    window.BONO_RENDER.shadow(ctx, mx, my + 46, 40, 10);
    monster.draw(ctx, mx, my, bob);
    window.BONO_RENDER.outlineText(ctx, monster.name, mx, my - 78, { font: 'bold 16px sans-serif', align: 'center' });
    window.BONO_RENDER.hpBar(ctx, mx - 60, my - 68, 120, 10, monster.hp / monster.maxHp, '#5ee06c', '#2fae3f');

    // player
    const px = 150 + pShakeX, py = 320 + pShakeY;
    window.BONO_RENDER.shadow(ctx, px, py + 40, 30, 8);
    ctx.save();
    ctx.translate(px, py);
    const img = window.BONO_PLAYER_IMG;
    const size = 88;
    if (img && img.complete && img.naturalWidth) ctx.drawImage(img, -size / 2, -size + 10, size, size);
    ctx.restore();
    window.BONO_RENDER.outlineText(ctx, `보노보노  Lv${state.player.level}`, px, py - 96, { font: 'bold 14px sans-serif', align: 'center' });
  }

  window.BONO_BATTLE = { start, update, render, isActive };
})();
