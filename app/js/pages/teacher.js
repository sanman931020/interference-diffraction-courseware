/* 教師端：教案、分節指引、參考答案、學習困難、評量細目表、學習紀錄檢視、AI 設定、交付檢核 */
(function () {
  const { h } = UI;
  const tbl = (head, rows) => h('div', { class: 'table-scroll' }, h('table', { class: 'doc-table' }, head ? h('tr', null, head.map(c => h('th', null, c))) : null, rows.map(r => h('tr', null, r.map((c, i) => (head ? h('td', null, c) : i === 0 ? h('th', null, c) : h('td', null, c)))))));
  const allWS = () => [...WS.L1, ...WS.L2, ...WS.L3];

  const TABS = {
    plan: ['教案總覽', () => h('div', { class: 'stack' },
      h('div', { class: 'card' }, h('h3', null, '一　基本資料'), tbl(null, TEACH.basic)),
      h('div', { class: 'card' }, h('h3', null, '二　教學設計依據'), tbl(null, TEACH.basis),
        h('h4', { style: { marginTop: '14px' } }, '課綱'), tbl(null, [['學習表現', COURSE.curriculum.performance.join('；')], ['學習內容', COURSE.curriculum.content.join('；')]]),
        h('h4', { style: { marginTop: '14px' } }, '學習目標與評量對應'), tbl(['序', '學習目標', '可觀察證據', '達成規準'], COURSE.goals.map((g, i) => [i + 1, g.text, g.evidence, g.criteria]))),
      h('div', { class: 'card' }, h('h3', null, '三　單元進程'), h('p', null, '學習路徑：' + COURSE.path.map(p => p.t).join(' → ')), tbl(['節次', '本節功能', '核心問題／重點', '教材／活動', '學生主要產出', '時間'], TEACH.schedule.map(s => [s.no, s.func, s.q, s.act, s.out, s.time]))),
      h('div', { class: 'card' }, h('h3', null, '五　評量與學習記錄'), tbl(['評量時機', '學生任務／題目', '判斷標準', '記錄位置'], TEACH.assess), h('p', { class: 'muted', style: { marginTop: '8px' } }, '數位記錄：以學生代碼作答；課末下載 JSON，另可匯出 CSV／HTML。教師收存回答、畫圖與操作紀錄（見「學習紀錄」分頁）。')),
      h('div', { class: 'card' }, h('h3', null, '六　附件與交付'), tbl(['附件／素材名稱', '用途／使用位置', '作者／來源授權', '檔名／位置'], TEACH.attachments)))],
    lessons: ['分節指引', () => h('div', { class: 'stack' }, COURSE.lessons.map(l => { const L = TEACH.lessons[l.id]; return h('div', { class: 'card' },
      h('h3', null, `第${l.no}節　${l.title}（50分鐘）`), tbl(null, [['銜接與目標', L.link], ['產出與教材', L.product]]),
      h('div', { style: { marginTop: '10px' } }, tbl(['時間', '教師活動與提問', '學生活動與預期表現', '評量／證據', '教材／備註'], L.rows)),
      h('h4', { style: { marginTop: '12px' } }, '教師教學指引'), tbl(null, [['專業說明', L.pro], ['條件與誤解', L.cond]]),
      L.timingNote ? UI.fb('info', L.timingNote) : null,
      h('div', { class: 'row', style: { marginTop: '10px' } }, h('a', { class: 'btn sm', href: '#/lesson/' + l.id }, '開啟學生頁面'), h('button', { class: 'btn sm', onclick: () => { document.body.classList.add('projector'); location.hash = '#/lesson/' + l.id; UI.toast('投影模式：按 Esc 離開'); } }, '投影模式'))); }))],
    answers: ['參考答案', () => h('div', { class: 'stack' }, ['L1', 'L2', 'L3'].map((k, i) => h('div', { class: 'card' }, h('h3', null, `第${i + 1}節學習單`), WS[k].map(w => h('div', { class: 'q-part' },
      h('div', { class: 'row' }, h('b', null, `${w.no}　${w.title}`), UI.chip(w.src === 'orig' ? 'good' : 'warn', w.src === 'orig' ? '原文件' : '補擬（待覆核）')),
      h('div', { class: 'muted', style: { fontSize: '.82rem' } }, '依據：' + w.basis),
      h('p', { style: { margin: '6px 0' } }, h('b', null, '參考答案／判讀：'), w.key),
      w.errors ? w.errors.map(e => h('div', { style: { fontSize: '.9rem' } }, '・' + e.when + ' → 「' + e.ask + '」')) : null,
      w.rubric ? h('div', null, h('div', { class: 'muted', style: { fontSize: '.82rem', marginTop: '4px' } }, '成功規準' + (w.rubricNote ? '：' + w.rubricNote : '')), tbl(null, [['達成', w.rubric.達成], ['發展中', w.rubric.發展中], ['待支持', w.rubric.待支持]])) : null)))))],
    diffs: ['學習困難', () => h('div', { class: 'stack' },
      h('div', { class: 'card' }, h('h3', null, '一　困難與引導速查'), tbl(null, [['單元名稱', '干涉與繞射'], ['領域／年段', '高中物理／高一'], ['節次／活動', '共3節／含課後修訂'], ['學習重點', TEACH.focus]]), h('div', { style: { height: '10px' } }), tbl(['節次／學習困難', '學生表現', '引導方式', '改善判準'], TEACH.diffs.map(d => [d.lesson + ' ' + d.name, d.say, d.guide, d.ok]))),
      TEACH.diffs.map(d => h('div', { class: 'card' }, h('div', { class: 'row' }, h('h3', { style: { margin: 0 } }, '單項引導表：' + d.name), d.custom ? UI.chip('warn', '本教材自編（10 原件僅範例1–3）') : UI.chip('good', '10 原件範例')), tbl(null, [['節次／題目', d.ladder.ws], ['學生表現', d.ladder.show], ['學習重點', d.ladder.focus]]), h('div', { style: { marginTop: '8px' } }, tbl(['提示層次', '提問或行動', '對照材料'], d.ladder.L)))),
      h('p', { class: 'muted' }, '每項困難一次給一層提示，依學生回應調整。學生端「卡關提示」與 AI 追問皆採用此階梯；連續兩層仍卡同一錯誤時，系統標記「轉教師」。'))],
    blueprint: ['評量細目表', () => h('div', { class: 'stack' }, ['pre', 'quiz1', 'quiz2', 'quiz3', 'post'].map(id => { const t = QB.tests[id]; const L = QB.levels;
      return h('div', { class: 'card' }, h('h3', null, t.title + '　雙向細目表'), tbl(null, [['科目與評量', '高中物理／高一；' + t.title], ['評量範圍', t.scope], ['時間與總量', `${t.minutes}分鐘；共${t.items.length}題；總分${t.total}分`], ['來源', t.src]]),
        h('div', { style: { marginTop: '10px' } }, tbl(['學習目標與知識節點', ...L, '題數', '配分', '占分比'], [...t.rows.map(r => { const its = t.items.filter(i => i.row === r); const p = its.reduce((s, i) => s + i.pts, 0); return [r, ...L.map(l => its.filter(i => i.level === l).map(i => i.no).join('、') || '—'), its.length, p, (p / t.total * 100).toFixed(1) + '%']; }),
          ['合計', ...L.map(l => { const its = t.items.filter(i => i.level === l); return `${its.length}題 ${its.reduce((s, i) => s + i.pts, 0)}分`; }), t.items.length, t.total, '100%']])),
        h('div', { class: 'row', style: { marginTop: '8px' } }, h('a', { class: 'btn sm', href: '#/test/' + id }, '預覽題目'), h('span', { class: 'muted', style: { fontSize: '.82rem' } }, '層次依據：十二年國教自然科學領域課綱表二。命題教師：＿＿＿　審題教師：＿＿＿')));
    }))],
    records: ['學習紀錄', () => {
      const out = h('div', { class: 'stack' });
      const recs = [];
      const input = h('input', { type: 'file', accept: '.json', multiple: true });
      const draw = () => {
        if (!recs.length) { UI.fill(out, h('p', { class: 'muted' }, '尚未匯入。可匯入多位學生下載的 JSON 檔；資料只在本機瀏覽器處理，不會上傳。')); return; }
        const tests = ['pre', 'quiz1', 'quiz2', 'quiz3', 'post'];
        UI.fill(out, 
          tbl(['學生代碼', '進度（步驟）', ...tests.map(t => QB.tests[t].title.replace('干涉與繞射', '').replace('隨堂測驗　', '').slice(0, 8)), '轉教師', 'AI 追問次數', '最後更新'],
            recs.map(r => [r.student.code, Object.keys(r.progress).length, ...tests.map(t => r.tests[t] && r.tests[t].submittedAt ? `${r.tests[t].score}/${r.tests[t].total}` : '—'), Object.keys(r.handoff).join('、') || '—', Object.values(r.tutor).flat().filter(m => m.role === 'ai').length, (r.updatedAt || '').replace('T', ' ').slice(0, 16)])),
          h('h3', null, '開放題作答（初稿 → 修訂）'),
          tbl(['學生', '題號', '初稿', '修訂', '修訂理由'], recs.flatMap(r => Object.entries(r.answers).filter(([id, a]) => a.draft || a.revision).map(([id, a]) => [r.student.code, id, a.draft || '', a.revision || '', a.reviseReason || '']))),
          h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { const rows = recs.flatMap((r, i) => Store.toRows(r).slice(i ? 1 : 0)); Store.download('全班紀錄.csv', '﻿' + rows.map(x => x.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\r\n'), 'text/csv'); } }, '合併匯出 CSV')));
      };
      input.addEventListener('change', async () => { for (const f of input.files) { try { const j = JSON.parse(await f.text()); if (j.student) recs.push(j); } catch (e) { UI.toast('無法讀取 ' + f.name); } } draw(); });
      draw();
      return h('div', { class: 'card' }, h('h3', null, '匯入學生紀錄（JSON）'), input, h('hr', { class: 'sep' }), out,
        h('hr', { class: 'sep' }), h('h4', null, '保管與期限'), h('p', { class: 'muted' }, '由授課教師確認保管人、保存期限與刪除方式。共用設備使用後，請學生在側欄按「清除本機紀錄」。'));
    }],
    ai: ['AI 設定', () => {
      const cfg = JSON.parse(localStorage.getItem('idr:ai') || 'null') || { endpoint: '', model: '', key: '' };
      const ep = h('input', { type: 'url', value: cfg.endpoint, placeholder: '例：http://localhost:11434/v1/chat/completions' });
      const md = h('input', { type: 'text', value: cfg.model, placeholder: '例：llama3.1' });
      const fb = h('div');
      return h('div', { class: 'card' }, h('h3', null, 'AI 追問服務'),
        h('p', null, '預設使用<b>離線規則式追問</b>（依 10 分層提示與 08 規則，免費且不需連網）。若學校有免費的本機或校內大型語言模型服務（相容 OpenAI Chat Completions 格式，例如本機 Ollama），可在此設定；連線失敗時自動退回離線追問。'),
        h('label', { class: 'field' }, '服務端點 URL'), ep, h('label', { class: 'field' }, '模型名稱'), md,
        h('div', { class: 'row', style: { marginTop: '12px' } }, h('button', { class: 'btn primary', onclick: () => { localStorage.setItem('idr:ai', JSON.stringify({ endpoint: ep.value.trim(), model: md.value.trim() })); fb.replaceChildren(UI.fb('good', '已儲存（只存在這台裝置的瀏覽器）。')); } }, '儲存'),
          h('button', { class: 'btn', onclick: () => { localStorage.removeItem('idr:ai'); ep.value = ''; md.value = ''; fb.replaceChildren(UI.fb('info', '已改回離線規則式追問。')); } }, '改回離線追問')), fb,
        h('h4', { style: { marginTop: '16px' } }, 'AI 回應規範（08 第四部分）'),
        tbl(null, [['啟動條件', 'Q4（或解釋題）初稿完成後，由學生點選「請 AI 追問」；可略過。'], ['帶入資料', '題目、學生作答、操作紀錄、教材內容。'], ['回覆與修訂', '每次1個主問題，最多3句，顯示在 AI 區；學生自行修訂。'], ['停止與備援', '連續兩層提示仍卡同一錯誤、無證據或來源衝突時轉教師。']]),
        h('div', { style: { marginTop: '10px' } }, tbl(['學生輸入', '可接受的引導', '不應出現的回覆'], [['暗紋是光沒到D。', '先看模型：兩個狹縫發出的波，都能到達D點嗎？', '直接給出D點的反相與相消結論。'], ['直接給我完整答案。', '先從你已有的觀察開始：實拍中哪項亮暗特徵需要解釋？', '可直接繳交的完整Q4答案。']])));
    }],
    check: ['交付檢核', () => {
      const saved = JSON.parse(localStorage.getItem('idr:check') || '{}');
      const mk = (list, pre) => h('div', { class: 'check-list' }, list.map((t, i) => { const k = pre + i; const cb = h('input', { type: 'checkbox', checked: saved[k] ? true : null, onchange: () => { saved[k] = cb.checked; localStorage.setItem('idr:check', JSON.stringify(saved)); } }); return h('label', null, cb, Array.isArray(t) ? h('span', null, h('b', null, t[0] + '：'), t[1]) : t); }));
      return h('div', { class: 'stack' }, h('div', { class: 'card' }, h('h3', null, '課前確認（02）'), mk(TEACH.checklist, 'c')),
        h('div', { class: 'card' }, h('h3', null, '驗收情境（08）'), mk(TEACH.acceptance, 'a')),
        h('div', { class: 'card' }, h('h3', null, '規格參照圖'), h('div', { class: 'grid g2' }, UI.img('act01_sketch'), UI.img('rope_ui_sketch'))));
    }]
  };

  Pages.teacher = function (root, tab) {
    App.setCrumb('教師端');
    tab = TABS[tab] ? tab : 'plan';
    UI.fill(root, 
      h('div', { class: 'teacher-banner' }, '教師專用頁面：含參考答案與評分規準，請勿於學生裝置開啟。'),
      h('h1', null, '教師端'),
      h('div', { class: 'tabs' }, Object.entries(TABS).map(([k, [name]]) => h('button', { class: k === tab ? 'on' : '', onclick: () => location.hash = '#/teacher/' + k }, name))),
      TABS[tab][1]());
  };
})();
