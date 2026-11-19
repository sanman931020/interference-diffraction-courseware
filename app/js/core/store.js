/* 學習紀錄：學生代碼、作答（初稿/修訂）、操作紀錄、AI 對話與提示歷程、轉教師標記、評量、進度
 * 依 08 第五部分：同一瀏覽器重新整理可續作；共用設備完成後可清除；匯出 JSON / CSV / HTML
 */
(function () {
  const VERSION = '干涉與繞射線上教材 v1.0（115.11）';
  const KEY_CUR = 'idr:current';
  const pref = code => 'idr:rec:' + code;
  let rec = null;
  const listeners = new Set();

  function blank(code) {
    return { version: VERSION, student: { code, startedAt: new Date().toISOString() }, answers: {}, logs: [], tests: {}, tutor: {}, handoff: {}, progress: {}, badges: [], evidence: [], settings: {} };
  }
  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function safeDel(k) { try { localStorage.removeItem(k); } catch (e) { } }

  const Store = {
    VERSION,
    load() {
      const code = safeGet(KEY_CUR);
      if (code) { try { rec = JSON.parse(safeGet(pref(code))) || blank(code); } catch (e) { rec = blank(code); } }
      return rec;
    },
    login(code) {
      code = String(code).trim();
      const old = safeGet(pref(code));
      rec = old ? JSON.parse(old) : blank(code);
      safeSet(KEY_CUR, code); this.save(); this.log('system', 'login', { resumed: !!old });
      return !!old;
    },
    logout() { safeDel(KEY_CUR); rec = null; this.emit(); },
    clear() { if (rec) safeDel(pref(rec.student.code)); safeDel(KEY_CUR); rec = null; this.emit(); },
    get rec() { return rec; },
    get code() { return rec && rec.student.code; },
    save() { if (rec) { rec.updatedAt = new Date().toISOString(); safeSet(pref(rec.student.code), JSON.stringify(rec)); } this.emit(); },
    on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    emit() { listeners.forEach(f => { try { f(rec); } catch (e) { console.error(e); } }); },

    /* 作答 */
    ans(id) { return (rec && rec.answers[id]) || {}; },
    setAns(id, patch, { silent } = {}) {
      if (!rec) return;
      const a = rec.answers[id] || { createdAt: new Date().toISOString() };
      Object.assign(a, patch, { updatedAt: new Date().toISOString() });
      rec.answers[id] = a;
      if (silent) { rec.updatedAt = a.updatedAt; safeSet(pref(rec.student.code), JSON.stringify(rec)); } else this.save();
    },
    log(step, action, detail) {
      if (!rec) return;
      rec.logs.push({ t: new Date().toISOString(), step, action, detail: detail || {} });
      if (rec.logs.length > 3000) rec.logs.splice(0, rec.logs.length - 3000);
      rec.updatedAt = new Date().toISOString(); safeSet(pref(rec.student.code), JSON.stringify(rec));
    },
    done(stepId) { return !!(rec && rec.progress[stepId]); },
    markDone(stepId) { if (rec && !rec.progress[stepId]) { rec.progress[stepId] = new Date().toISOString(); this.save(); } },
    tutorHist(id) { if (!rec) return []; return rec.tutor[id] || (rec.tutor[id] = []); },
    addBadge(b) { if (rec && !rec.badges.includes(b)) { rec.badges.push(b); this.save(); return true; } return false; },
    addEvidence(e) { if (rec && !rec.evidence.some(x => x.id === e.id)) { rec.evidence.push({ ...e, t: new Date().toISOString() }); this.save(); return true; } return false; },

    /* 匯出 */
    download(name, text, type) {
      const blob = new Blob([text], { type });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    },
    fname(ext) { const d = new Date(); return `干涉與繞射紀錄_${rec.student.code}_${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.${ext}`; },
    exportJSON() { if (rec) this.download(this.fname('json'), JSON.stringify(rec, null, 2), 'application/json'); },
    toRows(r = rec) {
      const rows = [['學生代碼', '類別', '活動/題號', '欄位', '內容', '時間', '教材版本']];
      const flat = (v) => typeof v === 'object' ? JSON.stringify(v) : String(v ?? '');
      for (const [id, a] of Object.entries(r.answers)) for (const [k, v] of Object.entries(a)) {
        if (['createdAt', 'updatedAt'].includes(k) || (typeof v === 'string' && v.startsWith('data:image'))) continue;
        rows.push([r.student.code, '作答', id, k, flat(v), a.updatedAt || '', r.version]);
      }
      for (const [id, t] of Object.entries(r.tests)) rows.push([r.student.code, '評量', id, '得分', `${t.score}/${t.total}`, t.submittedAt || '', r.version]);
      for (const [id, h] of Object.entries(r.tutor)) h.forEach(m => rows.push([r.student.code, 'AI追問', id, m.role + (m.level ? '·' + m.level : ''), m.text, m.t, r.version]));
      for (const id of Object.keys(r.handoff)) rows.push([r.student.code, '轉教師', id, '標記', r.handoff[id].reason || '', r.handoff[id].t, r.version]);
      r.logs.forEach(l => rows.push([r.student.code, '操作', l.step, l.action, flat(l.detail), l.t, r.version]));
      return rows;
    },
    exportCSV() {
      if (!rec) return;
      const csv = this.toRows().map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\r\n');
      this.download(this.fname('csv'), '﻿' + csv, 'text/csv');
    },
    exportHTML() {
      if (!rec) return;
      const e = UI.esc;
      const ans = Object.entries(rec.answers).map(([id, a]) => {
        const fields = Object.entries(a).filter(([k]) => !['createdAt', 'updatedAt'].includes(k)).map(([k, v]) =>
          typeof v === 'string' && v.startsWith('data:image') ? `<div><b>${e(k)}</b><br><img src="${v}" style="max-width:420px;border:1px solid #ccc"></div>`
            : `<div><b>${e(k)}</b>：${e(typeof v === 'object' ? JSON.stringify(v) : v)}</div>`).join('');
        return `<section><h3>${e(id)}</h3>${fields}</section>`;
      }).join('');
      const tests = Object.entries(rec.tests).map(([id, t]) => `<li>${e(id)}：${t.score}/${t.total}（${e(t.submittedAt)}）</li>`).join('');
      const tutor = Object.entries(rec.tutor).map(([id, h]) => `<h4>${e(id)}</h4>` + h.map(m => `<p><b>${m.role === 'ai' ? 'AI' : '學生'}${m.level ? '（' + m.level + '）' : ''}</b>：${e(m.text)}</p>`).join('')).join('');
      const html = `<!doctype html><meta charset="utf-8"><title>學習紀錄 ${e(rec.student.code)}</title>
<style>body{font-family:"Noto Sans TC","Microsoft JhengHei",sans-serif;max-width:900px;margin:30px auto;padding:0 16px;line-height:1.7}section{border-bottom:1px solid #ddd;padding:8px 0}</style>
<h1>干涉與繞射 學習紀錄</h1><p>學生代碼：${e(rec.student.code)}｜開始：${e(rec.student.startedAt)}｜匯出：${new Date().toISOString()}｜${e(rec.version)}</p>
<h2>評量</h2><ul>${tests || '<li>尚無</li>'}</ul><h2>作答（初稿與修訂）</h2>${ans}<h2>AI 追問歷程</h2>${tutor || '<p>無</p>'}
<h2>轉教師標記</h2><p>${Object.keys(rec.handoff).map(e).join('、') || '無'}</p>`;
      this.download(this.fname('html'), html, 'text/html');
    }
  };
  window.Store = Store;
})();
