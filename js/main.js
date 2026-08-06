// ============================================================
// Entry point: state machine (title/overworld/battle/gameover)
// and the main game loop.
// ============================================================
(function () {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const input = window.BONO_INPUT;

  const titleScreen = document.getElementById('title-screen');
  const gameoverScreen = document.getElementById('gameover-screen');
  const btnNewGame = document.getElementById('btn-new-game');
  const btnContinue = document.getElementById('btn-continue');
  const btnGameoverOk = document.getElementById('btn-gameover-ok');

  const hudHpBar = document.getElementById('hud-hp-bar');
  const hudMpBar = document.getElementById('hud-mp-bar');
  const hudHpText = document.getElementById('hud-hp-text');
  const hudMpText = document.getElementById('hud-mp-text');
  const hudLevel = document.getElementById('hud-level');
  const hudGold = document.getElementById('hud-gold');

  const playerImg = new Image();
  playerImg.src = 'bonobono.png';
  window.BONO_PLAYER_IMG = playerImg;

  let mode = 'title'; // title | overworld | battle | gameover
  let gs = null; // { player, flags }
  let autosaveAccum = 0;

  function newGame() {
    gs = { player: new window.BONO_Player(), flags: {} };
    window.BONO_OVERWORLD.setState(gs);
    titleScreen.classList.add('hidden');
    mode = 'overworld';
    window.BONO_DIALOGUE.start('', [
      '이곳은 향기 나무 숲과 맞닿은 바닷가 마을.',
      '이 마을엔 순진하고 온순한 성격에, 따뜻한 마음씨를 가진 어린 해달 한 마리가 살고 있다.',
      '행동도 말투도 어딘가 느릿느릿, 조금은 어벙한 편인데... 아빠도 꼭 그런 걸 보면 이건 아무래도 집안 내력인 모양이다.',
      '"너부리야~... 포로리야~..." 라고 부르는 그 늘어지는 목소리만 들어도, 누구나 금방 알아챌 정도.',
      '해달은 몸에 피하지방이 없어서, 비상식량으로 조개를 늘 몸에 지니고 다녀야 한다. 그래서인지 이 어린 해달은 조개가 없으면 유난히 안절부절못한다.',
      '어릴 적엔 어두운 밤이 무서워 늘 아빠 배 위에서 잠들곤 했다는데, 지금은 제법 씩씩해졌다... 아마도.',
      '오늘도 마을 어딘가에서 큰 소동이 벌어진 모양인데...',
    ]);
  }

  function continueGame() {
    const data = window.BONO_SAVE.load();
    if (!data) return;
    const p = new window.BONO_Player();
    Object.assign(p, data.player);
    p.setPosition(data.player.tileX, data.player.tileY);
    gs = { player: p, flags: data.flags || {} };
    window.BONO_OVERWORLD.setState(gs);
    titleScreen.classList.add('hidden');
    mode = 'overworld';
  }

  btnNewGame.addEventListener('click', newGame);
  btnContinue.addEventListener('click', () => { if (window.BONO_SAVE.hasSave()) continueGame(); });
  btnGameoverOk.addEventListener('click', () => {
    gs.player.map = 'village';
    gs.player.setPosition(10, 10);
    gs.player.hp = gs.player.maxHp;
    gs.player.gold = Math.floor(gs.player.gold * 0.5);
    window.BONO_SAVE.save(gs.player, gs.flags);
    gameoverScreen.classList.add('hidden');
    mode = 'overworld';
  });

  function showTitle() {
    btnContinue.disabled = !window.BONO_SAVE.hasSave();
    titleScreen.classList.remove('hidden');
  }
  showTitle();

  function onBattleEnd(result) {
    if (result === 'lose') {
      mode = 'gameover';
      gameoverScreen.classList.remove('hidden');
      return;
    }
    mode = 'overworld';
    window.BONO_SAVE.save(gs.player, gs.flags);
  }

  function updateHud() {
    if (!gs) return;
    const p = gs.player;
    hudLevel.textContent = `Lv ${p.level}`;
    hudHpBar.style.width = `${Math.max(0, (p.hp / p.maxHp) * 100)}%`;
    hudMpBar.style.width = `${Math.max(0, (p.mp / p.maxMp) * 100)}%`;
    hudHpText.textContent = `${p.hp}/${p.maxHp}`;
    hudMpText.textContent = `${p.mp}/${p.maxMp}`;
    hudGold.textContent = `💰 ${p.gold}`;
  }

  let lastTime = performance.now();
  function loop(now) {
    let dt = now - lastTime;
    lastTime = now;
    if (dt > 100) dt = 100; // avoid huge jumps after tab-away

    if (mode === 'overworld') {
      const ev = window.BONO_OVERWORLD.update(dt, input);
      if (ev && ev.type === 'battle') {
        mode = 'battle';
        window.BONO_BATTLE.start(gs, ev, onBattleEnd);
      }
      autosaveAccum += dt;
      if (autosaveAccum > 5000) { autosaveAccum = 0; window.BONO_SAVE.save(gs.player, gs.flags); }
    } else if (mode === 'battle') {
      window.BONO_BATTLE.update(dt, input);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (mode === 'overworld' || mode === 'gameover') {
      window.BONO_OVERWORLD.render(ctx, now);
    } else if (mode === 'battle') {
      window.BONO_BATTLE.render(ctx, now);
    }
    updateHud();

    input.endFrame();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame((t) => { lastTime = t; requestAnimationFrame(loop); });
})();
