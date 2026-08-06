// ============================================================
// Player entity: stats, leveling, inventory, grid movement/anim,
// and drawing (uses the real bonobono.png artwork).
// ============================================================
(function () {
  const TS = window.BONO_TILE_SIZE;
  const MOVE_MS = 150;

  const SKILLS = [
    { id: 'splash', name: '물보라', mpCost: 3, power: 1.6, desc: 'MP 3을 써서 적에게 물보라 공격', learnLv: 1 },
    { id: 'shellthrow', name: '조개 던지기', mpCost: 2, power: 1.3, desc: 'MP 2를 써서 조개껍질을 던진다', learnLv: 3 },
    { id: 'warmheart', name: '몽글몽글 온기', mpCost: 5, type: 'heal', healAmount: 30, desc: 'MP 5를 써서 HP를 30 회복한다', learnLv: 5 },
    { id: 'bigsplash', name: '큰 물보라', mpCost: 7, power: 2.6, desc: 'MP 7을 써서 강력한 물보라 공격', learnLv: 6 },
    { id: 'acornstorm', name: '도토리 폭풍', mpCost: 9, power: 3.2, desc: 'MP 9를 써서 도토리를 무수히 퍼붓는다', learnLv: 9 },
    { id: 'tidalclaw', name: '해일의 발톱', mpCost: 11, power: 3.7, desc: 'MP 11을 써서 밀려오는 파도처럼 날카로운 발톱을 휘두른다', learnLv: 10 },
    { id: 'nioigiblessing', name: '향기나무의 가호', mpCost: 14, power: 4.2, desc: 'MP 14를 써서 향기 나무 숲의 힘을 빌린 강력한 일격', learnLv: 12 },
  ];

  function expToNext(level) { return 20 + (level - 1) * 18; }

  class Player {
    constructor() {
      this.name = '보노보노';
      this.level = 1;
      this.exp = 0;
      this.maxHp = 30; this.hp = 30;
      this.maxMp = 10; this.mp = 10;
      this.baseAtk = 6; this.baseDef = 3;
      this.gold = 20;
      this.inventory = [{ itemId: 'potion', qty: 3 }];
      this.skills = ['splash'];

      this.map = 'village';
      this.tileX = 10; this.tileY = 10;
      this.px = this.tileX * TS; this.py = this.tileY * TS;
      this.dir = 'down'; // down/up/left/right
      this.moving = false;
      this.moveProgress = 0;
      this.fromX = this.tileX; this.fromY = this.tileY;
      this.animTime = 0;
    }

    get atk() { return this.baseAtk + (this.level - 1) * 2; }
    get def() { return this.baseDef + Math.floor((this.level - 1) * 1.2); }
    get expToNext() { return expToNext(this.level); }

    setPosition(x, y) {
      this.tileX = x; this.tileY = y;
      this.px = x * TS; this.py = y * TS;
      this.moving = false; this.moveProgress = 0;
    }

    startMove(dx, dy) {
      if (this.moving) return false;
      if (dx < 0) this.dir = 'left';
      else if (dx > 0) this.dir = 'right';
      else if (dy < 0) this.dir = 'up';
      else if (dy > 0) this.dir = 'down';
      this.fromX = this.tileX; this.fromY = this.tileY;
      this.targetX = this.tileX + dx; this.targetY = this.tileY + dy;
      this.moving = true;
      this.moveProgress = 0;
      return true;
    }

    // returns true the frame movement completes
    update(dt) {
      this.animTime += dt;
      if (this.moving) {
        this.moveProgress += dt / MOVE_MS;
        if (this.moveProgress >= 1) {
          this.moveProgress = 1;
          this.tileX = this.targetX; this.tileY = this.targetY;
          this.px = this.tileX * TS; this.py = this.tileY * TS;
          this.moving = false;
          return true;
        }
        this.px = (this.fromX + (this.targetX - this.fromX) * this.moveProgress) * TS;
        this.py = (this.fromY + (this.targetY - this.fromY) * this.moveProgress) * TS;
      }
      return false;
    }

    draw(ctx, img) {
      const cx = this.px + TS / 2;
      const cy = this.py + TS / 2;
      const bob = this.moving ? Math.abs(Math.sin(this.animTime / 60)) * 4 : Math.sin(this.animTime / 260) * 1.2;
      window.BONO_RENDER.shadow(ctx, cx, cy + 14, 14, 5);
      const size = 42;
      ctx.save();
      ctx.translate(cx, cy - bob + 6);
      if (this.dir === 'left') ctx.scale(-1, 1);
      if (img && img.complete && img.naturalWidth) {
        ctx.drawImage(img, -size / 2, -size, size, size);
      } else {
        ctx.fillStyle = '#4fb0e6';
        ctx.beginPath(); ctx.arc(0, -size / 2, size / 2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    // ---- stats / inventory helpers ----
    gainExp(amount) {
      const messages = [`${amount} 경험치를 얻었다!`];
      this.exp += amount;
      while (this.exp >= this.expToNext) {
        this.exp -= this.expToNext;
        this.level++;
        const hpUp = 8, mpUp = 3;
        this.maxHp += hpUp; this.hp = this.maxHp;
        this.maxMp += mpUp; this.mp = this.maxMp;
        messages.push(`레벨이 ${this.level}(으)로 올랐다! (HP+${hpUp} MP+${mpUp})`);
        for (const sk of SKILLS) {
          if (sk.learnLv === this.level && !this.skills.includes(sk.id)) {
            this.skills.push(sk.id);
            messages.push(`새로운 기술 [${sk.name}]을(를) 배웠다!`);
          }
        }
      }
      return messages;
    }

    addItem(itemId, qty) {
      qty = qty || 1;
      const slot = this.inventory.find((i) => i.itemId === itemId);
      if (slot) slot.qty += qty;
      else this.inventory.push({ itemId, qty });
    }

    removeItem(itemId, qty) {
      qty = qty || 1;
      const slot = this.inventory.find((i) => i.itemId === itemId);
      if (!slot) return false;
      slot.qty -= qty;
      if (slot.qty <= 0) this.inventory = this.inventory.filter((i) => i !== slot);
      return true;
    }

    hasItem(itemId) {
      const slot = this.inventory.find((i) => i.itemId === itemId);
      return !!slot && slot.qty > 0;
    }

    getItemQty(itemId) {
      const slot = this.inventory.find((i) => i.itemId === itemId);
      return slot ? slot.qty : 0;
    }

    isDead() { return this.hp <= 0; }
  }

  window.BONO_SKILLS = SKILLS;
  window.BONO_Player = Player;
})();
