/* 薄膜干涉：剖面兩路反射光（逐步顯示）＋膜厚漸變色帶 */
(function () {
  'use strict';
  window.Sims = window.Sims || {};
  var U = window.Sims._u;
  var N_FILM = 1.33, TMAX = 1000; // nm

  function filmRGB(tnm) {
    var r = 0, g = 0, b = 0, n = 0;
    for (var wl = 400; wl <= 700; wl += 5) {
      var I = Math.pow(Math.sin(2 * Math.PI * N_FILM * tnm / wl), 2); // 含一次反射相位反轉：t→0 時反射相消
      var c = U.wlRGB(wl); r += c[0] * I; g += c[1] * I; b += c[2] * I; n++;
    }
    var k = 2.4 / n; return [r * k, g * k, b * k];
  }

  function mount(el, opts) {
    opts = opts || {};
    var log = U.logger(opts);
    var adv = opts.mode === 'advanced';
    var S = { step: 0, stepsShown: 0, t: 0, probe: null, thick: 420, wl: 550 };
    var colors = U.colors();
    el.classList.add('sim', 'sim-film'); el.innerHTML = '';
    el.appendChild(U.el('div', { class: 'sim-head' }, [U.el('div', { class: 'sim-title', text: '薄膜干涉：到達眼睛的是哪兩路光？' }), U.el('div', { class: 'sim-status', text: '' })]));
    var status = el.querySelector('.sim-status');
    var body = U.el('div', { class: 'sim-body sim-split sim-split-narrow' }); el.appendChild(body);
    var main = U.el('div', { class: 'sim-main' }), side = U.el('div', { class: 'sim-side' });
    body.appendChild(main); body.appendChild(side);
    var C = U.canvas(main, function (w) { return Math.max(250, Math.min(400, w * 0.66)); }, function () { colors = U.colors(); draw(); });
    C.wrap.appendChild(U.tag('模型示意｜非實拍'));
    var stepBtn = U.btn('逐步顯示：下一步', function () { next(); }, 'primary');
    var caption = U.el('div', { class: 'sim-caption', 'aria-live': 'polite' });
    main.appendChild(caption);
    main.appendChild(U.el('div', { class: 'sim-controls' }, [stepBtn, U.btn('重來', function () { S.step = 0; upd(); draw(); }, 'ghost')]));

    side.appendChild(U.el('div', { class: 'sim-side-title', text: '肥皂膜色帶（白光）' }));
    side.appendChild(U.el('div', { class: 'sim-hint', text: '由上到下膜越來越厚。點色帶任一處看膜厚相對值。' }));
    var B = U.canvas(side, function (w) { return 260; }, function () { drawBand(); });
    B.cv.style.cursor = 'crosshair';
    var probeOut = U.el('div', { class: 'sim-readout', text: '尚未選取位置' });
    side.appendChild(probeOut);
    function onBand(e) {
      var r = B.cv.getBoundingClientRect(); var f = Math.max(0, Math.min(1, (e.clientY - r.top - 10) / (r.height - 20)));
      S.probe = f; probeOut.textContent = '此處膜厚相對值：' + Math.round(f * 100) + '%（上端最薄）';
      log('probe', { rel: Math.round(f * 100) / 100 }); drawBand();
    }
    B.cv.addEventListener('click', onBand);

    var advOut = null;
    if (adv) {
      var box = U.el('div', { class: 'sim-adv' }, [U.el('div', { class: 'sim-side-title', text: '延伸：膜厚與相位差（本單元不要求計算）' })]);
      box.appendChild(U.slider('膜厚', { min: 100, max: 900, step: 5, value: S.thick, fmt: function (v) { return v + ' nm'; }, oninput: function (v) { S.thick = v; log('param', { key: 'thick', value: v }); draw(); } }));
      box.appendChild(U.slider('單色光波長', { min: 400, max: 700, step: 1, value: S.wl, fmt: function (v) { return v + ' nm'; }, oninput: function (v) { S.wl = v; log('param', { key: 'wl', value: v }); draw(); } }));
      advOut = U.el('div', { class: 'sim-readout' }); box.appendChild(advOut);
      el.appendChild(box);
    }

    var CAPS = [
      '白光照向透明薄膜（例如肥皂膜）。按「下一步」看看會有哪些反射光。',
      '① 一部分光在薄膜「上表面」直接反射。',
      '② 另一部分光進入薄膜，在「下表面」反射後，再穿出上表面。',
      '③ 兩路反射光朝同一觀察方向前進並重疊——兩路反射光疊加。'
    ];
    function upd() {
      caption.textContent = CAPS[S.step];
      stepBtn.textContent = S.step >= 3 ? '已全部顯示' : '逐步顯示：下一步';
      stepBtn.disabled = S.step >= 3;
    }
    function next() { if (S.step < 3) { S.step++; S.stepsShown = Math.max(S.stepsShown, S.step); log('step', { step: S.step }); upd(); draw(); } }

    var loop = U.loop(function (dt) { S.t += dt; draw(); });

    function arrowLine(ctx, x1, y1, x2, y2, color, lw, label, dashOff, side) {
      side = side || 1;
      ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.setLineDash([10, 6]); ctx.lineDashOffset = -dashOff;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
      var a = Math.atan2(y2 - y1, x2 - x1); ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 11 * Math.cos(a - 0.4), y2 - 11 * Math.sin(a - 0.4)); ctx.lineTo(x2 - 11 * Math.cos(a + 0.4), y2 - 11 * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill();
      if (label) { ctx.font = U.font(14, 800); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, (x1 + x2) / 2 + side * 20 * Math.sin(a), (y1 + y2) / 2 - side * 20 * Math.cos(a)); }
    }
    function draw() {
      var ctx = C.ctx, w = C.w, h = C.h, off = S.t * 30;
      ctx.clearRect(0, 0, w, h);
      var th = adv ? 36 + (S.thick - 100) / 800 * 80 : 76, top = h * 0.52 - th / 3, bot = top + th;
      // 背景層
      ctx.fillStyle = colors.surface2; U.roundRect(ctx, 0, 0, w, h, 10); ctx.fill();
      ctx.fillStyle = 'rgba(120,170,255,0.22)'; ctx.fillRect(0, top, w, th);
      ctx.strokeStyle = colors.accent; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, top); ctx.lineTo(w, top); ctx.moveTo(0, bot); ctx.lineTo(w, bot); ctx.stroke();
      ctx.fillStyle = colors.muted; ctx.font = U.font(12, 600); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText('空氣', w - 10, top - 16); ctx.fillText('薄膜', w - 10, top + th / 2); ctx.fillText('空氣', w - 10, bot + 16);
      ctx.textAlign = 'left'; ctx.fillText('上表面', 8, top - 10); ctx.fillText('下表面', 8, bot + 12);
      // 幾何
      var ang = 0.62, x0 = w * 0.34, ox = x0, oy = top;
      var ix = ox - Math.tan(ang) * (top - 30), iy = 30;
      var rAng = Math.asin(Math.sin(ang) / N_FILM);
      var bx = ox + Math.tan(rAng) * th, by = bot;
      var o2x = bx + Math.tan(rAng) * th, o2y = top;
      var len = top - 46;
      var r1x = ox + Math.tan(ang) * len, r1y = top - len;
      var r2x = o2x + Math.tan(ang) * len, r2y = top - len;
      var white = colors.text;
      arrowLine(ctx, ix, iy, ox, oy, white, 2.4, '入射白光', off, -1.8);
      if (S.step >= 1) arrowLine(ctx, ox, oy, r1x, r1y, colors.accent, 3, '①', off);
      if (S.step >= 2) {
        arrowLine(ctx, ox, oy, bx, by, colors.accent2, 2.4, '', off);
        arrowLine(ctx, bx, by, o2x, o2y, colors.accent2, 2.4, '', off);
        arrowLine(ctx, o2x, o2y, r2x, r2y, colors.accent2, 3, '②', off);
        // 透射（淡）
        ctx.globalAlpha = 0.25; arrowLine(ctx, bx, by, bx + Math.tan(ang) * 50, by + 50, colors.muted, 1.5, '透射光', off); ctx.globalAlpha = 1;
      }
      if (S.step >= 3) {
        var ex = (r1x + r2x) / 2 + 30, ey = r1y - 2;
        ctx.fillStyle = colors.warn; ctx.globalAlpha = 0.18; ctx.beginPath(); ctx.ellipse((r1x + r2x) / 2, r1y + 24, (r2x - r1x) / 2 + 26, 30, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        // 眼睛
        ctx.strokeStyle = colors.text; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(ex + 20, ey + 6, 16, 9, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = colors.text; ctx.beginPath(); ctx.arc(ex + 20, ey + 6, 4, 0, Math.PI * 2); ctx.fill();
        ctx.font = U.font(13, 800); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = colors.text;
        ctx.fillText('兩路反射光疊加', Math.min(w - 120, ex + 42), ey + 6);
      }
      // 側欄色帶由 drawBand 處理；進階讀數
      if (advOut) {
        var opd = 2 * N_FILM * S.thick, ph = opd / S.wl + 0.5;
        var frac = ph - Math.floor(ph);
        var strong = Math.cos(2 * Math.PI * ph) > 0.3 ? '較強' : Math.cos(2 * Math.PI * ph) < -0.3 ? '較弱' : '中等';
        advOut.innerHTML = '光程差 2nt ≈ ' + Math.round(opd) + ' nm（垂直入射近似，n＝1.33）<br>加上一次反射相位改變（半個波長），相位差 ≈ ' + ph.toFixed(2) + ' 個 2π（小數部分 ' + frac.toFixed(2) + '）<br>此波長在此膜厚的反射：' + strong;
      }
      status.textContent = S.step >= 3 ? '已顯示全部' : '步驟 ' + S.step + '／3';
    }
    function drawBand() {
      var ctx = B.ctx, w = B.w, h = B.h;
      ctx.clearRect(0, 0, w, h);
      var bw = Math.min(90, w * 0.45), x0 = 8, y0 = 10, bh = h - 20;
      for (var i = 0; i < bh; i++) {
        var c = filmRGB(i / bh * TMAX);
        ctx.fillStyle = U.rgbStr([Math.min(1, c[0]), Math.min(1, c[1]), Math.min(1, c[2])]); ctx.fillRect(x0, y0 + i, bw, 1.2);
      }
      ctx.strokeStyle = colors.line; ctx.lineWidth = 1; U.roundRect(ctx, x0, y0, bw, bh, 6); ctx.stroke();
      ctx.fillStyle = colors.muted; ctx.font = U.font(11); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('薄', x0 + bw + 8, y0 + 8); ctx.fillText('厚', x0 + bw + 8, y0 + bh - 8);
      ctx.strokeStyle = colors.muted; ctx.beginPath(); ctx.moveTo(x0 + bw + 14, y0 + 20); ctx.lineTo(x0 + bw + 14, y0 + bh - 20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x0 + bw + 10, y0 + bh - 26); ctx.lineTo(x0 + bw + 14, y0 + bh - 20); ctx.lineTo(x0 + bw + 18, y0 + bh - 26); ctx.stroke();
      if (S.probe != null) {
        var py = y0 + S.probe * bh;
        ctx.strokeStyle = colors.text; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 - 4, py); ctx.lineTo(x0 + bw + 4, py); ctx.stroke();
      }
    }
    upd(); loop.start(); draw(); drawBand();
    return {
      destroy: function () { loop.destroy(); B.cv.removeEventListener('click', onBand); C.destroy(); B.destroy(); el.innerHTML = ''; },
      getState: function () { return { stepsShown: S.stepsShown, step: S.step, probe: S.probe }; }
    };
  }
  window.Sims.thinFilm = { mount: mount };
})();
