// ============================================================
// Monster definitions: stats + procedural canvas art (no image
// assets exist for them, so they are drawn with simple shapes).
// ============================================================
(function () {
  function circle(ctx, x, y, r, fill) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }
  function tri(ctx, pts, fill) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }
  function eyes(ctx, cx, cy, gap, r) {
    circle(ctx, cx - gap, cy, r, '#1a1a1a');
    circle(ctx, cx + gap, cy, r, '#1a1a1a');
  }

  const MONSTERS = {
    acornbug: {
      id: 'acornbug', name: '도토리벌레', hp: 18, atk: 5, def: 1, exp: 8, gold: 4,
      draw(ctx, cx, cy, bob) {
        circle(ctx, cx, cy + 10 + bob, 20, '#8a5a2b');
        circle(ctx, cx, cy - 6 + bob, 14, '#a9713a');
        ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx - 6, cy - 18 + bob); ctx.lineTo(cx - 12, cy - 30 + bob); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 6, cy - 18 + bob); ctx.lineTo(cx + 12, cy - 30 + bob); ctx.stroke();
        eyes(ctx, cx, cy - 8 + bob, 5, 2.5);
      },
    },
    boar: {
      id: 'boar', name: '멧돼지', hp: 26, atk: 7, def: 2, exp: 12, gold: 6,
      draw(ctx, cx, cy, bob) {
        ctx.fillStyle = '#75655a';
        ctx.beginPath(); ctx.ellipse(cx, cy + 6 + bob, 26, 18, 0, 0, Math.PI * 2); ctx.fill();
        circle(ctx, cx + 20, cy - 2 + bob, 12, '#75655a');
        tri(ctx, [[cx + 26, cy + 4 + bob], [cx + 34, cy + 2 + bob], [cx + 26, cy - 2 + bob]], '#eee');
        eyes(ctx, cx + 22, cy - 4 + bob, 4, 2);
      },
    },
    crab: {
      id: 'crab', name: '모래게', hp: 24, atk: 6, def: 3, exp: 11, gold: 6,
      draw(ctx, cx, cy, bob) {
        ctx.fillStyle = '#d1493a';
        ctx.beginPath(); ctx.ellipse(cx, cy + bob, 22, 14, 0, 0, Math.PI * 2); ctx.fill();
        circle(ctx, cx - 26, cy - 6 + bob, 9, '#d1493a');
        circle(ctx, cx + 26, cy - 6 + bob, 9, '#d1493a');
        eyes(ctx, cx, cy - 4 + bob, 6, 2.5);
      },
    },
    gull: {
      id: 'gull', name: '성난 갈매기', hp: 16, atk: 8, def: 1, exp: 10, gold: 5,
      draw(ctx, cx, cy, bob) {
        ctx.fillStyle = '#f2f2f2';
        ctx.beginPath(); ctx.ellipse(cx, cy + bob, 16, 12, 0, 0, Math.PI * 2); ctx.fill();
        tri(ctx, [[cx - 16, cy + bob], [cx - 32, cy - 8 + bob], [cx - 14, cy - 6 + bob]], '#e2e2e2');
        tri(ctx, [[cx + 16, cy + bob], [cx + 32, cy - 8 + bob], [cx + 14, cy - 6 + bob]], '#e2e2e2');
        tri(ctx, [[cx, cy + 2 + bob], [cx + 10, cy + 4 + bob], [cx, cy + 8 + bob]], '#e8a23a');
        circle(ctx, cx - 2, cy - 4 + bob, 2, '#1a1a1a');
      },
    },
    bat: {
      id: 'bat', name: '동굴박쥐', hp: 22, atk: 9, def: 2, exp: 16, gold: 10,
      draw(ctx, cx, cy, bob) {
        ctx.fillStyle = '#5b3d7a';
        tri(ctx, [[cx - 8, cy + bob], [cx - 34, cy - 14 + bob], [cx - 10, cy - 10 + bob]], '#5b3d7a');
        tri(ctx, [[cx + 8, cy + bob], [cx + 34, cy - 14 + bob], [cx + 10, cy - 10 + bob]], '#5b3d7a');
        circle(ctx, cx, cy - 2 + bob, 14, '#6b4a8a');
        eyes(ctx, cx, cy - 4 + bob, 5, 2);
      },
    },
    golem: {
      id: 'golem', name: '바위골렘', hp: 40, atk: 10, def: 6, exp: 28, gold: 18,
      draw(ctx, cx, cy, bob) {
        ctx.fillStyle = '#7a7a82';
        ctx.fillRect(cx - 22, cy - 20 + bob, 44, 40);
        ctx.fillRect(cx - 34, cy - 6 + bob, 12, 20);
        ctx.fillRect(cx + 22, cy - 6 + bob, 12, 20);
        circle(ctx, cx - 8, cy - 4 + bob, 3, '#ffde5e');
        circle(ctx, cx + 8, cy - 4 + bob, 3, '#ffde5e');
      },
    },
    crabking: {
      id: 'crabking', name: '왕게', hp: 120, atk: 16, def: 8, exp: 150, gold: 100, boss: true,
      draw(ctx, cx, cy, bob) {
        ctx.fillStyle = '#9c1f1f';
        ctx.beginPath(); ctx.ellipse(cx, cy + 10 + bob, 40, 26, 0, 0, Math.PI * 2); ctx.fill();
        circle(ctx, cx - 46, cy - 4 + bob, 16, '#9c1f1f');
        circle(ctx, cx + 46, cy - 4 + bob, 16, '#9c1f1f');
        tri(ctx, [[cx - 14, cy - 22 + bob], [cx, cy - 40 + bob], [cx + 14, cy - 22 + bob]], '#ffd75e');
        eyes(ctx, cx, cy - 2 + bob, 8, 3.5);
      },
    },
  };

  window.BONO_MONSTERS = MONSTERS;
})();
