// ============================================================
// NPC definitions per map. getLines(state) returns the dialogue
// lines to show right now, based on quest flags.
// ============================================================
(function () {
  const NPCS = {
    village: [
      {
        id: 'elder', x: 6, y: 3, name: '포도씨 할아버지', color: '#caa15a',
        getLines(state) {
          if (state.flags.shellReturned) {
            return ['오오, 반짝이는 조개가 다시 돌아왔구나.', '이건 우리 향기 나무 숲 마을에 대대로 전해오던 보물이란다.', '보노보노야, 정말 장하다. 이 마을의 자랑이야.'];
          }
          if (state.flags.hasShell) {
            return ['오오! 그게 바로 그 반짝이는 조개 아니냐!', '(조개를 건네주었다! 포도씨 할아버지가 활짝 웃는다)'];
          }
          if (state.flags.questStarted) {
            return ['동굴 깊은 곳에 사는 왕게가 조개를 가지고 있다는 소문이야.', '향기 나무 숲을 지나 동굴로 가보렴. 조심하고!', '숲 안쪽엔 미미즈쿠 대왕님도 계시니, 마주치면 인사부터 드리렴.'];
          }
          return ['보노보노야... 큰일이다.', '내가 애지중지하던 반짝이는 조개를 누가 훔쳐갔어.', '향기 나무 숲 너머 동굴 쪽에서 이상한 소리가 들렸다던데...', '(퀘스트 시작: 반짝이는 조개를 찾아라!)'];
        },
        onTalk(state) {
          if (!state.flags.questStarted && !state.flags.hasShell) state.flags.questStarted = true;
          if (state.flags.hasShell && !state.flags.shellReturned) {
            state.flags.shellReturned = true;
            state.player.removeItem('shiny_shell', 1);
            state.player.gold += 50;
          }
        },
      },
      {
        id: 'shopkeeper', x: 14, y: 3, name: '시마리스 군', color: '#c98a3a', shop: 'village_shop',
        getLines() { return ['어서 와! 여행에 필요한 물건들이 있어.', '(Space/Enter로 가게를 연다)']; },
      },
      {
        id: 'dad', x: 3, y: 4, name: '보노보노 아빠', color: '#4a7a9c',
        getLines(state) {
          if (state.flags.shellReturned) {
            return ['오, 조개를 찾아서 할아버지께 가져다 드렸다고? 장하구나, 보노.', '역시... 내 아들이야. …라고 말하고 싶은데, 사실 좀 놀랐단다.'];
          }
          if (state.flags.hasShell) {
            return ['오오... 조개를 손에 넣었구나.', '얼른... 할아버지께... 가져다... 드리렴...'];
          }
          return ['보노야, 겨드랑이 밑에 여분 조개는 잘 챙겼니?', '해달은 피하지방이 없어서, 비상식량이 없으면 큰일난단다.', '...아직 물고기 잡는 법은 못 가르쳐줬지만, 천천히 배우면 돼.', '너무 서두르지 말고... 다녀오렴...'];
        },
      },
      {
        id: 'friend', x: 4, y: 10, name: '아라이구마 군', color: '#8a8a8a',
        getLines(state) {
          if (state.flags.hasShell && !state.flags.shellReturned) return ['오, 조개를 찾았구나! 할아버지한테 얼른 가져다 드려!'];
          if (state.flags.acornQuestDone) {
            return ['도토리벌레는 이제 무섭지 않지? 역시 내 친구야!'];
          }
          if (state.flags.acornQuestStarted) {
            const kills = state.flags.acornKills || 0;
            if (kills >= 3) return ['오, 도토리벌레를 3마리나 해치웠구나! 정말 용감한걸.', '(약속한 대로 포션이랑 용돈을 줄게!)'];
            return [`아직 도토리벌레를 ${kills}/3마리 밖에 못 잡았잖아. 힘내!`];
          }
          return ['향기 나무 숲의 도토리벌레는 별로 안 무서운데, 멧돼지는 세게 박치기하니 조심해.', '동굴 쪽엔 훨씬 강한 녀석들이 있대.', '너 도토리벌레 3마리 잡을 수 있어? 나도 어릴 땐 무서워했었는데.', '(서브퀘스트 시작: 도토리벌레 3마리 퇴치하기)'];
        },
        onTalk(state) {
          if (state.flags.hasShell && !state.flags.shellReturned) return;
          if (!state.flags.acornQuestStarted && !state.flags.acornQuestDone) {
            state.flags.acornQuestStarted = true;
            return;
          }
          if (state.flags.acornQuestStarted && !state.flags.acornQuestDone && (state.flags.acornKills || 0) >= 3) {
            state.flags.acornQuestDone = true;
            state.player.addItem('potion', 1);
            state.player.gold += 15;
          }
        },
      },
    ],
    beach: [
      {
        id: 'crabfisher', x: 5, y: 4, name: '야자게 아저씨', color: '#b56a3a',
        getLines(state) {
          if (state.flags.shellQuestDone) {
            return ['조개껍질 고마워! 덕분에 근사한 목걸이를 만들 수 있겠어.', '모래사장 구석에 반짝이는 상자가 있던데... 열어봤나?'];
          }
          if (state.flags.shellQuestStarted) {
            const qty = state.player.getItemQty('shell_piece');
            if (qty >= 3) return ['오, 조개껍질을 3개나 모아왔구나! 정말 고마워.', '(Space/Enter로 조개껍질을 건넨다)'];
            return [`모래게가 떨어뜨리는 조개껍질을 ${qty}/3개 모아다 주겠나?`];
          }
          return ['모래사장 구석에 반짝이는 상자가 있던데... 열어봤나?', '요즘 모래게들이 조개껍질을 자꾸 흘리고 다니던데, 3개만 주워다 줄 수 있겠나?', '(서브퀘스트 시작: 부서진 조개껍질 3개 모으기)', '파도가 치는 곳은 조심하게, 게들이 사나워.'];
        },
        onTalk(state) {
          if (!state.flags.shellQuestStarted && !state.flags.shellQuestDone) {
            state.flags.shellQuestStarted = true;
            return;
          }
          if (state.flags.shellQuestStarted && !state.flags.shellQuestDone) {
            if (state.player.getItemQty('shell_piece') >= 3) {
              state.player.removeItem('shell_piece', 3);
              state.flags.shellQuestDone = true;
              state.player.gold += 30;
              state.player.addItem('hipotion', 1);
            }
          }
        },
      },
    ],
    forest: [
      {
        id: 'kingowl', x: 14, y: 4, name: '미미즈쿠 대왕님', color: '#6b5a8a',
        getLines(state) {
          if (state.flags.hasShell) {
            return ['호오... 그 조개에서 향기 나무 숲의 기운이 느껴지는구나.', '무사히 돌려주고 오너라.'];
          }
          if (state.flags.questStarted) {
            return ['...', '무엇 하러 왔느냐, 보노보노.', '동굴 깊은 곳의 왕게가 반짝이는 조개를 품고 있다.', '두려움 없이 나아가거라. 그것이 이 숲의 이치니라.'];
          }
          return ['...', '이곳은 향기 나무 숲. 나는 이 숲을 오래도록 지켜본 자다.', '두려워하지 않아도 된다... 아직은.'];
        },
      },
    ],
    cave: [],
  };

  window.BONO_NPCS = NPCS;
})();
