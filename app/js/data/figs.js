/* 本教材自製 SVG 圖（題圖、示意圖、模型圖）；顏色使用 CSS 變數以支援深色模式 */
(function () {
  const T = 'var(--text)', M = 'var(--muted)', A = 'var(--accent)', A2 = 'var(--accent-2)', L = 'var(--line)';
  const txt = (x, y, s, o = {}) => `<text x="${x}" y="${y}" fill="${o.fill || T}" font-size="${o.size || 14}" text-anchor="${o.anchor || 'middle'}" font-weight="${o.w || 400}">${s}</text>`;
  const pulsePath = (cx, w, hgt, base, sx = 1) => {
    let d = ''; for (let i = -1; i <= 1.0001; i += .05) { const x = cx + i * w / 2; const y = base - hgt * (Math.cos(Math.PI * i) + 1) / 2; d += (d ? 'L' : 'M') + (x * sx).toFixed(1) + ' ' + y.toFixed(1); }
    return d;
  };
  const sine = (x0, x1, base, amp, per, ph = 0) => { let d = ''; for (let x = x0; x <= x1; x += 2) { const y = base - amp * Math.sin((x - x0) / per * 2 * Math.PI + ph); d += (d ? 'L' : 'M') + x + ' ' + y.toFixed(1); } return d; };
  const svg = (w, h, body, label) => `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label || ''}" style="font-family:inherit">${body}</svg>`;
  const modelTag = (x, y, s = '模型示意｜非實拍') => `<g><rect x="${x}" y="${y - 13}" width="${s.length * 12 + 14}" height="20" rx="10" fill="var(--model)" opacity=".14"/>${txt(x + 7, y + 1, s, { anchor: 'start', size: 11, fill: 'var(--model)', w: 700 })}</g>`;

  const F = {};
  F.pulseMeet = () => svg(600, 170, `
    <line x1="20" y1="120" x2="580" y2="120" stroke="${M}" stroke-dasharray="4 4"/>
    <path d="${pulsePath(150, 120, 60, 120)}" fill="none" stroke="${T}" stroke-width="3"/>
    <path d="${pulsePath(450, 120, 60, 120)}" fill="none" stroke="${T}" stroke-width="3" stroke-dasharray="8 5"/>
    ${txt(150, 40, 'A →', { w: 700 })}${txt(450, 40, '← B', { w: 700 })}
    <line x1="300" y1="20" x2="300" y2="150" stroke="${M}" stroke-dasharray="2 4"/>${txt(312, 160, 'P', { anchor: 'start' })}
    ${modelTag(20, 160, '題圖｜相遇前')}`, '兩個脈衝相遇前');

  F.pulseOpp = () => svg(600, 200, `
    <line x1="20" y1="100" x2="580" y2="100" stroke="${M}" stroke-dasharray="4 4"/>
    <path d="${pulsePath(150, 120, 55, 100)}" fill="none" stroke="${T}" stroke-width="3"/>
    <path d="${pulsePath(450, 120, -55, 100)}" fill="none" stroke="${T}" stroke-width="3" stroke-dasharray="8 5"/>
    ${txt(150, 30, '+1　→', { w: 700 })}${txt(450, 180, '←　−1', { w: 700 })}
    ${modelTag(20, 192, '題圖')}`, '一上一下兩個脈衝');

  F.pulseTimeline = () => svg(600, 170, `
    <line x1="20" y1="100" x2="580" y2="100" stroke="${M}" stroke-dasharray="4 4"/>
    <path d="${pulsePath(130, 110, 40, 100)}" fill="none" stroke="${T}" stroke-width="3"/>
    <path d="${pulsePath(470, 110, -60, 100)}" fill="none" stroke="${T}" stroke-width="3" stroke-dasharray="8 5"/>
    ${txt(130, 40, 'A（+1）→', { w: 700 })}${txt(470, 185 - 20, '← B（−1.5）', { w: 700 })}
    <line x1="300" y1="20" x2="300" y2="150" stroke="${A}" stroke-dasharray="3 4"/>${txt(312, 30, 'P', { anchor: 'start', fill: A, w: 700 })}`, '脈衝 A 與 B');

  F.pulseTimeline2 = () => svg(600, 150, `
    <line x1="20" y1="95" x2="580" y2="95" stroke="${M}" stroke-dasharray="4 4"/>
    ${[0, 25, 50, 75, 100].map(p => `<line x1="${20 + p * 5.6}" y1="95" x2="${20 + p * 5.6}" y2="102" stroke="${M}"/>${txt(20 + p * 5.6, 120, p + '%', { size: 12, fill: M })}`).join('')}
    <path d="${pulsePath(160, 112, 45, 95)}" fill="none" stroke="${T}" stroke-width="3"/>
    <path d="${pulsePath(440, 112, 45, 95)}" fill="none" stroke="${T}" stroke-width="3" stroke-dasharray="8 5"/>
    ${txt(160, 35, 'A →', { w: 700 })}${txt(440, 35, '← B', { w: 700 })}
    <line x1="300" y1="20" x2="300" y2="132" stroke="${A}" stroke-dasharray="3 4"/>${txt(310, 142, 'P', { anchor: 'start', fill: A, w: 700 })}`, '脈衝時間軸');

  F.pointsXY = () => svg(600, 230, `
    ${['X', 'Y'].map((n, k) => { const b = 60 + k * 105; const amp = k ? 4 : 40;
      return `<line x1="60" y1="${b}" x2="580" y2="${b}" stroke="${L}"/><line x1="60" y1="${b - 48}" x2="60" y2="${b + 48}" stroke="${M}"/>
      ${txt(30, b + 5, n, { w: 800, size: 18 })}<line x1="56" y1="${b - 40}" x2="580" y2="${b - 40}" stroke="${L}" stroke-dasharray="3 5"/><line x1="56" y1="${b + 40}" x2="580" y2="${b + 40}" stroke="${L}" stroke-dasharray="3 5"/>${txt(52, b - 36, '+2', { size: 10, fill: M, anchor: 'end' })}${txt(52, b + 44, '−2', { size: 10, fill: M, anchor: 'end' })}
      <path d="${sine(60, 580, b, amp, 130)}" fill="none" stroke="${k ? A2 : A}" stroke-width="2.5"/>`; }).join('')}
    ${txt(570, 222, '時間 →', { anchor: 'end', size: 12, fill: M })}`, 'X Y 兩點位移紀錄');

  F.probes3 = () => svg(600, 300, `
    ${['P', 'Q', 'R'].map((n, k) => { const b = 50 + k * 95; const amp = [36, 3, 30][k];
      return `<line x1="60" y1="${b}" x2="580" y2="${b}" stroke="${L}"/><line x1="60" y1="${b - 42}" x2="60" y2="${b + 42}" stroke="${M}"/>
      ${txt(30, b + 5, n, { w: 800, size: 18 })}<path d="${sine(60, 580, b, amp, 260, k * .8)}" fill="none" stroke="${A}" stroke-width="2.5"/>`; }).join('')}
    ${txt(570, 296, '時間 →（約兩個週期）', { anchor: 'end', size: 12, fill: M })}`, '三點位移紀錄');

  F.bdModel = (o = {}) => svg(560, 330, `
    <rect x="0" y="0" width="560" height="330" rx="14" fill="var(--surface-2)"/>
    <line x1="120" y1="30" x2="120" y2="300" stroke="${T}" stroke-width="7"/>
    <rect x="114" y="118" width="12" height="16" fill="var(--surface-2)"/><rect x="114" y="196" width="12" height="16" fill="var(--surface-2)"/>
    ${txt(96, 132, 'S₁', { w: 700 })}${txt(96, 210, 'S₂', { w: 700 })}
    <line x1="470" y1="30" x2="470" y2="300" stroke="${T}" stroke-width="4"/>
    ${txt(120, 22, '雙狹縫', { size: 13 })}${txt(470, 22, '屏幕', { size: 13 })}
    <line x1="126" y1="126" x2="470" y2="166" stroke="${T}" stroke-width="2"/><line x1="126" y1="204" x2="470" y2="166" stroke="${T}" stroke-width="2"/>
    <line x1="126" y1="126" x2="470" y2="255" stroke="${T}" stroke-width="1.6" stroke-dasharray="7 5"/><line x1="126" y1="204" x2="470" y2="255" stroke="${T}" stroke-width="1.6" stroke-dasharray="7 5"/>
    <circle cx="470" cy="166" r="8" fill="${T}"/><circle cx="470" cy="255" r="8" fill="${T}"/>
    ${txt(492, 172, 'B', { w: 800, size: 20 })}${txt(492, 261, 'D', { w: 800, size: 20 })}
    ${txt(24, 318, '路徑示意　非實拍　未依比例', { anchor: 'start', size: 12, fill: M })}`, 'B 亮紋與 D 暗紋路徑示意');

  F.huygens = () => svg(560, 300, `
    <rect width="560" height="300" rx="14" fill="var(--surface-2)"/>
    ${[0, 1, 2, 3].map(i => `<line x1="${40 + i * 40}" y1="30" x2="${40 + i * 40}" y2="270" stroke="${A}" stroke-width="2" opacity="${.35 + i * .15}"/>`).join('')}
    ${txt(100, 22, '入射平面波（波前）', { size: 12, fill: M })}
    <line x1="240" y1="20" x2="240" y2="280" stroke="${T}" stroke-width="7"/>
    <rect x="234" y="104" width="12" height="14" fill="var(--surface-2)"/><rect x="234" y="182" width="12" height="14" fill="var(--surface-2)"/>
    ${[1, 2, 3, 4].map(r => `<path d="M240 ${111 - r * 34} A ${r * 34} ${r * 34} 0 0 1 240 ${111 + r * 34}" fill="none" stroke="${A2}" stroke-width="2" opacity="${1 - r * .17}"/>
    <path d="M240 ${189 - r * 34} A ${r * 34} ${r * 34} 0 0 1 240 ${189 + r * 34}" fill="none" stroke="${A}" stroke-width="2" opacity="${1 - r * .17}"/>`).join('')}
    <circle cx="240" cy="111" r="5" fill="${A2}"/><circle cx="240" cy="189" r="5" fill="${A}"/>
    ${txt(400, 40, '每條窄縫 ≈ 一個次波源', { size: 13, w: 700 })}${txt(400, 60, '兩縫由同一入射波驅動 → 相干', { size: 12, fill: M })}
    ${modelTag(14, 290)}`, '惠更斯原理示意');

  F.setupDS = () => svg(600, 170, `
    <rect width="600" height="170" rx="14" fill="var(--surface-2)"/>
    <line x1="30" y1="130" x2="570" y2="130" stroke="${M}" stroke-width="3"/>
    <rect x="50" y="88" width="70" height="30" rx="6" fill="${T}"/>${txt(85, 152, '雷射（教師操作）', { size: 12 })}
    <rect x="230" y="60" width="10" height="70" rx="2" fill="${T}"/>${txt(235, 152, '雙狹縫片', { size: 12 })}
    <rect x="520" y="30" width="12" height="100" rx="2" fill="${T}"/>${txt(526, 152, '屏幕', { size: 12 })}
    ${txt(380, 50, '只標器材位置，不畫光路', { size: 12, fill: M })}${modelTag(14, 22, '空間位置示意')}`, '雙狹縫實驗架設');
  F.setupSS = () => F.setupDS().replace('雙狹縫片', '單狹縫片').replace('雙狹縫實驗架設', '單狹縫實驗架設');

  F.dsPredict = () => svg(600, 200, `
    <rect width="600" height="200" rx="14" fill="var(--surface-2)"/>
    <rect x="40" y="88" width="70" height="26" rx="6" fill="${T}"/>${txt(75, 135, '紅色雷射', { size: 12 })}
    <line x1="230" y1="25" x2="230" y2="175" stroke="${T}" stroke-width="7"/>
    <rect x="224" y="84" width="12" height="8" fill="var(--surface-2)"/><rect x="224" y="110" width="12" height="8" fill="var(--surface-2)"/>
    ${txt(230, 192, '雙狹縫', { size: 12 })}
    <rect x="500" y="20" width="60" height="160" rx="4" fill="var(--surface)" stroke="${T}" stroke-dasharray="6 4"/>
    ${txt(530, 104, '?', { size: 40, w: 800, fill: A })}${txt(530, 196, '屏幕（請預測）', { size: 12 })}`, '雙狹縫預測題圖');

  F.waterAB = () => svg(560, 300, `
    <rect width="560" height="300" rx="14" fill="var(--surface-2)"/>
    ${[1, 2, 3, 4, 5, 6, 7].map(r => `<circle cx="210" cy="250" r="${r * 30}" fill="none" stroke="${A}" opacity=".3"/><circle cx="350" cy="250" r="${r * 30}" fill="none" stroke="${A2}" opacity=".3"/>`).join('')}
    <circle cx="210" cy="250" r="7" fill="${A}"/><circle cx="350" cy="250" r="7" fill="${A2}"/>
    ${txt(210, 280, 'S₁', { w: 700 })}${txt(350, 280, 'S₂', { w: 700 })}
    <circle cx="280" cy="80" r="9" fill="${T}"/>${txt(298, 85, 'A', { anchor: 'start', w: 800, size: 18 })}
    <circle cx="400" cy="110" r="9" fill="none" stroke="${T}" stroke-width="3"/>${txt(418, 115, 'B', { anchor: 'start', w: 800, size: 18 })}
    ${txt(20, 26, 'A 到兩波源距離相等；B 到兩波源距離相差半個波長', { anchor: 'start', size: 12, fill: M })}${modelTag(14, 292, '題圖｜俯視示意')}`, '雙點波源 A B 點');

  F.subsources = () => svg(600, 260, `
    <rect width="600" height="260" rx="14" fill="var(--surface-2)"/>
    ${txt(150, 28, '雙狹縫：兩個分立次波源', { w: 700, size: 14 })}${txt(450, 28, '單狹縫：縫內連續分布的次波源', { w: 700, size: 14 })}
    <line x1="150" y1="50" x2="150" y2="230" stroke="${T}" stroke-width="7"/>
    <rect x="144" y="105" width="12" height="12" fill="var(--surface-2)"/><rect x="144" y="163" width="12" height="12" fill="var(--surface-2)"/>
    <circle cx="150" cy="111" r="6" fill="${A}"/><circle cx="150" cy="169" r="6" fill="${A}"/>
    ${[1, 2, 3].map(r => `<path d="M150 ${111 - r * 26} A ${r * 26} ${r * 26} 0 0 1 150 ${111 + r * 26}" fill="none" stroke="${A}" opacity=".5"/><path d="M150 ${169 - r * 26} A ${r * 26} ${r * 26} 0 0 1 150 ${169 + r * 26}" fill="none" stroke="${A}" opacity=".5"/>`).join('')}
    <line x1="450" y1="50" x2="450" y2="230" stroke="${T}" stroke-width="7"/>
    <rect x="444" y="105" width="12" height="70" fill="var(--surface-2)"/>
    ${[0, 1, 2, 3, 4, 5, 6].map(i => `<circle cx="450" cy="${110 + i * 10}" r="4" fill="${A2}"/>`).join('')}
    ${[0, 2, 4, 6].map(i => `<line x1="450" y1="${110 + i * 10}" x2="560" y2="${80 + i * 10}" stroke="${A2}" opacity=".6"/>`).join('')}
    ${txt(300, 250, '兩者共同原理：次波疊加', { size: 13, fill: A, w: 700 })}${modelTag(14, 250)}`, '雙狹縫與單狹縫次波源分布');

  F.filmSection = (o = {}) => svg(600, 300, `
    <rect width="600" height="300" rx="14" fill="var(--surface-2)"/>
    <rect x="20" y="140" width="560" height="60" fill="${A2}" opacity=".18"/>
    <line x1="20" y1="140" x2="580" y2="140" stroke="${T}" stroke-width="2"/><line x1="20" y1="200" x2="580" y2="200" stroke="${T}" stroke-width="2"/>
    ${txt(570, 132, '空氣', { anchor: 'end', size: 12, fill: M })}${txt(570, 176, '薄膜', { anchor: 'end', size: 12, fill: M })}${txt(570, 222, '空氣（或水）', { anchor: 'end', size: 12, fill: M })}
    <line x1="120" y1="30" x2="230" y2="140" stroke="#eab308" stroke-width="4"/>${txt(110, 26, '白光', { size: 13, w: 700 })}
    <g data-ray="r1" class="ray"><line x1="230" y1="140" x2="330" y2="40" stroke="${A}" stroke-width="4"/>${txt(345, 40, '①', { size: 18, w: 800, fill: A })}</g>
    <g data-ray="r2" class="ray"><polyline points="230,140 270,200 310,140 410,40" fill="none" stroke="var(--model)" stroke-width="4"/>${txt(425, 40, '②', { size: 18, w: 800, fill: 'var(--model)' })}</g>
    <g data-ray="r3" class="ray"><polyline points="270,200 300,280" fill="none" stroke="${M}" stroke-width="3" stroke-dasharray="6 4"/>${txt(318, 284, '③', { size: 18, w: 800, fill: M })}</g>
    <g data-ray="r4" class="ray"><circle cx="470" cy="170" r="10" fill="#f97316" opacity=".7"/>${txt(495, 176, '④', { size: 18, w: 800, fill: '#f97316' })}</g>
    ${modelTag(14, 290, '剖面示意｜未依比例')}`, '薄膜剖面');

  F.curves = () => {
    const W = 520, x0 = 40;
    const ss = []; const ds = [];
    for (let i = 0; i <= 260; i++) {
      const u = (i - 130) / 130 * 3.2 * Math.PI; const s = Math.abs(u) < 1e-6 ? 1 : Math.sin(u) / u;
      ss.push([x0 + i * 2, 120 - 85 * s * s]);
      const v = (i - 130) / 130 * 3.2 * Math.PI; const env = (() => { const w = v / 4; return Math.abs(w) < 1e-6 ? 1 : (Math.sin(w) / w) ** 2; })();
      ds.push([x0 + i * 2, 260 - 85 * Math.cos(v * 1.1) ** 2 * env]);
    }
    const p = a => 'M' + a.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L');
    return svg(600, 290, `
      <line x1="${x0}" y1="120" x2="${x0 + W}" y2="120" stroke="${L}"/><line x1="${x0}" y1="260" x2="${x0 + W}" y2="260" stroke="${L}"/>
      <path d="${p(ss)}" fill="none" stroke="${A}" stroke-width="2.5"/><path d="${p(ds)}" fill="none" stroke="${A2}" stroke-width="2.5"/>
      ${txt(20, 70, '甲', { w: 800, size: 18 })}${txt(20, 210, '乙', { w: 800, size: 18 })}
      ${txt(580, 140, '屏幕位置 →', { anchor: 'end', size: 11, fill: M })}${modelTag(400, 22, '理想模型｜非實拍')}`, '兩條光強度曲線');
  };

  F.threeImages = () => {
    const a = ASSETS.get('doubleslit_red');
    return `<div class="grid g3" style="align-items:end">
      <div><div class="media"><img src="${a.src}" alt="圖甲"></div><div class="caption">圖甲：紅光雙狹縫屏幕照片</div></div>
      <div>${svg(240, 160, `<rect width="240" height="160" rx="10" fill="var(--surface-2)"/><line x1="40" y1="10" x2="40" y2="150" stroke="${T}" stroke-width="5"/>${[1, 2, 3, 4].map(r => `<path d="M40 ${60 - r * 22} A ${r * 22} ${r * 22} 0 0 1 40 ${60 + r * 22}" fill="none" stroke="${A}" opacity=".6"/><path d="M40 ${100 - r * 22} A ${r * 22} ${r * 22} 0 0 1 40 ${100 + r * 22}" fill="none" stroke="${A2}" opacity=".6"/>`).join('')}`)}<div class="caption">圖乙：兩縫發出的圓弧波前</div></div>
      <div>${svg(240, 160, `<rect width="240" height="160" rx="10" fill="var(--surface-2)"/><path d="${(() => { let d = ''; for (let i = 0; i <= 220; i++) { const v = (i - 110) / 110 * 9; const y = 140 - 110 * Math.cos(v) ** 2 * Math.exp(-(v * v) / 60); d += (d ? 'L' : 'M') + (10 + i) + ' ' + y.toFixed(1); } return d; })()}" fill="none" stroke="${A}" stroke-width="2"/>`)}<div class="caption">圖丙：理想光強度曲線</div></div></div>`;
  };

  F.doubleSlitPhoto = () => { const a = ASSETS.get('doubleslit_red'); return `<div class="media"><img src="${a.src}" alt="${a.title}"></div><div class="caption">${ASSETS.caption(a)}</div>`; };
  F.singleSlitPhoto = () => { const a = ASSETS.get('singleslit_blue'); return `<div class="media"><img src="${a.src}" alt="${a.title}"></div><div class="caption">${ASSETS.caption(a)}</div>`; };

  F.cover = () => {
    let waves = '';
    for (let k = 0; k < 7; k++) waves += `<path d="${sine(0, 900, 60 + k * 26, 14 - k, 120 + k * 8, k)}" fill="none" stroke="hsl(${250 - k * 30} 90% 65%)" stroke-width="2" opacity=".75"/>`;
    return svg(900, 260, waves, '');
  };

  window.FIGS = { get: (k, o) => (F[k] ? F[k](o) : ''), raw: F };
})();
