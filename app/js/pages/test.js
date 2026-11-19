/* 評量頁：前測、隨堂、後測；即時計分、逐題解析、依雙向細目表列呈現達成率 */
(function () {
  const { h } = UI;
  const letters = 'ABCDEFGH';
  Pages.test = function (root, id) {
    const t = QB.tests[id]; if (!t) return Pages.notFound(root);
    App.setCrumb(t.title);
    const rec = Store.rec.tests[id] || (Store.rec.tests[id] = { answers: {}, total: t.total });
    const ans = rec.answers;
    const submitted = !!rec.submittedAt;
    const key = (it, k) => it.parts ? `${it.no}.${k}` : `${it.no}`;
    const allKeys = t.items.flatMap(it => it.parts ? it.parts.map((_, k) => key(it, k)) : [key(it)]);
    const answered = () => allKeys.filter(k => ans[k] != null).length;
    const meter = h('i', { style: { width: '0%' } });
    const cnt = h('span', { style: { fontWeight: 700 } });
    const upd = () => { const n = answered(); meter.style.width = (n / allKeys.length * 100) + '%'; cnt.textContent = `${n} / ${allKeys.length} 小題`; };

    const qEl = (it) => {
      const parts = it.parts || [{ q: null, options: it.options, answer: it.answer, explain: it.explain }];
      return h('div', { class: 'q-card', id: 'q' + it.no },
        h('div', { class: 'q-head' }, h('span', { class: 'q-no' }, it.no), UI.chip('accent', it.level), UI.chip('', it.pts + ' 分'), h('span', { class: 'muted', style: { fontSize: '.82rem' } }, it.row)),
        h('div', { style: { fontWeight: 600 } }, it.stem),
        it.fig ? h('div', { class: 'q-fig', html: FIGS.get(it.fig) }) : null,
        parts.map((p, k) => {
          const kk = key(it, it.parts ? k : undefined);
          const fb = h('div');
          const ch = C.choice(p.options, { value: ans[kk] ?? null, answer: p.answer, show: submitted, onPick: i => { ans[kk] = i; ch.update(i); Store.save(); upd(); } });
          if (submitted) fb.append(UI.fb(ans[kk] === p.answer ? 'good' : 'bad', `${ans[kk] === p.answer ? '答對' : '正解 ' + letters[p.answer]}。${p.explain}`));
          return h('div', { class: it.parts ? 'q-part' : '' }, p.q ? h('div', { style: { marginBottom: '8px' } }, p.q) : null, ch, fb);
        }));
    };

    const result = () => {
      const rows = t.rows.map(r => { const its = t.items.filter(i => i.row === r); let got = 0, tot = 0; its.forEach(it => (it.parts || [it]).forEach((p, k) => { tot++; if (ans[key(it, it.parts ? k : undefined)] === p.answer) got++; })); return { r, got, tot }; });
      const lv = QB.levels.map(l => { const its = t.items.filter(i => i.level === l); let got = 0, tot = 0; its.forEach(it => (it.parts || [it]).forEach((p, k) => { tot++; if (ans[key(it, it.parts ? k : undefined)] === p.answer) got++; })); return { l, got, tot }; }).filter(x => x.tot);
      const weak = rows.filter(x => x.got / x.tot < .6);
      return h('div', { class: 'card', style: { marginBottom: '18px' } },
        h('div', { class: 'row', style: { alignItems: 'flex-end' } }, h('div', null, h('div', { class: 'muted' }, '得分'), h('div', { class: 'score-big' }, `${rec.score}`), h('div', { class: 'muted' }, `/ ${t.total} 分`)),
          h('span', { class: 'spacer' }), id === 'pre' ? UI.fb('info', '前測只用來了解起點，不列入成績。') : null),
        h('h3', { style: { marginTop: '16px' } }, '各學習目標達成情形'),
        h('div', { class: 'stack' }, rows.map(x => h('div', null, h('div', { class: 'row', style: { fontSize: '.88rem' } }, h('span', null, x.r), h('span', { class: 'spacer' }), h('b', null, `${x.got}/${x.tot}`)), h('div', { class: 'meter' }, h('i', { style: { width: (x.got / x.tot * 100) + '%' } }))))),
        h('h3', { style: { marginTop: '16px' } }, '認知層次'),
        h('div', { class: 'row' }, lv.map(x => UI.chip(x.got === x.tot ? 'good' : x.got / x.tot >= .5 ? 'warn' : 'bad', `${x.l} ${x.got}/${x.tot}`))),
        weak.length ? UI.fb('warn', '建議回顧：' + weak.map(w => w.r).join('、')) : UI.fb('good', '各目標表現良好！'));
    };

    const submit = h('button', { class: 'btn primary' }, '交卷');
    submit.onclick = async () => {
      const left = allKeys.length - answered();
      if (left) { const v = await UI.modal({ title: '還有未作答', body: `還有 ${left} 小題未作答，確定要交卷嗎？`, actions: [{ label: '繼續作答', value: 0 }, { label: '確定交卷', value: 1, primary: true }] }); if (v !== 1) return; }
      let score = 0; t.items.forEach(it => (it.parts || [it]).forEach((p, k) => { if (ans[key(it, it.parts ? k : undefined)] === p.answer) score++; }));
      Object.assign(rec, { score, total: t.total, submittedAt: new Date().toISOString() });
      Store.save(); Store.log(id, 'test_submit', { score });
      const st = COURSE.lessons.flatMap(l => l.steps).find(s => s.test === id); if (st) Store.markDone(st.id);
      if (id === 'pre') Store.addBadge('b0'); if (id === 'post') Store.addBadge('b4');
      if (score / t.total >= .8) UI.confetti();
      Pages.test(root, id); scrollTo(0, 0);
    };
    const retry = h('button', { class: 'btn' }, '重新作答');
    retry.onclick = async () => { const v = await UI.modal({ title: '重新作答', body: '會清除這份測驗的作答紀錄（前次分數保留於操作紀錄）。確定嗎？', actions: [{ label: '取消', value: 0 }, { label: '確定', value: 1, primary: true }] }); if (v !== 1) return; Store.log(id, 'test_retry', { prev: rec.score }); Store.rec.tests[id] = { answers: {}, total: t.total }; Store.save(); Pages.test(root, id); };

    const back = (() => { const st = COURSE.lessons.flatMap(l => l.steps.map(s => [l, s])).find(([l, s]) => s.test === id); return st ? `#/lesson/${st[0].id}/${st[1].id}` : '#/home'; })();
    UI.fill(root, 
      h('div', { class: 'lesson-head' }, h('div', { style: { flex: 1 } }, h('div', { class: 'tag' }, id === 'pre' ? '單元開始' : id === 'post' ? '單元結束' : '課後'), h('h1', null, t.title),
        h('div', { class: 'row' }, UI.chip('accent', `${t.items.length} 題`), UI.chip('accent', `總分 ${t.total}`), UI.chip('', `建議 ${t.minutes} 分鐘`)), h('p', { class: 'muted', style: { marginTop: '8px' } }, t.scope))),
      submitted ? result() : null,
      !submitted ? h('div', { class: 'test-bar' }, h('div', { style: { flex: 1 } }, h('div', { class: 'meter' }, meter)), cnt, submit) : h('div', { class: 'row', style: { marginBottom: '14px' } }, h('a', { class: 'btn', href: back }, '← 返回'), id.startsWith('quiz') ? retry : null),
      t.items.map(qEl),
      !submitted ? h('div', { class: 'row', style: { marginTop: '18px', justifyContent: 'flex-end' } }, submit.cloneNode(true)) : null);
    root.querySelectorAll('.btn.primary').forEach(b => { if (b.textContent === '交卷') b.onclick = submit.onclick; });
    upd();
  };
})();
