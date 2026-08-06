// ============================================================
// Item definitions
// ============================================================
(function () {
  const ITEMS = {
    potion: {
      id: 'potion', name: '포션', desc: 'HP를 20 회복한다', price: 10,
      usable: true, battleUsable: true,
      use(target) { const heal = 20; target.hp = Math.min(target.maxHp, target.hp + heal); return `${target.name}의 HP가 ${heal} 회복했다!`; },
    },
    hipotion: {
      id: 'hipotion', name: '하이포션', desc: 'HP를 50 회복한다', price: 30,
      usable: true, battleUsable: true,
      use(target) { const heal = 50; target.hp = Math.min(target.maxHp, target.hp + heal); return `${target.name}의 HP가 ${heal} 회복했다!`; },
    },
    ether: {
      id: 'ether', name: '에테르', desc: 'MP를 15 회복한다', price: 25,
      usable: true, battleUsable: true,
      use(target) { const heal = 15; target.mp = Math.min(target.maxMp, target.mp + heal); return `${target.name}의 MP가 ${heal} 회복했다!`; },
    },
    starfish: {
      id: 'starfish', name: '불가사리', desc: '쓰러졌을 때 HP 절반으로 되살아난다 (전투 중 자동 사용 불가, 직접 사용)', price: 0,
      usable: true, battleUsable: true,
      use(target) {
        if (target.hp > 0) return `${target.name}는 아직 쓰러지지 않았다.`;
        target.hp = Math.floor(target.maxHp / 2);
        return `반짝이는 불가사리의 힘으로 ${target.name}가 되살아났다!`;
      },
    },
    shiny_shell: {
      id: 'shiny_shell', name: '반짝이는 조개', desc: '향기 나무 숲 마을에 대대로 전해 내려오는, 보노보노가 애타게 찾던 소중한 조개껍질.', price: 0,
      usable: false, battleUsable: false, keyItem: true,
    },
    shell_piece: {
      id: 'shell_piece', name: '부서진 조개껍질', desc: '모래게가 떨어뜨린 조개껍질 조각. 야자게 아저씨가 모으고 있다.', price: 0,
      usable: false, battleUsable: false,
    },
  };

  window.BONO_ITEMS = ITEMS;
})();
