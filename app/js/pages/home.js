/* 首頁、單元統整、延伸學習、素材授權、證據筆記本 */
(function () {
  const { h } = UI;
  const P = Pages;
  const BADGES = [{ id: 'b0', name: '啟程偵探', icon: '◎', how: '完成前測' }, ...COURSE.lessons.map(l => ({ ...l.badge, how: `完成第 ${l.no} 節學習單` })), { id: 'b4', name: '結案報告', icon: '★', how: '完成後測' }];
  P.BADGES = BADGES;

  function heroWaves(cv) {
    const ctx = cv.getContext('2d'); let raf, t = 0;
    const draw = () => {
      const w = cv.width = cv.clientWidth * devicePixelRatio, hh = cv.height = cv.clientHeight * devicePixelRatio;
      ctx.clearRect(0, 0, w, hh);
      const s1 = [w * .72, hh * .35], s2 = [w * .72, hh * .65];
      for (let r = (t % 40); r < w; r += 40) {
        for (const [s, c] of [[s1, 'rgba(129,140,248,'], [s2, 'rgba(34,211,238,']]) {
          ctx.strokeStyle = c + Math.max(0, .5 - r / w * .6) + ')'; ctx.lineWidth = 1.5 * devicePixelRatio;
          ctx.beginPath(); ctx.arc(s[0], s[1], r * devicePixelRatio, Math.PI * .5, Math.PI * 1.5); ctx.stroke();
        }
      }
      if (!document.hidden) t += .4;
      raf = requestAnimationFrame(draw);
    };
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) draw();
    App.cleanups.push(() => cancelAnimationFrame(raf));
  }

  /* 首頁草寫浮水印：固定於畫面、不攔截點擊；離開首頁時移除 */
  P.WATERMARK = '1127AIark San Man-Wu';
  P.watermark = function (host) {
    const wm = h('div', { class: 'watermark', 'aria-hidden': 'true' }, h('span', null, P.WATERMARK));
    (host || document.querySelector('.app') || document.body).append(wm);
    App.cleanups.push(() => wm.remove());
    return wm;
  };

  P.home = function (root) {
    App.setCrumb('首頁');
    const r = Store.rec;
    const firstOpen = (() => { for (const l of COURSE.lessons) { const s = l.steps.find(s => !P.stepDone(l, s)); if (s) return `#/lesson/${l.id}/${s.id}`; } return '#/summary'; })();
    const started = Object.keys(r.progress).length > 0;
    const cv = h('canvas', { 'aria-hidden': 'true' });
    const testCard = (id, label, desc) => { const t = QB.tests[id]; const tr = r.tests[id]; return h('div', { class: 'card lesson-card' }, h('div', { class: 'band' }), h('div', { class: 'row' }, h('h3', { style: { margin: 0 } }, label), h('span', { class: 'spacer' }), tr && tr.submittedAt ? UI.chip('good', `${tr.score}/${t.total}`) : UI.chip('', '未完成')), h('p', { class: 'muted', style: { margin: 0 } }, desc), h('div', { class: 'meta' }, UI.chip('', `${t.items.length} 題｜${t.total} 分｜${t.minutes} 分鐘`)), h('a', { class: 'btn' + (tr && tr.submittedAt ? '' : ' primary'), href: '#/test/' + id }, tr && tr.submittedAt ? '查看結果' : '開始')); };
    UI.fill(root, 
      h('section', { class: 'hero' }, cv,
        h('span', { class: 'chip', style: { background: 'rgba(255,255,255,.14)', color: '#fff' } }, '高一必修物理｜3 節課｜線上互動教材'),
        h('h1', null, COURSE.title), h('div', { class: 'lead' }, COURSE.subtitle + '。用真實照片當證據，用波的疊加解開光的亮暗之謎。'),
        h('div', { class: 'q' }, h('b', null, '核心問題　'), COURSE.coreQuestion),
        h('div', { class: 'row' }, h('a', { class: 'btn primary lg', href: r.tests.pre && r.tests.pre.submittedAt ? firstOpen : '#/test/pre' }, started ? '繼續學習 →' : '從前測開始 →'), h('a', { class: 'btn lg', href: '#/lesson/L1' }, '直接進入第 1 節'))),
      h('h2', { style: { marginTop: '32px' } }, '學習路徑'),
      h('div', { class: 'path' }, COURSE.path.map(p => h('div', { class: 'st' }, h('b', null, p.t), h('span', { class: 'muted' }, p.d)))),
      h('div', { class: 'row', style: { marginTop: '32px' } }, h('h2', { style: { margin: 0 } }, '三節課'), h('span', { class: 'spacer' }), h('span', { class: 'muted' }, '每節：預測 → 觀察 → 解釋 → CER → 修訂')),
      h('div', { class: 'grid g3', style: { marginTop: '12px' } }, COURSE.lessons.map(l => {
        const p = P.lessonProgress(l);
        return h('div', { class: 'card lesson-card' }, h('div', { class: 'band' }),
          h('div', { class: 'row' }, h('div', null, h('div', { class: 'muted', style: { fontSize: '.8rem', fontWeight: 700 } }, `第 ${l.no} 節｜${l.func}`), h('h3', { style: { margin: '2px 0 0' } }, l.title)), h('span', { class: 'spacer' }), h('div', { class: 'progress-ring', style: { '--p': p } }, h('span', null, p + '%'))),
          h('p', { style: { margin: 0 } }, '核心問題：' + l.coreQ),
          h('div', { class: 'meta' }, l.goals.map(g => UI.chip('accent', g)), UI.chip('', '產出：' + l.output)),
          h('div', { class: 'row', style: { marginTop: 'auto' } }, h('div', { class: 'badge-medal' + (r.badges.includes(l.badge.id) ? ' on' : ''), style: { width: '40px', height: '40px', fontSize: '1rem' }, title: l.badge.name }, l.badge.icon), h('span', { class: 'muted', style: { fontSize: '.82rem' } }, l.badge.name), h('span', { class: 'spacer' }), h('a', { class: 'btn primary', href: '#/lesson/' + l.id }, p ? '繼續' : '開始')));
      })),
      h('h2', { style: { marginTop: '32px' } }, '評量與統整'),
      h('div', { class: 'grid g4' },
        testCard('pre', '前測', '教學前診斷初始理解，不列成績。'),
        h('div', { class: 'card lesson-card' }, h('div', { class: 'band' }), h('h3', { style: { margin: 0 } }, '單元統整'), h('p', { class: 'muted', style: { margin: 0 } }, '回顧四個知識節點與自己的 CER 修訂歷程。'), h('a', { class: 'btn', href: '#/summary' }, '前往')),
        testCard('post', '後測', '完成三節課後施測。'),
        h('div', { class: 'card lesson-card' }, h('div', { class: 'band' }), h('h3', { style: { margin: 0 } }, '延伸學習'), h('p', { class: 'muted', style: { margin: 0 } }, '高中量化 → 大一波動光學的進階資源。'), h('a', { class: 'btn', href: '#/extension' }, '前往'))),
      h('h2', { style: { marginTop: '32px' } }, '我的徽章'),
      h('div', { class: 'row', style: { gap: '18px' } }, BADGES.map(b => h('div', { style: { textAlign: 'center', width: '90px' } }, h('div', { class: 'badge-medal' + (r.badges.includes(b.id) ? ' on' : ''), style: { margin: '0 auto' } }, b.icon), h('div', { style: { fontSize: '.82rem', fontWeight: 700, marginTop: '6px' } }, b.name), h('div', { class: 'muted', style: { fontSize: '.72rem' } }, b.how)))));
    P.watermark();
    heroWaves(cv);
  };

  P.summary = function (root) {
    App.setCrumb('單元統整');
    const nodes = ['N01', 'N02', 'N03', 'N04'].map(k => COURSE.nodes[k]);
    const chain = [['L1Q7', '第1節 水波 CER'], ['L2Q6', '第2節 光的解釋'], ['L3Q5', '第3節 統整論證']].map(([id, label]) => {
      const a = Store.ans(id);
      const txt = a.revisedNext || a.revision || a.draft || '';
      return h('div', { class: 'card flat' }, h('div', { class: 'row' }, h('b', null, label), h('span', { class: 'spacer' }), a.done ? UI.chip('good', '已完成') : UI.chip('', '未完成')),
        txt ? h('p', { style: { whiteSpace: 'pre-wrap', fontSize: '.9rem', margin: '8px 0 0' } }, txt.length > 260 ? txt.slice(0, 260) + '…' : txt) : h('p', { class: 'muted' }, '尚未作答'),
        a.revisedNextReason ? h('div', { class: 'muted', style: { fontSize: '.82rem' } }, '下一節的修訂理由：' + a.revisedNextReason) : null);
    });
    const ev = Store.rec.evidence;
    UI.fill(root, 
      h('h1', null, '單元統整'), h('p', { class: 'muted' }, COURSE.conclusion),
      h('h2', null, '概念地圖'),
      h('div', { class: 'grid g4' }, nodes.map((n, i) => h('div', { class: 'card lesson-card' }, h('div', { class: 'band' }), h('span', { class: 'chip accent' }, '節點 ' + n.no), h('h3', { style: { margin: 0 } }, n.title), h('p', { style: { fontSize: '.9rem', margin: 0 } }, n.core), h('div', { class: 'muted', style: { fontSize: '.8rem' } }, n.link)))),
      h('div', { class: 'fb info', style: { marginTop: '14px' } }, h('span', { class: 'fb-ico' }, '→'), h('div', null, '位移相加 → 振幅穩定分布（腹線、節線）→ 兩個相干次波源 → 連續分布的次波源 → 兩表面反射光 → 光的波動性論證（有界限）')),
      h('div', { class: 'split even', style: { marginTop: '24px' } },
        h('div', null, h('h2', null, '我的 CER 修訂鏈'), h('div', { class: 'stack' }, chain)),
        h('div', null, h('h2', null, '證據筆記本'), h('p', { class: 'muted' }, '你在學習中查看過的素材。只有「實拍」能當作光的證據。'),
          ev.length ? h('div', { class: 'stack' }, ev.map(e => { const a = ASSETS.get(e.id); return h('div', { class: 'evi-card' }, a ? h('img', { src: a.src, alt: '' }) : h('div', { class: 'badge-medal', style: { width: '54px', height: '54px', borderRadius: '8px', filter: 'none', opacity: 1 } }, '◆'), h('div', null, UI.evTag(e.kind), h('div', { style: { fontWeight: 600, fontSize: '.9rem' } }, e.title), e.note ? h('div', { class: 'muted', style: { fontSize: '.8rem' } }, e.note) : null)); })) : h('p', { class: 'muted' }, '尚無紀錄。'))),
      h('div', { class: 'row', style: { marginTop: '26px' } }, h('a', { class: 'btn primary lg', href: '#/test/post' }, '前往後測 →'), h('button', { class: 'btn', onclick: () => Store.exportHTML() }, '下載完整學習紀錄（HTML）'), h('a', { class: 'btn', href: '#/extension' }, '延伸學習')));
  };

  P.extension = function (root) {
    App.setCrumb('延伸學習');
    const E = TEACH.ext;
    const res = (title, list) => h('div', { class: 'card' }, h('h3', null, title), h('div', { class: 'stack' }, list.map(r => h('div', { class: 'card flat' }, h('div', { class: 'row' }, h('b', null, r.name), h('span', { class: 'spacer' }), r.url ? h('a', { class: 'btn sm', href: r.url, target: '_blank', rel: 'noopener' }, '開啟來源 ↗') : UI.chip('', '紙本教材')), h('p', { style: { margin: '6px 0' } }, r.sum), h('div', { class: 'muted', style: { fontSize: '.82rem' } }, r.src + '｜' + r.use)))));
    UI.fill(root, h('h1', null, '延伸學習'), h('p', { class: 'muted' }, '高一定性理解 → 高中量化 → 大一波動光學。' + E.note),
      h('div', { class: 'card table-scroll' }, h('table', { class: 'doc-table' }, h('tr', null, h('th', null, '規劃面向'), h('th', null, '目前單元'), h('th', null, '第一進階年段'), h('th', null, '第二進階年段')), E.stages.map(r => h('tr', null, h('th', null, r[0]), r.slice(1).map(c => h('td', null, c)))))),
      h('div', { class: 'grid g2', style: { marginTop: '16px' } }, res('第一進階年段　高中量化', E.res1), res('第二進階年段　大一波動光學', E.res2)),
      h('h2', { style: { marginTop: '26px' } }, '延伸現象圖庫'),
      h('div', { class: 'grid g4' }, ['peacock', 'morpho', 'hubble_spikes', 'newton_rings', 'ar_lens', 'cd_rainbow'].map(id => h('div', null, UI.img(id), h('div', { style: { fontSize: '.82rem', marginTop: '4px' } }, ASSETS.get(id).use)))),
      h('h2', { style: { marginTop: '26px' } }, '模擬進階模式（可調參數）'),
      h('p', { class: 'muted' }, '課堂主流程鎖定參數；這裡開放調整，供有興趣的同學探索。'),
      (() => { const tabs = ['water', 'doubleSlitPattern', 'singleSlit', 'thinFilm']; const names = ['水波干涉', '光的雙狹縫干涉', '單狹縫繞射', '薄膜干涉']; const box = h('div'); const bar = h('div', { class: 'seg' }); let ctl;
        const show = i => { bar.querySelectorAll('button').forEach((b, k) => b.classList.toggle('on', k === i)); App.runCleanupsSoft && 0; if (ctl) try { ctl.destroy(); } catch (e) { } box.replaceChildren(); ctl = P.mountSim(box, tabs[i], { mode: 'advanced', startOn: true }, 'ext'); };
        tabs.forEach((t, i) => bar.append(h('button', { onclick: () => show(i) }, names[i]))); setTimeout(() => show(0)); return h('div', { class: 'stack' }, bar, box); })());
  };

  P.credits = function (root) {
    App.setCrumb('素材與授權');
    UI.fill(root, h('h1', null, '素材與授權'), h('p', { class: 'muted' }, '依 07A 多模態素材清單。實拍照片均來自 Wikimedia Commons，依原授權條款使用；自製圖與模擬為本教材原創。'),
      h('div', { class: 'card table-scroll' }, h('table', { class: 'doc-table' }, h('tr', null, h('th', null, '素材'), h('th', null, '類型'), h('th', null, '作者'), h('th', null, '授權'), h('th', null, '教學用途'), h('th', null, '來源')),
        ASSETS.list.map(a => h('tr', null, h('td', null, a.title), h('td', null, UI.evTag(a.kind)), h('td', null, a.author), h('td', null, a.license), h('td', null, a.use), h('td', null, a.url ? h('a', { href: a.url, target: '_blank', rel: 'noopener' }, '來源頁') : '—'))))),
      h('h2', { style: { marginTop: '22px' } }, '自製互動模擬'),
      h('div', { class: 'card' }, h('ul', null, ['繩波疊加模擬（依 07B 模擬需求腳本）', '兩個脈衝相遇 36 秒動畫（依 07B 動畫分鏡）', '雙點波源水波干涉（俯視與 3D）', 'M02 雙狹縫次波模型、光的雙狹縫干涉理想模型', '單狹縫繞射理想模型', '薄膜干涉剖面與色帶'].map(s => h('li', null, s))), h('p', { class: 'muted' }, '全部以 HTML Canvas 自製，不依賴外部套件，可離線使用。')),
      h('h2', { style: { marginTop: '22px' } }, '查核依據與設計參考'),
      h('div', { class: 'card' }, h('ul', null, Object.values(COURSE.nodes).map(n => h('li', null, h('a', { href: n.ref.url, target: '_blank', rel: 'noopener' }, n.ref.text))), TEACH.refs.map(r => h('li', null, r.url ? h('a', { href: r.url, target: '_blank', rel: 'noopener' }, r.text) : r.text)))));
  };

  P.notFound = root => { App.setCrumb('找不到頁面'); UI.fill(root, h('div', { class: 'card' }, h('h2', null, '找不到這一頁'), h('a', { class: 'btn primary', href: '#/home' }, '回首頁'))); };
})();
