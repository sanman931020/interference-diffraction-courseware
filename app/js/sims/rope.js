/* 繩波疊加模擬（依 07B 模擬需求腳本） */
(function () {
  'use strict';
  window.Sims = window.Sims || {};
  var U = window.Sims._u;

  var WIDTH = 0.20, SPEED = 0.05, XA0 = 0.25, XB0 = 0.75, XP = 0.5, YMAX = 3, TEND = 17;

  function pulse(x, c, h) {
    var d = x - c;
    if (Math.abs(d) >= WIDTH / 2) return 0;
    return h * 0.5 * (1 + Math.cos(2 * Math.PI * d / WIDTH));
  }

  function mount(el, opts) {
    opts = opts || {};
    var log = U.logger(opts);
    var S = { A: 1, B: 1, t: 0, playing: false, overlapSeen: false, casesTried: [], lastCase: 'same' };

    el.classList.add('sim', 'sim-rope');
    el.innerHTML = '';
    var head = U.el('div', { class: 'sim-head' }, [
      U.el('div', { class: 'sim-title', text: '繩波疊加模擬' }),
      U.el('div', { class: 'sim-status', text: '' })
    ]);
    var status = head.lastChild;
    el.appendChild(head);

    var body = U.el('div', { class: 'sim-body sim-split' });
    el.appendChild(body);
    var left = U.el('div', { class: 'sim-main' });
    var right = U.el('div', { class: 'sim-side' });
    body.appendChild(left); body.appendChild(right);

    var C = U.canvas(left, function (w) { return Math.max(300, Math.min(520, w * 0.72)); }, function () { draw(); });
    C.wrap.appendChild(U.tag('模型示意｜非實拍'));

    var readout = U.el('div', { class: 'sim-readout', 'aria-live': 'polite' });
    left.appendChild(readout);

    // 控制項
    right.appendChild(U.el('div', { class: 'sim-side-title', text: '學生可調' }));
    var sA = U.slider('脈衝高度 A（含正負號）', { min: -1.5, max: 1.5, step: 0.1, value: 1, fmt: function (v) { return U.fmtSigned(v); },
      oninput: function (v) { S.A = Math.round(v * 10) / 10; reset(true); log('height', { which: 'A', value: S.A }); } });
    var sB = U.slider('脈衝高度 B（含正負號）', { min: -1.5, max: 1.5, step: 0.1, value: 1, fmt: function (v) { return U.fmtSigned(v); },
      oninput: function (v) { S.B = Math.round(v * 10) / 10; reset(true); log('height', { which: 'B', value: S.B }); } });
    right.appendChild(sA); right.appendChild(sB);
    right.appendChild(U.el('div', { class: 'sim-hint', text: '範圍 −1.5～＋1.5；步進 0.1。負值表示脈衝向下。' }));

    var caseRow = U.el('div', { class: 'sim-row' }, [
      U.btn('同向', function () { setCase('same'); }),
      U.btn('反向', function () { setCase('opposite'); })
    ]);
    var playBtn = U.btn('播放', function () { S.playing ? pause() : play(); }, 'primary');
    var ctlRow = U.el('div', { class: 'sim-row' }, [
      playBtn,
      U.btn('重設', function () { S.A = 1; S.B = 1; sA.set(1); sB.set(1); reset(false); log('reset', {}); }, 'ghost')
    ]);
    right.appendChild(caseRow); right.appendChild(ctlRow);
    right.appendChild(U.el('div', { class: 'sim-hint', text: '調整高度或切換案例即重置。' }));
    var fixed = U.el('details', { class: 'sim-fixed' }, [
      U.el('summary', { text: '程式固定參數' }),
      U.el('div', { text: '脈衝全寬 20%；波速每秒 5% 畫面寬度；起始位置 A 25%／B 75%；位移刻度 −3～＋3；P 在 50%。理想線性介質，忽略反射與衰減，視窗外不反彈。' })
    ]);
    right.appendChild(fixed);

    var loop = U.loop(function (dt) {
      var prev = S.t;
      S.t = Math.min(TEND, S.t + dt);
      if (prev < 5 && S.t >= 5) {
        if (!S.overlapSeen) S.overlapSeen = true;
        log('overlap', { A: S.A, B: S.B, sum: Math.round((S.A + S.B) * 10) / 10 });
      }
      if (S.t >= TEND) pause(true);
      draw();
    });

    function setCase(c) {
      S.lastCase = c;
      S.A = 1; S.B = c === 'same' ? 1 : -1;
      sA.set(S.A); sB.set(S.B);
      if (S.casesTried.indexOf(c) < 0) S.casesTried.push(c);
      reset(true);
      log('case', { case: c, A: S.A, B: S.B });
    }
    function play() {
      if (S.t >= TEND) S.t = 0;
      S.playing = true; playBtn.textContent = '暫停'; loop.start(); log('play', { t: round1(S.t) }); draw();
    }
    function pause(auto) {
      S.playing = false; playBtn.textContent = S.t >= TEND ? '重播' : '播放'; loop.stop();
      if (!auto) log('pause', { t: round1(S.t) });
      draw();
    }
    function reset(silent) {
      S.playing = false; loop.stop(); S.t = 0; playBtn.textContent = '播放'; draw();
    }
    function round1(v) { return Math.round(v * 10) / 10; }

    function dispA(x) { return pulse(x, XA0 + SPEED * S.t, S.A); }
    function dispB(x) { return pulse(x, XB0 - SPEED * S.t, S.B); }

    function draw() {
      var ctx = C.ctx, w = C.w, h = C.h, col = U.colors();
      ctx.clearRect(0, 0, w, h);
      var padL = 38, padR = 14, padT = 26, gap = 34, padB = 34;
      var ph = (h - padT - gap - padB) / 2;
      var panels = [{ y: padT, title: '① 分波模型　A 細實線／B 虛線' }, { y: padT + ph + gap, title: '② 合成繩形　粗實線' }];
      var pw = w - padL - padR;
      function X(f) { return padL + f * pw; }
      panels.forEach(function (p, i) {
        var Y = function (v) { return p.y + ph / 2 - v / YMAX * (ph / 2); };
        p.Y = Y;
        ctx.fillStyle = col.muted; ctx.font = U.font(12, 600); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText(p.title, padL, p.y - 6);
        // frame
        ctx.strokeStyle = col.line; ctx.lineWidth = 1;
        U.roundRect(ctx, padL, p.y, pw, ph, 8); ctx.stroke();
        // ticks y
        ctx.font = U.font(10); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = col.muted;
        [-3, 0, 3].forEach(function (v) { ctx.fillText((v > 0 ? '+' : '') + v, padL - 6, Y(v)); });
        // equilibrium
        ctx.strokeStyle = col.muted; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(1), Y(0)); ctx.stroke(); ctx.globalAlpha = 1;
        // P line
        ctx.setLineDash([2, 4]); ctx.strokeStyle = col.text; ctx.globalAlpha = 0.55;
        ctx.beginPath(); ctx.moveTo(X(XP), p.y + 4); ctx.lineTo(X(XP), p.y + ph - 4); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
        ctx.fillStyle = col.text; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.font = U.font(11, 600);
        ctx.fillText('P', X(XP) + 4, p.y + ph - 4);
      });
      // y-axis label
      ctx.save(); ctx.translate(11, padT + ph + gap / 2); ctx.rotate(-Math.PI / 2); ctx.fillStyle = col.muted; ctx.font = U.font(10);
      ctx.textAlign = 'center'; ctx.fillText('位移（相對單位）', 0, 0); ctx.restore();
      // x ticks
      var by = panels[1].y + ph;
      ctx.fillStyle = col.muted; ctx.font = U.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      [0, 25, 50, 75, 100].forEach(function (v) { ctx.fillText(String(v), X(v / 100), by + 4); });
      ctx.fillText('位置（畫面寬度 %）', X(0.5), by + 17);

      var N = Math.max(200, Math.floor(pw));
      function curve(Y, f, color, lw, dash) {
        ctx.save();
        ctx.beginPath(); ctx.rect(padL, Y(YMAX), pw, Y(-YMAX) - Y(YMAX)); ctx.clip();
        ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.lineJoin = 'round';
        ctx.beginPath();
        for (var i = 0; i <= N; i++) { var x = i / N, yv = f(x); if (i === 0) ctx.moveTo(X(x), Y(yv)); else ctx.lineTo(X(x), Y(yv)); }
        ctx.stroke(); ctx.restore();
      }
      var Y1 = panels[0].Y, Y2 = panels[1].Y;
      curve(Y1, dispA, col.accent, 1.6);
      curve(Y1, dispB, col.accent2, 2, [6, 5]);
      curve(Y2, function (x) { return dispA(x) + dispB(x); }, col.text, 3.4);
      // labels A/B with arrows
      var cA = XA0 + SPEED * S.t, cB = XB0 - SPEED * S.t;
      ctx.font = U.font(12, 700); ctx.textBaseline = 'bottom'; ctx.textAlign = 'center';
      function lab(c, hgt, name, dir, color) {
        if (c < -0.12 || c > 1.12) return;
        var yy = hgt >= 0 ? Y1(Math.max(hgt, 0)) - 6 : Y1(hgt) + 18;
        ctx.fillStyle = color;
        ctx.fillText(dir > 0 ? name + ' →' : '← ' + name, X(Math.min(0.97, Math.max(0.03, c))), yy);
      }
      var overlapping = Math.abs(cA - cB) < 0.02;
      if (overlapping) {
        ctx.fillStyle = col.text;
        ctx.fillText('A、B', X(0.5), Y1(Math.max(S.A, S.B, 0)) - 6);
      } else {
        lab(cA, S.A, 'A', 1, col.accent);
        lab(cB, S.B, 'B', -1, col.accent2);
      }
      // legend
      ctx.textAlign = 'right'; ctx.font = U.font(11); ctx.textBaseline = 'middle';
      var lx = padL + pw - 10, ly = panels[0].y + ph - 30;
      ctx.fillStyle = col.muted; ctx.fillText('分波 A', lx - 34, ly); ctx.fillText('分波 B', lx - 34, ly + 16);
      ctx.strokeStyle = col.accent; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(lx - 28, ly); ctx.lineTo(lx, ly); ctx.stroke();
      ctx.strokeStyle = col.accent2; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(lx - 28, ly + 16); ctx.lineTo(lx, ly + 16); ctx.stroke(); ctx.setLineDash([]);

      // P values
      var a = dispA(XP), b = dispB(XP), s = a + b;
      ctx.fillStyle = col.text; ctx.beginPath(); ctx.arc(X(XP), Y2(s), 4, 0, Math.PI * 2); ctx.fill();
      if (overlapping) {
        ctx.font = U.font(13, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillStyle = col.text;
        var sg = function (v) { return (v < 0 ? '−' : '＋') + Math.abs(v).toFixed(1); };
        ctx.fillText('P：' + sg(S.A) + sg(S.B) + '＝' + U.fmtSigned(Math.round((S.A + S.B) * 10) / 10), X(0.5), panels[1].y + 18);
      }
      readout.innerHTML = '<b>P 點回饋</b>：A＝' + U.fmtSigned(a) + '，B＝' + U.fmtSigned(b) + '，合成＝' + U.fmtSigned(s) + '（相對單位）';
      status.textContent = (S.playing ? '播放中' : '暫停中') + '　t＝' + S.t.toFixed(1) + ' 秒';
    }

    draw();
    return {
      destroy: function () { loop.destroy(); C.destroy(); el.innerHTML = ''; },
      getState: function () { return { A: S.A, B: S.B, t: Math.round(S.t * 10) / 10, overlapSeen: S.overlapSeen, casesTried: S.casesTried.slice() }; }
    };
  }

  window.Sims.rope = { mount: mount };
})();
