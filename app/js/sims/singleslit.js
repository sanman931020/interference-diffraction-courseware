/* 單狹縫遠場繞射（理想模型）＋縫內次波源示意＋單／雙狹縫曲線比較 */
(function () {
  'use strict';
  window.Sims = window.Sims || {};
  var U = window.Sims._u;

  function mount(el, opts) {
    opts = opts || {};
    var log = U.logger(opts);
    var adv = opts.mode === 'advanced';
    var P = { a: 0.1, wl: 450, L: 1, d: 0.3, sub: false, dir: 'front', cmp: false };
    var blind = !!opts.blindCompare;
    var colors = U.colors();
    el.classList.add('sim', 'sim-single'); el.innerHTML = '';
    el.appendChild(U.el('div', { class: 'sim-head' }, [U.el('div', { class: 'sim-title', text: '單狹縫繞射（遠場理想模型）' }), U.el('div', { class: 'sim-status', text: '' })]));
    var status = el.querySelector('.sim-status');
    var C = U.canvas(el, function (w) { return Math.round(Math.max(280, Math.min(460, w * 0.62))) + (P.sub ? 190 : 0); }, function () { colors = U.colors(); draw(); });
    C.wrap.appendChild(U.tag('理想模型｜非實拍'));

    var ctl = U.el('div', { class: 'sim-controls' });
    var subBtn = U.btn('顯示縫內次波源', function () {
      P.sub = !P.sub; subBtn.textContent = P.sub ? '隱藏縫內次波源' : '顯示縫內次波源'; subBtn.classList.toggle('on', P.sub);
      dirSeg.style.display = P.sub ? '' : 'none'; log('toggle', { subsources: P.sub }); C.fit();
    }, 'ghost');
    var dirSeg = U.seg([{ value: 'front', label: '正前方' }, { value: 'side', label: '偏斜方向' }], 'front', function (v) { P.dir = v; log('toggle', { dir: v }); draw(); }, '方向');
    dirSeg.style.display = 'none';
    ctl.appendChild(subBtn); ctl.appendChild(dirSeg);
    if (opts.compare) {
      var cmpBtn = U.btn('比較：單狹縫／雙狹縫曲線', function () {
        P.cmp = !P.cmp; cmpBtn.classList.toggle('on', P.cmp); log('toggle', { compare: P.cmp }); draw();
      }, 'ghost');
      ctl.appendChild(cmpBtn);
    }
    el.appendChild(ctl);
    if (adv) {
      var box = U.el('div', { class: 'sim-adv' }, [U.el('div', { class: 'sim-side-title', text: '進階參數（延伸）' })]);
      box.appendChild(U.slider('縫寬 a', { min: 0.05, max: 0.2, step: 0.005, value: P.a, fmt: function (v) { return v.toFixed(3) + ' mm'; }, oninput: function (v) { P.a = v; log('param', { key: 'a', value: v }); draw(); } }));
      box.appendChild(U.slider('波長', { min: 400, max: 700, step: 1, value: P.wl, fmt: function (v) { return v.toFixed(0) + ' nm'; }, oninput: function (v) { P.wl = v; log('param', { key: 'wl', value: v }); draw(); } }));
      box.appendChild(U.el('div', { class: 'sim-hint', text: '固定波長、在本教材尺度內：縫越窄，中央亮紋越寬。這不是狹縫影像的放大。' }));
      el.appendChild(box);
    } else {
      el.appendChild(U.el('div', { class: 'sim-hint', text: '本模式固定：波長 450 nm、縫寬 0.10 mm、屏距 1.0 m，均勻單色照明、遠場觀察。' }));
    }

    var YR = 15;
    function Is(y) { var al = Math.PI * P.a * y / (P.wl * 1e-6 * P.L * 1000); return Math.abs(al) < 1e-9 ? 1 : Math.pow(Math.sin(al) / al, 2); }
    function Id(y) { var b = Math.PI * P.d * y / (P.wl * 1e-6 * P.L * 1000); var a = Math.PI * 0.04 * y / (P.wl * 1e-6 * P.L * 1000); var e = Math.abs(a) < 1e-9 ? 1 : Math.pow(Math.sin(a) / a, 2); return Math.cos(b) * Math.cos(b) * e; }

    function drawCurve(ctx, x0, y0, w, h, f, color, label) {
      ctx.strokeStyle = colors.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y0 + h); ctx.lineTo(x0 + w, y0 + h); ctx.stroke();
      ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.beginPath();
      for (var i = 0; i <= w; i++) { var y = i / w * 2 * YR - YR; var Y = y0 + h - f(y) * (h - 10); i ? ctx.lineTo(x0 + i, Y) : ctx.moveTo(x0 + i, Y); }
      ctx.stroke();
      if (label) { ctx.fillStyle = colors.text; ctx.font = U.font(12, 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(label, x0 + 4, y0); }
    }
    function drawSub(ctx, x0, y0, w, h) {
      ctx.save(); ctx.fillStyle = colors.surface2; U.roundRect(ctx, x0, y0, w, h, 8); ctx.fill(); ctx.clip();
      var sx = x0 + w * 0.18, cy = y0 + h / 2, half = Math.min(h * 0.3, 52);
      ctx.fillStyle = colors.text;
      ctx.fillRect(sx - 3, y0 + 6, 6, cy - half - y0 - 6); ctx.fillRect(sx - 3, cy + half, 6, y0 + h - 6 - cy - half);
      var n = 9, th = P.dir === 'front' ? 0 : 0.42;
      for (var i = 0; i < n; i++) {
        var yy = cy - half + (i + 0.5) / n * 2 * half;
        ctx.strokeStyle = colors.accent; ctx.globalAlpha = 0.65; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(sx, yy); ctx.lineTo(sx + Math.cos(th) * w * 0.55, yy + Math.sin(th) * w * 0.55); ctx.stroke(); ctx.globalAlpha = 1;
        ctx.fillStyle = colors.accent2; ctx.beginPath(); ctx.arc(sx, yy, 3.2, 0, Math.PI * 2); ctx.fill();
      }
      if (th > 0) { // 路程差示意
        var ytop = cy - half + 0.5 / n * 2 * half, ybot = cy - half + (n - 0.5) / n * 2 * half;
        var D = ybot - ytop, fx = sx + D * Math.sin(th) * Math.cos(th), fy = ytop + D * Math.sin(th) * Math.sin(th);
        ctx.setLineDash([4, 3]); ctx.strokeStyle = colors.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(sx, ybot); ctx.lineTo(fx, fy); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = colors.warn; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx, ytop); ctx.lineTo(fx, fy); ctx.stroke();
      }
      ctx.font = U.font(11, 600); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      function lbl(t, x, y) { var tw = ctx.measureText(t).width + 12; ctx.fillStyle = colors.surface; ctx.globalAlpha = 0.9; U.roundRect(ctx, x - 6, y - 3, tw, 19, 8); ctx.fill(); ctx.globalAlpha = 1; ctx.fillStyle = colors.text; ctx.fillText(t, x, y); }
      lbl('縫內許多次波源（連續分布的示意）', x0 + 10, y0 + 8);
      lbl(th > 0 ? '偏離正前方：各次波路徑長度不同（橘色粗線＝最上與最下次波的路程差）' : '正前方：各次波大致同相到達', x0 + 10, y0 + h - 24);
      ctx.restore();
    }
    function draw() {
      var ctx = C.ctx, w = C.w, h = C.h;
      ctx.clearRect(0, 0, w, h);
      var pad = 14, pw = w - 2 * pad, y = 8;
      if (P.sub) { var sh = 180; drawSub(ctx, pad, y, pw, sh); y += sh + 10; }
      var remain = h - y - 26;
      if (P.cmp) {
        var hh = (remain - 10) / 2;
        drawCurve(ctx, pad, y, pw, hh, Is, U.rgbStr(U.wlRGB(P.wl)), blind ? '曲線 甲' : '單狹縫');
        drawCurve(ctx, pad, y + hh + 10, pw, hh, Id, colors.accent2, blind ? '曲線 乙' : '雙狹縫');
      } else {
        var fh = remain * 0.42;
        ctx.fillStyle = '#05070c'; U.roundRect(ctx, pad, y, pw, fh, 8); ctx.fill();
        ctx.save(); U.roundRect(ctx, pad, y, pw, fh, 8); ctx.clip();
        var c = U.wlRGB(P.wl);
        for (var px = 0; px < pw; px++) {
          var yy = px / pw * 2 * YR - YR, I = Math.pow(Is(yy), 0.55);
          ctx.fillStyle = U.rgbStr([c[0] * I, c[1] * I, c[2] * I]); ctx.fillRect(pad + px - 0.5, y + fh * 0.15, 2, fh * 0.7);
        }
        ctx.restore();
        ctx.fillStyle = colors.muted; ctx.font = U.font(10); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('屏幕正面（亮度經壓縮以便看見旁側亮紋）', pad, y + fh + 2);
        drawCurve(ctx, pad, y + fh + 18, pw, remain - fh - 18, Is, U.rgbStr(c), '');
        ctx.fillStyle = colors.muted; ctx.font = U.font(10); ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText('光強度（時間平均）', pad + pw, y + fh + 18);
      }
      ctx.fillStyle = colors.muted; ctx.font = U.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      [-15, -10, -5, 0, 5, 10, 15].forEach(function (v) { ctx.fillText(String(v), pad + (v + YR) / (2 * YR) * pw, h - 24); });
      ctx.fillText('屏幕位置（mm）', pad + pw / 2, h - 12);
      status.textContent = '縫寬 ' + P.a.toFixed(adv ? 3 : 2) + ' mm｜' + P.wl.toFixed(0) + ' nm';
    }
    draw();
    return {
      destroy: function () { C.destroy(); el.innerHTML = ''; },
      getState: function () { return { a: P.a, wl: P.wl, subsources: P.sub, dir: P.dir, compare: P.cmp }; }
    };
  }
  window.Sims.singleSlit = { mount: mount };
})();
