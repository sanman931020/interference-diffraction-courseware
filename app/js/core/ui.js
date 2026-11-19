/* 共用 UI 工具：元素建構、提示、對話框、燈箱、彩帶 */
(function () {
  const UI = {};
  UI.h = function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return el;
  };
  const h = UI.h;
  UI.fill = (el, ...kids) => el.replaceChildren(...kids.flat(Infinity).filter(k => k != null && k !== false).map(k => (k.nodeType ? k : document.createTextNode(String(k)))));
  UI.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  UI.toast = function (msg, ms = 2600) {
    let box = document.querySelector('.toasts');
    if (!box) { box = h('div', { class: 'toasts', 'aria-live': 'polite' }); document.body.append(box); }
    const t = h('div', { class: 'toast' }, msg);
    box.append(t);
    setTimeout(() => t.remove(), ms);
  };

  UI.modal = function ({ title, body, actions = [{ label: '關閉', primary: true }] }) {
    return new Promise(resolve => {
      const wrap = h('div', { class: 'modal-wrap', role: 'dialog', 'aria-modal': 'true' });
      const close = v => { wrap.remove(); resolve(v); };
      const m = h('div', { class: 'modal' },
        title && h('h3', null, title),
        typeof body === 'string' ? h('div', { html: body }) : body,
        h('div', { class: 'row', style: { justifyContent: 'flex-end', marginTop: '18px' } },
          actions.map(a => h('button', { class: 'btn' + (a.primary ? ' primary' : ''), onclick: () => close(a.value ?? a.label) }, a.label))));
      wrap.append(m);
      wrap.addEventListener('click', e => { if (e.target === wrap) close(null); });
      document.body.append(wrap);
      m.querySelector('.btn.primary, .btn')?.focus();
    });
  };

  UI.lightbox = function (src, caption) {
    const lb = h('div', { class: 'lightbox', role: 'dialog' },
      h('button', { class: 'btn icon-btn close', 'aria-label': '關閉', onclick: () => lb.remove() }, '✕'),
      h('figure', null, h('img', { src, alt: caption || '' }), caption && h('figcaption', { html: caption })));
    lb.addEventListener('click', e => { if (e.target === lb) lb.remove(); });
    const onKey = e => { if (e.key === 'Escape') { lb.remove(); document.removeEventListener('keydown', onKey); } };
    document.addEventListener('keydown', onKey);
    document.body.append(lb);
  };

  UI.fb = (type, text) => h('div', { class: 'fb ' + type }, h('span', { class: 'fb-ico' }, { good: '✓', warn: '!', bad: '✕', info: 'i' }[type]), h('div', { html: text }));

  UI.chip = (type, text) => h('span', { class: 'chip ' + (type || '') }, text);
  UI.evTag = kind => kind === 'real' ? UI.chip('real', '● 實拍證據') : kind === 'model' ? UI.chip('model', '◆ 模型示意｜非實拍') : UI.chip('', '▲ 示意圖');

  UI.confetti = function () {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = h('canvas', { class: 'confetti' }); document.body.append(c);
    const ctx = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
    const cols = ['#7c3aed', '#4f46e5', '#0ea5e9', '#10b981', '#eab308', '#f97316', '#ef4444'];
    const ps = Array.from({ length: 140 }, () => ({ x: innerWidth / 2, y: innerHeight / 3, vx: (Math.random() - .5) * 14, vy: Math.random() * -12 - 2, r: Math.random() * 6 + 3, c: cols[Math.random() * 7 | 0], a: Math.random() * 6 }));
    let n = 0;
    (function f() {
      ctx.clearRect(0, 0, c.width, c.height);
      ps.forEach(p => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.a += .2; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore(); });
      if (++n < 150) requestAnimationFrame(f); else c.remove();
    })();
  };

  /* 圖片：有本機檔案用本機；失敗時退回說明框 */
  UI.img = function (assetId, opts = {}) {
    const a = window.ASSETS && ASSETS.get(assetId);
    if (!a) return h('div', { class: 'muted' }, '（素材 ' + assetId + ' 未定義）');
    const cap = ASSETS.caption(a);
    const fig = h('div', { class: 'media-wrap' });
    const media = h('div', { class: 'media' });
    const im = h('img', { src: a.src, alt: a.title, loading: 'lazy' });
    im.addEventListener('click', () => { UI.lightbox(a.src, cap); opts.onOpen && opts.onOpen(a); });
    im.addEventListener('error', () => {
      media.replaceChildren(h('div', { style: { padding: '28px', color: '#cbd5e1', background: '#111827', textAlign: 'center', fontSize: '.9rem' } },
        '圖片未能載入（可能為離線狀態）。', h('br'), a.title, h('br'), a.url ? h('a', { href: a.url, target: '_blank', rel: 'noopener', style: { color: '#93c5fd' } }, '開啟原始來源頁') : ''));
    });
    media.append(im, h('div', { class: 'media-tag' }, UI.evTag(a.kind)));
    fig.append(media);
    if (opts.caption !== false) fig.append(h('div', { class: 'caption', html: cap }));
    return fig;
  };

  /* 名詞提示 */
  UI.term = (word, tip) => h('span', { class: 'term', title: tip, tabindex: 0 }, word);

  window.UI = UI;
})();
