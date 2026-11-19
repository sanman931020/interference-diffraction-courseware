// 驗證題庫配分是否符合 06 雙向細目表，並輸出「題庫補充.md」
// 用法：node tools/gen-qbank.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ['worksheets.js', 'questions.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'app/js/data', f), 'utf8'), ctx);
}
const { WS, QB } = ctx.window;
const L = QB.levels;
const letters = 'ABCDEFGH';

// 06 原規格（題號→層次、配分總和）供驗證
const spec = {
  pre: { total: 30, n: 14, levels: { 了解: [6, 9], 應用: [4, 11], 分析: [2, 7], 評鑑: [2, 3] } },
  post: { total: 30, n: 14, levels: { 了解: [6, 9], 應用: [4, 8], 分析: [2, 7], 評鑑: [2, 6] } },
  quiz3: { total: 15, n: 7, levels: { 記憶: [1, 1], 了解: [3, 4], 應用: [1, 3], 評鑑: [2, 7] } },
  quiz1: { total: 15, n: 7 }, quiz2: { total: 15, n: 7 }
};
let errors = [];
for (const [id, t] of Object.entries(QB.tests)) {
  const sum = t.items.reduce((s, i) => s + i.pts, 0);
  if (sum !== spec[id].total) errors.push(`${id} 總分 ${sum} ≠ ${spec[id].total}`);
  if (t.items.length !== spec[id].n) errors.push(`${id} 題數 ${t.items.length}`);
  for (const it of t.items) {
    if (it.parts && it.parts.length !== it.pts) errors.push(`${id} Q${it.no} 小題數≠配分`);
    if (!t.rows.includes(it.row)) errors.push(`${id} Q${it.no} row 不在列表`);
    const chk = it.parts || [it];
    for (const p of chk) if (p.answer == null || p.answer >= p.options.length) errors.push(`${id} Q${it.no} 答案索引錯`);
  }
  if (spec[id].levels) for (const [lv, [n, pts]] of Object.entries(spec[id].levels)) {
    const its = t.items.filter(i => i.level === lv);
    const p = its.reduce((s, i) => s + i.pts, 0);
    if (its.length !== n || p !== pts) errors.push(`${id} ${lv}: ${its.length}題${p}分，規格 ${n}題${pts}分`);
  }
}
if (errors.length) { console.error('驗證失敗：\n' + errors.join('\n')); process.exit(1); }
console.log('驗證通過：五份評量題數、配分、認知層次皆符合規格。');

// ── 輸出 Markdown ──
const out = [];
out.push('# 干涉與繞射：補齊缺漏題目（題庫補充）', '');
out.push('> 本文件由 `tools/gen-qbank.js` 從教材資料檔（`app/js/data/worksheets.js`、`questions.js`）自動產生，與線上教材內容一致。');
out.push('> 標示「原文件」者沿用 03 學習單原文；標示「補擬」者為本次依 02 教案描述、05 核心題卡與 06 雙向細目表規格新擬，**請命題與審題教師覆核**。', '');
out.push('## 補齊範圍一覽', '');
out.push('| 項目 | 原狀態 | 本次處理 |', '|---|---|---|');
out.push('| 第1節學習單 Q1–Q8 | 02 僅有描述 | 補擬 8 題（含參考答案、判讀、成功規準） |');
out.push('| 第2節學習單 Q1–Q6 | 03 已完整 | 沿用原文，轉為線上題型 |');
out.push('| 第3節學習單 Q1–Q5 | 02 只提到 Q1、Q3、Q5 | 補擬 5 題（Q2、Q4 依節點03與02「新情境應用」補足） |');
out.push('| 前測 14 題／30 分 | 06 只有規格 | 依細目表逐題補擬 |');
out.push('| 第1節隨堂 7 題／15 分 | 06 未提供 | 依第1節目標設計細目表並補擬 |');
out.push('| 第2節隨堂 7 題／15 分 | 06 未提供 | 依第2節目標設計細目表並補擬 |');
out.push('| 第3節隨堂 7 題／15 分 | 06 只有規格 | 依細目表逐題補擬 |');
out.push('| 後測 14 題／30 分 | 06 只有規格 | 依細目表逐題補擬 |', '');

