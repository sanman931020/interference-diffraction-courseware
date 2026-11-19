/* 模擬共用工具：須最先載入（在其他 sims/*.js 之前） */
(function () {
  'use strict';
  window.Sims = window.Sims || {};
  var U = {};

  U.css = function (name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    v = v && v.trim();
    return v || fallback || '#888';
  };
  U.colors = function () {
    return {
      bg: U.css('--bg', '#f7f8fb'), surface: U.css('--surface', '#ffffff'), surface2: U.css('--surface-2', '#eef1f6'),
      text: U.css('--text', '#1b2030'), muted: U.css('--muted', '#6b7385'), line: U.css('--line', '#d9dee8'),
      accent: U.css('--accent', '#3b6cf6'), accent2: U.css('--accent-2', '#e0567a'),
      good: U.css('--good', '#1f9d6b'), warn: U.css('--warn', '#d99012'), bad: U.css('--bad', '#d64545')
    };
  };

  U.el = function (tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    (children || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  };

  U.logger = function (opts) {
    return function (a, d) { try { if (opts && typeof opts.log === 'function') opts.log(a, d || {}); } catch (e) { /* ignore */ } };
  };

  /* 自適應畫布：aspect = 高/寬，或函式(w)→h */
  U.canvas = function (parent, aspect, onResize) {
    var wrap = U.el('div', { class: 'sim-canvas-wrap' });
    var cv = U.el('canvas', { class: 'sim-canvas' });
    wrap.appendChild(cv); parent.appendChild(wrap);
    var ctx = cv.getContext('2d');
    var st = { cv: cv, ctx: ctx, w: 300, h: 200, wrap: wrap };
    function fit(silent) {
      var w = Math.max(150, Math.floor(wrap.clientWidth || 300));
      var h = Math.round(typeof aspect === 'function' ? aspect(w) : w * aspect);
      var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      cv.style.width = w + 'px'; cv.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      st.w = w; st.h = h; st.dpr = dpr;
      if (onResize && !silent) onResize(st);
    }
    var ro = new ResizeObserver(function () { fit(); });
    fit(true);
    ro.observe(wrap);
    st.fit = fit;
    st.destroy = function () { ro.disconnect(); };
    return st;
  };

  /* 動畫迴圈：頁面隱藏時自動暫停 */
  U.loop = function (step) {
    var raf = 0, last = 0, running = false, dead = false;
    function frame(ts) {
      if (!running || dead) return;
      var dt = last ? Math.min(0.1, (ts - last) / 1000) : 0;
      last = ts;
      if (!document.hidden) step(dt);
      raf = requestAnimationFrame(frame);
    }
    function vis() { last = 0; }
    document.addEventListener('visibilitychange', vis);
    return {
      start: function () { if (running || dead) return; running = true; last = 0; raf = requestAnimationFrame(frame); },
      stop: function () { running = false; cancelAnimationFrame(raf); },
      get running() { return running; },
      destroy: function () { dead = true; running = false; cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', vis); }
    };
  };

  U.btn = function (label, onclick, cls) {
    return U.el('button', { type: 'button', class: 'btn ' + (cls || ''), onclick: onclick, text: label });
  };

  U.slider = function (label, o) {
    // o: {min,max,step,value,fmt,oninput}
    var fmt = o.fmt || function (v) { return String(v); };
    var val = U.el('span', { class: 'sim-slider-val', text: fmt(o.value) });
    var inp = U.el('input', { type: 'range', min: o.min, max: o.max, step: o.step, value: o.value, 'aria-label': label });
    inp.addEventListener('input', function () { var v = parseFloat(inp.value); val.textContent = fmt(v); o.oninput && o.oninput(v); });
    var box = U.el('label', { class: 'sim-slider' }, [U.el('span', { class: 'sim-slider-label', text: label }), val, inp]);
    box.input = inp;
    box.set = function (v) { inp.value = v; val.textContent = fmt(v); };
    return box;
  };

  U.seg = function (options, value, onchange, ariaLabel) {
    // options: [{value,label}]
    var box = U.el('div', { class: 'sim-seg', role: 'group', 'aria-label': ariaLabel || '' });
    var btns = options.map(function (op) {
      var b = U.el('button', { type: 'button', text: op.label, 'aria-pressed': String(op.value === value) });
      b.addEventListener('click', function () { box.set(op.value); onchange && onchange(op.value); });
      box.appendChild(b); return { b: b, v: op.value };
    });
    box.set = function (v) { btns.forEach(function (x) { x.b.setAttribute('aria-pressed', String(x.v === v)); x.b.classList.toggle('on', x.v === v); }); };
    box.set(value);
    return box;
  };

  U.tag = function (text) { return U.el('div', { class: 'sim-tag', text: text || '模型示意｜非實拍' }); };

  U.fmtSigned = function (v, d) {
    d = d == null ? 1 : d;
    var s = Math.abs(v) < 1e-9 ? 0 : v;
    var t = Math.abs(s).toFixed(d);
    return (s > 0 ? '＋' : s < 0 ? '−' : '') + t;
  };

  /* 波長(nm) → RGB 0..1（近似可見光色彩） */
  U.wlRGB = function (wl) {
    var r = 0, g = 0, b = 0;
    if (wl >= 380 && wl < 440) { r = -(wl - 440) / 60; b = 1; }
    else if (wl < 490) { g = (wl - 440) / 50; b = 1; }
    else if (wl < 510) { g = 1; b = -(wl - 510) / 20; }
    else if (wl < 580) { r = (wl - 510) / 70; g = 1; }
    else if (wl < 645) { r = 1; g = -(wl - 645) / 65; }
    else if (wl <= 780) { r = 1; }
    var f = 1;
    if (wl < 420) f = 0.3 + 0.7 * (wl - 380) / 40;
    else if (wl > 700) f = 0.3 + 0.7 * (780 - wl) / 80;
    return [r * f, g * f, b * f];
  };
  U.rgbStr = function (c, a) {
    var f = function (x) { return Math.max(0, Math.min(255, Math.round(x * 255))); };
    return 'rgba(' + f(c[0]) + ',' + f(c[1]) + ',' + f(c[2]) + ',' + (a == null ? 1 : a) + ')';
  };

  U.roundRect = function (ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };

  U.font = function (px, weight) {
    var fam = getComputedStyle(document.body || document.documentElement).fontFamily || 'sans-serif';
    return (weight || 400) + ' ' + px + 'px ' + fam;
  };

  window.Sims._u = U;
})();
