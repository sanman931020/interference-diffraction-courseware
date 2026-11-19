/* AI 追問引擎（依 08 第四部分與 10 分層提示）
 * 規則：只在解釋階段啟用；每次 1 個主問題、最多 3 句；不代答；
 *      同一迷思連續兩層提示後仍卡住 → 轉教師（保留原稿與提示歷程）。
 * 預設：離線規則式追問（免費、可離線）。可選：教師設定相容 OpenAI 格式的免費端點（例如本機 Ollama），失敗自動退回規則式。
 */
(function () {
  const ASK_ANSWER = /(直接|完整)?(給我|告訴我|說出).{0,6}(答案|解答)|答案是什麼|幫我寫|代寫|標準答案/;
  const RULES = {
    superposition: {
      mis: [
        { id: 'bounce', name: '波像物體碰撞', re: /反彈|彈回|撞|碰撞|倒退/, ladder: [
          '你寫到脈衝會「反彈」或「碰撞」，是根據什麼想法？',
          '回到動畫，追蹤脈衝 A 的標籤：相遇前、重疊時、通過後，它的傳播方向有改變嗎？',
          '依你在 Q2 畫的三個時刻，你會如何修訂「相遇後會反彈」這句話？'] },
        { id: 'vanish', name: '相消等於消失', re: /消失|不見|沒了|能量.{0,4}(消失|不見|沒)|抵消掉了/, ladder: [
          '你說波「消失」了，是看到哪一個時刻的畫面？',
          '把動畫拉到完全重疊之後的鏡頭 05：兩個脈衝還在嗎？',
          '「位移為零」描述的是哪一個瞬間？請用這個想法修訂你的句子。'] }
      ],
      elements: [
        { kw: ['同一位置', '同一點', '同一處', '同位置', '同個位置'], ask: '你的「相加」是在比較哪裡的位移？是同一個位置嗎？' },
        { kw: ['同一時刻', '同時', '同一瞬間', '當下', '那一刻'], ask: '相加的兩個位移，是同一個時刻的嗎？請在句子中說清楚。' },
        { kw: ['通過', '之後', '繼續', '各自', '仍'], ask: '重疊結束之後，兩個脈衝怎麼了？請補上這部分。' }
      ]
    },
    water: {
      mis: [
        { id: 'color', name: '以顏色判斷振幅', re: /顏色|白色|亮的|暗的|深色|淺色|截圖/, ladder: [
          '你用顏色判斷腹線或節線，這張圖記錄的是「某一刻」還是「一段時間」？',
          '回到模擬，在同一個位置看一整個週期的起伏紀錄：最大偏移是多少？',
          '用「一段時間的最大偏移」重新說明，哪些位置是腹線、哪些是節線？'] },
        { id: 'still', name: '節線必定完全靜止', re: /完全(靜止|不動)|一定不動/, ladder: [
          '你認為節線上一定完全不動，這需要什麼條件？',
          '看 B 點的紀錄：振幅是剛好零，還是很小？兩列波到達時振幅相等嗎？',
          '請修訂成較精確的說法：節線上振幅「極小」，等振幅時才完全相消。'] },
        { id: 'front', name: '把干涉線當波前', re: /往外(傳|跑|移動)|向外傳播的線/, ladder: [
          '腹線、節線會隨時間向外移動嗎？',
          '開啟「顯示腹線／節線」，播放一段時間：線的位置有沒有改變？',
          '請區分「向外傳播的波前」與「位置固定的振幅分布」。'] }
      ],
      elements: [
        { kw: ['同頻率', '頻率相同', '同步', '同相', '相同頻率'], ask: '兩個波源的振動有什麼共同點，使花紋位置穩定？' },
        { kw: ['振幅', '起伏', '最大偏移'], ask: '你的證據是哪一點、在一段時間內的什麼紀錄？' },
        { kw: ['疊加', '相加', '增強', '減弱', '相消'], ask: '兩列波到達 A、B 時如何疊加？請把因果連起來。' }
      ]
    },
    doubleslit: {
      mis: [
        { id: 'nolight', name: '暗紋等於無光', re: /(沒有|沒|無)(光|任何光).{0,4}(到|抵達)|光沒到|沒有光|光到不了|照不到/, ladder: [
          '你說「沒有光到達 D」，是根據哪項觀察？',
          '先看模型：在模型中連出兩狹縫到 D 的路徑，兩個狹縫發出的波，都能到達 D 點嗎？',
          'D 點兩路光到達時的振動關係，如何影響合成振幅與亮度？'] },
        { id: 'image', name: '條紋是狹縫影像', re: /影像|影子|投影|放大|擋住|遮擋/, ladder: [
          '你提到影子或投影，屏幕上有幾條亮紋？兩條狹縫能投出這麼多條嗎？',
          '比較實拍與直進模型的預測：哪個特徵是投影無法說明的？',
          '請改用兩個次波源的疊加，說明多條亮暗紋從哪裡來。'] },
        { id: 'modelAsPhoto', name: '模型當成實拍', re: /照片.{0,6}(圓弧|波前)|看到.{0,4}(波前|圓弧)|光沿.{0,3}圓弧/, ladder: [
          '你提到圓弧，這是實際照片，還是用來解釋的模型？',
          '並列實拍與波前圖：各自能說明什麼？哪一張是屏幕亮度的紀錄？',
          '請在解釋中分別標示：哪句是觀察證據、哪句是模型推理。'] },
        { id: 'energy', name: '相消等於能量消失', re: /能量.{0,4}(消失|不見|沒)/, ladder: [
          '你說能量消失，其他屏幕位置的亮度有何變化？',
          '比較 B 亮紋與 D 暗紋：亮紋處是否比單一狹縫時更亮？',
          '請改寫成「位移（光波）在 D 處相消」，避免說能量消失。'] }
      ],
      elements: [
        { kw: ['兩', '兩列', '兩道', 'S1', 'S2', 'S₁', '兩個狹縫', '兩縫'], ask: '屏幕上這一點的光，來自哪幾個次波源？' },
        { kw: ['同相', '相位相同', '步調相同'], ask: '在 B 點，兩列光波到達時的相位關係是什麼？' },
        { kw: ['反相', '相位相反', '步調相反'], ask: '在 D 點，兩列光波到達時的相位關係是什麼？' },
        { kw: ['疊加', '相加', '干涉', '增強', '減弱', '相消'], ask: '相位關係如何造成亮或暗？請用「因為……所以……」連起來。' }
      ]
    },
    compare: {
      mis: [
        { id: 'unrelated', name: '干涉繞射無關', re: /(完全)?不同(的)?原理|沒有關係|無關|兩回事/, ladder: [
          '你認為原理不同，是根據兩張圖的哪個差異？',
          '在兩個模型標出次波源：它們各自如何分布？',
          '根據次波源分布與明暗紋，你會如何修訂「兩者原理無關」？'] },
        { id: 'image', name: '圖樣是狹縫放大影像', re: /放大|影像|影子|投影/, ladder: [
          '單狹縫中央亮紋旁還有亮紋，一條狹縫的影子能做到嗎？',
          '看模擬中的縫內次波源：偏離正前方時發生什麼？',
          '請用次波疊加取代「放大影像」重新說明。'] }
      ],
      elements: [
        { kw: ['中央', '中間'], ask: '單狹縫圖樣的中央亮紋和旁側亮紋有何不同？' },
        { kw: ['分立', '兩個'], ask: '雙狹縫的次波源有幾個？是分立還是連續？' },
        { kw: ['連續', '許多', '很多'], ask: '單狹縫的次波源怎麼分布？' },
        { kw: ['疊加', '次波'], ask: '兩種現象有什麼共同的原理？' }
      ]
    },
    film: {
      mis: [
        { id: 'pigment', name: '顏色來自顏料', re: /顏料|色素|染/, ladder: [
          '肥皂水本身有顏色嗎？你的根據是什麼？',
          '在剖面圖中找找：哪兩路光會朝同一方向到達眼睛？',
          '請用兩路反射光的疊加，說明顏色從哪裡來。'] },
        { id: 'refractOnly', name: '只歸因於折射', re: /折射|三稜鏡|色散/, ladder: [
          '你提到折射，到達眼睛的光是穿過去的，還是反射回來的？',
          '在模擬中逐步顯示光路：①和②分別從哪個界面反射？',
          '請補上兩路反射光如何疊加，以及為何不同位置顏色不同。'] }
      ],
      elements: [
        { kw: ['上表面', '上界面', '表面'], ask: '第一路反射光從哪裡反射？' },
        { kw: ['下表面', '下界面', '底部'], ask: '第二路光進入薄膜後，從哪裡反射回來？' },
        { kw: ['干涉', '疊加', '重疊', '增強', '減弱'], ask: '兩路光相遇後會發生什麼？' },
        { kw: ['膜厚', '厚度', '厚薄'], ask: '為什麼膜上不同位置的顏色不同？' }
      ]
    },
    argument: {
      mis: [
        { id: 'simEvidence', name: '以模擬作主要證據', re: /模擬(證明|顯示光是)|動畫(證明|裡)|水波.{0,4}證明/, ladder: [
          '你的主要證據是實拍還是模擬？',
          '回看兩張光學實拍：它們各自顯示了什麼可回查的特徵？',
          '請把模擬改成「機制說明」，主要證據換成實拍並註明來源。'] },
        { id: 'overclaim', name: '過度宣稱', re: /一切|所有性質|只有波動|完全是波|證明光是波/, ladder: [
          '你的結論涵蓋多大範圍？本單元的證據能支持到哪裡？',
          '這兩項觀察是在什麼情境下得到的？',
          '請加上一句適用範圍，例如「在這些情境中光具有波動行為」。'] }
      ],
      elements: [
        { kw: ['雙狹縫'], ask: '第一項光學證據是什麼？請註明來源。' },
        { kw: ['單狹縫', '繞射'], ask: '第二項光學證據是什麼？請註明來源。' },
        { kw: ['直進'], ask: '直進模型對這些現象的預測是什麼？為何不足？' },
        { kw: ['範圍', '界限', '不代表', '不等於', '情境', '限制'], ask: '這個結論的適用範圍是什麼？' }
      ]
    }
  };

  function has(text, kws) { return kws.some(k => text.includes(k)); }
  function trim3(s) { const parts = String(s).split(/(?<=[。？！?!])/).filter(Boolean); return parts.slice(0, 3).join('').trim(); }

  const Tutor = {
    RULES,
    /* 規則式：回傳 { text, level, mis, handoff, kind } */
    rule(setId, wsId, text) {
      const set = RULES[setId];
      const hist = Store.tutorHist(wsId).filter(m => m.role === 'ai');
      if (ASK_ANSWER.test(text)) return { text: '先從你已有的觀察開始：實拍或模型中，哪一項特徵是你最需要解釋的？', level: '引導', kind: 'redirect' };
      if (!set) return { text: '你的解釋引用了哪一項觀察？請把證據與推理連起來。', level: 'L1' };
      for (const m of set.mis) {
        if (m.re.test(text)) {
          const prev = hist.filter(x => x.mis === m.id).length;
          const lv = Math.min(prev, 2);
          const handoff = prev >= 2;
          return { text: m.ladder[lv], level: 'L' + (lv + 1), mis: m.id, misName: m.name, handoff };
        }
      }
      const missing = set.elements.filter(e => !has(text, e.kw));
      if (missing.length) {
        const prevAsk = hist.filter(x => x.kind === 'element').length;
        return { text: missing[0].ask, level: prevAsk ? 'L2' : 'L1', kind: 'element' };
      }
      return { text: '你的解釋已包含主要環節。最後檢查：哪一句是觀察證據、哪一句是模型推理？確認後就可以完成修訂。', level: '確認', kind: 'ok' };
    },
    async ask(setId, wsId, text, ctx = {}) {
      const s = (Store.rec && Store.rec.settings) || {};
      const fb = this.rule(setId, wsId, text);
      const cfg = JSON.parse(localStorage.getItem('idr:ai') || 'null');
      if (cfg && cfg.endpoint && !fb.kind?.startsWith('redirect')) {
        try {
          const sys = `你是高中物理「干涉與繞射」的追問助教。規則：1) 只問一個主問題，最多三句；2) 絕不提供可直接繳交的答案或結論（例如不可直接說「D點反相所以相消」）；3) 引導學生回看實拍證據與模型，區分實拍與模型；4) 使用繁體中文。題目：${ctx.prompt || ''}。教材重點：${ctx.key ? '（教師參考，不可透露）' + ctx.key : ''}。可參考的提示：${fb.text}`;
          const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 15000);
          const r = await fetch(cfg.endpoint, { method: 'POST', signal: ctl.signal, headers: Object.assign({ 'Content-Type': 'application/json' }, cfg.key ? { Authorization: 'Bearer ' + cfg.key } : {}),
            body: JSON.stringify({ model: cfg.model || 'llama3.1', stream: false, messages: [{ role: 'system', content: sys }, { role: 'user', content: '學生作答：' + text }] }) });
          clearTimeout(tm);
          const j = await r.json();
          const out = j.choices?.[0]?.message?.content || j.message?.content;
          if (out) return Object.assign({}, fb, { text: trim3(out), source: 'llm' });
        } catch (e) { return Object.assign({}, fb, { source: 'rule', note: '連線 AI 失敗，已改用離線追問。' }); }
      }
      return Object.assign({}, fb, { source: 'rule' });
    },
    /* 關鍵要素覆蓋（即時回饋用；僅供自評參考，非評分） */
    coverage(text, keywords) {
      if (!keywords) return null;
      const hits = keywords.map(g => has(text || '', g));
      const n = hits.filter(Boolean).length;
      return { hits, ratio: n / keywords.length, level: n / keywords.length >= .8 ? '達成' : n / keywords.length >= .4 ? '發展中' : '待支持' };
    }
  };
  window.Tutor = Tutor;
})();