out.push('---', '', '## 一、三節學習單', '');
const lessonNames = { L1: '第1節　波的疊加與水波干涉', L2: '第2節　光的雙狹縫干涉', L3: '第3節　光的繞射與生活應用' };
for (const [k, arr] of Object.entries(WS)) {
  out.push(`### ${lessonNames[k]}`, '');
  for (const q of arr) {
    out.push(`#### ${q.no}　${q.title}　〔${q.src === 'orig' ? '原文件' : '補擬'}〕`, '');
    out.push(`- **依據**：${q.basis}`);
    out.push(`- **題目**：${q.prompt}`);
    if (q.options) out.push(`- **選項**：${q.options.map((o, i) => `□ ${o}`).join('　')}`);
    if (q.checks) q.checks.forEach((c, i) => out.push(`- **小題${i + 1}**：${c.q}（${c.options.map((o, j) => (j === c.answer ? `**${o}**` : o)).join('／')}）`));
    if (q.table) out.push(`- **作答表**：${q.table.rows.map((r, i) => `${r}：${q.table.cols.map((c, j) => `${c.name}【${c.options[q.table.answer[i][j]]}】`).join('、')}`).join('；')}`);
    if (q.fields) out.push(`- **作答欄**：${q.fields.join('／')}`);
    if (q.steps) out.push(`- **書寫鷹架**：${q.steps.join(' → ')}`);
    if (q.rows && q.cols) out.push(`- **比較表**：列＝${q.rows.join('、')}；欄＝${q.cols.join('、')}`);
    if (q.rays) out.push(`- **點選光路**：${q.rays.map(r => (r.correct ? `**${r.label}**` : r.label)).join('；')}`);
    if (q.bins) out.push(`- **分類**：${q.bins.map((b, i) => `${b}＝${q.items.filter(x => x.bin === i).map(x => x.label).join('、')}`).join('；')}`);
    out.push(`- **參考答案／判讀**：${q.key}`);
    if (q.errors) q.errors.forEach(e => out.push(`- **常見錯誤與引導**：${e.when} → 「${e.ask}」`));
    if (q.rubric) out.push(`- **成功規準**：達成｜${q.rubric.達成}　發展中｜${q.rubric.發展中}　待支持｜${q.rubric.待支持}`);
    out.push('');
  }
}

out.push('---', '', '## 二、評量（前測、三節隨堂、後測）', '');
for (const id of ['pre', 'quiz1', 'quiz2', 'quiz3', 'post']) {
  const t = QB.tests[id];
  out.push(`### ${t.title}`, '');
  out.push(`- 範圍：${t.scope}`, `- 時間與總量：${t.minutes} 分鐘；共 ${t.items.length} 題；總分 ${t.total} 分`, `- 來源：${t.src}`, '');
  // 雙向細目表
  out.push('**雙向細目表**', '');
  out.push(`| 學習目標與知識節點 | ${L.join(' | ')} | 題數 | 配分 | 占分比 |`);
  out.push(`|---|${L.map(() => '---').join('|')}|---|---|---|`);
  for (const r of t.rows) {
    const its = t.items.filter(i => i.row === r);
    const cells = L.map(lv => its.filter(i => i.level === lv).map(i => i.no).join('、') || '—');
    const p = its.reduce((s, i) => s + i.pts, 0);
    out.push(`| ${r} | ${cells.join(' | ')} | ${its.length} | ${p} | ${(p / t.total * 100).toFixed(1)}% |`);
  }
  const tot = L.map(lv => { const its = t.items.filter(i => i.level === lv); return `${its.length}題 ${its.reduce((s, i) => s + i.pts, 0)}分`; });
  out.push(`| 合計 | ${tot.join(' | ')} | ${t.items.length} | ${t.total} | 100% |`, '');
  out.push('**題目**', '');
  for (const it of t.items) {
    out.push(`${it.no}. （${it.level}｜${it.pts}分｜${it.row}）${it.stem}${it.fig ? '〔附圖〕' : ''}`);
    if (it.parts) it.parts.forEach(p => {
      out.push(`   - ${p.q}　${p.options.map((o, j) => `(${letters[j]}) ${o}`).join('　')}　**答：${letters[p.answer]}**。${p.explain}`);
    });
    else out.push(`   - ${it.options.map((o, j) => `(${letters[j]}) ${o}`).join('　')}　**答：${letters[it.answer]}**。${it.explain}`);
  }
  out.push('');
}
out.push('---', '', '命題教師：＿＿＿＿＿＿　審題教師：＿＿＿＿＿＿　日期：＿＿年＿＿月＿＿日', '');
fs.writeFileSync(path.join(root, '題庫補充.md'), out.join('\n'), 'utf8');
console.log('已輸出 題庫補充.md');
