// ============================================================
// Save / load via localStorage.
// ============================================================
(function () {
  const KEY = 'bono_rpg_save_v1';

  function collectObjectStates() {
    const out = {};
    for (const mapName in window.BONO_MAPS) {
      const objs = window.BONO_MAPS[mapName].objects;
      if (!objs) continue;
      for (const o of objs) {
        out[o.id] = { opened: !!o.opened, defeated: !!o.defeated };
      }
    }
    return out;
  }

  function applyObjectStates(saved) {
    if (!saved) return;
    for (const mapName in window.BONO_MAPS) {
      const objs = window.BONO_MAPS[mapName].objects;
      if (!objs) continue;
      for (const o of objs) {
        const s = saved[o.id];
        if (!s) continue;
        if ('opened' in s) o.opened = s.opened;
        if ('defeated' in s) o.defeated = s.defeated;
      }
    }
  }

  function save(player, flags) {
    const data = {
      player: {
        level: player.level, exp: player.exp,
        maxHp: player.maxHp, hp: player.hp,
        maxMp: player.maxMp, mp: player.mp,
        baseAtk: player.baseAtk, baseDef: player.baseDef,
        gold: player.gold,
        inventory: player.inventory,
        skills: player.skills,
        map: player.map, tileX: player.tileX, tileY: player.tileY,
      },
      flags,
      objects: collectObjectStates(),
      savedAt: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify(data));
    return data;
  }

  function hasSave() {
    return !!localStorage.getItem(KEY);
  }

  function load() {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    let data;
    try { data = JSON.parse(raw); } catch (e) { return null; }
    applyObjectStates(data.objects);
    return data;
  }

  function clear() { localStorage.removeItem(KEY); }

  window.BONO_SAVE = { save, load, hasSave, clear };
})();
