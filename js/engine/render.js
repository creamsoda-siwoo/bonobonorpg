// ============================================================
// Small canvas drawing helpers shared across systems.
// ============================================================
(function () {
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function shadow(ctx, cx, cy, rw, rh) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function outlineText(ctx, text, x, y, opts) {
    opts = opts || {};
    ctx.font = opts.font || '14px sans-serif';
    ctx.textAlign = opts.align || 'left';
    ctx.textBaseline = opts.baseline || 'alphabetic';
    ctx.lineWidth = opts.lineWidth || 3;
    ctx.strokeStyle = opts.stroke || 'rgba(0,0,0,0.8)';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = opts.fill || '#fff';
    ctx.fillText(text, x, y);
  }

  function hpBar(ctx, x, y, w, h, ratio, colorFrom, colorTo) {
    ratio = Math.max(0, Math.min(1, ratio));
    ctx.fillStyle = '#1a1a1a';
    roundRect(ctx, x, y, w, h, h / 2); ctx.fill();
    if (ratio > 0) {
      const grad = ctx.createLinearGradient(x, y, x + w, y);
      grad.addColorStop(0, colorFrom);
      grad.addColorStop(1, colorTo);
      ctx.fillStyle = grad;
      roundRect(ctx, x + 1, y + 1, Math.max(0, (w - 2) * ratio), h - 2, (h - 2) / 2); ctx.fill();
    }
  }

  window.BONO_RENDER = { roundRect, shadow, outlineText, hpBar };
})();
