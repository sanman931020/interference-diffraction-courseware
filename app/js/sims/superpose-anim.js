/* 波的疊加 36 秒動畫（依 07B 動畫影片需求腳本 5 個分鏡） */
(function () {
  'use strict';
  window.Sims = window.Sims || {};
  var U = window.Sims._u;
  var W = 0.2, T = 36;

  var SHOTS = [
    { id: '01', t0: 0, t1: 6, cap: '在理想線性介質中，兩個相同脈衝正相向傳播。' },
    { id: '02', t0: 6, t1: 14, cap: '同一位置的位移相加。同向重疊時，這裡的合成位移變大。' },
    { id: '03', t0: 14, t1: 20, cap: '通過之後，兩個脈衝仍各自向原方向傳播。' },
    { id: '04', t0: 20, t1: 28, cap: '改成等大反向時，位移抵銷，完全重疊當下合成位移為零。' },
    { id: '05', t0: 28, t1: 36, cap: '零位移只描述這一瞬間；不代表波或能量永久消失。' }
  ];

  function pulse(x, c, h) { var d = x - c; return Math.abs(d) >= W / 2 ? 0 : h * 0.5 * (1 + Math.cos(2 * Math.PI * d / W)); }

  // 依時間計算畫面狀態
  function stateAt(t) {
    var s = { hB: 1, cA: 0.25, cB: 0.75, freeze: false, nums: [], newCase: false, summary: false, shot: 0 };
    for (var i = 0; i < SHOTS.length; i++) if (t >= SHOTS[i].t0) s.shot = i;
    var v1 = 0.25 / 10.5; // 1.5s~12s 抵達中央
    if (t < 1.5) { s.cA = 0.25; s.cB = 0.75; }
    else if (t < 12) { var d = (t - 1.5) * v1; s.cA = 0.25 + d; s.cB = 0.75 - d; }
    else if (t < 14) { s.cA = s.cB = 0.5; s.freeze = true;
      if (t >= 12.2) s.nums.push('A：＋1'); if (t >= 12.8) s.nums.push('B：＋1'); if (t >= 13.4) s.nums.push('合成：＋2'); }
    else if (t < 20) { var e = (t - 14) * v1 * 1.6; s.cA = 0.5 + e; s.cB = 0.5 - e; }
    else {
      s.hB = -1;
      var v2 = 0.25 / 4.5;
      if (t < 21.5) { s.cA = 0.25; s.cB = 0.75; s.newCase = true; }
      else if (t < 26) { var f = (t - 21.5) * v2; s.cA = 0.25 + f; s.cB = 0.75 - f; }
      else if (t < 28) { s.cA = s.cB = 0.5; s.freeze = true; s.nums = ['P：＋1−1＝0']; }
      else if (t < 34) { var g = (t - 28) * v2; s.cA = 0.5 + g; s.cB = 0.5 - g; }
      else { var g2 = 6 * v2; s.cA = 0.5 + g2; s.cB = 0.5 - g2; s.summary = true; }
    }
    return s;
  }

  function mount(el, opts) {
    opts = opts || {};
    var log = U.logger(opts);
    var S = { t: 0, playing: false, completed: false };
    el.classList.add('sim', 'sim-anim');
    el.innerHTML = '';
    var head = U.el('div', { class: 'sim-head' }, [U.el('div', { class: 'sim-title', text: '動畫：兩個脈衝相遇的兩種案例（36 秒）' })]);
    el.appendChild(head);
    var C = U.canvas(el, function (w) { return Math.max(260, Math.min(440, w * 0.56)); }, function () { draw(); });
    C.wrap.appendChild(U.tag('模型示意｜非實拍'));
    var caption = U.el('div', { class: 'sim-caption', 'aria-live': 'polite' });
    el.appendChild(caption);

    var shotBox = U.el('div', { class: 'sim-shots' });
    var shotBtns = SHOTS.map(function (sh, i) {
      var b = U.el('button', { type: 'button', class: 'sim-shot', text: '鏡 ' + sh.id });
      b.addEventListener('click', function () { seek(sh.t0 + 0.01); log('seek', { t: sh.t0, shot: sh.id }); });
      shotBox.appendChild(b); return b;
    });
    var playBtn = U.btn('播放', function () { S.playing ? pause() : play(); }, 'primary');
    var replay = U.btn('重播', function () { seek(0); play(); }, 'ghost');
    var range = U.el('input', { type: 'range', min: 0, max: T, step: 0.05, value: 0, class: 'sim-timeline', 'aria-label': '時間軸' });
    var timeLbl = U.el('span', { class: 'sim-time', text: '0.0 / 36 秒' });
    range.addEventListener('input', function () { seek(parseFloat(range.value)); });
    range.addEventListener('change', function () { log('seek', { t: Math.round(S.t * 10) / 10 }); });
    el.appendChild(U.el('div', { class: 'sim-controls' }, [playBtn, replay, range, timeLbl]));
    el.appendChild(shotBox);

    var loop = U.loop(function (dt) {
      S.t += dt;
      if (S.t >= T) { S.t = T; if (!S.completed) { S.completed = true; log('complete', {}); } pause(true); }
      sync(); draw();
    });
    function play() { if (S.t >= T) S.t = 0; S.playing = true; playBtn.textContent = '暫停'; loop.start(); log('play', { t: Math.round(S.t * 10) / 10 }); }
    function pause(auto) { S.playing = false; playBtn.textContent = S.t >= T ? '重播' : '播放'; loop.stop(); if (!auto) log('pause', { t: Math.round(S.t * 10) / 10 }); }
    function seek(t) { S.t = Math.max(0, Math.min(T, t)); sync(); draw(); }
    function sync() { range.value = S.t; timeLbl.textContent = S.t.toFixed(1) + ' / 36 秒'; }

    function draw() {
      var ctx = C.ctx, w = C.w, h = C.h, col = U.colors(), st = stateAt(S.t);
      ctx.clearRect(0, 0, w, h);
      var padL = 54, padR = 16, padT = 22, gap = 22, padB = 16;
      var ph = (h - padT - gap - padB) / 2, pw = w - padL - padR;
      var X = function (f) { return padL + f * pw; };
      var mk = function (y0) { return function (v) { return y0 + ph / 2 - v / 2.6 * (ph / 2); }; };
      var Y1 = mk(padT), Y2 = mk(padT + ph + gap);
      ctx.font = U.font(13, 700); ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('分波', 10, padT + ph / 2); ctx.fillText('合成', 10, padT + ph + gap + ph / 2);
      [padT, padT + ph + gap].forEach(function (y0) {
        ctx.strokeStyle = col.line; ctx.lineWidth = 1; U.roundRect(ctx, padL, y0, pw, ph, 8); ctx.stroke();
        ctx.strokeStyle = col.muted; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(X(0), y0 + ph / 2); ctx.lineTo(X(1), y0 + ph / 2); ctx.stroke(); ctx.globalAlpha = 1;
        ctx.setLineDash([2, 4]); ctx.strokeStyle = col.text; ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.moveTo(X(0.5), y0 + 3); ctx.lineTo(X(0.5), y0 + ph - 3); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      });
      ctx.fillStyle = col.text; ctx.font = U.font(12, 600); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText('P', X(0.5) + 4, padT + 2 * ph + gap - 3);
      var N = Math.floor(pw);
      function curve(Y, f, color, lw, dash) {
        ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.beginPath();
        for (var i = 0; i <= N; i++) { var x = i / N; var y = Y(f(x)); i ? ctx.lineTo(X(x), y) : ctx.moveTo(X(x), y); }
        ctx.stroke(); ctx.setLineDash([]);
      }
      var fa = function (x) { return pulse(x, st.cA, 1); }, fb = function (x) { return pulse(x, st.cB, st.hB); };
      curve(Y1, fa, col.accent, 1.8); curve(Y1, fb, col.accent2, 2.2, [6, 5]);
      curve(Y2, function (x) { return fa(x) + fb(x); }, col.text, 3.6);
      // labels + arrows
      ctx.font = U.font(13, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      var moving = !st.freeze && !st.newCase && !st.summary;
      if (Math.abs(st.cA - st.cB) < 0.03) {
        ctx.fillStyle = col.text; ctx.fillText('A、B', X(0.5), Y1(1) - 6);
      } else {
        ctx.fillStyle = col.accent; ctx.fillText('A →', X(st.cA), Y1(1) - 6);
        ctx.fillStyle = col.accent2; ctx.fillText('← B', X(st.cB), st.hB > 0 ? Y1(1) - 6 : Y1(-1) + 20);
      }
      // overlays
      function badge(text, x, y, color) {
        ctx.font = U.font(13, 700); var tw = ctx.measureText(text).width + 18;
        ctx.fillStyle = color; ctx.globalAlpha = 0.92; U.roundRect(ctx, x - tw / 2, y - 13, tw, 26, 13); ctx.fill(); ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 1);
      }
      if (st.freeze) badge('教學定格', X(0.12), padT + 18, col.warn);
      if (st.newCase) badge('新案例：等大反向', X(0.5), padT + 18, col.accent2);
      if (st.nums.length) {
        ctx.font = U.font(14, 700); ctx.fillStyle = col.text; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        st.nums.forEach(function (n, i) { ctx.fillText(n, X(0.62), padT + ph + gap + 18 + i * 18); });
      }
      if (st.summary) {
        ctx.fillStyle = col.surface; ctx.globalAlpha = 0.86; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1;
        ctx.fillStyle = col.text; ctx.font = U.font(Math.max(16, Math.min(24, w / 26)), 800); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('重疊暫時，通過後各自傳播', w / 2, h / 2);
      }
      void moving;
      var sh = SHOTS[st.shot];
      caption.innerHTML = '<span class="sim-cap-id">鏡 ' + sh.id + '</span>「' + sh.cap + '」';
      shotBtns.forEach(function (b, i) { b.classList.toggle('on', i === st.shot); });
    }
    sync(); draw();
    return {
      destroy: function () { loop.destroy(); C.destroy(); el.innerHTML = ''; },
      getState: function () { return { t: Math.round(S.t * 10) / 10, completed: S.completed }; }
    };
  }
  window.Sims.superposeAnim = { mount: mount };
})();
