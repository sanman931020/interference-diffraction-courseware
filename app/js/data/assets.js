/* 素材庫（依 07A 素材清單）：kind real=實拍證據、model=模型示意、figure=示意圖／題圖 */
(function () {
  const W = 'https://commons.wikimedia.org/wiki/File:';
  const list = [
    // 第2節
    { id: 'bench_kit', kind: 'real', lesson: 2, title: '光凳器材組', src: 'assets/img/bench_kit.jpg', author: 'Waifer X／Cuesta College', license: 'CC BY 2.0', url: W + 'Optical_Bench_educational_Kit_-_Cuesta_College.jpg', use: '第2節實驗前器材辨認；不宣稱照片為本次實驗組。' },
    { id: 'bench_setup', kind: 'real', lesson: 2, title: '光凳實際架設', src: 'assets/img/bench_setup.jpg', author: "Cantons-de-l'Est", license: 'CC BY-SA 4.0', url: W + 'Banc_optique_-_exemple_de_montage_01.jpg', use: '第2、3節實驗前建立空間配置概念。' },
    { id: 'doubleslit_red', kind: 'real', lesson: 2, title: '雙狹縫干涉　紅光實拍（632.8 nm）', src: 'assets/img/doubleslit_red.jpg', author: 'Bryan Tong Minh', license: 'Public Domain', url: W + 'Subwavelength_slits.JPG', use: '第2節觀察主要證據；先於理想模型呈現。' },
    // 第3節
    { id: 'singleslit_blue', kind: 'real', lesson: 3, title: '單狹縫繞射　藍光雷射實拍', src: 'assets/img/singleslit_blue.jpg', author: 'Xyqorophibian', license: 'CC BY-SA 4.0', url: W + 'Blue_laser_single_slit_diffraction_photo.jpg', use: '第3節觀察主要證據；與理想圖樣並列比較。' },
    { id: 'slit_adjustable', kind: 'real', lesson: 3, title: '可調式單狹縫器', src: 'assets/img/slit_adjustable.jpg', author: 'Jan Krieger', license: 'CC BY-SA 3.0', url: W + 'Xy_adjustable_optical_slit.jpg', use: '第3節器材辨認；照片尺度不代表課堂狹縫尺度。' },
    { id: 'cd_rainbow', kind: 'real', lesson: 3, title: '光碟表面的彩虹', src: 'assets/img/cd_rainbow.jpg', author: 'Hapecko', license: 'CC BY-SA 4.0', url: W + 'CD_rainbow.jpg', use: '第3節生活中的繞射；不歸為薄膜干涉。' },
    { id: 'ar_lens', kind: 'real', lesson: 3, title: '一般鏡片與抗反射鏡片', src: 'assets/img/ar_lens.jpg', author: 'Maximilian Schönherr', license: 'CC0', url: W + 'Reflective_and_anti-reflective_lens.jpg', use: '薄膜干涉科技應用補充。' },
    { id: 'oil_film', kind: 'real', lesson: 3, title: '水面油膜', src: 'assets/img/oil_film.jpg', author: 'gambier20', license: 'CC BY 2.0', url: W + 'Rainbow_Pollution.jpg', use: '薄膜干涉生活情境；連結上下界面反射光。' },
    { id: 'soap_bubble', kind: 'real', lesson: 3, title: '肥皂泡薄膜干涉', src: 'assets/img/soap_bubble.jpg', author: 'Pksois23', license: 'CC BY-SA 4.0', url: W + 'Thin_Film_Interference_Soap_Bubble.jpg', use: '薄膜干涉生活情境。' },
    { id: 'soap_film', kind: 'real', lesson: 3, title: '肥皂膜薄膜干涉', src: 'assets/img/soap_film.jpg', author: 'Yaroslav Ulyushin', license: 'CC BY 4.0', url: W + '%D0%98%D0%BD%D1%82%D0%B5%D1%80%D1%84%D0%B5%D1%80%D0%B5%D0%BD%D1%86%D0%B8%D1%8F_%D0%B2_%D1%82%D0%BE%D0%BD%D0%BA%D0%BE%D0%B9_%D0%BC%D1%8B%D0%BB%D1%8C%D0%BD%D0%BE%D0%B9_%D0%BF%D0%BB%D1%91%D0%BD%D0%BA%D0%B5.jpg', use: '薄膜厚度不均與色彩分布的定性觀察。' },
    // 延伸
    { id: 'peacock', kind: 'real', lesson: 5, title: '孔雀羽毛（結構色）', src: 'assets/img/peacock.jpg', author: 'Bernard Spragg. NZ', license: 'CC0', url: W + 'Peacock_feathers._(20779300743).jpg', use: '結構色延伸；避免只以顏料或單一機制解釋。' },
    { id: 'morpho', kind: 'real', lesson: 5, title: '藍閃蝶（結構色）', src: 'assets/img/morpho.jpg', author: 'Alias 0591（Rene Mensen）', license: 'CC BY 2.0', url: W + 'Blue_Morpho_butterfly_(Morpho_peleides)_wings_open.jpg', use: '結構色延伸；可能同時涉及干涉、繞射與散射。' },
    { id: 'hubble_spikes', kind: 'real', lesson: 5, title: '望遠鏡影像的繞射尖峰', src: 'assets/img/hubble_spikes.jpg', author: 'ESA/Hubble & NASA', license: 'CC BY 4.0', url: W + 'A_slice_of_Sagittarius.jpg', use: '繞射科技情境；尖峰不是恆星真實外形。' },
    { id: 'newton_rings', kind: 'real', lesson: 5, title: '牛頓環', src: 'assets/img/newton_rings.jpg', author: 'Ulfbastel', license: 'Public Domain', url: W + 'Newton_rings.jpg', use: '薄膜（空氣膜）干涉延伸現象。' },
    // 本教材自製（07B）
    { id: 'pulse_compare', kind: 'model', lesson: 1, title: '兩種完全重疊的比較', src: 'assets/img/doc/pulse_compare.png', author: '本教材自製（07B 圖片需求腳本）', license: '本教材自製', use: '第1節疊加原理說明與學生修訂預測。同向等大脈衝完全重疊時位移相加而增強；等大反向時完全重疊當下位移相消為 0；適用於理想線性介質，相消後兩脈衝仍各自傳播。' },
    { id: 'rope_ui_sketch', kind: 'figure', lesson: 1, title: '繩波疊加模擬介面草圖', src: 'assets/img/doc/rope_ui_sketch.png', author: '本教材自製（07B 模擬需求腳本）', license: '本教材自製', use: '教師端：模擬規格參照。' },
    { id: 'act01_sketch', kind: 'figure', lesson: 2, title: 'ACT01 畫面草圖', src: 'assets/img/doc/act01_sketch.png', author: '本教材自製（08 數位教材整合規劃表）', license: '本教材自製', use: '教師端：互動頁規格參照。' }
  ];
  for (let i = 1; i <= 5; i++) list.push({ id: 'storyboard_0' + i, kind: 'model', lesson: 1, title: '動畫分鏡 0' + i, src: `assets/img/doc/storyboard_0${i}.png`, author: '本教材自製（07B 動畫需求腳本）', license: '本教材自製', use: '動畫靜態備援。' });

  const map = Object.fromEntries(list.map(a => [a.id, a]));
  window.ASSETS = {
    list,
    get: id => map[id],
    caption(a) {
      const tag = a.kind === 'real' ? '實拍' : a.kind === 'model' ? '模型示意' : '示意圖';
      const src = a.url ? `<a href="${a.url}" target="_blank" rel="noopener">來源頁</a>` : '';
      return `【${tag}】${UI.esc(a.title)}｜${UI.esc(a.author)}｜${UI.esc(a.license)} ${src}`;
    }
  };
})();
