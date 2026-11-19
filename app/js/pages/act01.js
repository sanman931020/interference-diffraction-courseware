/* ACT01 解釋雙狹縫亮暗紋：完全依 08 數位教材整合規劃表的四區版面與五步流程
 * ①教材與模型（正文／實拍／模型，切換保留作答） ②我的初稿 ③AI 追問（可收合、可略過） ④我的修訂 ＋ 完成與下載
 */
(function () {
  const { h } = UI;
  Pages.act01 = function (st, lesson) {
    const ws = Pages.wsById(st.ws);
    const a = Store.ans(ws.id);
    const T = ws.table;
    const draft = a.draftTable ? a.draftTable.map(r => r.slice()) : T.rows.map(() => T.cols.map(() => null));
    const rev = a.revTable ? a.revTable.map(r => r.slice()) : null;
    let sentence = a.draftSentence || '';

    /* 進度列 */
    const prog = h('div', { class: 'act-progress' });
    const stage = () => a.done || Store.ans(ws.id).done ? 4 : Store.ans(ws.id).draftSaved ? (Store.tutorHist(ws.id).length ? 3 : 2) : 1;
    const drawProg = () => { const s = stage(); prog.replaceChildren(...['觀察教材', '填寫初稿', 'AI 追問', '自行修訂'].flatMap((t, i) => [i ? h('i', null, '→') : null, h('span', { class: i + 1 < s ? 'ok' : i + 1 === s ? 'on' : '' }, (i + 1 < s ? '✓ ' : '') + t)]).filter(Boolean)); };

    /* ① 教材與模型 */
    const z1 = h('div', { class: 'zone' });
    const tabs = h('div', { class: 'tabs', role: 'tablist' });
    const pane = h('div');
    let ctl = null;
    const showTab = k => {
      tabs.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', i === k));
      if (ctl) { try { ctl.destroy(); } catch (e) { } ctl = null; }
      pane.replaceChildren();
      Store.log(st.id, 'tab', { k: ['正文', '實拍', '模型'][k] });
      if (k === 0) { const n = COURSE.nodes.N02; pane.append(h('div', { class: 'reading' }, n.body.map(p => h('p', { html: p }))), h('div', { class: 'q-fig', html: FIGS.get('huygens') })); }
      if (k === 1) pane.append(UI.img('doubleslit_red', { onOpen: () => Store.log(st.id, 'zoom', { id: 'doubleslit_red' }) }), UI.fb('info', '真實證據：可點圖放大，按 Esc 或背景關閉回到原頁。'));
      if (k === 2) {
        const s = h('div'); pane.append(s);
        ctl = Pages.mountSim(s, 'doubleSlitModel', { onSelect: p => Store.log(st.id, 'select', { p }) }, st.id);
        pane.append(UI.fb('info', '這是模型，不是實拍。切換正文、實拍與模型，已填答案會保留。'));
      }
    };
    ['正文', '實拍', '模型'].forEach((t, i) => tabs.append(h('button', { role: 'tab', type: 'button', onclick: () => showTab(i) }, t)));
    z1.append(h('div', { class: 'card-title' }, h('span', { class: 'num' }, '1'), h('h3', { style: { margin: 0 } }, '教材與模型')), tabs, pane);
    App.cleanups.push(() => { if (ctl) try { ctl.destroy(); } catch (e) { } });

    /* 表格元件 */
    const tableUI = (data, { locked, reveal, onPick }) => h('div', { class: 'table-scroll' }, h('table', { class: 'grid-table' },
      h('tr', null, h('th', null, '點'), T.cols.map(c => h('th', null, c.name))),
      T.rows.map((r, i) => h('tr', null, h('th', null, r), T.cols.map((c, j) => h('td', null, h('div', { class: 'pick' }, c.options.map((o, k) => {
        let cls = data[i][j] === k ? 'on' : '';
        if (reveal && data[i][j] === k) cls = k === T.answer[i][j] ? 'right' : 'wrong';
        return h('button', { type: 'button', class: cls, disabled: locked ? true : null, onclick: () => onPick(i, j, k) }, o);
    }))))))));

    /* ② 我的初稿 */
    const z2 = h('div', { class: 'zone' });
    const savedChip = h('span', { class: 'chip good' }, '已儲存');
    const sentenceIn = h('textarea', { rows: 3, placeholder: '用 2–3 句說明：兩列光波都能到達屏幕，為何仍有亮紋與暗紋？' }, sentence);
    const z2fb = h('div');
    const draftLocked = () => !!Store.ans(ws.id).draftSaved;
    const drawZ2 = () => {
      const locked = draftLocked();
      z2.replaceChildren(h('div', { class: 'card-title' }, h('span', { class: 'num' }, '2'), h('h3', { style: { margin: 0 } }, '我的初稿'), h('span', { class: 'spacer' }), locked ? savedChip : null),
        tableUI(draft, { locked, onPick: (i, j, k) => { draft[i][j] = k; Store.setAns(ws.id, { draftTable: draft }, { silent: true }); drawZ2(); drawZ3(); } }),
        h('label', { class: 'field' }, '一句解釋'), sentenceIn,
        locked ? h('div', { class: 'muted', style: { fontSize: '.84rem', marginTop: '6px' } }, '初稿已保存，不再修改；請在 ④ 修訂。初稿與修訂分別保存。')
          : h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { class: 'btn primary', onclick: saveDraft }, '儲存初稿')), z2fb);
      sentenceIn.readOnly = locked;
    };
    sentenceIn.addEventListener('input', () => { sentence = sentenceIn.value; Store.setAns(ws.id, { draftSentence: sentence }, { silent: true }); drawZ3(); });
    const complete = () => draft.every(r => r.every(x => x != null)) && sentence.trim().length >= 6;
    function saveDraft() {
      if (!complete()) { z2fb.replaceChildren(UI.fb('warn', '請先完成選項與解釋。')); return; }
      Store.setAns(ws.id, { draftTable: draft, draftSentence: sentence, draft: draftText(draft, sentence), draftSaved: new Date().toISOString() });
      Store.log(st.id, 'draft_save');
      if (!Store.ans(ws.id).revTable) Store.setAns(ws.id, { revTable: draft.map(r => r.slice()), revision: sentence });
      drawAll();
    }
    const draftText = (tb, s) => T.rows.map((r, i) => r + '：' + T.cols.map((c, j) => c.options[tb[i][j]]).join('、')).join('；') + '。解釋：' + s;

    /* ③ AI 追問 */
    const z3 = h('div');
    let tutorEl = null;
    const drawZ3 = () => {
      if (!tutorEl) {
        tutorEl = C.tutor({ ws, getDraft: () => { const s = Store.ans(ws.id); return s.revTable && s.revision ? draftText(s.revTable, s.revision) : draftText(draft, sentence); }, isReady: () => draftLocked() && complete(), onAsk: () => drawProg() });
        tutorEl.addEventListener('skip', () => { z4.scrollIntoView({ behavior: 'smooth' }); });
        z3.append(tutorEl);
      }
      tutorEl.refresh();
    };

    /* ④ 我的修訂 */
    const z4 = h('div', { class: 'zone' });
    const revIn = h('textarea', { rows: 3, placeholder: '用觀察證據修訂解釋。' }, a.revision || '');
    const reasonIn = h('input', { type: 'text', placeholder: '簡述原因…', value: a.reviseReason || '' });
    revIn.addEventListener('input', () => Store.setAns(ws.id, { revision: revIn.value }, { silent: true }));
    reasonIn.addEventListener('input', () => Store.setAns(ws.id, { reviseReason: reasonIn.value }, { silent: true }));
    const z4fb = h('div');
    const drawZ4 = () => {
      const on = draftLocked();
      const rt = Store.ans(ws.id).revTable || draft.map(r => r.slice());
      const reveal = !!Store.ans(ws.id).done;
      z4.replaceChildren(h('div', { class: 'card-title' }, h('span', { class: 'num' }, '4'), h('h3', { style: { margin: 0 } }, '我的修訂')),
        on ? h('div', { class: 'stack' },
          tableUI(rt, { reveal, onPick: (i, j, k) => { rt[i][j] = k; Store.setAns(ws.id, { revTable: rt, done: false }, { silent: true }); drawZ4(); } }),
          revIn, h('label', { class: 'field' }, '修訂理由／保留初稿的理由'), reasonIn, z4fb)
          : h('div', { class: 'muted' }, '儲存初稿後即可修訂。'));
    };

    /* 底部：返回／完成與下載 */
    const finish = () => {
      if (!draftLocked()) { UI.toast('請先儲存初稿'); return; }
      const rt = Store.ans(ws.id).revTable;
      const right = rt.flat().filter((x, i) => x === T.answer.flat()[i]).length;
      Store.setAns(ws.id, { revision: revIn.value, reviseReason: reasonIn.value, tableScore: `${right}/6`, done: true, doneAt: new Date().toISOString() });
      Store.log(st.id, 'complete', { tableScore: right });
      Store.markDone(st.id); App.refreshNav();
      const cov = Tutor.coverage(revIn.value, ws.keywords);
      drawAll();
      z4fb.replaceChildren(UI.fb(right === 6 ? 'good' : 'warn', (right === 6 ? '表格判斷全部正確！' : `表格中有 ${6 - right} 格與模型不符（紅色）。你可以再修改後按「完成與下載」。`) +
        `<br>解釋的關鍵要素覆蓋 ${Math.round(cov.ratio * 100)}%（自動初判，僅供參考）。<br><b>達成</b>的樣子：${ws.rubric.達成}`));
      UI.modal({ title: '完成 ACT01', body: '已保存初稿與修訂。要現在下載本次作答嗎？', actions: [{ label: '稍後', value: 0 }, { label: '下載 JSON', value: 1, primary: true }] }).then(v => { if (v === 1) Store.exportJSON(); });
    };

    const root = h('div', null,
      prog,
      h('div', { class: 'act' }, z1, h('div', { class: 'right' }, z2, z3, z4)),
      h('div', { class: 'step-nav', style: { borderTop: 0, marginTop: '16px' } }, h('span', { class: 'muted' }, '初稿與修訂分別保存'), h('span', { class: 'spacer' }), h('button', { class: 'btn primary lg', onclick: finish }, '完成與下載')));
    function drawAll() { drawProg(); drawZ2(); drawZ3(); drawZ4(); }
    drawAll(); showTab(2);
    const hint = TEACH.diffs.find(d => d.key === st.diff);
    root.append(h('details', { class: 'cond', style: { marginTop: '16px' } }, h('summary', null, '卡關了？分層提示（' + hint.name + '）'),
      hint.ladder.L.map(L => h('p', { style: { marginTop: '8px' } }, h('b', null, L[0] + '　'), L[1], h('br'), h('small', { class: 'muted' }, '對照：' + L[2])))));
    return root;
  };
})();
