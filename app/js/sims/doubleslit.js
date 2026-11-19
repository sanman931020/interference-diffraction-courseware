/* 雙狹縫：M02 次波模型（Sims.doubleSlitModel）＋ 光的干涉理想模型（Sims.doubleSlitPattern） */
(function () {
  'use strict';
  window.Sims = window.Sims || {};
  var U = window.Sims._u;

  var VEL = 2.4; // 波前每秒前進的波長數（動畫用）
  function pill(ctx, text, x, y) {
    var c = U.colors(); ctx.save(); ctx.font = U.font(12, 700);
    var tw = ctx.measureText(text).width + 14;
    ctx.fillStyle = c.surface; ctx.globalAlpha = 0.92; U.roundRect(ctx, x - tw / 2, y - 11, tw, 22, 11); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = c.text; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 0.5); ctx.restore();
  }
  /* ---------------- M02 次波模型 ---------------- */
  function mountModel(el, opts) {
    opts = opts || {};
    var log = U.logger(opts);
    var S = { t: 0, playing: false, played: false, selected: [], current: null };
    var colors = U.colors();
    el.classList.add('sim', 'sim-dsmodel'); el.innerHTML = '';
    el.appendChild(U.el('div', { class: 'sim-head' }, [U.el('div', { class: 'sim-title', text: 'M02 次波模型' }), U.el('div', { class: 'sim-status', text: '比較 B、D 兩點的波' })]));
    var body = U.el('div', { class: 'sim-body sim-split' }); el.appendChild(body);
    var main = U.el('div', { class: 'sim-main' }), side = U.el('div', { class: 'sim-side' });
    body.appendChild(main); body.appendChild(side);
    var C = U.canvas(main, function (w) { return Math.max(260, Math.min(460, w * 0.78)); }, function () { colors = U.colors(); geom(); draw(); });
    var tg = U.tag('路徑示意　非實拍　未依比例'); tg.style.top = 'auto'; tg.style.bottom = '8px'; C.wrap.appendChild(tg);

    var playBtn = U.btn('播放', function () { S.playing ? pause() : play(); }, 'primary');
    main.appendChild(U.el('div', { class: 'sim-controls' }, [playBtn,
      U.btn('重置', function () { S.t = 0; pause(true); S.current = null; seg.set(null); log('reset', {}); draw(); }, 'ghost')]));
    var seg = U.seg([{ value: 'B', label: 'B 點' }, { value: 'D', label: 'D 點' }], null, function (v) { select(v); }, '比較位置');
    main.appendChild(U.el('div', { class: 'sim-controls' }, [U.el('span', { class: 'sim-lbl', text: '比較位置' }), seg]));

    side.appendChild(U.el('div', { class: 'sim-side-title', text: '到達所選位置的振動' }));
    var sideNote = U.el('div', { class: 'sim-hint', text: '先播放，再選 B 點或 D 點。' });
    side.appendChild(sideNote);
    var V = U.canvas(side, function (w) { return 210; }, function () { drawVib(); });

    var Gm = {};
    function geom() {
      var w = C.w, h = C.h;
      Gm.bx = w * 0.16; Gm.sx = w * 0.86; Gm.cy = h * 0.5;
      Gm.ds = Math.max(46, h * 0.22); Gm.lam = Math.max(16, Math.min(30, w * 0.045));
      Gm.s1 = [Gm.bx, Gm.cy - Gm.ds / 2]; Gm.s2 = [Gm.bx, Gm.cy + Gm.ds / 2];
      function pd(y) { return Math.hypot(Gm.sx - Gm.s2[0], y - Gm.s2[1]) - Math.hypot(Gm.sx - Gm.s1[0], y - Gm.s1[1]); }
      function solve(target, dir) { // 在螢幕上找路程差 = target 的 y（dir: -1 往上）
        var lo = Gm.cy, hi = Gm.cy + dir * h * 0.48;
        for (var i = 0; i < 50; i++) { var mid = (lo + hi) / 2; if (Math.abs(pd(mid)) < target) lo = mid; else hi = mid; }
        return (lo + hi) / 2;
      }
      Gm.B = { id: 'B', x: Gm.sx, y: solve(Gm.lam, -1) };        // 路程差 1 個波長（上方第一亮紋）
      Gm.D = { id: 'D', x: Gm.sx, y: solve(Gm.lam * 0.5, 1) };   // 路程差半個波長（下方第一暗紋）
    }
    geom();

    var loop = U.loop(function (dt) { S.t += dt; draw(); });
    function play() { S.playing = true; S.played = true; playBtn.textContent = '暫停'; loop.start(); log('play', {}); }
    function pause(silent) { S.playing = false; playBtn.textContent = '播放'; loop.stop(); if (!silent) log('pause', {}); draw(); }
    function select(id) {
      S.current = id; if (S.selected.indexOf(id) < 0) S.selected.push(id);
      sideNote.textContent = '所選位置：' + id + ' 點。比較兩列波到達時的振動，以及兩者疊加的結果。';
      log('select', { point: id, played: S.played });
      if (typeof opts.onSelect === 'function') try { opts.onSelect(id); } catch (e) { /* */ }
      draw();
    }

    function draw() {
      var ctx = C.ctx, w = C.w, h = C.h;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = colors.surface2; U.roundRect(ctx, 0, 0, w, h, 10); ctx.fill();
      var L = Gm.lam, front = S.t * L * VEL; // 波前傳播距離
      // 入射平面波
      ctx.strokeStyle = colors.accent; ctx.globalAlpha = 0.35; ctx.lineWidth = 1.5;
      for (var xx = Gm.bx - ((front % L) + L) % L; xx > 8; xx -= L) { ctx.beginPath(); ctx.moveTo(xx, 14); ctx.lineTo(xx, h - 14); ctx.stroke(); }
      ctx.globalAlpha = 1;
      // 次波前（只在擋板右側、螢幕左側）
      ctx.save(); ctx.beginPath(); ctx.rect(Gm.bx, 0, Gm.sx - Gm.bx, h); ctx.clip();
      [Gm.s1, Gm.s2].forEach(function (s, si) {
        var maxR = S.played ? front : 0;
        for (var r = maxR % L; r <= Math.min(maxR, w * 1.2); r += L / 2) {
          var isCrest = Math.round((maxR - r) / (L / 2)) % 2 === 0;
          ctx.strokeStyle = si === 0 ? colors.accent : colors.accent2;
          ctx.globalAlpha = isCrest ? 0.55 : 0.3; ctx.lineWidth = isCrest ? 1.6 : 1.2; ctx.setLineDash(isCrest ? [] : [4, 4]);
          ctx.beginPath(); ctx.arc(s[0], s[1], r, -Math.PI / 2, Math.PI / 2); ctx.stroke();
        }
      });
      ctx.setLineDash([]); ctx.globalAlpha = 1; ctx.restore();
      // 擋板
      ctx.fillStyle = colors.text;
      var gap = 8;
      ctx.fillRect(Gm.bx - 3, 12, 6, Gm.s1[1] - gap - 12);
      ctx.fillRect(Gm.bx - 3, Gm.s1[1] + gap, 6, Gm.s2[1] - Gm.s1[1] - 2 * gap);
      ctx.fillRect(Gm.bx - 3, Gm.s2[1] + gap, 6, h - 12 - Gm.s2[1] - gap);
      ctx.font = U.font(13, 700); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      pill(ctx, 'S₁', Gm.bx - 18, Gm.s1[1]); pill(ctx, 'S₂', Gm.bx - 18, Gm.s2[1]);
      // 螢幕
      ctx.fillStyle = colors.text; ctx.fillRect(Gm.sx - 2, 12, 5, h - 24);
      pill(ctx, '雙狹縫', Gm.bx, h - 22); pill(ctx, '螢幕', Gm.sx, h - 22);
      // 選取路徑
      [Gm.B, Gm.D].forEach(function (p) {
        var sel = S.current === p.id;
        if (sel) {
          ctx.lineWidth = 2; ctx.strokeStyle = colors.accent; ctx.setLineDash(p.id === 'D' ? [6, 5] : []);
          ctx.beginPath(); ctx.moveTo(Gm.s1[0], Gm.s1[1]); ctx.lineTo(p.x, p.y); ctx.stroke();
          ctx.strokeStyle = colors.accent2; ctx.beginPath(); ctx.moveTo(Gm.s2[0], Gm.s2[1]); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.setLineDash([]);
        }
        ctx.fillStyle = sel ? colors.warn : colors.text; ctx.beginPath(); ctx.arc(p.x, p.y, sel ? 7 : 5.5, 0, Math.PI * 2); ctx.fill();
        ctx.font = U.font(15, 800); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = colors.text;
        ctx.fillText(p.id, p.x + 10, p.y);
      });
      ctx.font = U.font(11, 600); pill(ctx, '實線＝波峰　虛線＝波谷', 82, 22);
      drawVib();
    }

    function drawVib() {
      var ctx = V.ctx, w = V.w, h = V.h;
      ctx.clearRect(0, 0, w, h);
      if (!S.current) {
        ctx.fillStyle = colors.muted; ctx.font = U.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('尚未選擇位置', w / 2, h / 2); return;
      }
      if (!S.played) {
        ctx.fillStyle = colors.muted; ctx.font = U.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('請先播放，讓波傳到螢幕', w / 2, h / 2); return;
      }
      var p = S.current === 'B' ? Gm.B : Gm.D, L = Gm.lam;
      var r1 = Math.hypot(p.x - Gm.s1[0], p.y - Gm.s1[1]), r2 = Math.hypot(p.x - Gm.s2[0], p.y - Gm.s2[1]);
      var k = 2 * Math.PI / L, om = 2 * Math.PI * VEL;
      function arr(r, t) { return t * L * VEL >= r ? 1 : 0; }
      var rows = [
        { label: '來自 S₁ 的波', f: function (t) { return arr(r1, t) * Math.cos(k * r1 - om * t); }, c: colors.accent, lw: 2 },
        { label: '來自 S₂ 的波', f: function (t) { return arr(r2, t) * Math.cos(k * r2 - om * t); }, c: colors.accent2, lw: 2 },
        { label: '兩者疊加', f: function (t) { return arr(r1, t) * Math.cos(k * r1 - om * t) + arr(r2, t) * Math.cos(k * r2 - om * t); }, c: colors.text, lw: 3 }
      ];
      var rh = (h - 10) / 3, gx = 8, gw = w - 16;
      rows.forEach(function (r, i) {
        var y0 = 4 + i * rh, mid = y0 + rh / 2 + 6;
        ctx.fillStyle = colors.muted; ctx.font = U.font(11, 700); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(r.label, gx, y0);
        ctx.strokeStyle = colors.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gx, mid); ctx.lineTo(gx + gw, mid); ctx.stroke();
        ctx.strokeStyle = r.c; ctx.lineWidth = r.lw; ctx.beginPath();
        var amp = (rh / 2 - 8) / 2;
        for (var j = 0; j <= 120; j++) { var tt = S.t - (120 - j) / 120 * 2 / VEL; var X = gx + j / 120 * gw, Y = mid - r.f(tt) * amp; j ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
        ctx.stroke();
      });
    }
    draw();
    return {
      destroy: function () { loop.destroy(); C.destroy(); V.destroy(); el.innerHTML = ''; },
      getState: function () { return { selected: S.selected.slice(), current: S.current, played: S.played }; }
    };
  }

  /* ---------------- 光的干涉理想模型 ---------------- */
  function mountPattern(el, opts) {
    opts = opts || {};
    var log = U.logger(opts);
    var adv = opts.mode === 'advanced';
    var P = { wl: 632.8, d: 0.25, L: 1.0, a: 0.05, white: false, on: !!opts.startOn, show: 'both' };
    var env = opts.showEnvelope !== false;
    var colors = U.colors();
    el.classList.add('sim', 'sim-dspattern'); el.innerHTML = '';
    el.appendChild(U.el('div', { class: 'sim-head' }, [U.el('div', { class: 'sim-title', text: '光的雙狹縫干涉（理想模型）' }), U.el('div', { class: 'sim-status', text: '' })]));
    var status = el.querySelector('.sim-status');
    var C = U.canvas(el, function (w) { return Math.max(240, Math.min(380, w * 0.5)); }, function () { colors = U.colors(); draw(); });
    C.wrap.appendChild(U.tag('理想模型｜非實拍'));
    var onBtn = U.btn(P.on ? '關閉光源' : '開啟光源', function () {
      P.on = !P.on; onBtn.textContent = P.on ? '關閉光源' : '開啟光源'; log('mode', { light: P.on }); draw();
    }, 'primary');
    var showSeg = U.seg([{ value: 'both', label: '條紋＋曲線' }, { value: 'fringe', label: '條紋' }, { value: 'curve', label: '強度曲線' }], 'both', function (v) { P.show = v; log('mode', { show: v }); draw(); }, '顯示');
    el.appendChild(U.el('div', { class: 'sim-controls' }, [onBtn, showSeg]));
    if (adv) {
      var box = U.el('div', { class: 'sim-adv' }, [U.el('div', { class: 'sim-side-title', text: '進階參數（延伸：高中量化前導）' })]);
      var sw = U.slider('波長', { min: 400, max: 700, step: 1, value: P.wl, fmt: function (v) { return v.toFixed(0) + ' nm'; }, oninput: function (v) { P.wl = v; log('param', { key: 'wl', value: v }); draw(); } });
      box.appendChild(sw);
      box.appendChild(U.slider('縫距 d', { min: 0.1, max: 0.6, step: 0.01, value: P.d, fmt: function (v) { return v.toFixed(2) + ' mm'; }, oninput: function (v) { P.d = v; log('param', { key: 'd', value: v }); draw(); } }));
      box.appendChild(U.slider('屏距 L', { min: 0.5, max: 2, step: 0.05, value: P.L, fmt: function (v) { return v.toFixed(2) + ' m'; }, oninput: function (v) { P.L = v; log('param', { key: 'L', value: v }); draw(); } }));
      box.appendChild(U.seg([{ value: false, label: '單色光' }, { value: true, label: '白光' }], false, function (v) { P.white = v; log('mode', { white: v }); draw(); }, '光源'));
      el.appendChild(box);
    } else {
      el.appendChild(U.el('div', { class: 'sim-hint', text: '本模式鎖定：632.8 nm 紅光、縫距 0.25 mm、屏距 1.0 m。只用來辨認規律，不掃描參數。' }));
    }
    var YR = 15; // ±15 mm
    function Iwl(ymm, wl) {
      var lamMm = wl * 1e-6, Lmm = P.L * 1000;
      var beta = Math.PI * P.d * ymm / (lamMm * Lmm);
      var I = Math.cos(beta) * Math.cos(beta);
      if (env) { var al = Math.PI * P.a * ymm / (lamMm * Lmm); var s = Math.abs(al) < 1e-9 ? 1 : Math.sin(al) / al; I *= s * s; }
      return I;
    }
    function colorAt(ymm) {
      if (!P.white) { var c = U.wlRGB(P.wl), I = Iwl(ymm, P.wl); return [c[0] * I, c[1] * I, c[2] * I, I]; }
      var r = 0, g = 0, b = 0, n = 0, tot = 0;
      for (var wl = 400; wl <= 700; wl += 10) { var cc = U.wlRGB(wl), ii = Iwl(ymm, wl); r += cc[0] * ii; g += cc[1] * ii; b += cc[2] * ii; tot += ii; n++; }
      var k = 2.6 / n; return [r * k, g * k, b * k, tot / n];
    }
    function draw() {
      var ctx = C.ctx, w = C.w, h = C.h;
      ctx.clearRect(0, 0, w, h);
      var padL = 16, padR = 16, pw = w - padL - padR;
      var showF = P.show !== 'curve', showC = P.show !== 'fringe';
      var fh = showF && showC ? h * 0.38 : showF ? h - 50 : 0;
      var X = function (y) { return padL + (y + YR) / (2 * YR) * pw; };
      if (showF) {
        ctx.fillStyle = '#05070c'; U.roundRect(ctx, padL, 10, pw, fh, 8); ctx.fill();
        if (P.on) {
          ctx.save(); U.roundRect(ctx, padL, 10, pw, fh, 8); ctx.clip();
          for (var px = 0; px < pw; px++) {
            var ymm = (px / pw) * 2 * YR - YR, c = colorAt(ymm);
            ctx.fillStyle = U.rgbStr([Math.pow(c[0], 0.8), Math.pow(c[1], 0.8), Math.pow(c[2], 0.8)]);
            ctx.fillRect(padL + px - 0.5, 10 + fh * 0.12, 2, fh * 0.76);
          }
          ctx.restore();
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = U.font(13, 600); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('光源未開啟：先完成你的預測', w / 2, 10 + fh / 2);
        }
        ctx.fillStyle = colors.muted; ctx.font = U.font(10); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText('屏幕正面（橫向為位置）', padL, 10 + fh + 3);
      }
      if (showC) {
        var cy0 = showF ? 10 + fh + 22 : 14, ch = h - cy0 - 30;
        ctx.strokeStyle = colors.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(padL, cy0 + ch); ctx.lineTo(padL + pw, cy0 + ch); ctx.stroke();
        ctx.fillStyle = colors.muted; ctx.font = U.font(10); ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText('光強度（時間平均）', padL + pw, cy0 - 2);
        if (P.on) {
          ctx.strokeStyle = P.white ? colors.text : U.rgbStr(U.wlRGB(P.wl)); ctx.lineWidth = 2.2; ctx.beginPath();
          for (var i = 0; i <= pw; i++) { var y = i / pw * 2 * YR - YR, I = P.white ? colorAt(y)[3] : Iwl(y, P.wl); var Y = cy0 + ch - I * (ch - 14); i ? ctx.lineTo(padL + i, Y) : ctx.moveTo(padL + i, Y); }
          ctx.stroke();
        }
        ctx.fillStyle = colors.muted; ctx.textAlign = 'center';
        [-15, -10, -5, 0, 5, 10, 15].forEach(function (v) { ctx.fillText(String(v), X(v), cy0 + ch + 4); });
        ctx.fillText('屏幕位置（mm）', X(0), cy0 + ch + 16);
      }
      status.textContent = P.white ? '白光' : (P.wl.toFixed(adv ? 0 : 1) + ' nm');
    }
    draw();
    return {
      destroy: function () { C.destroy(); el.innerHTML = ''; },
      getState: function () { return { on: P.on, wl: P.wl, d: P.d, L: P.L, white: P.white, show: P.show }; }
    };
  }

  window.Sims.doubleSlitModel = { mount: mountModel };
  window.Sims.doubleSlitPattern = { mount: mountPattern };
})();
