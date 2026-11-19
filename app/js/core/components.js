/* 互動元件：選擇、畫板、追問面板、修訂區，以及各種學習單題型 */
(function () {
  const { h } = UI;
  const C = {};

  /* ---------- 選擇題 ---------- */
  C.choice = function (options, { value = null, onPick, locked = false, answer = null, show = false, inline = false, retry = false } = {}) {
    const wrap = h('div', { class: 'opts' + (inline ? ' inline' : ''), role: 'radiogroup' });
    const draw = (val, reveal) => {
      const open = retry && reveal && val !== answer;   // 答錯可再試
      wrap.replaceChildren(...options.map((o, i) => {
        let cls = 'opt';
        if (open) { if (i === val) cls += ' wrong'; }
        else if (reveal && answer != null) { if (i === answer) cls += ' right'; else if (i === val) cls += ' wrong'; }
        else if (i === val) cls += ' sel';
        return h('button', { type: 'button', class: cls, role: 'radio', 'aria-checked': i === val ? 'true' : 'false', disabled: locked || (reveal && !open) ? true : null,
          onclick: () => { onPick && onPick(i); } }, h('span', { class: 'mark' }, reveal && answer === i ? '✓' : reveal && i === val ? '✕' : 'ABCDEFG'[i]), h('span', null, o));
      }));
    };
    draw(value, show);
    wrap.update = draw;
    return wrap;
  };

  /* ---------- 畫板 ---------- */
  C.pad = function ({ label = '', value = null, onChange, height = 160, guide = 'screen', readonly = false }) {
    const cv = h('canvas', { 'aria-label': label || '畫板' });
    const wrap = h('div', { class: 'pad' }, cv, h('div', { class: 'pad-label' }, label));
    let ctx, drawing = false, last = null, w = 0, dpr = 1;
    const tools = h('div', { class: 'pad-tools' });
    if (!readonly) {
      tools.append(h('button', { class: 'btn sm', type: 'button', onclick: () => { clear(); emit(); } }, '清除'));
      wrap.append(tools);
    }
    function bg() {
      ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, height);
      ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
      if (guide === 'screen') {
        for (let x = 0; x <= w; x += w / 12) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
        ctx.fillStyle = '#9ca3af'; ctx.font = '11px sans-serif'; ctx.fillText('左', 6, height - 6); ctx.fillText('中央', w / 2 - 12, height - 6); ctx.fillText('右', w - 16, height - 6);
        ctx.strokeStyle = '#c7d2fe'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, height); ctx.stroke(); ctx.setLineDash([]);
      } else {
        ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(0, height * .6); ctx.lineTo(w, height * .6); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#9ca3af'; ctx.font = '11px sans-serif'; ctx.fillText('平衡位置', 6, height * .6 - 4);
      }
      ctx.restore();
    }
    function clear() { bg(); }
    function emit() { onChange && onChange(cv.toDataURL('image/png')); }
    function size() {
      const nw = wrap.clientWidth || 300; if (nw === w) return;
      const old = w ? cv.toDataURL() : value;
      w = nw; dpr = window.devicePixelRatio || 1;
      cv.width = w * dpr; cv.height = height * dpr; cv.style.height = height + 'px';
      ctx = cv.getContext('2d'); bg();
      if (old) { const im = new Image(); im.onload = () => ctx.drawImage(im, 0, 0, cv.width, cv.height); im.src = old; }
    }
    const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr]; };
    if (!readonly) {
      cv.addEventListener('pointerdown', e => { drawing = true; last = pos(e); cv.setPointerCapture(e.pointerId); });
      cv.addEventListener('pointermove', e => {
        if (!drawing) return; const p = pos(e);
        ctx.strokeStyle = '#111827'; ctx.lineWidth = (guide === 'screen' ? 10 : 3.5) * dpr; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(...last); ctx.lineTo(...p); ctx.stroke(); last = p;
      });
      const end = () => { if (drawing) { drawing = false; emit(); } };
      cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    }
    const ro = new ResizeObserver(size); ro.observe(wrap);
    requestAnimationFrame(size);
    return wrap;
  };

  /* ---------- 關鍵要素覆蓋提示 ---------- */
  C.coverage = function (keywords, getText) {
    const box = h('div', { class: 'cov' });
    const labels = keywords.map(g => g[0]);
    const upd = () => {
      const c = Tutor.coverage(getText(), keywords);
      box.replaceChildren(
        h('div', { class: 'row', style: { fontSize: '.8rem' } }, h('span', { class: 'muted' }, '自我檢核：關鍵要素'), h('span', { class: 'spacer' }), h('span', { class: 'chip ' + (c.level === '達成' ? 'good' : c.level === '發展中' ? 'warn' : '') }, c.level === '達成' ? '要素齊全' : c.level === '發展中' ? '再補一些' : '剛開始')),
        h('div', { class: 'meter', style: { marginTop: '6px' } }, h('i', { style: { width: Math.round(c.ratio * 100) + '%' } })),
        h('div', { class: 'kw' }, labels.map((l, i) => h('span', { class: c.hits[i] ? 'hit' : '' }, l))));
    };
    upd(); box.update = upd;
    return box;
  };

  /* ---------- AI 追問面板（08 第四部分） ---------- */
  C.tutor = function ({ ws, getDraft, isReady, onAsk }) {
    const hist = Store.tutorHist(ws.id);
    const body = h('div', { class: 'tutor-body', 'aria-live': 'polite' });
    const askBtn = h('button', { class: 'btn primary sm', type: 'button' }, '請 AI 追問');
    const skipBtn = h('button', { class: 'btn ghost sm', type: 'button' }, '略過 AI 繼續');
    const reply = h('input', { type: 'text', placeholder: '可以回答追問，或說明你的想法……', style: { flex: '1 1 200px' } });
    const sendBtn = h('button', { class: 'btn sm', type: 'button' }, '送出');
    let collapsed = false;
    const tog = h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { collapsed = !collapsed; panel.querySelector('.tutor-main').style.display = collapsed ? 'none' : ''; tog.textContent = collapsed ? '展開 +' : '收合 −'; } }, '收合 −');
    const status = h('div', { class: 'muted', style: { fontSize: '.82rem' } });
    const render = () => {
      body.replaceChildren(...(hist.length ? hist.map(m => m.role === 'sys' ? h('div', { class: 'msg sys' }, m.text)
        : h('div', { class: 'msg ' + (m.role === 'ai' ? 'ai' : 'me') }, m.role === 'ai' && m.level ? h('span', { class: 'lv' }, `${m.level}${m.misName ? '｜' + m.misName : ''}`) : null, m.text))
        : [h('div', { class: 'muted', style: { fontSize: '.88rem' } }, '完成初稿後，可以按「請 AI 追問」。AI 一次只問一個問題，不會直接給答案；你也可以略過。')]));
      body.scrollTop = body.scrollHeight;
      const ready = isReady();
      askBtn.disabled = !ready; sendBtn.disabled = !ready || !hist.length; reply.disabled = !ready || !hist.length;
      status.textContent = ready ? '' : '請先完成選項與解釋';
      if (Store.rec.handoff[ws.id]) status.textContent = '已標記轉教師協助；你仍可修訂並完成活動。';
    };
    async function ask(text, fromStudent) {
      if (fromStudent) hist.push({ role: 'me', text, t: new Date().toISOString() });
      const typing = h('div', { class: 'msg ai' }, h('span', { class: 'typing' }, h('i'), h('i'), h('i')));
      body.append(typing); body.scrollTop = body.scrollHeight;
      askBtn.disabled = true;
      const r = await Tutor.ask(ws.tutor, ws.id, text, { prompt: ws.prompt, key: ws.key });
      await new Promise(res => setTimeout(res, 450));
      if (r.note) hist.push({ role: 'sys', text: r.note, t: new Date().toISOString() });
      hist.push({ role: 'ai', text: r.text, level: r.level, mis: r.mis, misName: r.misName, kind: r.kind, source: r.source, t: new Date().toISOString() });
      if (r.handoff && !Store.rec.handoff[ws.id]) {
        Store.rec.handoff[ws.id] = { t: new Date().toISOString(), reason: '連續兩層提示仍卡在「' + r.misName + '」' };
        hist.push({ role: 'sys', text: '已連續兩層提示仍卡在同一個想法，系統已標記「轉教師」，老師會來協助你。你的原稿與提示歷程都已保存。', t: new Date().toISOString() });
      }
      Store.log(ws.id, 'ai_ask', { level: r.level, mis: r.mis || null, source: r.source });
      Store.save(); render(); onAsk && onAsk(r);
    }
    askBtn.onclick = () => ask(getDraft(), false);
    sendBtn.onclick = () => { const v = reply.value.trim(); if (!v) return; reply.value = ''; ask(v, true); };
    reply.addEventListener('keydown', e => { if (e.key === 'Enter') sendBtn.click(); });
    skipBtn.onclick = () => { Store.log(ws.id, 'ai_skip'); UI.toast('已略過 AI，可直接修訂並完成。'); panel.dispatchEvent(new CustomEvent('skip')); };
    const panel = h('div', { class: 'tutor' },
      h('div', { class: 'tutor-head' }, h('span', { class: 'ai-ico' }, 'AI'), h('b', null, 'AI 追問'), h('span', { class: 'chip' }, '選用'), h('span', { class: 'spacer' }), tog),
      h('div', { class: 'tutor-main' }, body, h('div', { class: 'tutor-foot' }, askBtn, skipBtn, h('div', { class: 'row', style: { flex: '1 1 100%' } }, reply, sendBtn), status)));
    panel.refresh = render; render();
    return panel;
  };

  /* ---------- 解釋型題目：初稿 → AI 追問 → 修訂（08 流程） ---------- */
  C.explainFlow = function (ws, { draftUI, getDraft, isReady, onComplete }) {
    const a = Store.ans(ws.id);
    const wrap = h('div', { class: 'stack' });
    const saved = h('span', { class: 'chip good', style: { display: a.draft ? '' : 'none' } }, '初稿已儲存');
    const saveBtn = h('button', { class: 'btn', type: 'button' }, '儲存初稿');
    const revBox = h('div', { class: 'stack', style: { display: a.draftSaved ? '' : 'none' } });
    const tutor = ws.tutor ? C.tutor({ ws, getDraft: () => (rev && rev.value.trim()) || getDraft(), isReady: () => !!Store.ans(ws.id).draftSaved && isReady() }) : null;
    const rev = h('textarea', { rows: 4, placeholder: '用觀察證據修訂你的解釋（可沿用初稿再修改）。' }, a.revision || '');
    const reason = h('input', { type: 'text', placeholder: '例如：AI 追問提醒我兩縫的光都能到達 D，所以修改……／我保留初稿，因為……', value: a.reviseReason || '' });
    rev.addEventListener('input', () => Store.setAns(ws.id, { revision: rev.value }, { silent: true }));
    reason.addEventListener('input', () => Store.setAns(ws.id, { reviseReason: reason.value }, { silent: true }));
    const doneBtn = h('button', { class: 'btn primary', type: 'button' }, a.done ? '已完成 ✓ 更新' : '完成本題');
    const fbBox = h('div');
    saveBtn.onclick = () => {
      if (!isReady()) { fbBox.replaceChildren(UI.fb('warn', '請先完成所有欄位，再儲存初稿。')); return; }
      Store.setAns(ws.id, { draft: getDraft(), draftSaved: new Date().toISOString() });
      Store.log(ws.id, 'draft_save');
      saved.style.display = ''; revBox.style.display = '';
      if (!rev.value) { rev.value = getDraft(); Store.setAns(ws.id, { revision: rev.value }, { silent: true }); }
      fbBox.replaceChildren(UI.fb('good', '初稿已儲存（初稿與修訂會分別保存）。你可以請 AI 追問，或直接修訂。'));
      tutor && tutor.refresh();
    };
    doneBtn.onclick = () => {
      Store.setAns(ws.id, { revision: rev.value, reviseReason: reason.value, done: true, doneAt: new Date().toISOString() });
      Store.log(ws.id, 'complete');
      const cov = ws.keywords ? Tutor.coverage(rev.value, ws.keywords) : null;
      const msgs = [];
      if (cov) msgs.push(`關鍵要素覆蓋：<b>${Math.round(cov.ratio * 100)}%</b>（自動初判「${cov.level}」，僅供參考，最終由老師依成功規準判讀）。`);
      if (ws.rubric) msgs.push(`<b>達成</b>的樣子：${ws.rubric.達成}`);
      fbBox.replaceChildren(UI.fb(cov && cov.level === '達成' ? 'good' : 'info', msgs.join('<br>') || '已完成。'));
      doneBtn.textContent = '已完成 ✓ 更新';
      onComplete && onComplete();
    };
    wrap.append(draftUI, h('div', { class: 'row' }, saveBtn, saved));
    if (tutor) wrap.append(tutor);
    revBox.append(h('label', { class: 'field' }, '我的修訂'), rev, h('label', { class: 'field' }, '修訂理由／保留初稿的理由'), reason, h('div', { class: 'row' }, doneBtn));
    wrap.append(revBox, fbBox);
    return wrap;
  };

  /* ---------- 學習單題型 ---------- */
  const R = {};
  const done = (ws, extra) => { Store.setAns(ws.id, Object.assign({ done: true, doneAt: new Date().toISOString() }, extra || {})); Store.log(ws.id, 'complete'); };

  R.predict = (ws, ctx) => {
    const a = Store.ans(ws.id);
    let pick = a.choice ?? null;
    const reason = h('textarea', { rows: 3, placeholder: '寫出一項理由', readonly: a.locked ? true : null }, a.reason || '');
    const fb = h('div');
    const ch = C.choice(ws.options, { value: pick, locked: a.locked, onPick: i => { pick = i; ch.update(i); } });
    const btn = h('button', { class: 'btn primary', type: 'button', disabled: a.locked ? true : null }, a.locked ? '預測已鎖定' : '送出預測（送出後鎖定）');
    btn.onclick = () => {
      if (pick == null || !reason.value.trim()) { fb.replaceChildren(UI.fb('warn', '請先勾選並寫出一項理由。')); return; }
      done(ws, { choice: pick, choiceText: ws.options[pick], reason: reason.value.trim(), locked: true });
      ch.update(pick); btn.disabled = true; btn.textContent = '預測已鎖定'; reason.readOnly = true;
      fb.replaceChildren(UI.fb('info', '預測已保存！預測不計分；接下來用觀察來檢驗它。'));
      ctx.onDone();
    };
    return h('div', { class: 'stack' }, ch, h('label', { class: 'field' }, ws.reasonLabel || '理由'), reason, h('div', { class: 'row' }, btn), fb);
  };

  R.predictAB = (ws, ctx) => {
    const a = Store.ans(ws.id); const picks = Object.assign({}, a.picks || {});
    const rows = ws.points.map(p => { const c = C.choice(ws.options, { value: picks[p] ?? null, locked: a.locked, inline: true, onPick: i => { picks[p] = i; c.update(i); } }); return h('div', null, h('label', { class: 'field' }, p + ' 點'), c); });
    const reason = h('textarea', { rows: 3, readonly: a.locked ? true : null }, a.reason || '');
    const fb = h('div');
    const btn = h('button', { class: 'btn primary', type: 'button', disabled: a.locked ? true : null }, a.locked ? '預測已鎖定' : '送出預測（送出後鎖定）');
    btn.onclick = () => {
      if (ws.points.some(p => picks[p] == null) || !reason.value.trim()) { fb.replaceChildren(UI.fb('warn', '請完成 A、B 兩點的預測並寫理由。')); return; }
      done(ws, { picks, picksText: ws.points.map(p => p + '：' + ws.options[picks[p]]).join('；'), reason: reason.value.trim(), locked: true });
      btn.disabled = true; btn.textContent = '預測已鎖定'; fb.replaceChildren(UI.fb('info', '預測已保存，下一步到水波模擬中觀察。')); ctx.onDone();
    };
    return h('div', { class: 'stack' }, rows, h('label', { class: 'field' }, ws.reasonLabel), reason, h('div', { class: 'row' }, btn), fb);
  };

  R.draw3 = (ws, ctx) => {
    const a = Store.ans(ws.id); const draws = Object.assign({}, a.draws || {}); const checks = Object.assign({}, a.checks || {});
    const pads = h('div', { class: 'grid g3' }, ws.frames.map(f => h('div', null, h('div', { class: 'muted', style: { fontSize: '.85rem', fontWeight: 700 } }, f),
      C.pad({ label: '合成繩形', value: draws[f], guide: 'rope', height: 130, onChange: d => { draws[f] = d; Store.setAns(ws.id, { draws }, { silent: true }); } }))));
    const ckEls = ws.checks.map((c, k) => {
      const fb = h('div');
      const ch = C.choice(c.options, { value: checks[k] ?? null, answer: c.answer, show: checks[k] != null, retry: true,
        onPick: i => { checks[k] = i; ch.update(i, true); fb.replaceChildren(UI.fb(i === c.answer ? 'good' : 'warn', c.fb[i])); Store.setAns(ws.id, { checks }); Store.log(ws.id, 'check', { k, i, correct: i === c.answer }); } });
      if (checks[k] != null) fb.append(UI.fb(checks[k] === c.answer ? 'good' : 'warn', c.fb[checks[k]]));
      return h('div', { class: 'q-part' }, h('b', null, `小題 ${k + 1}　`), c.q, ch, fb);
    });
    const fb = h('div');
    const btn = h('button', { class: 'btn primary', type: 'button' }, '完成本題');
    btn.onclick = () => {
      if (Object.keys(draws).length < 3 || ws.checks.some((_, k) => checks[k] == null)) { fb.replaceChildren(UI.fb('warn', '請畫完三個時刻並回答兩個小題。')); return; }
      done(ws, { draws, checks }); fb.replaceChildren(UI.fb('good', '已完成！可對照左側「兩種完全重疊的比較」圖修訂你的畫。')); ctx.onDone();
    };
    return h('div', { class: 'stack' }, pads, ckEls, h('div', { class: 'row' }, btn), fb);
  };

  R.text = (ws, ctx) => {
    const a = Store.ans(ws.id);
    const ta = h('textarea', { rows: ws.rows || 4, placeholder: '在這裡寫下你的解釋' }, a.text || '');
    const cov = ws.keywords ? C.coverage(ws.keywords, () => ta.value) : null;
    ta.addEventListener('input', () => { Store.setAns(ws.id, { text: ta.value }, { silent: true }); cov && cov.update(); });
    return C.explainFlow(ws, { draftUI: h('div', null, ta, cov), getDraft: () => ta.value.trim(), isReady: () => ta.value.trim().length >= 8, onComplete: ctx.onDone });
  };

  R.cer = (ws, ctx) => {
    const a = Store.ans(ws.id); const v = Object.assign({ claim: '', evidence: '', reasoning: '' }, a.cer || {});
    const mk = (k, label, ph) => { const t = h('textarea', { rows: 2, placeholder: ph }, v[k]); t.addEventListener('input', () => { v[k] = t.value; Store.setAns(ws.id, { cer: v }, { silent: true }); cov && cov.update(); }); return [h('label', { class: 'field' }, label), t]; };
    const get = () => `主張：${v.claim}\n證據：${v.evidence}\n推理：${v.reasoning}`;
    var cov = ws.keywords ? C.coverage(ws.keywords, get) : null;
    const ui = h('div', null, mk('claim', 'C 主張', '你的結論是什麼？'), mk('evidence', 'E 證據', '引用哪一項觀察紀錄？（註明實拍或模型）'), mk('reasoning', 'R 推理', '用什麼原理把證據連到主張？'), cov);
    return C.explainFlow(ws, { draftUI: ui, getDraft: get, isReady: () => v.claim.trim() && v.evidence.trim() && v.reasoning.trim(), onComplete: ctx.onDone });
  };

  R.chain = (ws, ctx) => {
    const a = Store.ans(ws.id); const v = (a.chain || ws.steps.map(() => '')).slice();
    const get = () => v.map((s, i) => `${i + 1}.（${ws.steps[i]}）${s}`).join('\n');
    var cov = ws.keywords ? C.coverage(ws.keywords, () => v.join(' ')) : null;
    const ui = h('div', null, ws.steps.map((s, i) => { const t = h('input', { type: 'text', value: v[i], placeholder: `第 ${i + 1} 句：${s}` }); t.addEventListener('input', () => { v[i] = t.value; Store.setAns(ws.id, { chain: v }, { silent: true }); cov && cov.update(); }); return h('div', { style: { marginTop: '8px' } }, h('span', { class: 'chip accent' }, `${i + 1}　${s}`), t); }), cov);
    return C.explainFlow(ws, { draftUI: ui, getDraft: get, isReady: () => v.filter(x => x.trim()).length >= 4, onComplete: ctx.onDone });
  };

  R.table2 = (ws, ctx) => {
    const a = Store.ans(ws.id); const v = Object.assign({}, a.table || {}); let common = a.common || '';
    const get = () => ws.rows.map(r => `${r}｜${ws.cols.map(c => c + '：' + (v[r + c] || '')).join('；')}`).join('\n') + `\n共同原理：${common}`;
    var cov = ws.keywords ? C.coverage(ws.keywords, get) : null;
    const tbl = h('table', { class: 'grid-table' }, h('tr', null, h('th', null, ''), ws.cols.map(c => h('th', null, c))),
      ws.rows.map(r => h('tr', null, h('th', null, r), ws.cols.map(c => { const t = h('textarea', { rows: 2 }, v[r + c] || ''); t.addEventListener('input', () => { v[r + c] = t.value; Store.setAns(ws.id, { table: v }, { silent: true }); cov && cov.update(); }); return h('td', null, t); }))));
    const cm = h('textarea', { rows: 2 }, common); cm.addEventListener('input', () => { common = cm.value; Store.setAns(ws.id, { common }, { silent: true }); cov && cov.update(); });
    const ui = h('div', null, h('div', { class: 'table-scroll' }, tbl), h('label', { class: 'field' }, ws.common), cm, cov);
    return C.explainFlow(ws, { draftUI: ui, getDraft: get, isReady: () => ws.rows.every(r => ws.cols.every(c => (v[r + c] || '').trim())) && common.trim(), onComplete: ctx.onDone });
  };

  R.probe = (ws, ctx) => {
    const a = Store.ans(ws.id); let rows = a.rows || [];
    const tb = h('div');
    const fb = h('div');
    const draw = () => {
      tb.replaceChildren(rows.length ? h('table', { class: 'grid-table' }, h('tr', null, h('th', null, '觀察點'), h('th', null, '最大偏移（振幅）'), h('th', null, '我的判斷')),
        rows.map(r => h('tr', null, h('td', null, h('b', null, r.id)), h('td', null, r.amp == null ? '記錄中…' : r.amp.toFixed(2)),
          h('td', null, h('div', { class: 'pick' }, ['腹線', '節線', '介於之間'].map(o => h('button', { type: 'button', class: (r.pick === o ? 'on' : '') + (r.checked ? (r.pick === o ? (r.right ? ' right' : ' wrong') : '') : ''), onclick: () => { r.pick = o; r.checked = false; Store.setAns(ws.id, { rows }, { silent: true }); draw(); } }, o)))))))
        : h('div', { class: 'muted' }, '在左側水面點選放置觀察點（播放約兩個週期後會量到振幅），再按「從模擬帶入紀錄」。'));
    };
    const pull = h('button', { class: 'btn', type: 'button' }, '從模擬帶入紀錄');
    pull.onclick = () => {
      const s = ctx.sim && ctx.sim() && ctx.sim().getState();
      if (!s || !s.probes || !s.probes.length) { fb.replaceChildren(UI.fb('warn', '還沒有觀察點紀錄，請先在水面上點選並播放。')); return; }
      rows = s.probes.map(p => { const old = rows.find(r => r.id === p.id) || {}; return { id: p.id, amp: p.amp, cls: p.cls, pick: old.pick }; });
      Store.setAns(ws.id, { rows }); Store.log(ws.id, 'probe_pull', { n: rows.length }); draw(); fb.replaceChildren();
    };
    const check = h('button', { class: 'btn primary', type: 'button' }, '檢查並完成');
    check.onclick = () => {
      if (rows.length < 3 || rows.some(r => r.amp == null || !r.pick)) { fb.replaceChildren(UI.fb('warn', '請至少記錄 3 個點（含 A、B），每點都要量到振幅並做判斷。')); return; }
      const map = { 'near-antinode': '腹線', 'near-node': '節線', between: '介於之間' };
      rows.forEach(r => { r.checked = true; r.right = map[r.cls] === r.pick; });
      const ok = rows.filter(r => r.right).length;
      done(ws, { rows }); draw();
      fb.replaceChildren(UI.fb(ok === rows.length ? 'good' : 'warn', ok === rows.length ? '判斷都和振幅紀錄一致！注意：判斷依據是一段時間的最大偏移，不是某一刻的顏色。' : `有 ${rows.length - ok} 點的判斷和振幅紀錄不一致。再看看下方紀錄圖：一個週期內最大偏移大的是腹線，接近 0 的是節線。`));
      ctx.onDone();
    };
    draw();
    return h('div', { class: 'stack' }, tb, h('div', { class: 'row' }, pull, check), fb);
  };

  R.compare = (ws, ctx) => {
    const a = Store.ans(ws.id); let pick = a.choice ?? null;
    const ch = C.choice(ws.options, { value: pick, inline: true, onPick: i => { pick = i; ch.update(i); } });
    const keep = h('input', { type: 'text', value: a.keep || '', placeholder: '保留／修正的內容' });
    const basis = h('input', { type: 'text', value: a.basis || '', placeholder: '引用一項觀察' });
    const fb = h('div');
    const btn = h('button', { class: 'btn primary', type: 'button' }, a.done ? '已完成 ✓ 更新' : '完成本題');
    btn.onclick = () => {
      if (pick == null || !keep.value.trim() || !basis.value.trim()) { fb.replaceChildren(UI.fb('warn', '請勾選，並寫出保留／修正的內容與依據的觀察。')); return; }
      done(ws, { choice: pick, choiceText: ws.options[pick], keep: keep.value, basis: basis.value });
      const vague = basis.value.trim().length < 6;
      fb.replaceChildren(UI.fb(vague ? 'warn' : 'good', vague ? '依據有點簡短：哪個觀察讓你修改哪一部分？' : '很好！比較時引用了觀察。不要求每個人一定改變想法，重點是理由連到證據。'));
      ctx.onDone();
    };
    return h('div', { class: 'stack' }, ch, h('div', { class: 'grid g2' }, h('div', null, h('label', { class: 'field' }, '我保留／修正'), keep), h('div', null, h('label', { class: 'field' }, '依據是'), basis)), h('div', { class: 'row' }, btn), fb);
  };

  R.reflect = (ws, ctx) => {
    const a = Store.ans(ws.id);
    const ta = h('textarea', { rows: 4, placeholder: '例如：我原本以為……，看到……之後，我發現……' }, a.text || '');
    const fb = h('div');
    const btn = h('button', { class: 'btn primary', type: 'button' }, a.done ? '已完成 ✓ 更新' : '完成反思');
    btn.onclick = () => { if (ta.value.trim().length < 10) { fb.replaceChildren(UI.fb('warn', '請寫具體一點：是哪一項觀察？')); return; } done(ws, { text: ta.value }); fb.replaceChildren(UI.fb('good', '反思已保存。')); ctx.onDone(); };
    return h('div', { class: 'stack' }, ta, h('div', { class: 'row' }, btn), fb);
  };

  R.predictDraw = (ws, ctx) => {
    const a = Store.ans(ws.id); let pick = a.choice ?? null; let drawing = a.drawing || null;
    const ch = C.choice(ws.options, { value: pick, locked: a.locked, onPick: i => { pick = i; ch.update(i); } });
    const pad = C.pad({ label: '屏幕（深色＝暗，留白＝亮）', value: drawing, readonly: a.locked, height: 150, onChange: d => { drawing = d; } });
    const reason = h('textarea', { rows: 2, readonly: a.locked ? true : null }, a.reason || '');
    const fb = h('div');
    const btn = h('button', { class: 'btn primary', type: 'button', disabled: a.locked ? true : null }, a.locked ? '預測已鎖定' : '送出預測（送出後才揭示屏幕）');
    btn.onclick = () => {
      if (pick == null || !drawing || !reason.value.trim()) { fb.replaceChildren(UI.fb('warn', '請勾選、畫出屏幕預測，並寫一項理由。')); return; }
      done(ws, { choice: pick, choiceText: ws.options[pick], drawing, reason: reason.value.trim(), locked: true });
      btn.disabled = true; btn.textContent = '預測已鎖定'; fb.replaceChildren(UI.fb('info', '預測已保存！請保留初稿，等觀察後再比較。')); ctx.onDone();
    };
    return h('div', { class: 'stack' }, ch, h('label', { class: 'field' }, '我的屏幕圖樣預測'), pad, h('label', { class: 'field' }, ws.reasonLabel), reason, h('div', { class: 'row' }, btn), fb);
  };

  R.observe = (ws, ctx) => {
    const a = Store.ans(ws.id); let src = a.source ?? null; let drawing = a.drawing || null;
    const ch = C.choice(ws.sources, { value: src, onPick: i => { src = i; ch.update(i); } });
    const pad = C.pad({ label: '我的觀察（深色＝暗）', value: drawing, height: 150, onChange: d => { drawing = d; } });
    const f1 = h('input', { type: 'text', value: a.f1 || '', placeholder: '特徵一' });
    const f2 = h('input', { type: 'text', value: a.f2 || '', placeholder: '特徵二' });
    const fb = h('div');
    const btn = h('button', { class: 'btn primary', type: 'button' }, a.done ? '已完成 ✓ 更新' : '完成觀察紀錄');
    btn.onclick = () => {
      if (src == null || !drawing || !f1.value.trim() || !f2.value.trim()) { fb.replaceChildren(UI.fb('warn', '請勾選資料來源、畫圖並寫兩個特徵。')); return; }
      done(ws, { source: src, sourceText: ws.sources[src], drawing, f1: f1.value, f2: f2.value });
      const t = f1.value + f2.value; const good = /明暗|亮暗|交替|多條|對稱|間距|等距/.test(t);
      const msgs = [];
      if (src === 2) msgs.push('你標示為「僅理想模型」：請記得模型結果需要實際觀察支持。');
      if (/圓弧|波前|光線/.test(t)) msgs.push('這個畫面是實際紀錄，還是用來解釋的模型？照片只記錄屏幕亮度。');
      msgs.push(good ? '你描述了可回查的特徵（例如明暗交替、左右近似對稱、間距近似相等）。' : '試著描述屏幕上看得到的特徵：亮紋有幾條？排列有什麼規律？');
      fb.replaceChildren(UI.fb(good && src !== 2 ? 'good' : 'warn', msgs.join('<br>')));
      Store.addEvidence({ id: 'doubleslit_red', kind: 'real', title: '雙狹縫紅光實拍', note: f1.value + '；' + f2.value });
      ctx.onDone();
    };
    return h('div', { class: 'stack' }, h('label', { class: 'field' }, '資料來源'), ch, pad, h('div', { class: 'grid g2' }, f1, f2), h('div', { class: 'row' }, btn), fb);
  };

  R.triple = (ws, ctx) => {
    const a = Store.ans(ws.id); const v = (a.fields || ws.fields.map(() => '')).slice();
    const ins = ws.fields.map((f, i) => { const t = h('input', { type: 'text', value: v[i] }); t.addEventListener('input', () => { v[i] = t.value; }); return h('div', null, h('label', { class: 'field' }, f), t); });
    const fb = h('div');
    const btn = h('button', { class: 'btn primary', type: 'button' }, a.done ? '已完成 ✓ 更新' : '完成本題');
    btn.onclick = () => {
      if (v.some(x => !x.trim())) { fb.replaceChildren(UI.fb('warn', '三個欄位都要填寫。')); return; }
      done(ws, { fields: v });
      const msgs = [];
      if (/光強|亮度|亮暗/.test(v[0])) msgs.push('水波直接看到的是什麼？是水面的起伏，還是亮度？');
      if (/起伏|位移|振動/.test(v[1]) && !/強度|亮/.test(v[1])) msgs.push('光的雙狹縫直接看到的是什麼？眼睛能追蹤光的快速振動嗎？');
      if (!/疊加|干涉|增強|減弱/.test(v[2])) msgs.push('共同規則可以想想：兩種現象都用到哪一個原理？');
      fb.replaceChildren(msgs.length ? UI.fb('warn', msgs.join('<br>')) : UI.fb('good', '很好：水面起伏 vs. 屏幕時間平均光強；共同規則是波的疊加。'));
      ctx.onDone();
    };
    return h('div', { class: 'stack' }, ins, h('div', { class: 'row' }, btn), fb);
  };

  R.predictCheck = (ws, ctx) => {
    const a = Store.ans(ws.id); let pick = a.choice ?? null;
    const reason = h('input', { type: 'text', value: a.reason || '', placeholder: '理由' , readonly: a.locked ? true : null });
    const fb = h('div');
    if (a.verified != null) fb.append(UI.fb(a.verified === ws.answer ? 'good' : 'warn', ws.fb[a.verified]));
    const ch = C.choice(ws.options, { value: pick, locked: a.locked, onPick: i => { pick = i; ch.update(i); } });
    const lockBtn = h('button', { class: 'btn', type: 'button', disabled: a.locked ? true : null }, a.locked ? '預測已鎖定' : '鎖定預測');
    const verBox = h('div', { class: 'stack', style: { display: a.locked ? '' : 'none' } });
    lockBtn.onclick = () => { if (pick == null) { fb.replaceChildren(UI.fb('warn', '請先選一個預測。')); return; } Store.setAns(ws.id, { choice: pick, reason: reason.value, locked: true }); lockBtn.disabled = true; lockBtn.textContent = '預測已鎖定'; verBox.style.display = ''; fb.replaceChildren(UI.fb('info', '請到左側模擬，把縫寬由大調小，觀察中央亮紋寬度。')); };
    const vch = C.choice(ws.options, { value: a.verified ?? null, answer: ws.answer, show: a.verified != null, onPick: i => { vch.update(i, true); done(ws, { verified: i, verifiedText: ws.options[i] }); fb.replaceChildren(UI.fb(i === ws.answer ? 'good' : 'warn', ws.fb[i] + (i === ws.answer && pick !== ws.answer ? '<br>你的預測和觀察不同──這正是用證據修正想法的好例子！' : ''))); ctx.onDone(); } });
    verBox.append(h('b', null, '驗證：在模擬中觀察到中央亮紋'), vch);
    return h('div', { class: 'stack' }, ch, reason, h('div', { class: 'row' }, lockBtn), verBox, fb);
  };

  R.film = (ws, ctx) => {
    const a = Store.ans(ws.id); const sel = new Set(a.rays || []);
    const figBox = h('div', { class: 'q-fig', html: FIGS.get('filmSection') });
    const legend = h('div', { class: 'opts' });
    const rayFb = h('div');
    let checked = !!a.raysChecked;
    const drawLegend = () => legend.replaceChildren(...ws.rays.map(r => h('button', { type: 'button', class: 'opt' + (checked ? (r.correct ? (sel.has(r.id) ? ' right' : '') : (sel.has(r.id) ? ' wrong' : '')) : (sel.has(r.id) ? ' sel' : '')), onclick: () => { if (sel.has(r.id)) sel.delete(r.id); else sel.add(r.id); checked = false; drawLegend(); hl(); } }, h('span', { class: 'mark' }, sel.has(r.id) ? '✓' : ''), r.label)));
    const hl = () => figBox.querySelectorAll('.ray').forEach(g => { g.style.opacity = sel.size && !sel.has(g.dataset.ray) ? .3 : 1; g.style.cursor = 'pointer'; });
    figBox.addEventListener('click', e => { const g = e.target.closest('.ray'); if (!g) return; const id = g.dataset.ray; if (sel.has(id)) sel.delete(id); else sel.add(id); checked = false; drawLegend(); hl(); });
    const chk = h('button', { class: 'btn', type: 'button' }, '檢查光路');
    chk.onclick = () => {
      const right = ws.rays.filter(r => r.correct).every(r => sel.has(r.id)) && ws.rays.filter(r => !r.correct).every(r => !sel.has(r.id));
      checked = true; drawLegend(); Store.setAns(ws.id, { rays: [...sel], raysChecked: true, raysRight: right }); Store.log(ws.id, 'rays', { right });
      rayFb.replaceChildren(UI.fb(right ? 'good' : 'warn', right ? '正確：①上表面直接反射光與②下表面反射後穿出的光，朝同一方向重疊。' : '再想想：到達眼睛的是「反射回來」的光。哪兩路光從膜的上方朝觀察者射出？薄膜沒有顏料喔。'));
    };
    drawLegend(); setTimeout(hl);
    const ta = h('textarea', { rows: 3, placeholder: '說明透明薄膜為何出現彩色區帶' }, a.text || '');
    const cov = C.coverage(ws.keywords, () => ta.value);
    ta.addEventListener('input', () => { Store.setAns(ws.id, { text: ta.value }, { silent: true }); cov.update(); });
    const top = h('div', { class: 'stack' }, h('b', null, '① 點選會互相干涉的兩路光（可點圖或下方選項）'), figBox, legend, h('div', { class: 'row' }, chk), rayFb, h('b', null, '② 用 2–3 句說明'), ta, cov);
    return C.explainFlow(ws, { draftUI: top, getDraft: () => ta.value.trim(), isReady: () => Store.ans(ws.id).raysChecked && ta.value.trim().length >= 8, onComplete: ctx.onDone });
  };

  R.sort = (ws, ctx) => {
    const a = Store.ans(ws.id); const place = Object.assign({}, a.place || {});
    let selected = null; let checked = false;
    const pool = h('div', { class: 'sort-pool', 'aria-label': '待分類' });
    const bins = ws.bins.map((b, i) => { const items = h('div', { class: 'items' }); const el = h('div', { class: 'bin', dataset: { bin: i } }, h('h4', null, b), items); el.items = items; return el; });
    const mkItem = it => {
      const asset = ASSETS.get(it.img);
      const el = h('div', { class: 'sort-item', draggable: 'true', tabindex: 0, dataset: { id: it.id } }, asset ? h('img', { src: asset.src, alt: '', onerror: e => e.target.remove() }) : null, it.label);
      el.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', it.id); el.classList.add('dragging'); });
      el.addEventListener('dragend', () => el.classList.remove('dragging'));
      el.addEventListener('click', () => { selected = selected === it.id ? null : it.id; render(); });
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } });
      return el;
    };
    const putTo = (id, bin) => { if (bin == null) delete place[id]; else place[id] = bin; selected = null; checked = false; Store.setAns(ws.id, { place }, { silent: true }); render(); };
    [pool, ...bins].forEach((zone, zi) => {
      zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('over'); });
      zone.addEventListener('dragleave', () => zone.classList.remove('over'));
      zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('over'); putTo(e.dataTransfer.getData('text/plain'), zi === 0 ? null : zi - 1); });
      zone.addEventListener('click', e => { if (selected && !e.target.closest('.sort-item')) putTo(selected, zi === 0 ? null : zi - 1); });
    });
    const render = () => {
      pool.replaceChildren(); bins.forEach(b => b.items.replaceChildren());
      ws.items.forEach(it => {
        const el = mkItem(it);
        if (selected === it.id) el.classList.add('sel');
        if (checked && place[it.id] != null) el.classList.add(place[it.id] === it.bin ? 'right' : 'wrong');
        (place[it.id] == null ? pool : bins[place[it.id]].items).append(el);
      });
      if (!pool.children.length) pool.append(h('span', { class: 'muted' }, '全部分類完成！'));
    };
    render();
    const fb = h('div');
    const sent = h('input', { type: 'text', value: a.sentence || '', placeholder: '光碟主要是……；肥皂膜是……' });
    const btn = h('button', { class: 'btn primary', type: 'button' }, '檢查分類');
    btn.onclick = () => {
      if (Object.keys(place).length < ws.items.length) { fb.replaceChildren(UI.fb('warn', '還有現象沒分類（電腦可拖曳；手機請先點選項目，再點類別）。')); return; }
      checked = true; render();
      const wrong = ws.items.filter(it => place[it.id] !== it.bin);
      Store.setAns(ws.id, { place, sentence: sent.value, sortScore: ws.items.length - wrong.length });
      const tips = { cd: '光碟表面有規律排列的細微溝槽（週期結構），彩虹主要來自繞射，不歸為薄膜干涉。', spike: '繞射尖峰是望遠鏡結構造成的繞射，不是恆星真實外形。', peacock: '結構色可能同時涉及干涉、繞射與散射，需個別判斷。', morpho: '結構色可能同時涉及干涉、繞射與散射，需個別判斷。', newton: '牛頓環來自薄空氣膜的干涉。', ar: '抗反射鍍膜利用薄膜干涉，在設計的波長與角度範圍內降低反射。', soap: '肥皂泡的彩色來自膜上下表面反射光的干涉。', oil: '油膜上下表面的反射光干涉。' };
      if (!wrong.length && sent.value.trim()) { done(ws, { place, sentence: sent.value }); fb.replaceChildren(UI.fb('good', '全部正確！光碟不能一律歸為薄膜干涉。')); ctx.onDone(); }
      else fb.replaceChildren(UI.fb('warn', (wrong.length ? `有 ${wrong.length} 項放錯：<br>` + wrong.map(w => '・' + w.label + '：' + tips[w.id]).join('<br>') : '') + (sent.value.trim() ? '' : '<br>別忘了寫一句光碟與肥皂膜的機制差異。')));
    };
    return h('div', { class: 'stack' }, h('div', { class: 'muted', style: { fontSize: '.85rem' } }, '拖曳到類別中；手機可「點選項目 → 點類別」。'), pool, h('div', { class: 'sort-bins' }, bins), h('label', { class: 'field' }, ws.sentence), sent, h('div', { class: 'row' }, btn), fb);
  };

  R.argument = (ws, ctx) => {
    const a = Store.ans(ws.id);
    const v = Object.assign({ e1: '', s1: '', e2: '', s2: '', compare: '', scope: '', change: '', ai: '' }, a.arg || {});
    const srcOpts = ['雙狹縫紅光實拍（Bryan Tong Minh，PD）', '單狹縫藍光實拍（Xyqorophibian，CC BY-SA 4.0）', '現場示範', '模擬或模型（不建議作主要證據）'];
    const field = (k, label, ph, rows = 2) => { const t = h('textarea', { rows, placeholder: ph }, v[k]); t.addEventListener('input', () => { v[k] = t.value; Store.setAns(ws.id, { arg: v }, { silent: true }); cov.update(); }); return h('div', null, h('label', { class: 'field' }, label), t); };
    const sel = k => { const s = h('select', null, h('option', { value: '' }, '選擇證據來源'), srcOpts.map(o => h('option', { value: o, selected: v[k] === o ? true : null }, o))); s.addEventListener('change', () => { v[k] = s.value; Store.setAns(ws.id, { arg: v }, { silent: true }); cov.update(); if (s.value.startsWith('模擬')) UI.toast('提醒：模擬是機制說明，主要證據應為光學實拍。'); }); return s; };
    const get = () => `證據1：${v.e1}（來源：${v.s1}）\n證據2：${v.e2}（來源：${v.s2}）\n模型比較與推理：${v.compare}\n適用範圍：${v.scope}\n想法改變：${v.change}\nAI採納理由：${v.ai}`;
    var cov = C.coverage(ws.keywords, get);
    const ui = h('div', null,
      h('h4', null, '① 統整論證'),
      h('div', { class: 'grid g2' }, h('div', null, field('e1', '證據一（真實光學觀察）', '雙狹縫屏幕上看到……'), sel('s1')), h('div', null, field('e2', '證據二（真實光學觀察）', '單狹縫屏幕上看到……'), sel('s2'))),
      field('compare', '比較直進模型與波動模型，說明證據如何支持波動行為', '直進模型預測……，但實拍顯示……；波動模型用次波疊加可以解釋……', 3),
      field('scope', '這項結論的適用範圍／界限', '這些證據支持……，但不代表……'),
      h('h4', { style: { marginTop: '16px' } }, '② 反思'),
      field('change', '哪項證據改變了你的想法？前後有何不同？', ''),
      field('ai', '若用過 AI 追問：你採納或拒絕了哪些建議？為什麼？', '沒有使用可寫「未使用」'), cov);
    return C.explainFlow(ws, { draftUI: ui, getDraft: get, isReady: () => v.e1.trim() && v.e2.trim() && v.s1 && v.s2 && v.compare.trim() && v.scope.trim() && v.change.trim(), onComplete: ctx.onDone });
  };

  C.renderWS = function (ws, ctx) {
    const fn = R[ws.kind];
    const card = h('div', { class: 'card' },
      h('div', { class: 'card-title' }, h('span', { class: 'chip accent' }, ws.no), h('h3', { style: { margin: 0 } }, ws.title)),
      h('p', null, ws.prompt));
    card.append(fn ? fn(ws, ctx) : h('div', { class: 'muted' }, '（題型 ' + ws.kind + ' 尚未支援）'));
    return card;
  };

  window.C = C;
})();
