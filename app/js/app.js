/* 路由、側欄導覽、登入、主題 */
(function () {
  const { h } = UI;
  const App = window.App = { cleanups: [], next: () => { } };
  App.runCleanups = () => { const c = App.cleanups; App.cleanups = []; c.forEach(f => { try { f(); } catch (e) { } }); };
  App.setCrumb = t => { const el = document.querySelector('.crumb'); if (el) el.textContent = t; document.title = t + '｜干涉與繞射'; };

  function sidebar() {
    const r = Store.rec; const hash = location.hash || '#/home';
    const link = (href, ico, text, opts = {}) => h('a', { href, class: (hash === href || (opts.prefix && hash.startsWith(opts.prefix)) ? 'active' : '') + (opts.done ? ' done' : '') }, h('span', { class: 'ico' }, ico), h('span', null, text));
    const nav = h('nav', { class: 'nav', 'aria-label': '主選單' },
      h('div', { class: 'nav-group' }, h('div', { class: 'nav-title' }, '單元'),
        link('#/home', '⌂', '首頁'),
        link('#/test/pre', '前', '前測', { done: r.tests.pre && r.tests.pre.submittedAt })),
      h('div', { class: 'nav-group' }, h('div', { class: 'nav-title' }, '三節課'),
        COURSE.lessons.map(l => {
          const p = Pages.lessonProgress(l); const cur = hash.startsWith('#/lesson/' + l.id);
          return [link('#/lesson/' + l.id, String(l.no), l.title, { prefix: '#/lesson/' + l.id, done: p === 100 }),
            cur ? l.steps.map(s => h('a', { href: `#/lesson/${l.id}/${s.id}`, class: 'sub' + (hash === `#/lesson/${l.id}/${s.id}` || (hash === '#/lesson/' + l.id && s === l.steps[0]) ? ' active' : '') + (Pages.stepDone(l, s) ? ' done' : '') }, s.id + '　' + s.title)) : null];
        })),
      h('div', { class: 'nav-group' }, h('div', { class: 'nav-title' }, '統整'),
        link('#/summary', '◎', '單元統整'), link('#/test/post', '後', '後測', { done: r.tests.post && r.tests.post.submittedAt }), link('#/extension', '↗', '延伸學習'), link('#/credits', '©', '素材與授權')),
      h('div', { class: 'nav-group' }, h('div', { class: 'nav-title' }, '教師'), link('#/teacher', '師', '教師端', { prefix: '#/teacher' })));
    return h('aside', { class: 'side', id: 'side' },
      h('a', { class: 'brand', href: '#/home' }, h('div', { class: 'brand-logo' }, '∿'), h('div', null, h('b', null, '干涉與繞射'), h('small', { class: 'muted' }, '線上互動教材'))),
      h('div', { class: 'who' }, h('span', { class: 'dot' }), h('span', null, '學生代碼：', h('b', null, r.student.code)), h('span', { class: 'spacer' }), h('button', { class: 'btn ghost sm', onclick: switchUser }, '切換')),
      nav,
      h('div', { class: 'side-foot' },
        h('button', { class: 'btn sm', onclick: () => Store.exportJSON() }, '⤓ 下載學習紀錄'),
        h('button', { class: 'btn sm ghost', onclick: clearData }, '清除本機紀錄（共用設備）')));
  }

  async function switchUser() {
    const v = await UI.modal({ title: '切換學生', body: '目前的紀錄會保留在這台裝置。要登出並換其他學生代碼嗎？', actions: [{ label: '取消', value: 0 }, { label: '登出', value: 1, primary: true }] });
    if (v === 1) { Store.logout(); login(); }
  }
  async function clearData() {
    const v = await UI.modal({ title: '清除本機紀錄', body: '將永久刪除這台裝置上「' + Store.code + '」的作答紀錄，無法復原。<br>建議先按「下載學習紀錄」保存。確定清除嗎？', actions: [{ label: '取消', value: 0 }, { label: '先下載再清除', value: 2 }, { label: '直接清除', value: 1, primary: true }] });
    if (v === 2) Store.exportJSON();
    if (v === 1 || v === 2) { Store.clear(); UI.toast('已清除'); login(); }
  }

  function login() {
    App.runCleanups();
    const input = h('input', { type: 'text', placeholder: '例如：10123（座號或老師指定代碼）', maxlength: 24, 'aria-label': '學生代碼' });
    const go = (code) => { code = (code || '').trim(); if (!code) { input.focus(); return; } if (!/^[\w\-一-鿿]{1,24}$/.test(code)) { UI.toast('代碼請用英數字或中文，勿含空白與符號'); return; } const resumed = Store.login(code); boot(); UI.toast(resumed ? '歡迎回來！已載入你的紀錄。' : '歡迎加入光學偵探社！'); };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') go(input.value); });
    document.getElementById('app').replaceChildren(h('div', { style: { minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '16px', background: 'radial-gradient(900px 500px at 20% 0%, color-mix(in srgb, var(--accent) 22%, transparent), transparent), var(--bg)' } },
      h('div', { class: 'card', style: { maxWidth: '460px', width: '100%', padding: '32px' } },
        h('div', { class: 'brand', style: { padding: 0, marginBottom: '14px' } }, h('div', { class: 'brand-logo' }, '∿'), h('div', null, h('b', null, '干涉與繞射'), h('small', { class: 'muted' }, '光學偵探社：狹縫後的亮暗之謎'))),
        h('h2', null, '輸入學生代碼'), h('p', { class: 'muted' }, '以學生代碼作答，不需姓名。紀錄存在這台裝置的瀏覽器，重新整理可續作，也能下載交給老師。'),
        input,
        h('div', { class: 'row', style: { marginTop: '14px' } }, h('button', { class: 'btn primary lg', style: { flex: 1 }, onclick: () => go(input.value) }, '開始'), h('button', { class: 'btn lg', onclick: () => go('訪客' + Math.floor(Math.random() * 9000 + 1000)) }, '訪客體驗')),
        h('p', { class: 'muted', style: { fontSize: '.8rem', marginTop: '14px' } }, '老師請先以任一代碼登入，再到側欄「教師端」。'))));
    document.getElementById('app').append(h('div', { class: 'watermark', 'aria-hidden': 'true' }, h('span', null, Pages.WATERMARK)));
    setTimeout(() => input.focus(), 50);
  }

  function shell() {
    const main = h('main', { class: 'main' },
      h('div', { class: 'topbar' },
        h('button', { class: 'btn icon-btn menu-btn', 'aria-label': '開啟選單', onclick: () => { document.getElementById('side').classList.add('open'); scrim.classList.add('show'); } }, '☰'),
        h('div', { class: 'crumb' }, ''),
        h('button', { class: 'btn icon-btn ghost', title: '切換深淺色', 'aria-label': '切換深淺色', onclick: toggleTheme }, '◐')),
      h('div', { class: 'content', id: 'view' }));
    const scrim = h('div', { class: 'scrim', onclick: closeMenu });
    document.getElementById('app').replaceChildren(h('div', { class: 'app' }, h('div', { id: 'sideWrap' }), main), scrim);
  }
  function closeMenu() { document.getElementById('side')?.classList.remove('open'); document.querySelector('.scrim')?.classList.remove('show'); }
  App.refreshNav = () => { const w = document.getElementById('sideWrap'); if (!w) return; const open = document.getElementById('side')?.classList.contains('open'); const s = sidebar(); if (open) s.classList.add('open'); w.replaceChildren(s); };
  function toggleTheme() {
    const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const nx = cur === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = nx;
    try { localStorage.setItem('idr:theme', nx); } catch (e) { }
    route();
  }

  function route() {
    if (!Store.rec) return login();
    App.runCleanups(); closeMenu();
    const view = document.getElementById('view'); if (!view) { shell(); return route(); }
    const parts = (location.hash || '#/home').slice(2).split('/');
    const [page, a, b] = parts;
    try {
      if (page === 'lesson') Pages.lesson(view, a, b);
      else if (page === 'test') Pages.test(view, a);
      else if (page === 'summary') Pages.summary(view);
      else if (page === 'extension') Pages.extension(view);
      else if (page === 'credits') Pages.credits(view);
      else if (page === 'teacher') Pages.teacher(view, a);
      else Pages.home(view);
    } catch (e) { console.error(e); view.replaceChildren(UI.fb('bad', '頁面發生錯誤：' + UI.esc(e.message))); }
    App.refreshNav();
    if (!b || page !== 'lesson') scrollTo(0, 0); else scrollTo(0, 0);
  }

  function boot() { shell(); route(); }
  window.addEventListener('hashchange', route);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('projector')) document.body.classList.remove('projector'); });
  try { const th = localStorage.getItem('idr:theme'); if (th) document.documentElement.dataset.theme = th; } catch (e) { }
  window.addEventListener('DOMContentLoaded', () => { Store.load(); if (Store.rec) boot(); else login(); });
})();
