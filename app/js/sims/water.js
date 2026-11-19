/* 雙點波源水波干涉模擬（俯視熱圖／3D 斜視） */
(function () {
  'use strict';
  window.Sims = window.Sims || {};
  var U = window.Sims._u;
  var H = 0.72;        // 世界座標：寬 1、高 H
  var YS = 0.08;       // 波源 y
  var R0 = 0.18;       // 衰減尺度

  function mount(el, opts) {
    opts = opts || {};
    var log = U.logger(opts);
    var adv = opts.mode === 'advanced';
    var P = { d: 0.24, f: 1, amp: 1, v: 0.08 };
    var S = { t: 0, playing: true, view: 'top', lines: false, probes: [], presets: [] };
    var colors = U.colors();

    el.classList.add('sim', 'sim-water'); el.innerHTML = '';
    el.appendChild(U.el('div', { class: 'sim-head' }, [U.el('div', { class: 'sim-title', text: '雙點波源水波干涉' }), U.el('div', { class: 'sim-status', text: '兩波源同頻率、同相' })]));
    var C = U.canvas(el, function (w) { return Math.round(w * H); }, function () { colors = U.colors(); draw(); });
    C.wrap.appendChild(U.tag('模型示意｜非實拍'));
    var hint = U.el('div', { class: 'sim-hint', text: '在俯視圖上點一下可放置觀察點（最多 3 個）；觀察一段時間的起伏，再判斷振幅。' });
    el.appendChild(hint);

    var playBtn = U.btn('暫停', function () { S.playing ? pause() : play(); }, 'primary');
    var viewSeg = U.seg([{ value: 'top', label: '俯視' }, { value: '3d', label: '3D 斜視' }], 'top', function (v) { S.view = v; log('view', { view: v }); draw(); }, '視角');
    var controls = U.el('div', { class: 'sim-controls' }, [playBtn, viewSeg,
      U.btn('清除觀察點', function () { S.probes = []; G.fit(); draw(); }, 'ghost')]);
    var linesBtn = null;
    if (opts.allowLines) {
      linesBtn = U.btn('顯示腹線／節線', function () {
        S.lines = !S.lines; linesBtn.textContent = S.lines ? '隱藏腹線／節線' : '顯示腹線／節線';
        linesBtn.classList.toggle('on', S.lines); log('lines', { shown: S.lines }); draw();
      }, 'ghost');
      controls.appendChild(linesBtn);
    }
    el.appendChild(controls);

    if (adv) {
      var advBox = U.el('div', { class: 'sim-adv' }, [U.el('div', { class: 'sim-side-title', text: '進階參數（延伸）' })]);
      function prm(label, key, min, max, step, fmt) {
        advBox.appendChild(U.slider(label, { min: min, max: max, step: step, value: P[key], fmt: fmt, oninput: function (v) {
          P[key] = v; S.probes.forEach(function (p) { p.hist = []; p.logged = false; }); log('param', { key: key, value: v }); draw();
        } }));
      }
      prm('波源距離', 'd', 0.12, 0.4, 0.01, function (v) { return (v / (P.v / P.f)).toFixed(1) + ' 個波長'; });
      prm('頻率', 'f', 0.5, 2, 0.1, function (v) { return v.toFixed(1) + '（相對）'; });
      prm('振幅', 'amp', 0.5, 1.5, 0.1, function (v) { return v.toFixed(1); });
      prm('波速', 'v', 0.04, 0.16, 0.01, function (v) { return v.toFixed(2) + '（相對）'; });
      advBox.appendChild(U.el('div', { class: 'sim-hint', text: '法拉第波（延伸）：垂直振動容器產生的駐波圖樣，本單元只作延伸閱讀，模擬未實作。' }));
      el.appendChild(advBox);
    }

    var G = U.canvas(el, function (w) { return S.probes.length ? S.probes.length * 78 + 8 : 1; }, function () { drawGraphs(); });
    G.wrap.classList.add('sim-graphs');

    function lam() { return P.v / P.f; }
    function k() { return 2 * Math.PI / lam(); }
    function src() { return [[0.5 - P.d / 2, YS], [0.5 + P.d / 2, YS]]; }
    function dec(r) { return 1 / Math.sqrt(1 + r / R0); }
    function z(x, y, t) {
      var s = src(), w = 2 * Math.PI * P.f, kk = k(), sum = 0;
      for (var i = 0; i < 2; i++) { var r = Math.hypot(x - s[i][0], y - s[i][1]); sum += P.amp * dec(r) * Math.sin(kk * r - w * t); }
      return sum;
    }
    function ampTheory(x, y) {
      var s = src(), kk = k(), re = 0, im = 0, mx = 0;
      for (var i = 0; i < 2; i++) { var r = Math.hypot(x - s[i][0], y - s[i][1]), a = P.amp * dec(r); re += a * Math.cos(kk * r); im += a * Math.sin(kk * r); mx += a; }
      return { amp: Math.hypot(re, im), max: mx };
    }
    // 雙曲線上的點：路程差 delta，世界 y
    function hyperPoint(delta, yw) {
      var c = P.d / 2, a = Math.abs(delta) / 2, b = Math.sqrt(Math.max(1e-9, c * c - a * a));
      var yy = yw - YS, u = Math.asinh(yy / b), x = a * Math.cosh(u);
      return { x: 0.5 + (delta >= 0 ? x : -x), y: yw };
    }
    // 預設觀察點：A 在第一條腹線（路程差 1λ）、B 在第一條節線（路程差 0.5λ）
    function computePresets() {
      var list = opts.presetPoints || [{ id: 'A' }, { id: 'B' }];
      return list.map(function (p, i) {
        if (typeof p.x === 'number' && typeof p.y === 'number') return { id: p.id, x: p.x, y: p.y * H };
        var delta = i === 0 ? lam() : lam() / 2;
        var q = hyperPoint(delta, YS + 0.42);
        return { id: p.id || String.fromCharCode(65 + i), x: q.x, y: q.y };
      });
    }
    S.presets = computePresets();
    S.presets.forEach(function (p) { addProbe(p.id, p.x, p.y, true); });

    function addProbe(id, x, y, silent) {
      if (S.probes.length >= 3) S.probes.shift();
      S.probes.push({ id: id, x: x, y: y, hist: [], logged: false });
      G.fit();
    }

    // 點擊放置觀察點
    function onClick(e) {
      if (S.view !== 'top') { hint.textContent = '請先切換到「俯視」再點選放置觀察點。'; return; }
      var r = C.cv.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height * H;
      var used = S.probes.map(function (p) { return p.id; });
      var id = ['A', 'B', 'C', 'D', 'E'].filter(function (n) { return used.indexOf(n) < 0; })[0] || 'P';
      addProbe(id, x, y);
      hint.textContent = '已放置觀察點 ' + id + '：看下方起伏紀錄，等兩個週期後讀出最大偏移。';
      draw();
    }
    C.cv.addEventListener('click', onClick);

    var loop = U.loop(function (dt) {
      S.t += dt;
      var T = 1 / P.f;
      S.probes.forEach(function (p) {
        p.hist.push([S.t, z(p.x, p.y, S.t)]);
        while (p.hist.length && p.hist[0][0] < S.t - 2 * T) p.hist.shift();
        if (!p.logged && p.hist.length > 10 && p.hist[p.hist.length - 1][0] - p.hist[0][0] >= 2 * T - 0.05) {
          p.logged = true;
          var th = ampTheory(p.x, p.y), ratio = th.amp / th.max;
          log('probe', { id: p.id, amp: round2(measured(p)), cls: ratio > 0.7 ? 'near-antinode' : ratio < 0.3 ? 'near-node' : 'between', x: round2(p.x), y: round2(p.y / H) });
        }
      });
      draw();
    });
    function round2(v) { return Math.round(v * 100) / 100; }
    function measured(p) { var m = 0; p.hist.forEach(function (h) { m = Math.max(m, Math.abs(h[1])); }); return m; }
    function play() { S.playing = true; playBtn.textContent = '暫停'; loop.start(); log('play', {}); }
    function pause() { S.playing = false; playBtn.textContent = '播放'; loop.stop(); log('pause', {}); draw(); }

    // 熱圖離屏
    var off = document.createElement('canvas'), offCtx = off.getContext('2d'), img = null;
    function drawTop(ctx, w, h) {
      var gw = Math.min(220, Math.max(120, Math.floor(w / 3))), gh = Math.round(gw * H);
      if (off.width !== gw || off.height !== gh) { off.width = gw; off.height = gh; img = offCtx.createImageData(gw, gh); }
      var d = img.data, i = 0;
      for (var py = 0; py < gh; py++) {
        var y = (py + 0.5) / gh * H;
        for (var px = 0; px < gw; px++) {
          var x = (px + 0.5) / gw, v = z(x, y, S.t) / (2 * P.amp);
          var s = Math.max(-1, Math.min(1, v)) * 0.5 + 0.5; // 0 波谷 1 波峰
          d[i++] = 18 + s * 222; d[i++] = 58 + s * 190; d[i++] = 128 + s * 125; d[i++] = 255;
        }
      }
      offCtx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, w, h);
      if (S.lines) drawLines(ctx, w, h);
      // 波源
      src().forEach(function (s, i) {
        var X = s[0] * w, Y = s[1] / H * h;
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#0b1b3a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(X, Y, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = U.font(12, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('S' + (i + 1), X, Y - 8);
      });
      drawProbes(ctx, function (p) { return [p.x * w, p.y / H * h]; });
    }
    function drawLines(ctx, w, h) {
      var dmax = P.d, L = lam();
      function hyp(delta, solid) {
        ctx.beginPath();
        var first = true;
        for (var yw = YS + 0.005; yw <= H; yw += 0.01) {
          var q = Math.abs(delta) < 1e-9 ? { x: 0.5, y: yw } : hyperPoint(delta, yw);
          var X = q.x * w, Y = q.y / H * h;
          first ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); first = false;
        }
        ctx.setLineDash(solid ? [] : [7, 6]); ctx.lineWidth = solid ? 2.2 : 1.8;
        ctx.strokeStyle = solid ? 'rgba(255,214,90,0.95)' : 'rgba(20,20,30,0.85)';
        ctx.stroke(); ctx.setLineDash([]);
      }
      for (var m = -5; m <= 5; m++) { if (Math.abs(m * L) < dmax - 1e-6) hyp(m * L, true); }
      for (var n = -5; n < 5; n++) { var dd = (n + 0.5) * L; if (Math.abs(dd) < dmax - 1e-6) hyp(dd, false); }
      // 圖例
      ctx.fillStyle = 'rgba(255,255,255,0.88)'; U.roundRect(ctx, 8, h - 50, 150, 42, 8); ctx.fill();
      ctx.font = U.font(11, 600); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(214,160,20,1)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(16, h - 38); ctx.lineTo(40, h - 38); ctx.stroke();
      ctx.fillStyle = '#222'; ctx.fillText('腹線（振幅最大）', 46, h - 38);
      ctx.setLineDash([6, 5]); ctx.strokeStyle = '#222'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(16, h - 20); ctx.lineTo(40, h - 20); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillText('節線（振幅最小）', 46, h - 20);
    }
    function drawProbes(ctx, proj) {
      S.probes.forEach(function (p) {
        var q = proj(p);
        ctx.fillStyle = colors.accent2; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(q[0], q[1], 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = U.font(10, 800); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.id, q[0], q[1] + 0.5);
      });
    }
    function draw3d(ctx, w, h) {
      ctx.fillStyle = colors.surface2; ctx.fillRect(0, 0, w, h);
      var nx = 70, ny = 44, sc = w * 0.9, hs = h * 0.028;
      function proj(x, y, zz) { var f = y / H; return [w / 2 + (x - 0.5) * sc * (0.72 + 0.28 * f), h * 0.16 + f * h * 0.74 - zz * hs]; }
      for (var j = 0; j <= ny; j++) {
        var y = j / ny * H, pts = [];
        for (var i = 0; i <= nx; i++) { var x = i / nx; pts.push(proj(x, y, z(x, y, S.t))); }
        // 遮擋：填色到底部
        ctx.beginPath(); ctx.moveTo(pts[0][0], h); pts.forEach(function (p) { ctx.lineTo(p[0], p[1]); }); ctx.lineTo(pts[pts.length - 1][0], h); ctx.closePath();
        var shade = 0.35 + 0.65 * (j / ny);
        ctx.fillStyle = 'rgba(' + Math.round(30 + 40 * shade) + ',' + Math.round(80 + 70 * shade) + ',' + Math.round(150 + 70 * shade) + ',1)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.25 + 0.5 * shade) + ')'; ctx.lineWidth = 1;
        ctx.beginPath(); pts.forEach(function (p, i) { i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.stroke();
      }
      src().forEach(function (s, i) {
        var q = proj(s[0], s[1], 0); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(q[0], q[1] - 6, 5, 0, Math.PI * 2); ctx.fill();
        ctx.font = U.font(12, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText('S' + (i + 1), q[0], q[1] - 13);
      });
      drawProbes(ctx, function (p) { return proj(p.x, p.y, z(p.x, p.y, S.t)); });
      ctx.fillStyle = colors.muted; ctx.font = U.font(11); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('3D 斜視：高度代表該瞬間的水面位移', 10, 8);
    }
    function draw() {
      var ctx = C.ctx, w = C.w, h = C.h;
      ctx.clearRect(0, 0, w, h);
      ctx.save(); U.roundRect(ctx, 0, 0, w, h, 10); ctx.clip();
      if (S.view === 'top') drawTop(ctx, w, h); else draw3d(ctx, w, h);
      ctx.restore();
      drawGraphs();
    }
    function drawGraphs() {
      var ctx = G.ctx, w = G.w, h = G.h;
      ctx.clearRect(0, 0, w, h);
      if (!S.probes.length) return;
      var T = 1 / P.f, ymax = 2 * P.amp;
      S.probes.forEach(function (p, i) {
        var y0 = 4 + i * 78, gh = 70, gx = 70, gw = w - gx - 120;
        ctx.fillStyle = colors.surface2; U.roundRect(ctx, 0, y0, w, gh, 8); ctx.fill();
        ctx.fillStyle = colors.accent2; ctx.beginPath(); ctx.arc(20, y0 + gh / 2, 11, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = U.font(12, 800); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.id, 20, y0 + gh / 2 + 0.5);
        ctx.fillStyle = colors.muted; ctx.font = U.font(10); ctx.textAlign = 'left'; ctx.fillText('位移', 36, y0 + 12); ctx.fillText('時間 →', gx + gw - 40, y0 + gh - 8);
        var mid = y0 + gh / 2;
        ctx.strokeStyle = colors.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gx, mid); ctx.lineTo(gx + gw, mid); ctx.stroke();
        if (p.hist.length > 1) {
          var tEnd = p.hist[p.hist.length - 1][0];
          ctx.strokeStyle = colors.accent; ctx.lineWidth = 2; ctx.beginPath();
          p.hist.forEach(function (hp, j) { var X = gx + gw - (tEnd - hp[0]) / (2 * T) * gw, Y = mid - hp[1] / ymax * (gh / 2 - 6); j ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
          ctx.stroke();
        }
        var span = p.hist.length > 1 ? p.hist[p.hist.length - 1][0] - p.hist[0][0] : 0;
        ctx.textAlign = 'left'; ctx.fillStyle = colors.text; ctx.font = U.font(12, 700);
        if (span >= 2 * T - 0.05) { ctx.fillText('最大偏移', gx + gw + 12, mid - 9); ctx.font = U.font(15, 800); ctx.fillText(measured(p).toFixed(2), gx + gw + 12, mid + 10); }
        else { ctx.fillStyle = colors.muted; ctx.font = U.font(11, 600); ctx.fillText(S.playing ? '記錄中…' : '請按播放記錄', gx + gw + 12, mid); }
      });
    }

    loop.start(); draw();
    return {
      destroy: function () { loop.destroy(); C.cv.removeEventListener('click', onClick); C.destroy(); G.destroy(); el.innerHTML = ''; },
      getState: function () {
        return {
          probes: S.probes.map(function (p) {
            var th = ampTheory(p.x, p.y);
            return { id: p.id, amp: round2(measured(p)), x: round2(p.x), y: round2(p.y / H), cls: th.amp / th.max > 0.7 ? 'near-antinode' : th.amp / th.max < 0.3 ? 'near-node' : 'between' };
          }),
          presets: S.presets.map(function (p) { return { id: p.id, x: round2(p.x), y: round2(p.y / H) }; }),
          view: S.view, linesShown: S.lines
        };
      }
    };
  }
  window.Sims.water = { mount: mount };
})();
