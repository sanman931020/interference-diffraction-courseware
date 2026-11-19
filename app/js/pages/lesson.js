/* 課程頁：依步驟類型呈現（情境、閱讀、學習單、素材、修訂、分類、ACT01、AI 查核、隨堂測驗） */
(function () {
  const { h } = UI;
  const P = window.Pages = window.Pages || {};
  const wsById = id => [...WS.L1, ...WS.L2, ...WS.L3].find(w => w.id === id);
  P.wsById = wsById;

  /* 掛載模擬，路由切換時自動銷毀 */
  P.mountSim = function (el, name, opts, stepId) {
    if (!window.Sims || !Sims[name]) { el.append(h('div', { class: 'muted' }, '模擬載入失敗：' + name)); return null; }
    try {
      const ctl = Sims[name].mount(el, Object.assign({ log: (a, d) => Store.log(stepId || name, name + ':' + a, d), mode: 'core' }, opts || {}));
      App.cleanups.push(() => { try { ctl && ctl.destroy(); } catch (e) { } });
      return ctl;
    } catch (e) { console.error(e); el.append(P.simFallback(name)); return null; }
  };

  /* 模擬無法執行時的靜態備援（07A、07B：關鍵畫面備援） */
  P.simFallback = function (name) {
    const sb = ['storyboard_01', 'storyboard_02', 'storyboard_03', 'storyboard_04', 'storyboard_05'];
    const box = h('div', { class: 'stack' }, UI.fb('warn', '此裝置無法執行互動模擬，以下改用靜態備援圖。'));
    if (name === 'rope' || name === 'superposeAnim') box.append(h('div', { class: 'grid g3' }, (name === 'rope' ? ['storyboard_01', 'storyboard_02', 'storyboard_03'] : sb).map(id => UI.img(id))));
    else { const fig = { doubleSlitModel: 'bdModel', doubleSlitPattern: 'bdModel', singleSlit: 'subsources', thinFilm: 'filmSection', water: 'waterAB' }[name]; if (fig) box.append(h('div', { class: 'q-fig', html: FIGS.get(fig) })); }
    return box;
  };

  /* 07B：旁白同時作字幕 → 以瀏覽器內建語音朗讀各鏡旁白（免費、離線可用，依裝置而定） */
  P.narration = function (ctl) {
    const lines = [[0, '在理想線性介質中，兩個相同脈衝正相向傳播。'], [6, '同一位置的位移相加。同向重疊時，這裡的合成位移變大。'], [14, '通過之後，兩個脈衝仍各自向原方向傳播。'], [20, '改成等大反向時，位移抵銷，完全重疊當下合成位移為零。'], [28, '零位移只描述這一瞬間；不代表波或能量永久消失。']];
    let on = false, last = -1, timer = null, prevT = 0;
    const btn = h('button', { class: 'btn sm', type: 'button' }, '🔊 開啟旁白朗讀');
    const tick = () => {
      const t = (ctl.getState() || {}).t || 0;
      if (t < prevT - 0.5) last = -1;
      prevT = t;
      let k = -1; lines.forEach(([s], i) => { if (t >= s) k = i; });
      if (k !== last && k >= 0 && t - lines[k][0] < 1.2) { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(lines[k][1]); u.lang = 'zh-TW'; u.rate = 1.05; speechSynthesis.speak(u); last = k; }
    };
    btn.onclick = () => { on = !on; btn.textContent = on ? '🔇 關閉旁白朗讀' : '🔊 開啟旁白朗讀'; if (on) { last = -1; timer = setInterval(tick, 250); Store.log('anim', 'narration_on'); } else { clearInterval(timer); speechSynthesis.cancel(); } };
    App.cleanups.push(() => { clearInterval(timer); try { speechSynthesis.cancel(); } catch (e) { } });
    return h('div', { class: 'row' }, btn, h('span', { class: 'muted', style: { fontSize: '.82rem' } }, '旁白與字幕相同；播放動畫時依鏡頭朗讀。'));
  };

  P.stepDone = function (lesson, st) {
    if (Store.done(st.id)) return true;
    let ok = false;
    if (st.kind === 'ws') ok = st.ws.every(id => Store.ans(id).done);
    else if (st.kind === 'act01') ok = !!Store.ans(st.ws).done;
    else if (st.kind === 'quiz') ok = !!(Store.rec.tests[st.test] && Store.rec.tests[st.test].submittedAt);
    if (ok) Store.markDone(st.id);
    return ok;
  };
  P.answerText = function (a) {
    if (!a) return '';
    if (a.revisedNext) return a.revisedNext;
    if (a.revision) return a.revision;
    if (a.cer) return `主張：${a.cer.claim}
證據：${a.cer.evidence}
推理：${a.cer.reasoning}`;
    if (a.f1) return `來源：${a.sourceText || ''}
特徵一：${a.f1}
特徵二：${a.f2}`;
    return a.draft || a.text || '';
  };
  P.lessonProgress = function (lesson) {
    const n = lesson.steps.filter(s => P.stepDone(lesson, s)).length;
    return Math.round(n / lesson.steps.length * 100);
  };

  P.diffHint = diffHint;
  function diffHint(key, stepId) {
    const d = TEACH.diffs.find(x => x.key === key); if (!d) return null;
    let lv = 0;
    const box = h('div', { class: 'stack' });
    const btn = h('button', { class: 'btn sm', type: 'button' }, '卡關了？看提示');
    btn.onclick = () => {
      if (lv >= 3) return;
      const L = d.ladder.L[lv];
      box.append(UI.fb('info', `<b>${L[0]}</b>　${L[1]}<br><small>對照：${L[2]}</small>`));
      Store.log(stepId, 'hint', { key, level: lv + 1 }); lv++;
      if (lv >= 3) { btn.disabled = true; btn.textContent = '已顯示全部提示'; }
      else btn.textContent = '還是卡住？下一層提示';
    };
    return h('div', { class: 'card flat', style: { background: 'var(--surface-2)' } },
      h('div', { class: 'row' }, h('b', null, '常見卡關：' + d.name), h('span', { class: 'spacer' }), btn),
      h('div', { class: 'muted', style: { fontSize: '.85rem' } }, '提示一次一層，先自己想想再看下一層。'), box);
  }

  function panelFor(st, lesson, ctxRef) {
    const p = st.panel; if (!p) return null;
    const box = h('div', { class: 'stack' });
    const gated = st.requires && !Store.ans(st.requires).locked && !Store.ans(st.requires).done;
    const inner = h('div', { class: 'stack locked-overlay' });
    if (p.fig) inner.append(h('div', { class: 'card flat q-fig', style: { maxWidth: 'none' }, html: FIGS.get(p.fig) }));
    if (p.img) inner.append(UI.img(p.img, { onOpen: a => { Store.log(st.id, 'zoom', { id: a.id }); if (p.evidence) Store.addEvidence({ id: a.id, kind: a.kind, title: a.title }); } }));
    if (p.gallery) inner.append(h('div', { class: 'grid g2' }, p.gallery.map(id => UI.img(id))));
    if (p.mine) inner.append(h('div', { class: 'card' }, h('h3', null, '回看我的紀錄'), p.mine.map(id => { const w = wsById(id); const a = Store.ans(id); const txt = P.answerText(a);
      return h('div', { class: 'q-part' }, h('b', null, w.no + '　' + w.title.replace(/^.+?：/, '')), txt ? h('p', { style: { whiteSpace: 'pre-wrap', margin: '6px 0 0', fontSize: '.9rem' } }, txt) : h('p', { class: 'muted', style: { margin: '6px 0 0' } }, '尚未作答')); })));
    if (p.sim && !gated) {
      const s = h('div'); inner.append(s);
      if (p.note) inner.append(UI.fb('info', p.note));
      const opts = Object.assign({}, p.opts || {});
      if (p.sim === 'doubleSlitPattern') opts.startOn = false;
      ctxRef.sim = P.mountSim(s, p.sim, opts, st.id);
      if (p.sim === 'superposeAnim' && ctxRef.sim && 'speechSynthesis' in window) inner.append(P.narration(ctxRef.sim));
      if (p.sim === 'water' || p.sim === 'doubleSlitPattern' || p.sim === 'singleSlit') Store.addEvidence({ id: 'model-' + p.sim, kind: 'model', title: { water: '水波干涉模擬', doubleSlitPattern: '雙狹縫理想模型', singleSlit: '單狹縫理想模型' }[p.sim] });
    }
    if (p.after && p.after.img) {
      const w = st.ws && st.ws[0];
      if (w && Store.ans(w).done) inner.append(h('div', null, h('h4', null, '對照：兩種完全重疊的比較'), UI.img(p.after.img), p.after.note ? UI.fb('info', p.after.note) : null));
      else inner.append(h('div', { class: 'card flat muted', style: { fontSize: '.88rem' } }, '完成本題後，這裡會出現「兩種完全重疊的比較」圖供你修訂。'));
    }
    if (gated) {
      inner.style.minHeight = '260px';
      inner.append(h('div', { class: 'veil' }, h('div', null, h('b', null, '🔒 先預測，再觀察'), h('div', { class: 'muted' }, '完成上一步的預測並送出後，這裡才會揭示。'),
        h('a', { class: 'btn primary sm', style: { marginTop: '10px' }, href: '#/lesson/' + lesson.id + '/' + (lesson.steps.find(s => s.ws && [].concat(s.ws).includes(st.requires)) || st).id }, '回到預測'))));
    }
    box.append(inner);
    return box;
  }

  const K = {};
  K.scenario = (st, lesson) => {
    const sc = lesson.scenario;
    return h('div', { class: 'stack' },
      h('div', { class: 'scenario' }, h('span', { class: 'chip accent' }, `第 ${lesson.no} 節｜${lesson.func}`), h('h2', { style: { marginTop: '10px' } }, sc.title),
        sc.lines.map(l => h('div', { class: 'who-say' }, h('div', { class: 'avatar' }, COURSE.mentor.initial), h('div', { class: 'bubble', html: l })))),
      h('div', { class: 'grid g2' },
        h('div', { class: 'card' }, h('h3', null, '本節核心問題'), h('p', { style: { fontSize: '1.15rem', fontWeight: 700 } }, lesson.coreQ),
          h('h4', null, '學習目標'), h('ul', { class: 'goal-list' }, lesson.goals.map(g => { const G = COURSE.goals.find(x => x.id === g); return h('li', null, `${g}　${G.text}`); })),
          h('h4', null, '你會留下的成果'), h('p', null, lesson.output)),
        h('div', { class: 'card' }, h('h3', null, '本節流程（50 分鐘）'),
          h('table', { class: 'grid-table' }, lesson.steps.filter(s => s.kind !== 'scenario').map(s => h('tr', null, h('td', { style: { whiteSpace: 'nowrap' } }, h('span', { class: 'step-time' }, s.time)), h('td', null, s.title)))))));
  };

  K.read = (st, lesson) => {
    const n = COURSE.nodes[st.node];
    const ans = Store.ans('read-' + st.node);
    const res = Object.assign({}, ans.check || {});
    const checks = n.check.map((c, k) => {
      const fb = h('div');
      const ch = C.choice(c.options, { value: res[k] ?? null, answer: c.answer, show: res[k] != null, retry: true, onPick: i => { res[k] = i; ch.update(i, true); fb.replaceChildren(UI.fb(i === c.answer ? 'good' : 'warn', c.fb[i])); Store.setAns('read-' + st.node, { check: res }); if (Object.keys(res).length === n.check.length) { Store.markDone(st.id); App.refreshNav(); } } });
      if (res[k] != null) fb.append(UI.fb(res[k] === c.answer ? 'good' : 'warn', c.fb[res[k]]));
      return h('div', { class: 'q-part' }, h('b', null, `快問快答 ${k + 1}　`), c.q, ch, fb);
    });
    return h('div', { class: 'split' },
      h('div', { class: 'card reading' }, h('span', { class: 'chip accent' }, '知識節點 ' + n.no), h('h2', { style: { marginTop: '8px' } }, n.title),
        h('div', { class: 'fb info', style: { marginBottom: '14px' } }, h('span', { class: 'fb-ico' }, '★'), h('div', null, h('b', null, '核心理解：'), n.core)),
        n.body.map(p => h('p', { html: p })),
        h('details', { class: 'cond' }, h('summary', null, '成立條件與易混淆處'), h('p', { style: { marginTop: '8px' } }, n.cond)),
        h('div', { class: 'ref' }, '查核依據：', h('a', { href: n.ref.url, target: '_blank', rel: 'noopener' }, n.ref.text)),
        h('div', { class: 'ref' }, '銜接：' + n.link)),
      h('div', { class: 'stack sticky' }, [].concat(st.fig || []).map(f => h('div', { class: 'card flat q-fig', style: { maxWidth: 'none' }, html: FIGS.get(f) })),
        h('div', { class: 'card' }, h('h3', null, '讀完檢核'), checks)));
  };

  K.ws = (st, lesson, rerender) => {
    const ctxRef = { sim: null };
    const ctx = { sim: () => ctxRef.sim, onDone: () => { if (P.stepDone(lesson, st)) { App.refreshNav(); if (st.wrap) P.finishLesson(lesson); } rerenderSoft(); } };
    const right = h('div', { class: 'stack' });
    if (st.intro) right.append(UI.fb('info', st.intro));
    st.ws.forEach(id => right.append(C.renderWS(wsById(id), ctx)));
    if (st.diff) right.append(diffHint(st.diff, st.id));
    if (st.wrap) right.append(P.saveCard(lesson));
    const panel = panelFor(st, lesson, ctxRef);
    function rerenderSoft() {
      if (st.panel && st.panel.after && Store.ans(st.ws[0]).done && !right.dataset.after) { right.dataset.after = 1; rerender(); }
    }
    return panel ? h('div', { class: 'split' }, h('div', { class: 'sticky' }, panel), right) : right;
  };

  K.gallery = (st) => {
    const box = h('div', { class: 'stack' });
    if (st.note) box.append(UI.fb('info', st.note));
    box.append(h('div', { class: 'grid g2' }, st.images.map(id => UI.img(id, { onOpen: a => { Store.log(st.id, 'zoom', { id }); Store.addEvidence({ id: a.id, kind: a.kind, title: a.title }); } }))));
    if (st.fig) box.append(h('div', { class: 'card flat q-fig', style: { maxWidth: '640px' }, html: FIGS.get(st.fig) }));
    if (st.sim) { box.append(h('h3', null, '理想模型（與實拍並列比較）')); const s = h('div'); box.append(s); P.mountSim(s, st.sim, {}, st.id); }
    st.images.forEach(id => { const a = ASSETS.get(id); if (a.kind === 'real') Store.addEvidence({ id, kind: 'real', title: a.title }); });
    box.append(h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: () => { Store.markDone(st.id); App.refreshNav(); UI.toast('已記錄到證據筆記本'); App.next(); } }, '我看完了，繼續')));
    return box;
  };

  K.revise = (st) => {
    const src = wsById(st.from); const a = Store.ans(st.from);
    const mine = a.revision || a.draft || (a.cer ? `主張：${a.cer.claim}\n證據：${a.cer.evidence}\n推理：${a.cer.reasoning}` : '');
    const peers = st.peers.map((p, i) => {
      const rv = h('div');
      return h('div', { class: 'card flat' }, h('div', { class: 'row' }, h('b', null, `匿名同學 ${'甲乙'[i]}`), h('span', { class: 'spacer' }),
        h('button', { class: 'btn sm', onclick: () => { rv.replaceChildren(UI.fb(i ? 'good' : 'warn', p.issue)); Store.log(st.id, 'peer_check', { i }); } }, '這份 CER 的證據與推理如何？')),
        h('p', { style: { whiteSpace: 'pre-wrap', margin: '8px 0' } }, p.text), rv);
    });
    const ta = h('textarea', { rows: 5 }, a.revisedNext || mine);
    const reason = h('input', { type: 'text', value: a.revisedNextReason || '', placeholder: '我補上了哪項證據或理由？' });
    const fb = h('div');
    return h('div', { class: 'split even' },
      h('div', { class: 'stack' }, h('h3', null, '檢查同學的 CER'), h('p', { class: 'muted' }, '問：哪項觀察支持腹線、節線？'), peers),
      h('div', { class: 'card' }, h('h3', null, '修訂我的 ' + src.no + '（' + src.title + '）'),
        mine ? h('details', { class: 'cond' }, h('summary', null, '我的原稿'), h('p', { style: { whiteSpace: 'pre-wrap' } }, mine)) : UI.fb('warn', '你在第1節還沒有寫 Q7，可以直接在下方寫。'),
        h('label', { class: 'field' }, '修訂後'), ta, h('label', { class: 'field' }, '修訂理由'), reason,
        h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { class: 'btn primary', onclick: () => {
          if (!ta.value.trim() || !reason.value.trim()) { fb.replaceChildren(UI.fb('warn', '請寫出修訂內容與理由。')); return; }
          Store.setAns(st.from, { revisedNext: ta.value, revisedNextReason: reason.value }); Store.log(st.id, 'revise'); Store.markDone(st.id); App.refreshNav();
          fb.replaceChildren(UI.fb('good', '修訂已保存（修訂前後稿都會留存）。'));
        } }, '保存修訂')), fb));
  };

  K.classify = (st) => {
    const a = Store.ans('classify-' + st.id); const picks = Object.assign({}, a.picks || {});
    let checked = !!a.checked;
    const list = h('div', { class: 'stack' });
    const fb = h('div');
    const draw = () => list.replaceChildren(...st.sentences.map((s, i) => h('div', { class: 'card flat', style: { padding: '12px 14px' } },
      h('div', { style: { marginBottom: '8px' } }, `「${s.text}」`),
      h('div', { class: 'pick' }, st.bins.map((b, k) => h('button', { type: 'button', class: (picks[i] === k ? 'on' : '') + (checked && picks[i] === k ? (k === s.ans ? ' right' : ' wrong') : ''), onclick: () => { picks[i] = k; checked = false; draw(); } }, b))),
      checked && picks[i] !== s.ans ? h('div', { class: 'muted', style: { fontSize: '.84rem', marginTop: '6px' } }, '→ 應為「' + st.bins[s.ans] + '」。' + (s.warn || '')) : null)));
    draw();
    const chk = h('button', { class: 'btn', onclick: () => {
      if (Object.keys(picks).length < st.sentences.length) { fb.replaceChildren(UI.fb('warn', '每一句都要分類。')); return; }
      checked = true; draw(); const ok = st.sentences.filter((s, i) => picks[i] === s.ans).length;
      Store.setAns('classify-' + st.id, { picks, checked: true, score: ok }); Store.log(st.id, 'classify', { ok });
      fb.replaceChildren(UI.fb(ok === st.sentences.length ? 'good' : 'warn', `分類正確 ${ok}/${st.sentences.length}。記得：只有光學實拍是光的證據；水波是類比；波前與理想曲線是模型。`));
    } }, '檢查分類');
    const src = wsById(st.from); const sa = Store.ans(st.from);
    const mine = sa.revision || sa.draft || '';
    const ta = h('textarea', { rows: 5 }, sa.revisedNext || mine);
    const reason = h('input', { type: 'text', value: sa.revisedNextReason || '', placeholder: '我補上了哪項證據？刪掉了哪句把模型當證據的話？' });
    const fb2 = h('div');
    return h('div', { class: 'split even' },
      h('div', { class: 'stack' }, h('h3', null, '匿名後台回答紀錄：哪句把模型當成實驗證據？'), list, h('div', { class: 'row' }, chk), fb),
      h('div', { class: 'card' }, h('h3', null, '修訂我的第2節 ' + src.no), mine ? h('details', { class: 'cond' }, h('summary', null, '我的原稿'), h('p', { style: { whiteSpace: 'pre-wrap' } }, mine)) : UI.fb('warn', '你在第2節還沒有完成 Q6，可以直接在下方寫。'),
        h('label', { class: 'field' }, '修訂後'), ta, h('label', { class: 'field' }, '修訂理由'), reason,
        h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { class: 'btn primary', onclick: () => {
          if (!ta.value.trim() || !reason.value.trim()) { fb2.replaceChildren(UI.fb('warn', '請寫出修訂內容與理由。')); return; }
          Store.setAns(st.from, { revisedNext: ta.value, revisedNextReason: reason.value }); Store.markDone(st.id); App.refreshNav(); fb2.replaceChildren(UI.fb('good', '修訂已保存。'));
        } }, '保存修訂')), fb2));
  };

  K.aicheck = (st) => {
    const a = Store.ans('aicheck'); const res = Object.assign({}, a.res || {});
    const cards = COURSE.aiCheck.map((q, i) => {
      const r = res[i] || { ok: null, reasons: [] };
      const fb = h('div');
      const verdict = h('div', { class: 'pick' }, ['可以採納', '需要查核'].map((t, k) => h('button', { type: 'button', class: r.ok === (k === 0) ? 'on' : '', onclick: () => { r.ok = k === 0; res[i] = r; draw(); } }, t)));
      const reasons = h('div', { class: 'opts' });
      const draw = () => {
        verdict.querySelectorAll('button').forEach((b, k) => b.className = r.ok === (k === 0) ? 'on' : '');
        reasons.replaceChildren(...q.reasons.map((t, k) => h('button', { type: 'button', class: 'opt' + (r.reasons.includes(k) ? ' sel' : ''), onclick: () => { r.reasons = r.reasons.includes(k) ? r.reasons.filter(x => x !== k) : [...r.reasons, k]; res[i] = r; draw(); } }, h('span', { class: 'mark' }, r.reasons.includes(k) ? '✓' : ''), t)));
      };
      draw();
      const chk = h('button', { class: 'btn sm', onclick: () => {
        if (r.ok == null || !r.reasons.length) { fb.replaceChildren(UI.fb('warn', '請判斷並勾選理由（可複選）。')); return; }
        const right = r.ok === q.ok && q.right.every(k => r.reasons.includes(k)) && r.reasons.every(k => q.right.includes(k));
        r.checked = true; r.right = right; res[i] = r; Store.setAns('aicheck', { res }); Store.log(st.id, 'aicheck', { i, right });
        fb.replaceChildren(UI.fb(right ? 'good' : 'warn', right ? '判斷正確！' : `參考：這則回饋${q.ok ? '可以採納' : '需要查核'}，理由是「${q.right.map(k => q.reasons[k]).join('」「')}」。`));
        if (COURSE.aiCheck.every((_, j) => res[j] && res[j].checked)) { Store.markDone(st.id); App.refreshNav(); }
      } }, '檢查');
      return h('div', { class: 'card' }, h('div', { class: 'row' }, h('span', { class: 'ai-ico', style: { width: '30px', height: '30px', borderRadius: '9px', background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '.78rem' } }, 'AI'), h('b', null, `AI 回饋 ${i + 1}`)),
        h('div', { class: 'bubble', style: { margin: '10px 0' } }, q.ai), h('b', null, '你的判斷'), verdict, h('div', { style: { marginTop: '10px' } }, h('b', null, '理由（可複選）')), reasons, h('div', { class: 'row', style: { marginTop: '10px' } }, chk), fb);
    });
    return h('div', { class: 'stack' }, UI.fb('info', 'AI 的回饋不一定正確。查核三問：<b>有沒有可回查的證據來源？</b>證據是實拍還是模型？結論有沒有超出證據範圍？'), cards);
  };

  K.quiz = (st) => {
    const t = QB.tests[st.test]; const r = Store.rec.tests[st.test];
    return h('div', { class: 'card', style: { maxWidth: '720px' } }, h('h2', null, t.title), h('p', null, t.scope),
      h('div', { class: 'row' }, UI.chip('accent', `${t.items.length} 題`), UI.chip('accent', `${t.total} 分`), UI.chip('', `${t.minutes} 分鐘`)),
      r && r.submittedAt ? UI.fb('good', `已完成：${r.score}/${t.total} 分`) : null,
      h('div', { class: 'row', style: { marginTop: '14px' } }, h('a', { class: 'btn primary lg', href: '#/test/' + st.test }, r && r.submittedAt ? '查看結果' : '開始測驗')));
  };

  K.act01 = (st, lesson) => P.act01(st, lesson);

  P.saveCard = function (lesson) {
    return h('div', { class: 'card flat' }, h('h3', null, '存檔與下載（08 學習紀錄）'),
      h('p', { class: 'muted' }, '下載本次作答（含初稿、修訂、AI 追問歷程與操作紀錄），交給老師或自己保存。'),
      h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => Store.exportJSON() }, '下載 JSON'), h('button', { class: 'btn', onclick: () => Store.exportCSV() }, '下載 CSV'), h('button', { class: 'btn', onclick: () => Store.exportHTML() }, '下載 HTML 報告')));
  };

  P.finishLesson = function (lesson) {
    if (Store.addBadge(lesson.badge.id)) {
      UI.confetti();
      UI.modal({ title: '🎉 獲得徽章：' + lesson.badge.name, body: h('div', { class: 'row' }, h('div', { class: 'badge-medal on' }, lesson.badge.icon), h('div', null, h('p', null, `你完成了第 ${lesson.no} 節「${lesson.title}」的學習單！`), h('p', { class: 'muted' }, '別忘了下載紀錄，並完成隨堂測驗。'))),
        actions: [{ label: '繼續', primary: true }] });
    }
  };

  /* ---------- 課程頁主體 ---------- */
  P.lesson = function (root, lessonId, stepId) {
    const lesson = COURSE.lessons.find(l => l.id === lessonId);
    if (!lesson) return P.notFound(root);
    let idx = Math.max(0, lesson.steps.findIndex(s => s.id === stepId));
    const st = lesson.steps[idx];
    App.setCrumb(`第 ${lesson.no} 節　${lesson.title}　›　${st.title}`);
    const render = () => {
      App.runCleanups();
      const prog = P.lessonProgress(lesson);
      const bar = h('div', { class: 'steps-bar', role: 'navigation', 'aria-label': '步驟' }, lesson.steps.map((s, i) => h('a', { href: `#/lesson/${lesson.id}/${s.id}`, class: (i === idx ? 'cur' : '') + (P.stepDone(lesson, s) ? ' done' : ''), title: s.title }, h('i'), s.id)));
      const body = (K[st.kind] || (() => h('div', null, '未知步驟')))(st, lesson, render);
      const prev = lesson.steps[idx - 1], next = lesson.steps[idx + 1];
      const nextLesson = COURSE.lessons[COURSE.lessons.indexOf(lesson) + 1];
      UI.fill(root, 
        h('div', { class: 'lesson-head' },
          h('div', { style: { flex: 1, minWidth: '240px' } }, h('div', { class: 'tag' }, `第 ${lesson.no} 節｜${lesson.func}｜知識節點 ${COURSE.nodes[lesson.node].no}${lesson.node2 ? '、' + COURSE.nodes[lesson.node2].no : ''}`), h('h1', { style: { margin: '2px 0' } }, lesson.title), h('div', { class: 'muted' }, '核心問題：' + lesson.coreQ)),
          h('div', { class: 'progress-ring', style: { '--p': prog }, title: '本節進度' }, h('span', null, prog + '%'))),
        bar,
        h('div', { class: 'step-title' }, h('span', { class: 'chip accent' }, st.id), h('h2', null, st.title), h('span', { class: 'step-time' }, st.time)),
        body,
        h('div', { class: 'step-nav' },
          prev ? h('a', { class: 'btn', href: `#/lesson/${lesson.id}/${prev.id}` }, '← ' + prev.title) : h('a', { class: 'btn', href: '#/home' }, '← 回首頁'),
          h('span', { class: 'spacer' }),
          next ? h('a', { class: 'btn primary', href: `#/lesson/${lesson.id}/${next.id}` }, (st.kind === 'scenario' ? '開始 ' : '下一步：') + next.title + ' →')
            : nextLesson ? h('a', { class: 'btn primary', href: `#/lesson/${nextLesson.id}` }, `前往第 ${nextLesson.no} 節 →`) : h('a', { class: 'btn primary', href: '#/summary' }, '前往單元統整 →')));
      if (st.kind === 'scenario') Store.markDone(st.id);
      App.refreshNav();
    };
    App.next = () => { const n = lesson.steps[idx + 1]; location.hash = n ? `#/lesson/${lesson.id}/${n.id}` : '#/summary'; };
    Store.log(st.id, 'view');
    render();
  };
})();
