/* ガチャモン — キャラクターのイラスト（すべてオリジナルの手描きSVG）
 *
 * ART['マシンID.キャラID'] = (u) => SVGの中身
 *   u … グラデーションなどのIDがぶつからないための一意な文字列
 * 座標は 0〜100 の正方形。足もとが y=92 くらい。
 */
'use strict';

const Art = (() => {
  const O = '#4a3a4f'; // 線の色
  const S = (w = 2.4, c = O) => `stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const N = 'fill="none"';

  /* ---------- 小さな部品（顔など） ---------- */
  const eye = (x, y, r = 4.4) => `<ellipse cx="${x}" cy="${y}" rx="${(r * 0.82).toFixed(2)}" ry="${r}" fill="${O}"/>`
    + `<circle cx="${(x - r * 0.28).toFixed(2)}" cy="${(y - r * 0.42).toFixed(2)}" r="${(r * 0.36).toFixed(2)}" fill="#fff"/>`
    + `<circle cx="${(x + r * 0.3).toFixed(2)}" cy="${(y + r * 0.38).toFixed(2)}" r="${(r * 0.16).toFixed(2)}" fill="#fff"/>`;
  const dot = (x, y, r = 2.5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${O}"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.4}" r="${r * 0.32}" fill="#fff"/>`;
  const happy = (x, y, w = 4) => `<path d="M${x - w} ${y + 1.5} Q${x} ${y - 3.5} ${x + w} ${y + 1.5}" ${N} ${S(2.4)}/>`;
  const sleepy = (x, y, w = 4) => `<path d="M${x - w} ${y} Q${x} ${y + 3.5} ${x + w} ${y}" ${N} ${S(2.4)}/>`;
  const cheek = (x, y, c = '#ff8fa3', rx = 4.4, ry = 2.7) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" opacity=".6"/>`;
  const smile = (x, y, w = 3.6) => `<path d="M${x - w} ${y} Q${x} ${y + w} ${x + w} ${y}" ${N} ${S(2.2)}/>`;
  const omega = (x, y, w = 2.6) => `<path d="M${x - 2 * w} ${y} Q${x - w} ${y + w * 1.3} ${x} ${y} Q${x + w} ${y + w * 1.3} ${x + 2 * w} ${y}" ${N} ${S(2.2)}/>`;
  const open = (x, y, w = 4.2, h = 4.6) => `<path d="M${x - w} ${y} Q${x} ${y + h * 1.7} ${x + w} ${y} Z" fill="#e8607a" ${S(2)}/>`;
  const fangs = (x, y) => `<path d="M${x - 3.2} ${y + 0.4} L${x - 2} ${y + 3.4} L${x - 0.8} ${y + 1}Z" fill="#fff" ${S(1.1)}/><path d="M${x + 0.8} ${y + 1} L${x + 2} ${y + 3.4} L${x + 3.2} ${y + 0.4}Z" fill="#fff" ${S(1.1)}/>`;
  const brows = (y, inner = 1) => `<path d="M34 ${y - 2 * inner} L45 ${y + 2 * inner}" ${S(2.6)}/><path d="M66 ${y - 2 * inner} L55 ${y + 2 * inner}" ${S(2.6)}/>`;
  const shadow = (rx = 24) => `<ellipse cx="50" cy="93" rx="${rx}" ry="3.4" fill="#000" opacity=".08"/>`;
  const sparkle = (x, y, s = 4, c = '#fff') => `<path d="M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s}Z" fill="${c}"/>`;
  const star = (x, y, r, fill, w = 1.6) => {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.45 : r;
      d += `${i ? 'L' : 'M'}${(x + Math.cos(a) * rr).toFixed(2)} ${(y + Math.sin(a) * rr).toFixed(2)} `;
    }
    return `<path d="${d}Z" fill="${fill}" ${S(w)}/>`;
  };
  const bow = (x, y, c, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 L-8 -5 L-8 5Z M0 0 L8 -5 L8 5Z" fill="${c}" ${S(1.8 / s)}/><circle r="2.6" fill="${c}" ${S(1.6 / s)}/></g>`;
  const leaf = (x, y, rot, s, c, vein = '#3f7f3a') => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M0 0 C6 -6 6 -16 0 -22 C-6 -16 -6 -6 0 0Z" fill="${c}" ${S(2 / s)}/><path d="M0 -3 L0 -17" ${N} ${S(1.2 / s, vein)}/></g>`;
  const flame = (x, y, s, c1 = '#ff7a3d', c2 = '#ffd23f') => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -14 C5 -9 9 -3 6 3 C4 8 -4 8 -6 3 C-9 -3 -4 -5 0 -14Z" fill="${c1}" ${S(2 / s)}/><path d="M0 -5 C3 -2 4 1 2 4 C1 6 -1 6 -2 4 C-4 1 -2 -1 0 -5Z" fill="${c2}"/></g>`;
  const mir = (svg) => `<g transform="translate(100 0) scale(-1 1)">${svg}</g>`;
  const glow = (u, c, r = 46, cy = 52) => `<defs><radialGradient id="${u}gl"><stop offset="0" stop-color="${c}" stop-opacity=".95"/><stop offset=".6" stop-color="${c}" stop-opacity=".35"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs><circle cx="50" cy="${cy}" r="${r}" fill="url(#${u}gl)"/>`;

  /* ---------- 人の部品（家族） ---------- */
  const SK = '#ffdcc2';
  const body = (w, c, y = 64) => `<path d="M${50 - w} 95 C${50 - w} ${y + 9} ${50 - w * 0.72} ${y} 50 ${y} C${50 + w * 0.72} ${y} ${50 + w} ${y + 9} ${50 + w} 95 Z" fill="${c}" ${S()}/>`;
  const head = (skin = SK, rx = 22, ry = 21, cy = 42) => `<circle cx="${50 - rx + 0.5}" cy="${cy + 3}" r="4" fill="${skin}" ${S(2)}/><circle cx="${50 + rx - 0.5}" cy="${cy + 3}" r="4" fill="${skin}" ${S(2)}/><ellipse cx="50" cy="${cy}" rx="${rx}" ry="${ry}" fill="${skin}" ${S()}/>`;
  const hand = (x, y, skin = SK, r = 4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${skin}" ${S(2)}/>`;
  const roundGlasses = (c = '#2b2b2b', y = 45, r = 6.4) => `<circle cx="41" cy="${y}" r="${r}" fill="#fff" fill-opacity=".25" ${S(2.2, c)}/><circle cx="59" cy="${y}" r="${r}" fill="#fff" fill-opacity=".25" ${S(2.2, c)}/><path d="M${41 + r} ${y - 1} Q50 ${y - 4} ${59 - r} ${y - 1}" ${N} ${S(2, c)}/>`;
  const squareGlasses = (c = '#2b2b2b', y = 45, w = 2.6) => `<rect x="33" y="${y - 5.5}" width="15" height="11" rx="2.5" fill="#fff" fill-opacity=".25" ${S(w, c)}/><rect x="52" y="${y - 5.5}" width="15" height="11" rx="2.5" fill="#fff" fill-opacity=".25" ${S(w, c)}/><path d="M48 ${y - 1} L52 ${y - 1}" ${S(2, c)}/>`;
  const sweat = (x, y) => `<path d="M${x} ${y - 5} C${x + 3} ${y - 1} ${x + 3.5} ${y + 2} ${x} ${y + 3} C${x - 3.5} ${y + 2} ${x - 3} ${y - 1} ${x} ${y - 5}Z" fill="#a8dcff" ${S(1.4)}/>`;
  const halo = (y = 13) => `<ellipse cx="50" cy="${y}" rx="14" ry="4" ${N} ${S(3, '#f5c542')}/><ellipse cx="50" cy="${y}" rx="14" ry="4" ${N} stroke="#fff6c8" stroke-width="1"/>`;
  const angelWings = (c = '#fff') => `<path d="M32 72 C20 60 8 64 8 74 C10 82 22 82 32 80Z" fill="${c}" ${S(2)}/><path d="M14 72 C18 70 22 72 24 74" ${N} ${S(1.4)}/>`;
  const cloud = (y = 90) => `<path d="M14 ${y + 4} C12 ${y - 4} 22 ${y - 8} 28 ${y - 3} C32 ${y - 10} 44 ${y - 10} 48 ${y - 3} C54 ${y - 9} 66 ${y - 9} 70 ${y - 2} C76 ${y - 8} 88 ${y - 4} 86 ${y + 4} Z" fill="#fff" ${S(2)}/>`;

  const A = {};

  /* ================================================================
   * ガチャモン（40体）
   * ================================================================ */

  // No.001 モリリン
  A['pachimon.moririn'] = () => `${shadow()}
    <path d="M70 76 C82 74 90 64 88 52 C79 55 72 64 70 76Z" fill="#7cc96b" ${S()}/>
    <path d="M73 72 C78 67 82 62 85 56" ${N} ${S(1.6, '#4f8f3f')}/>
    <path d="M50 36 C69 36 79 50 79 65 C79 81 67 89 50 89 C33 89 21 81 21 65 C21 50 31 36 50 36Z" fill="#a3dd7f" ${S()}/>
    <ellipse cx="50" cy="74" rx="16" ry="11" fill="#effad7"/>
    <ellipse cx="37" cy="89" rx="7" ry="3.8" fill="#86c868" ${S(2.2)}/><ellipse cx="63" cy="89" rx="7" ry="3.8" fill="#86c868" ${S(2.2)}/>
    <path d="M50 37 C50 30 51 25 53 21" ${N} ${S(2.6, '#4f8f3f')}/>
    <path d="M52 23 C45 14 35 15 32 21 C38 27 46 28 52 23Z" fill="#8fd16f" ${S(2.2)}/>
    <path d="M53 22 C58 12 68 12 71 17 C66 24 58 26 53 22Z" fill="#8fd16f" ${S(2.2)}/>
    ${eye(40, 59)}${eye(60, 59)}${cheek(31, 66)}${cheek(69, 66)}${smile(50, 66, 3.4)}`;

  // No.002 モリモリン
  A['pachimon.morimorin'] = () => `${shadow(26)}
    <path d="M72 80 C90 80 96 62 90 46 C80 52 72 62 72 80Z" fill="#5fb85a" ${S()}/>
    <path d="M76 76 C82 68 86 60 88 52" ${N} ${S(1.4, '#3f7f3a')}/>
    <path d="M31 42 C16 38 8 26 10 14 C22 16 32 26 35 37Z" fill="#6cc46a" ${S()}/>
    <path d="M30 37 C22 32 16 26 13 18" ${N} ${S(1.4, '#3f7f3a')}/>
    ${mir(`<path d="M31 42 C16 38 8 26 10 14 C22 16 32 26 35 37Z" fill="#6cc46a" ${S()}/><path d="M30 37 C22 32 16 26 13 18" ${N} ${S(1.4, '#3f7f3a')}/>`)}
    <path d="M50 26 C66 26 74 38 74 52 C74 60 80 66 80 76 C80 86 68 91 50 91 C32 91 20 86 20 76 C20 66 26 60 26 52 C26 38 34 26 50 26Z" fill="#7fcf6e" ${S()}/>
    <path d="M50 62 C60 62 68 70 68 78 C68 85 60 88 50 88 C40 88 32 85 32 78 C32 70 40 62 50 62Z" fill="#e2f5c4"/>
    <path d="M42 30 Q50 36 58 30" ${N} ${S(1.6, '#4f9a45')}/>
    <path d="M50 27 L50 18" ${N} ${S(2.6, '#4f8f3f')}/>
    ${leaf(50, 22, -60, 0.45, '#8fd16f')}${leaf(50, 22, 60, 0.45, '#8fd16f')}
    <path d="M50 6 C57 8 58 16 50 19 C42 16 43 8 50 6Z" fill="#ff9ec4" ${S(2)}/>
    <path d="M50 8 L50 17" ${N} ${S(1.2, '#e06a9a')}/>
    <ellipse cx="36" cy="90" rx="8" ry="4" fill="#5fb85a" ${S(2.2)}/><ellipse cx="64" cy="90" rx="8" ry="4" fill="#5fb85a" ${S(2.2)}/>
    ${eye(40, 47, 4.6)}${eye(60, 47, 4.6)}${cheek(30, 54)}${cheek(70, 54)}${open(50, 54, 4, 4)}`;

  // No.003 モリキング
  A['pachimon.morikingu'] = () => {
    let mane = '';
    [-170, -140, -110, -70, -40, -10, 160, 20].forEach((a, i) => {
      const r = (a * Math.PI) / 180;
      mane += leaf(50 + Math.cos(r) * 24, 46 + Math.sin(r) * 22, a + 90, 0.95, i % 2 ? '#3f9a4e' : '#56b25c');
    });
    let crown = '';
    for (let i = 0; i < 5; i++) {
      const a = (i * 72 - 90) * (Math.PI / 180);
      crown += `<ellipse cx="${(50 + Math.cos(a) * 5).toFixed(1)}" cy="${(18 + Math.sin(a) * 5).toFixed(1)}" rx="4.4" ry="4.4" fill="#ff8fb8" ${S(1.6)}/>`;
    }
    return `${shadow(32)}${mane}
    <path d="M50 24 C72 24 84 40 84 58 C84 80 70 92 50 92 C30 92 16 80 16 58 C16 40 28 24 50 24Z" fill="#3fa55a" ${S()}/>
    <ellipse cx="50" cy="74" rx="20" ry="14" fill="#d6efb0"/>
    <path d="M40 70 Q50 74 60 70 M38 78 Q50 82 62 78" ${N} ${S(1.4, '#9cc77a')}/>
    <ellipse cx="50" cy="50" rx="22" ry="16" fill="#6fc46f"/>
    ${crown}<circle cx="50" cy="18" r="3.4" fill="#ffd23f" ${S(1.6)}/>
    <path d="M24 88 C24 80 34 80 36 88Z" fill="#2f8a44" ${S(2.2)}/><path d="M64 88 C66 80 76 80 76 88Z" fill="#2f8a44" ${S(2.2)}/>
    <path d="M26 88 L26 92 M30 88 L30 92 M34 88 L34 92 M66 88 L66 92 M70 88 L70 92 M74 88 L74 92" ${S(1.6)}/>
    ${eye(41, 50, 4.2)}${eye(59, 50, 4.2)}${brows(42, 1)}${smile(50, 58, 4)}${fangs(50, 58)}`;
  };

  // No.004 ヒノコッコ
  A['pachimon.hinokokko'] = () => `${shadow()}
    ${flame(80, 62, 1.1)}
    <ellipse cx="50" cy="64" rx="27" ry="25" fill="#ffa25c" ${S()}/>
    <ellipse cx="50" cy="73" rx="15" ry="11" fill="#ffe6c4"/>
    <path d="M24 62 C15 60 13 70 20 74 C24 74 26 70 26 67Z" fill="#ff8a45" ${S(2)}/>
    ${mir(`<path d="M24 62 C15 60 13 70 20 74 C24 74 26 70 26 67Z" fill="#ff8a45" ${S(2)}/>`)}
    <path d="M43 42 C41 33 45 29 47 24 C49 30 51 30 53 25 C56 31 58 35 57 42Z" fill="#ff6a3a" ${S(2)}/>
    <path d="M47 41 C46 36 48 33 49 31 C50 34 52 35 53 41Z" fill="#ffd23f"/>
    <path d="M45 63 L55 63 L50 69Z" fill="#ffcf4a" ${S(1.8)}/>
    ${eye(40, 56, 4.2)}${eye(60, 56, 4.2)}${cheek(31, 64, '#ff6b6b')}${cheek(69, 64, '#ff6b6b')}
    <path d="M40 88 L35 92 M40 88 L40 93 M40 88 L45 92 M60 88 L55 92 M60 88 L60 93 M60 88 L65 92" ${S(2.2, '#d9772e')}/>`;

  // No.005 ボウボウマル
  A['pachimon.bouboumaru'] = () => `${shadow(26)}
    <path d="M70 76 C86 78 94 66 90 52 C84 58 78 58 74 56 C78 64 74 70 68 70Z" fill="#c8662e" ${S()}/>
    ${flame(88, 48, 0.9)}
    <circle cx="32" cy="35" r="8" fill="#9a4a22" ${S()}/><circle cx="32" cy="35" r="3.8" fill="#ffcf9a"/>
    <circle cx="68" cy="35" r="8" fill="#9a4a22" ${S()}/><circle cx="68" cy="35" r="3.8" fill="#ffcf9a"/>
    <path d="M50 30 C70 30 80 44 80 60 C80 80 68 90 50 90 C32 90 20 80 20 60 C20 44 30 30 50 30Z" fill="#ff8a45" ${S()}/>
    <ellipse cx="50" cy="76" rx="15" ry="11" fill="#fff0d6"/>
    <path d="M27 52 C31 44 44 45 46 53 C44 60 33 61 27 52Z" fill="#9a4a22"/>
    <path d="M73 52 C69 44 56 45 54 53 C56 60 67 61 73 52Z" fill="#9a4a22"/>
    ${flame(50, 30, 1.05, '#ff5a2e')}
    ${eye(38, 53, 3.8)}${eye(62, 53, 3.8)}
    <ellipse cx="50" cy="61" rx="3.2" ry="2.3" fill="${O}"/>${omega(50, 64, 2.4)}
    <ellipse cx="38" cy="90" rx="7" ry="3.6" fill="#9a4a22" ${S(2)}/><ellipse cx="62" cy="90" rx="7" ry="3.6" fill="#9a4a22" ${S(2)}/>`;

  // No.006 ゴウエンオー
  A['pachimon.gouenou'] = (u) => `${shadow(32)}
    <path d="M28 56 C12 42 4 28 8 16 C16 24 22 26 30 26 C26 32 26 40 32 46Z" fill="#ffb35c" ${S()}/>
    <path d="M14 26 C18 32 22 38 28 44" ${N} ${S(1.4, '#d9772e')}/>
    ${mir(`<path d="M28 56 C12 42 4 28 8 16 C16 24 22 26 30 26 C26 32 26 40 32 46Z" fill="#ffb35c" ${S()}/><path d="M14 26 C18 32 22 38 28 44" ${N} ${S(1.4, '#d9772e')}/>`)}
    <path d="M50 6 C55 12 61 11 65 6 C66 14 72 16 78 14 C74 22 79 27 86 29 C79 33 80 41 84 46 C76 46 72 52 70 56 L30 56 C28 52 24 46 16 46 C20 41 21 33 14 29 C21 27 26 22 22 14 C28 16 34 14 35 6 C39 11 45 12 50 6Z" fill="#ff6a3a" ${S()}/>
    <path d="M50 16 C53 20 57 19 60 16 C61 22 66 23 70 23 C67 28 70 32 74 34 C68 37 68 42 70 46 L30 46 C32 42 32 37 26 34 C30 32 33 28 30 23 C34 23 39 22 40 16 C43 19 47 20 50 16Z" fill="#ffb03a"/>
    <path d="M30 54 C30 40 40 30 50 30 C60 30 70 40 70 54 C76 62 80 72 78 82 C76 90 64 92 50 92 C36 92 24 90 22 82 C20 72 24 62 30 54Z" fill="#e8503a" ${S()}/>
    <path d="M50 58 C60 58 66 68 66 78 C66 86 58 90 50 90 C42 90 34 86 34 78 C34 68 40 58 50 58Z" fill="#ffd28a"/>
    <path d="M38 70 Q50 74 62 70 M36 80 Q50 84 64 80" ${N} ${S(1.4, '#e0a85c')}/>
    <path d="M38 34 C34 26 34 19 38 14 C40 20 42 26 44 31Z" fill="#fff3c4" ${S(2)}/>
    ${mir(`<path d="M38 34 C34 26 34 19 38 14 C40 20 42 26 44 31Z" fill="#fff3c4" ${S(2)}/>`)}
    <ellipse cx="50" cy="52" rx="9" ry="5.6" fill="#ff8a6a" ${S(1.6)}/>
    <ellipse cx="47" cy="50.5" rx="1.1" ry="1.4" fill="${O}"/><ellipse cx="53" cy="50.5" rx="1.1" ry="1.4" fill="${O}"/>
    ${eye(41, 43, 3.6)}${eye(59, 43, 3.6)}${brows(36, 1)}${smile(50, 55, 3.4)}${fangs(50, 55)}
    <path d="M26 90 C26 82 36 82 38 90Z" fill="#c43a28" ${S(2.2)}/><path d="M62 90 C64 82 74 82 74 90Z" fill="#c43a28" ${S(2.2)}/>`;

  // No.007 ミズプク
  A['pachimon.mizupuku'] = () => `${shadow(22)}
    <circle cx="78" cy="22" r="5" fill="#e2f6ff" ${S(1.6)}/><circle cx="86" cy="12" r="3" fill="#e2f6ff" ${S(1.4)}/>
    <path d="M24 66 C14 62 12 72 18 76 C22 76 24 72 25 70Z" fill="#8fd4fa" ${S(2)}/>
    ${mir(`<path d="M24 66 C14 62 12 72 18 76 C22 76 24 72 25 70Z" fill="#8fd4fa" ${S(2)}/>`)}
    <path d="M50 16 C58 32 78 46 78 65 C78 81 66 90 50 90 C34 90 22 81 22 65 C22 46 42 32 50 16Z" fill="#6cc4f5" ${S()}/>
    <path d="M33 56 C33 47 39 40 44 37" ${N} stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>
    <ellipse cx="50" cy="77" rx="14" ry="9" fill="#e2f6ff"/>
    ${eye(41, 62, 4.6)}${eye(59, 62, 4.6)}${cheek(32, 69)}${cheek(68, 69)}
    <ellipse cx="50" cy="71" rx="2.6" ry="3" fill="#e8607a" ${S(1.6)}/>`;

  // No.008 ザブザブ
  A['pachimon.zabuzabu'] = () => `${shadow(30)}
    <path d="M86 70 C92 62 98 64 96 70 C98 76 92 80 86 74Z" fill="#3a8fd0" ${S(2)}/>
    <path d="M20 70 C18 50 30 34 48 34 C64 34 74 46 74 60 C74 68 80 72 88 70 C86 82 76 88 62 88 L36 88 C26 88 20 80 20 70Z" fill="#4aa9ea" ${S()}/>
    <path d="M30 76 C34 68 54 66 64 74 C62 84 40 88 30 76Z" fill="#d6f0ff"/>
    <path d="M36 74 C30 80 30 86 36 89 C40 85 42 81 42 77Z" fill="#3a8fd0" ${S(2)}/>
    <path d="M36 37 C38 26 48 22 55 28 C50 28 48 32 50 36Z" fill="#cdeeff" ${S(2)}/>
    <path d="M42 30 C44 27 48 26 50 28" ${N} ${S(1.2, '#7fbde8')}/>
    ${eye(38, 52, 4.2)}${eye(57, 52, 4.2)}
    <ellipse cx="47" cy="60" rx="7.5" ry="4.6" fill="#e8f6ff"/>
    <ellipse cx="47" cy="58" rx="2.6" ry="1.8" fill="${O}"/>
    <path d="M40 60 L32 58 M40 62 L32 63 M54 60 L62 58 M54 62 L62 63" ${S(1.2)}/>
    ${open(47, 62, 2.6, 2.6)}${cheek(31, 58)}${cheek(64, 58)}`;

  // No.009 カイオウザブ
  A['pachimon.kaiouzabu'] = () => `${shadow(34)}
    <path d="M50 18 C46 12 40 8 34 9 M50 18 C54 12 60 8 66 9 M50 18 L50 6" ${N} ${S(3, '#7fd0ff')}/>
    <circle cx="33" cy="9" r="2.2" fill="#bfe9ff"/><circle cx="67" cy="9" r="2.2" fill="#bfe9ff"/><circle cx="50" cy="5" r="2.2" fill="#bfe9ff"/>
    <path d="M14 62 C14 42 32 30 52 30 C72 30 86 44 86 60 C86 78 72 88 52 88 C30 88 14 80 14 62Z" fill="#2f7fd6" ${S()}/>
    <path d="M20 70 C30 84 70 86 82 70 C76 80 62 86 50 86 C38 86 26 80 20 70Z" fill="#cbe9ff" ${S(1.5)}/>
    <path d="M34 78 L34 84 M42 80 L42 86 M50 80 L50 86 M58 80 L58 86 M66 78 L66 84" ${S(1.2, '#7fbde8')}/>
    <path d="M20 66 C8 66 6 76 12 80 C16 76 20 74 24 72Z" fill="#2668b8" ${S(2)}/>
    ${mir(`<path d="M20 66 C8 66 6 76 12 80 C16 76 20 74 24 72Z" fill="#2668b8" ${S(2)}/>`)}
    <path d="M40 30 L42 19 L46 25 L50 16 L54 25 L58 19 L60 30Z" fill="#ffd23f" ${S(2)}/>
    <circle cx="50" cy="26" r="1.8" fill="#ff6b8b"/>
    ${eye(38, 52, 3.8)}${eye(62, 52, 3.8)}${brows(46, 0.8)}
    <path d="M50 64 C44 59 35 61 33 68 C40 65 46 67 50 66 C54 67 60 65 67 68 C65 61 56 59 50 64Z" fill="#fff" ${S(1.8)}/>
    ${smile(50, 69, 3)}`;

  // No.010 ピリッチ
  A['pachimon.piricchi'] = () => `${shadow()}
    <path d="M70 74 L80 65 L76 63 L87 52 L84 60 L89 61 L76 75Z" fill="#ffd23f" ${S(2)}/>
    <circle cx="31" cy="37" r="8.5" fill="#ffd84a" ${S()}/><circle cx="31" cy="37" r="4" fill="#c98a2e"/>
    <circle cx="69" cy="37" r="8.5" fill="#ffd84a" ${S()}/><circle cx="69" cy="37" r="4" fill="#c98a2e"/>
    <path d="M50 32 C70 32 80 46 80 62 C80 80 68 90 50 90 C32 90 20 80 20 62 C20 46 30 32 50 32Z" fill="#ffd84a" ${S()}/>
    <ellipse cx="50" cy="77" rx="15" ry="10" fill="#fff4c2"/>
    <path d="M44 34 L45.5 40 M50 33 L50 39 M56 34 L54.5 40" ${S(2.2, '#d9a400')}/>
    <circle cx="31" cy="64" r="5" fill="#ff9f43"/><path d="M31 60.5 L29.5 64 L32.5 63.6 L31 67.5" ${N} ${S(1.2, '#fff')}/>
    <circle cx="69" cy="64" r="5" fill="#ff9f43"/><path d="M69 60.5 L67.5 64 L70.5 63.6 L69 67.5" ${N} ${S(1.2, '#fff')}/>
    ${eye(40, 56, 4.3)}${eye(60, 56, 4.3)}${omega(50, 64, 2.4)}
    <rect x="48.6" y="64.6" width="2.8" height="3.2" rx=".6" fill="#fff" ${S(1)}/>
    <ellipse cx="42" cy="73" rx="4" ry="3" fill="#ffd84a" ${S(1.8)}/><ellipse cx="58" cy="73" rx="4" ry="3" fill="#ffd84a" ${S(1.8)}/>`;

  // No.011 ビリビリッチ
  A['pachimon.biribiricchi'] = () => `${shadow(26)}
    <path d="M70 82 C90 82 95 62 85 47 C80 40 82 30 88 26" ${N} ${S(4.6)}/>
    <path d="M70 82 C90 82 95 62 85 47 C80 40 82 30 88 26" ${N} ${S(2.4, '#6a6a7a')}/>
    <rect x="84" y="14" width="10" height="11" rx="2.5" fill="#d6d6dc" ${S(2)}/>
    <path d="M87 14 L87 9 M91 14 L91 9" ${S(2)}/>
    <path d="M40 34 L32 16" ${S(2.2)}/><circle cx="31" cy="15" r="4" fill="#ff6a3a" ${S(1.8)}/>
    <path d="M60 34 L68 16" ${S(2.2)}/><circle cx="69" cy="15" r="4" fill="#ff6a3a" ${S(1.8)}/>
    <path d="M50 28 L56 34 L64 30 L66 38 L74 38 L72 46 C80 52 80 64 78 72 C76 84 66 90 50 90 C34 90 24 84 22 72 C20 64 20 52 28 46 L26 38 L34 38 L36 30 L44 34Z" fill="#ffc61a" ${S()}/>
    <ellipse cx="50" cy="77" rx="14" ry="10" fill="#fff0b0"/>
    <circle cx="31" cy="64" r="5" fill="#ff9f43"/><circle cx="69" cy="64" r="5" fill="#ff9f43"/>
    ${eye(40, 56, 4.1)}${eye(60, 56, 4.1)}${brows(48, 0.6)}${smile(50, 64, 3.4)}${fangs(50, 64)}`;

  // No.012 モフワタ
  A['pachimon.mofuwata'] = () => {
    const c = [[50, 38, 15], [33, 46, 14], [67, 46, 14], [24, 62, 13], [76, 62, 13], [33, 78, 14], [67, 78, 14], [50, 82, 15], [50, 60, 24]];
    const fill = (st) => c.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fffdfb" ${st}/>`).join('');
    return `${shadow(28)}${fill(S())}${fill('')}
    <ellipse cx="40" cy="48" rx="4" ry="2" fill="#fff" opacity=".9"/>
    <ellipse cx="32" cy="58" rx="6.5" ry="3.4" fill="#f3dccb" ${S(2)} transform="rotate(-24 32 58)"/>
    <ellipse cx="68" cy="58" rx="6.5" ry="3.4" fill="#f3dccb" ${S(2)} transform="rotate(24 68 58)"/>
    <ellipse cx="50" cy="62" rx="15" ry="13" fill="#f6e7da" ${S(2)}/>
    ${sleepy(44, 60, 3)}${sleepy(56, 60, 3)}${cheek(39, 66, '#ffb3c7', 3.4, 2.2)}${cheek(61, 66, '#ffb3c7', 3.4, 2.2)}${smile(50, 67, 2.4)}
    <ellipse cx="40" cy="92" rx="4" ry="2.6" fill="${O}"/><ellipse cx="60" cy="92" rx="4" ry="2.6" fill="${O}"/>`;
  };

  // No.013 コロネズ
  A['pachimon.koronezu'] = () => `${shadow()}
    <path d="M72 80 C86 82 91 70 85 63 C81 59 75 63 79 67" ${N} ${S(3, '#a99bbd')}/>
    <circle cx="29" cy="40" r="12.5" fill="#cfc7dc" ${S()}/><circle cx="29" cy="40" r="7" fill="#ffc6d6"/>
    <circle cx="71" cy="40" r="12.5" fill="#cfc7dc" ${S()}/><circle cx="71" cy="40" r="7" fill="#ffc6d6"/>
    <circle cx="50" cy="64" r="26" fill="#d6cfe2" ${S()}/>
    <ellipse cx="50" cy="75" rx="14" ry="10" fill="#f5f1fa"/>
    ${eye(41, 60, 3.8)}${eye(59, 60, 3.8)}
    <ellipse cx="50" cy="66" rx="2.4" ry="1.8" fill="#ff8fa3" ${S(1.2)}/>
    <path d="M44 67 L33 65 M44 69 L33 71 M56 67 L67 65 M56 69 L67 71" ${S(1.1)}/>
    ${omega(50, 69, 1.8)}${cheek(36, 68, '#ffb3c7', 3, 2)}${cheek(64, 68, '#ffb3c7', 3, 2)}`;

  // No.014 ポテコロ
  A['pachimon.potekoro'] = () => `${shadow(28)}
    <path d="M24 66 C22 52 34 44 48 46 C56 40 70 42 76 52 C84 58 82 74 74 80 C66 88 40 90 30 82 C24 78 22 72 24 66Z" fill="#d9ab6c" ${S()}/>
    <path d="M30 56 q2 -2 4 0 M70 58 q2 -2 4 0 M66 78 q2 -2 4 0 M32 76 q2 -2 4 0" ${N} ${S(1.5, '#a7783f')}/>
    <circle cx="58" cy="52" r="1.3" fill="#a7783f"/><circle cx="74" cy="68" r="1.3" fill="#a7783f"/><circle cx="28" cy="68" r="1.3" fill="#a7783f"/>
    <path d="M58 45 C58 38 61 34 65 32" ${N} ${S(2, '#4f8f3f')}/>
    <path d="M65 32 C71 27 78 29 78 34 C74 37 70 37 65 32Z" fill="#8fd16f" ${S(1.8)}/>
    ${sleepy(42, 63, 3.4)}${sleepy(58, 63, 3.4)}${cheek(36, 69)}${cheek(64, 69)}${smile(50, 69, 2.6)}
    <ellipse cx="40" cy="87" rx="5" ry="2.8" fill="#b98a4e" ${S(1.8)}/><ellipse cx="60" cy="87" rx="5" ry="2.8" fill="#b98a4e" ${S(1.8)}/>`;

  // No.015 ドロンボ
  A['pachimon.doronbo'] = () => `${shadow(28)}
    <path d="M50 30 C70 30 80 46 80 64 C80 82 68 90 50 90 C32 90 20 82 20 64 C20 46 30 30 50 30Z" fill="#9b6f4c" ${S()}/>
    <ellipse cx="50" cy="76" rx="15" ry="11" fill="#c99b70"/>
    <path d="M30 41 C37 30 63 30 70 41 C68 47 64 43 62 49 C60 43 56 45 54 51 C52 45 48 47 46 43 C44 49 40 47 38 45 C36 47 32 45 30 41Z" fill="#6b4a33" ${S(1.8)}/>
    <path d="M26 70 C17 70 15 78 21 83 L30 80Z" fill="#f2d2b2" ${S(2)}/>
    <path d="M19 78 L15 81 M21 81 L18 85 M24 82 L23 86" ${S(1.6)}/>
    ${mir(`<path d="M26 70 C17 70 15 78 21 83 L30 80Z" fill="#f2d2b2" ${S(2)}/><path d="M19 78 L15 81 M21 81 L18 85 M24 82 L23 86" ${S(1.6)}/>`)}
    ${happy(41, 56, 3.4)}${happy(59, 56, 3.4)}
    <ellipse cx="50" cy="63" rx="5" ry="3.6" fill="#ff9fb0" ${S(1.8)}/>${smile(50, 69, 2.6)}
    ${cheek(33, 62)}${cheek(67, 62)}`;

  // No.016 ユキダマン
  A['pachimon.yukidaman'] = () => `${shadow(22)}
    <path d="M31 68 L15 57 M19 60 L15 64" ${N} ${S(2.4, '#8a5a3a')}/>
    ${mir(`<path d="M31 68 L15 57 M19 60 L15 64" ${N} ${S(2.4, '#8a5a3a')}/>`)}
    <circle cx="50" cy="72" r="20" fill="#f4fbff" ${S()}/>
    <circle cx="50" cy="42" r="17" fill="#f4fbff" ${S()}/>
    <path d="M58 60 L63 75 L54 73Z" fill="#ff6b8b" ${S(2)}/>
    <path d="M34 54 C42 60 58 60 66 54 L66 60 C58 66 42 66 34 60Z" fill="#ff6b8b" ${S(2)}/>
    <path d="M38 58 L38 62 M44 60 L44 64 M50 60 L50 64 M56 60 L56 64 M62 58 L62 62" ${S(1.2, '#fff')}/>
    <path d="M33 37 C33 21 67 21 67 37Z" fill="#5bb6f0" ${S(2)}/>
    <rect x="31" y="33" width="38" height="6.5" rx="3.2" fill="#3a8fd0" ${S(2)}/>
    <circle cx="50" cy="21" r="5" fill="#fff" ${S(2)}/>
    ${dot(44, 44, 2.4)}${dot(56, 44, 2.4)}
    <path d="M50 47 L57 49 L50 51Z" fill="#ff9a3c" ${S(1.4)}/>
    ${cheek(39, 50, '#9fd8ff', 3.4, 2.2)}${cheek(61, 50, '#9fd8ff', 3.4, 2.2)}${smile(47, 53, 2)}
    <circle cx="50" cy="72" r="2" fill="${O}"/><circle cx="50" cy="81" r="2" fill="${O}"/>`;

  // No.017 ツララッコ
  A['pachimon.tsuraracco'] = () => `${shadow(24)}
    <path d="M70 80 C84 84 90 78 92 72 C86 74 78 74 72 72Z" fill="#7fc8e6" ${S(2)}/>
    <circle cx="36" cy="31" r="5.5" fill="#9fdcf2" ${S(2)}/><circle cx="64" cy="31" r="5.5" fill="#9fdcf2" ${S(2)}/>
    <path d="M50 26 C64 26 70 38 70 50 C76 58 78 70 74 80 C70 90 30 90 26 80 C22 70 24 58 30 50 C30 38 36 26 50 26Z" fill="#9fdcf2" ${S()}/>
    <path d="M46 28 L50 8 L54 28Z" fill="#e6f8ff" ${S(2)}/><path d="M50 12 L50 24" ${S(1, '#9fdcf2')}/>
    <ellipse cx="50" cy="46" rx="13" ry="10" fill="#e6f8ff"/>
    <path d="M38 70 C38 62 62 62 62 70 C62 76 38 76 38 70Z" fill="#cdeffd" ${S(2)}/>
    <path d="M44 64 L44 74 M50 63 L50 75 M56 64 L56 74" ${S(1.2, '#8ccbe6')}/>
    <circle cx="38" cy="70" r="4" fill="#9fdcf2" ${S(1.8)}/><circle cx="62" cy="70" r="4" fill="#9fdcf2" ${S(1.8)}/>
    ${eye(44, 44, 3.6)}${eye(56, 44, 3.6)}
    <ellipse cx="50" cy="50" rx="2.4" ry="1.6" fill="${O}"/>
    <ellipse cx="50" cy="54.5" rx="1.8" ry="2.2" fill="#e8607a"/>
    ${cheek(38, 50, '#a8dcff', 3, 2)}${cheek(62, 50, '#a8dcff', 3, 2)}
    ${sparkle(20, 34, 4, '#cdeffd')}${sparkle(82, 44, 3, '#cdeffd')}`;

  // No.018 オバケット
  A['pachimon.obaketto'] = () => `<ellipse cx="50" cy="94" rx="16" ry="2.6" fill="#000" opacity=".06"/>
    <path d="M24 62 C16 60 14 66 18 68 C20 68 22 66 24 66Z" fill="#cbbcf3" ${S(2)}/>
    <path d="M78 58 L86 46" ${S(2.2, '#b8b8c0')}/><ellipse cx="87.5" cy="43" rx="3.2" ry="4" fill="#e4e4ea" ${S(1.6)}/>
    <path d="M24 58 C24 32 76 32 76 58 L76 84 C72 80 68 80 64 86 C60 80 56 80 50 86 C44 80 40 80 36 86 C32 80 28 80 24 84Z" fill="#d8cbf7" ${S()}/>
    <path d="M76 60 C82 58 84 64 80 66 C78 66 77 64 76 64Z" fill="#d8cbf7" ${S(2)}/>
    <path d="M34 44 C36 40 40 38 44 38" ${N} stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>
    ${eye(41, 56, 4.6)}${eye(59, 56, 4.6)}${cheek(32, 63, '#ff9fc7')}${cheek(68, 63, '#ff9fc7')}
    <path d="M45 64 Q50 72 55 64Z" fill="#e8607a" ${S(2)}/>
    <path d="M48 67 Q50 71 52 67" fill="#ff9fb0"/>`;

  // No.019 ヒュードロン
  A['pachimon.hyudoron'] = () => `<ellipse cx="50" cy="95" rx="18" ry="2.6" fill="#000" opacity=".06"/>
    ${flame(16, 34, 0.85, '#7fd6ff', '#ffffff')}${flame(86, 26, 0.7, '#7fd6ff', '#ffffff')}
    <path d="M26 58 C26 30 74 30 74 58 L74 74 C74 82 70 86 64 86 C70 88 80 86 85 79 C83 92 64 96 50 92 C38 90 26 86 26 76Z" fill="#7d63c9" ${S()}/>
    <path d="M37 37 L34 25 L43 33Z" fill="#5a45a0" ${S(1.8)}/>${mir(`<path d="M37 37 L34 25 L43 33Z" fill="#5a45a0" ${S(1.8)}/>`)}
    <path d="M24 64 C16 62 14 70 19 72 C22 72 24 70 26 69Z" fill="#7d63c9" ${S(2)}/>
    <ellipse cx="41" cy="54" rx="6" ry="6.4" fill="#fff"/><ellipse cx="59" cy="54" rx="6" ry="6.4" fill="#fff"/>
    ${eye(42, 55, 3.6)}${eye(58, 55, 3.6)}${brows(47, 0.9)}
    <path d="M40 64 Q50 73 60 64" ${N} ${S(2.4)}/><path d="M43 65.6 L44.4 69 L46 66.6Z" fill="#fff" ${S(1)}/>
    ${cheek(32, 63, '#c49bff')}${cheek(68, 63, '#c49bff')}`;

  // No.020 ネムネム
  A['pachimon.nemunemu'] = () => `${shadow()}
    <ellipse cx="27" cy="50" rx="6" ry="9" fill="#f7b0d0" ${S(2)} transform="rotate(-25 27 50)"/>
    <ellipse cx="73" cy="50" rx="6" ry="9" fill="#f7b0d0" ${S(2)} transform="rotate(25 73 50)"/>
    <path d="M50 34 C70 34 80 48 80 64 C80 82 68 90 50 90 C32 90 20 82 20 64 C20 48 30 34 50 34Z" fill="#f7b0d0" ${S()}/>
    <ellipse cx="50" cy="78" rx="16" ry="10" fill="#ffe3ef"/>
    <path d="M30 43 C32 23 56 14 74 22 C70 28 72 36 70 43Z" fill="#8f7fe0" ${S(2)}/>
    <path d="M28 43 C42 37 58 37 72 43 L72 48 C58 42 42 42 28 48Z" fill="#fff" ${S(1.8)}/>
    <circle cx="76" cy="22" r="5" fill="#fff" ${S(2)}/>
    <path d="M56 26 C52 26 50 30 52 33 C50 32 48 30 49 27 C50 25 53 24 56 26Z" fill="#ffd23f" ${S(1.2)}/>
    ${sleepy(40, 56, 3.8)}${sleepy(60, 56, 3.8)}${cheek(31, 62)}${cheek(69, 62)}
    <path d="M45.5 59 C45 64 46 68 44 72 C44.5 75 48 75 50 72.5 C52 70 54 65 54.5 59 C52 57 48 57 45.5 59Z" fill="#f9bfd9" ${S(2)}/>
    <path d="M46 64 L53.5 64 M45.6 68 L52 68" ${N} ${S(1.1, '#d98aae')}/>
    <path d="M58 70 Q61 72 64 70" ${N} ${S(1.8)}/>
    <text x="80" y="42" font-size="9" font-weight="800" fill="#8f7fe0" font-family="sans-serif">z</text>
    <text x="86" y="34" font-size="7" font-weight="800" fill="#8f7fe0" font-family="sans-serif">z</text>`;

  // No.021 ミラクルン
  A['pachimon.mirakurun'] = () => `${shadow(22)}
    <path d="M38 42 C32 28 32 15 36 9 C42 14 44 28 44 39Z" fill="#ffd1e8" ${S(2)}/><path d="M38 36 C36 28 36 20 37 15" ${N} ${S(1.6, '#ff9fc7')}/>
    ${mir(`<path d="M38 42 C32 28 32 15 36 9 C42 14 44 28 44 39Z" fill="#ffd1e8" ${S(2)}/><path d="M38 36 C36 28 36 20 37 15" ${N} ${S(1.6, '#ff9fc7')}/>`)}
    ${star(36, 9, 5.5, '#ffd23f')}${star(64, 9, 5.5, '#ffd23f')}
    <ellipse cx="50" cy="64" rx="24" ry="26" fill="#ffd1e8" ${S()}/>
    <ellipse cx="50" cy="76" rx="13" ry="10" fill="#fff0f7"/>
    ${bow(50, 40, '#ff6fa5', 0.9)}
    <path d="M73 74 L84 58" ${S(2.4, '#c9a0ff')}/>${star(85, 55, 5, '#ffe680')}
    ${eye(41, 60, 4.6)}${eye(59, 60, 4.6)}${sparkle(39.5, 58, 1.6)}${sparkle(57.5, 58, 1.6)}
    ${cheek(32, 67, '#ff8fb8')}${cheek(68, 67, '#ff8fb8')}${open(50, 68, 3, 3)}
    ${sparkle(16, 40, 4, '#ffd23f')}${sparkle(20, 76, 3, '#ff9fc7')}`;

  // No.022 パンチョス
  A['pachimon.panchosu'] = () => `${shadow(28)}
    <circle cx="32" cy="35" r="7.5" fill="#ff8a7a" ${S()}/><circle cx="32" cy="35" r="3.6" fill="#ffd6cc"/>
    <circle cx="68" cy="35" r="7.5" fill="#ff8a7a" ${S()}/><circle cx="68" cy="35" r="3.6" fill="#ffd6cc"/>
    <path d="M50 30 C70 30 80 44 80 60 C80 80 68 90 50 90 C32 90 20 80 20 60 C20 44 30 30 50 30Z" fill="#ff8a7a" ${S()}/>
    <ellipse cx="50" cy="78" rx="14" ry="9" fill="#ffe0d6"/>
    <path d="M23 44 C40 38 60 38 77 44 L77 50 C60 44 40 44 23 50Z" fill="#fff" ${S(2)}/>
    <circle cx="50" cy="42" r="2.6" fill="#ff3b4a"/>
    <path d="M24 46 L11 40 L14 48 L10 52Z" fill="#fff" ${S(1.8)}/>
    <ellipse cx="50" cy="64" rx="9" ry="6" fill="#ffe0d6"/>
    <ellipse cx="50" cy="61" rx="2.6" ry="1.8" fill="${O}"/>
    ${eye(40, 55, 3.8)}${eye(60, 55, 3.8)}<path d="M34 49 L45 52 M66 49 L55 52" ${S(2.4)}/>
    ${smile(50, 65, 3)}${fangs(50, 65)}
    <circle cx="23" cy="72" r="9.5" fill="#ff3b4a" ${S()}/><ellipse cx="20" cy="69" rx="3" ry="2" fill="#fff" opacity=".6"/>
    <rect x="25" y="76" width="8" height="6" rx="2" fill="#fff" ${S(1.8)} transform="rotate(30 29 79)"/>
    <circle cx="77" cy="72" r="9.5" fill="#ff3b4a" ${S()}/><ellipse cx="74" cy="69" rx="3" ry="2" fill="#fff" opacity=".6"/>
    <rect x="67" y="76" width="8" height="6" rx="2" fill="#fff" ${S(1.8)} transform="rotate(-30 71 79)"/>`;

  // No.023 ツバサン
  A['pachimon.tsubasan'] = () => `${shadow()}
    <path d="M24 62 C15 57 11 66 17 72 C21 72 24 68 26 66Z" fill="#7fbcf5" ${S(2)}/>
    ${mir(`<path d="M24 62 C15 57 11 66 17 72 C21 72 24 68 26 66Z" fill="#7fbcf5" ${S(2)}/>`)}
    <ellipse cx="50" cy="64" rx="26" ry="25" fill="#a8d6ff" ${S()}/>
    <ellipse cx="50" cy="73" rx="16" ry="13" fill="#fff"/>
    <path d="M47 40 C45 31 49 27 53 29 C51 33 53 35 56 33 C56 39 52 41 50 41Z" fill="#7fbcf5" ${S(1.8)}/>
    <path d="M45 63 L55 63 L50 69Z" fill="#ffb23f" ${S(1.8)}/>
    ${eye(41, 56, 3.8)}${eye(59, 56, 3.8)}${cheek(32, 63)}${cheek(68, 63)}
    ${sweat(78, 44)}
    <path d="M42 88 L37 92 M42 88 L42 93 M42 88 L47 92 M58 88 L53 92 M58 88 L58 93 M58 88 L63 92" ${S(2.2, '#e0942e')}/>`;

  // No.024 カゼノトリ
  A['pachimon.kazenotori'] = () => `<ellipse cx="50" cy="94" rx="20" ry="2.6" fill="#000" opacity=".06"/>
    <path d="M10 30 C18 25 25 31 19 34 C15 35 14 30 18 30" ${N} ${S(1.8, '#9fc6f5')}/>
    <path d="M78 22 C86 18 92 24 86 27" ${N} ${S(1.8, '#9fc6f5')}/>
    <path d="M58 76 L82 92 L74 78 L92 82 L66 68Z" fill="#3f6fb5" ${S(2)}/>
    <path d="M34 56 C20 46 8 46 2 50 C10 54 14 58 18 62 C10 62 6 66 6 68 C16 68 26 66 34 64Z" fill="#5a9ae0" ${S(2)}/>
    <path d="M10 52 C18 54 24 56 30 58" ${N} ${S(1.2, '#3f6fb5')}/>
    ${mir(`<path d="M34 56 C20 46 8 46 2 50 C10 54 14 58 18 62 C10 62 6 66 6 68 C16 68 26 66 34 64Z" fill="#5a9ae0" ${S(2)}/><path d="M10 52 C18 54 24 56 30 58" ${N} ${S(1.2, '#3f6fb5')}/>`)}
    <ellipse cx="50" cy="58" rx="18" ry="22" fill="#5aa9e6" ${S()}/>
    <ellipse cx="50" cy="67" rx="11" ry="12" fill="#eef7ff"/>
    <path d="M46 38 C42 29 44 25 48 23 C48 29 50 31 53 34Z" fill="#3f6fb5" ${S(1.6)}/>
    ${eye(44, 50, 3.4)}${eye(56, 50, 3.4)}<path d="M38 44 L46 46 M62 44 L54 46" ${S(2.2)}/>
    <path d="M47 56 L53 56 L50 60.5Z" fill="#ffb23f" ${S(1.4)}/>
    <path d="M44 80 L42 86 M56 80 L58 86" ${S(2.2, '#e0942e')}/>`;

  // No.025 ムシムシ
  A['pachimon.mushimushi'] = () => `${shadow(34)}
    <path d="M8 85 C8 72 18 66 27 70 C25 80 17 87 8 85Z" fill="#6cc46a" ${S(1.8)}/><path d="M11 82 C15 78 19 74 24 72" ${N} ${S(1.2, '#3f7f3a')}/>
    <circle cx="82" cy="78" r="9" fill="#8fc455" ${S()}/>
    <circle cx="69" cy="79" r="10" fill="#a8d66a" ${S()}/>
    <circle cx="56" cy="78" r="10.5" fill="#8fc455" ${S()}/>
    <path d="M78 88 L78 91 M86 88 L86 91 M65 89 L65 92 M73 89 L73 92 M52 89 L52 92 M60 89 L60 92" ${S(2)}/>
    <circle cx="69" cy="74" r="1.6" fill="#ffd23f"/><circle cx="56" cy="73" r="1.6" fill="#ffd23f"/><circle cx="82" cy="74" r="1.4" fill="#ffd23f"/>
    <path d="M30 50 L23 35" ${S(2)}/><circle cx="22.5" cy="34" r="3.4" fill="#ff9f43" ${S(1.6)}/>
    <path d="M42 49 L46 33" ${S(2)}/><circle cx="46.5" cy="32" r="3.4" fill="#ff9f43" ${S(1.6)}/>
    <circle cx="36" cy="68" r="20" fill="#bfe384" ${S()}/>
    ${eye(29, 66, 4)}${eye(43, 66, 4)}${cheek(22, 73)}${cheek(50, 73)}${open(36, 74, 3, 3)}`;

  // No.026 テントウマル
  A['pachimon.tentoumaru'] = () => `${shadow(32)}
    <path d="M54 88 L54 92 M64 88 L66 92 M74 86 L78 90" ${S(2)}/>
    <path d="M18 76 C18 50 34 38 56 38 C76 38 88 52 88 76 Z" fill="#ff5a5a" ${S()}/>
    <path d="M56 39 L56 76" ${S(2)}/>
    <circle cx="44" cy="52" r="4.6" fill="#3a2b3f"/><circle cx="70" cy="52" r="4.6" fill="#3a2b3f"/>
    <circle cx="40" cy="66" r="4" fill="#3a2b3f"/><circle cx="72" cy="66" r="4" fill="#3a2b3f"/>
    <circle cx="82" cy="68" r="3" fill="#3a2b3f"/><circle cx="56" cy="46" r="3.2" fill="#3a2b3f"/>
    <circle cx="64" cy="70" r="3" fill="#3a2b3f"/>
    <path d="M42 44 C46 41 52 40 54 41" ${N} stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>
    <path d="M22 60 L14 46" ${S(2)}/><circle cx="13.5" cy="45" r="3" fill="#3a2b3f"/>
    <path d="M32 59 L34 44" ${S(2)}/><circle cx="34" cy="43" r="3" fill="#3a2b3f"/>
    <ellipse cx="28" cy="74" rx="16" ry="15" fill="#3a2b3f" ${S()}/>
    <circle cx="22" cy="72" r="4.6" fill="#fff"/><circle cx="34" cy="72" r="4.6" fill="#fff"/>
    <circle cx="23" cy="73" r="2.6" fill="${O}"/><circle cx="35" cy="73" r="2.6" fill="${O}"/>
    <circle cx="22" cy="72" r=".9" fill="#fff"/><circle cx="34" cy="72" r=".9" fill="#fff"/>
    ${cheek(17, 79, '#ff8fa3', 3, 2)}${cheek(39, 79, '#ff8fa3', 3, 2)}
    <path d="M25 80 Q28 83 31 80" ${N} ${S(2, '#fff')}/>`;

  // No.027 チョウチョリン
  A['pachimon.chouchorin'] = () => `<ellipse cx="50" cy="94" rx="14" ry="2.4" fill="#000" opacity=".06"/>
    <path d="M48 52 C34 28 12 24 10 39 C8 52 26 58 46 58Z" fill="#c4a7ff" ${S(2)}/>
    <path d="M52 52 C66 28 88 24 90 39 C92 52 74 58 54 58Z" fill="#ffb3d9" ${S(2)}/>
    <path d="M46 60 C30 62 20 74 26 83 C34 89 44 77 48 64Z" fill="#ffd6a5" ${S(2)}/>
    <path d="M54 60 C70 62 80 74 74 83 C66 89 56 77 52 64Z" fill="#a5e3ff" ${S(2)}/>
    <circle cx="24" cy="40" r="4" fill="#fff" opacity=".85"/><circle cx="34" cy="48" r="2.6" fill="#fff" opacity=".85"/>
    <circle cx="76" cy="40" r="4" fill="#fff" opacity=".85"/><circle cx="66" cy="48" r="2.6" fill="#fff" opacity=".85"/>
    <circle cx="32" cy="76" r="3" fill="#fff" opacity=".85"/><circle cx="68" cy="76" r="3" fill="#fff" opacity=".85"/>
    <ellipse cx="50" cy="66" rx="7.5" ry="18" fill="#ffe6f4" ${S()}/>
    <path d="M44 70 L56 70 M44 76 L56 76" ${S(1.2, '#e8b5d3')}/>
    <path d="M46 34 C42 25 36 23 33 27" ${N} ${S(1.8)}/><circle cx="33" cy="27" r="2" fill="${O}"/>
    ${mir(`<path d="M46 34 C42 25 36 23 33 27" ${N} ${S(1.8)}/><circle cx="33" cy="27" r="2" fill="${O}"/>`)}
    <circle cx="50" cy="44" r="12" fill="#ffe6f4" ${S()}/>
    ${eye(45, 44, 3.2)}${eye(55, 44, 3.2)}${cheek(41, 49, '#ff9fc7', 2.8, 1.8)}${cheek(59, 49, '#ff9fc7', 2.8, 1.8)}${smile(50, 49, 2)}`;

  // No.028 ドクキノ
  A['pachimon.dokukino'] = () => `${shadow(22)}
    <circle cx="16" cy="28" r="2" fill="#c99be6"/><circle cx="84" cy="20" r="2.4" fill="#c99be6"/><circle cx="88" cy="34" r="1.6" fill="#c99be6"/>
    <path d="M34 54 L34 82 C34 90 66 90 66 82 L66 54Z" fill="#f6e6d6" ${S()}/>
    <path d="M34 72 C28 72 26 76 28 79" ${N} ${S(2.2)}/>${mir(`<path d="M34 72 C28 72 26 76 28 79" ${N} ${S(2.2)}/>`)}
    <path d="M13 56 C13 29 30 17 50 17 C70 17 87 29 87 56 C76 61 24 61 13 56Z" fill="#b26bd8" ${S()}/>
    <ellipse cx="31" cy="34" rx="5.5" ry="4.6" fill="#fff"/><ellipse cx="50" cy="25" rx="6.5" ry="4" fill="#fff"/>
    <ellipse cx="69" cy="34" rx="5.5" ry="4.6" fill="#fff"/><circle cx="24" cy="48" r="3" fill="#fff"/>
    <circle cx="76" cy="48" r="3" fill="#fff"/><circle cx="50" cy="42" r="4" fill="#fff"/>
    ${dot(43, 69, 2.8)}${dot(57, 69, 2.8)}${cheek(38, 75, '#ffb3c7', 3.2, 2)}${cheek(62, 75, '#ffb3c7', 3.2, 2)}${smile(50, 75, 2.6)}`;

  // No.029 ネバネバン
  A['pachimon.nebanebann'] = () => `${shadow(32)}
    <path d="M16 86 C16 70 22 50 36 42 C42 30 58 30 64 42 C78 50 84 70 84 86 C76 88 74 82 70 86 C66 90 60 84 56 88 C50 92 44 86 40 88 C34 90 30 84 24 88 C20 90 16 88 16 86Z" fill="#b57edc" ${S()}/>
    <ellipse cx="38" cy="51" rx="5.5" ry="3" fill="#fff" opacity=".6" transform="rotate(-30 38 51)"/>
    <circle cx="70" cy="70" r="3" fill="#d4b0ef"/><circle cx="28" cy="74" r="2.4" fill="#d4b0ef"/><circle cx="62" cy="80" r="1.8" fill="#d4b0ef"/>
    ${eye(42, 62, 4)}${eye(58, 62, 4)}<path d="M37 58.5 Q42 56 47 58.5 M53 58.5 Q58 56 63 58.5" ${N} ${S(2.4)}/>
    ${open(50, 70, 4, 4)}<path d="M51 76 C51 80 53 82 52 84" ${N} ${S(1.6, '#d4b0ef')}/>
    ${cheek(33, 70, '#ff9fc7')}${cheek(67, 70, '#ff9fc7')}
    <ellipse cx="82" cy="58" rx="3.4" ry="2.4" fill="#e9d2a0" ${S(1.4)}/><ellipse cx="88" cy="54" rx="3.4" ry="2.4" fill="#e9d2a0" ${S(1.4)}/>
    <path d="M79 61 C76 66 80 70 76 74 M86 57 C88 62 84 66 86 70" ${N} ${S(1, '#e9d2a0')}/>`;

  // No.030 カチコチ
  A['pachimon.kachikochi'] = () => `${shadow(28)}
    <rect x="16" y="54" width="10" height="18" rx="3" fill="#a4b0bb" ${S(2)}/><rect x="74" y="54" width="10" height="18" rx="3" fill="#a4b0bb" ${S(2)}/>
    <rect x="44" y="27" width="12" height="9" rx="2" fill="#9aa7b3" ${S(2)}/><rect x="47" y="22" width="6" height="5" fill="#9aa7b3" ${S(1.6)}/>
    <rect x="24" y="35" width="52" height="51" rx="12" fill="#c3cdd6" ${S()}/>
    <rect x="31" y="45" width="38" height="28" rx="8" fill="#e6ecf1"/>
    <circle cx="29" cy="40" r="1.6" fill="#8a97a3"/><circle cx="71" cy="40" r="1.6" fill="#8a97a3"/><circle cx="29" cy="81" r="1.6" fill="#8a97a3"/><circle cx="71" cy="81" r="1.6" fill="#8a97a3"/>
    <path d="M28 38 L40 38" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>
    <rect x="37" y="53" width="6" height="7.5" rx="2" fill="${O}"/><rect x="57" y="53" width="6" height="7.5" rx="2" fill="${O}"/>
    <rect x="38" y="54" width="2" height="2" fill="#fff"/><rect x="58" y="54" width="2" height="2" fill="#fff"/>
    ${cheek(35, 65, '#ff9fb0', 3.2, 2)}${cheek(65, 65, '#ff9fb0', 3.2, 2)}<path d="M46 66 L54 66" ${S(2.2)}/>
    <rect x="31" y="86" width="12" height="6" rx="2" fill="#8a97a3" ${S(2)}/><rect x="57" y="86" width="12" height="6" rx="2" fill="#8a97a3" ${S(2)}/>`;

  // No.031 ロボッチ
  A['pachimon.robocchi'] = () => `${shadow(26)}
    <path d="M50 30 L50 16" ${S(2.2)}/><circle cx="50" cy="13" r="4" fill="#ff6a6a" ${S(1.8)}/>${sparkle(50, 13, 1.8)}
    <path d="M28 64 C19 64 17 72 21 77" ${N} ${S(4.4)}/><path d="M28 64 C19 64 17 72 21 77" ${N} ${S(2.4, '#a9b8c6')}/>
    <circle cx="21" cy="79" r="3.6" fill="#8fa2b3" ${S(1.8)}/>
    <path d="M72 64 C81 64 84 70 82 74" ${N} ${S(4.4)}/><path d="M72 64 C81 64 84 70 82 74" ${N} ${S(2.4, '#a9b8c6')}/>
    <path d="M78 74 C78 70 88 70 88 74 L88 84 C86 86 84 84 83 82 C82 84 80 86 78 84Z" fill="#ff9fc0" ${S(1.6)}/>
    <rect x="28" y="54" width="44" height="32" rx="9" fill="#b8c5d1" ${S()}/>
    <circle cx="42" cy="68" r="3" fill="#ffd23f" ${S(1.4)}/><circle cx="50" cy="68" r="3" fill="#7ed98a" ${S(1.4)}/><circle cx="58" cy="68" r="3" fill="#5cc8ff" ${S(1.4)}/>
    <rect x="40" y="76" width="20" height="4" rx="2" fill="#8fa2b3"/>
    <path d="M28 48 C28 30 72 30 72 48 L72 54 L28 54Z" fill="#9fb1c1" ${S()}/>
    <rect x="33" y="36" width="34" height="15" rx="5" fill="#2b3a4a" ${S(1.6)}/>
    <path d="M38 45 Q42 40 46 45 M54 45 Q58 40 62 45" ${N} ${S(2.2, '#7ff0ff')}/>
    <circle cx="38" cy="90" r="4.6" fill="${O}"/><circle cx="62" cy="90" r="4.6" fill="${O}"/><circle cx="38" cy="90" r="1.6" fill="#b8c5d1"/><circle cx="62" cy="90" r="1.6" fill="#b8c5d1"/>`;

  // No.032 ペロリン
  A['pachimon.perorin'] = () => `${shadow()}
    <path d="M72 80 C86 82 91 70 87 62 C84 56 78 58 80 62" ${N} ${S(5)}/><path d="M72 80 C86 82 91 70 87 62 C84 56 78 58 80 62" ${N} ${S(2.6, '#ffc4dc')}/>
    <path d="M27 46 L29 24 L45 37Z" fill="#ffc4dc" ${S(2.2)}/><path d="M31 41 L32 30 L40 37Z" fill="#ff9fc0"/>
    ${mir(`<path d="M27 46 L29 24 L45 37Z" fill="#ffc4dc" ${S(2.2)}/><path d="M31 41 L32 30 L40 37Z" fill="#ff9fc0"/>`)}
    <path d="M50 32 C70 32 80 46 80 62 C80 80 68 90 50 90 C32 90 20 80 20 62 C20 46 30 32 50 32Z" fill="#ffd1e4" ${S()}/>
    <ellipse cx="50" cy="78" rx="14" ry="9" fill="#fff1f7"/>
    ${bow(68, 33, '#ff5c8a', 0.85)}
    ${happy(40, 58, 4)}${happy(60, 58, 4)}${cheek(31, 64, '#ff8fb8')}${cheek(69, 64, '#ff8fb8')}
    ${omega(50, 64, 2.4)}<path d="M47.6 65.6 C47.6 72 52.4 72 52.4 65.6Z" fill="#ff7a9a" ${S(1.4)}/>
    <path d="M42 66 L31 64 M42 68 L32 70 M58 66 L69 64 M58 68 L68 70" ${S(1.1)}/>
    <ellipse cx="40" cy="89" rx="6" ry="3.4" fill="#ffc4dc" ${S(2)}/><ellipse cx="60" cy="89" rx="6" ry="3.4" fill="#ffc4dc" ${S(2)}/>`;

  // No.033 ハートン
  A['pachimon.hearton'] = () => `<ellipse cx="50" cy="94" rx="16" ry="2.6" fill="#000" opacity=".06"/>
    <path d="M26 46 C14 36 5 42 9 52 C13 58 22 56 28 52Z" fill="#fff" ${S(2)}/><path d="M14 46 C18 48 22 50 25 51" ${N} ${S(1.2)}/>
    ${mir(`<path d="M26 46 C14 36 5 42 9 52 C13 58 22 56 28 52Z" fill="#fff" ${S(2)}/><path d="M14 46 C18 48 22 50 25 51" ${N} ${S(1.2)}/>`)}
    <ellipse cx="50" cy="20" rx="12" ry="3.6" ${N} ${S(2.6, '#ffcf33')}/>
    <path d="M50 88 C28 74 16 60 18 46 C20 34 34 28 44 34 C47 36 49 38 50 40 C51 38 53 36 56 34 C66 28 80 34 82 46 C84 60 72 74 50 88Z" fill="#ff9fbf" ${S()}/>
    <ellipse cx="31" cy="45" rx="5" ry="3" fill="#fff" opacity=".7" transform="rotate(-35 31 45)"/>
    ${eye(41, 56, 4)}${eye(59, 56, 4)}${cheek(33, 63, '#ff5c8a')}${cheek(67, 63, '#ff5c8a')}${smile(50, 63, 3)}
    <path d="M84 24 C84 21 88 21 88 24 C88 21 92 21 92 24 C92 27 88 29 88 30 C88 29 84 27 84 24Z" fill="#ff7aa5" ${S(1.2)}/>
    <path d="M10 70 C10 68 13 68 13 70 C13 68 16 68 16 70 C16 72 13 74 13 75 C13 74 10 72 10 70Z" fill="#ff7aa5" ${S(1.2)}/>`;

  // No.034 チビドラン
  A['pachimon.chibidoran'] = () => `${shadow(26)}
    <path d="M70 70 C84 68 88 58 82 52" ${N} ${S(5.6)}/><path d="M70 70 C84 68 88 58 82 52" ${N} ${S(3.2, '#6fbfab')}/>
    <path d="M82 52 L78 46 L86 48Z" fill="#fff3c4" ${S(1.6)}/>
    <path d="M30 50 C20 42 13 46 15 55 C19 55 23 57 27 59Z" fill="#a8e3d4" ${S(2)}/>
    ${mir(`<path d="M30 50 C20 42 13 46 15 55 C19 55 23 57 27 59Z" fill="#a8e3d4" ${S(2)}/>`)}
    <path d="M38 30 L33 17 L44 26Z" fill="#fff3c4" ${S(1.8)}/>${mir(`<path d="M38 30 L33 17 L44 26Z" fill="#fff3c4" ${S(1.8)}/>`)}
    <path d="M50 25 C66 25 75 37 75 51 C75 63 66 72 50 72 C34 72 25 63 25 51 C25 37 34 25 50 25Z" fill="#82d0bd" ${S()}/>
    <ellipse cx="50" cy="58" rx="12" ry="8" fill="#fff0c4"/>
    ${eye(41, 47, 4.2)}${eye(59, 47, 4.2)}${cheek(32, 55)}${cheek(68, 55)}${open(50, 56, 3.4, 3.2)}${fangs(50, 56)}
    <path d="M21 67 L28 60 L34 68 L40 60 L46 68 L52 60 L58 68 L64 60 L70 68 L79 61 C81 80 70 92 50 92 C30 92 19 80 21 67Z" fill="#fffaf0" ${S()}/>
    <circle cx="34" cy="80" r="3" fill="#d5f0e6"/><circle cx="62" cy="84" r="2.4" fill="#d5f0e6"/><circle cx="52" cy="76" r="1.8" fill="#d5f0e6"/>
    <ellipse cx="33" cy="66" rx="4.4" ry="3.4" fill="#82d0bd" ${S(1.8)}/><ellipse cx="67" cy="66" rx="4.4" ry="3.4" fill="#82d0bd" ${S(1.8)}/>`;

  // No.035 ドラゴニオ
  A['pachimon.doragonio'] = () => `${shadow(30)}
    <path d="M32 50 C18 30 6 26 4 34 C10 36 12 40 10 44 C16 44 18 48 16 52 C22 52 26 56 30 60Z" fill="#a6c0ff" ${S(2)}/>
    <path d="M10 34 C18 40 24 46 28 52" ${N} ${S(1.2, '#6f8fe0')}/>
    ${mir(`<path d="M32 50 C18 30 6 26 4 34 C10 36 12 40 10 44 C16 44 18 48 16 52 C22 52 26 56 30 60Z" fill="#a6c0ff" ${S(2)}/><path d="M10 34 C18 40 24 46 28 52" ${N} ${S(1.2, '#6f8fe0')}/>`)}
    <path d="M66 80 C80 84 90 78 93 68" ${N} ${S(6.4)}/><path d="M66 80 C80 84 90 78 93 68" ${N} ${S(4, '#5f86e0')}/>
    <path d="M93 68 L88 62 L98 62Z" fill="#5f86e0" ${S(1.8)}/>
    <path d="M50 26 C64 26 72 36 72 48 C78 56 80 68 76 78 C72 88 60 92 50 92 C40 92 28 88 24 78 C20 68 22 56 28 48 C28 36 36 26 50 26Z" fill="#6f92e6" ${S()}/>
    <path d="M50 54 C60 54 66 64 66 75 C66 85 58 90 50 90 C42 90 34 85 34 75 C34 64 40 54 50 54Z" fill="#fff0c4" ${S(1.4)}/>
    <path d="M37 66 L63 66 M35 74 L65 74 M37 82 L63 82" ${S(1.2, '#e6cf8f')}/>
    <path d="M38 30 C34 22 34 16 38 11 C40 17 42 22 44 27Z" fill="#fff3c4" ${S(1.8)}/>${mir(`<path d="M38 30 C34 22 34 16 38 11 C40 17 42 22 44 27Z" fill="#fff3c4" ${S(1.8)}/>`)}
    <path d="M47 27 L50 21 L53 27Z" fill="#4a6ccf" ${S(1.4)}/>
    ${eye(42, 41, 3.6)}${eye(58, 41, 3.6)}${brows(35, 0.8)}
    <circle cx="47" cy="47" r=".9" fill="${O}"/><circle cx="53" cy="47" r=".9" fill="${O}"/>
    ${smile(50, 50, 3.2)}${fangs(50, 50)}
    <path d="M30 88 C30 82 38 82 40 88Z" fill="#4a6ccf" ${S(2)}/><path d="M60 88 C62 82 70 82 70 88Z" fill="#4a6ccf" ${S(2)}/>`;

  // No.036 ギャラクシオン
  A['pachimon.garakushion'] = (u) => `${shadow(30)}
    <defs><linearGradient id="${u}n" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9b7bff"/><stop offset=".5" stop-color="#ff8fd1"/><stop offset="1" stop-color="#4cc9f0"/></linearGradient></defs>
    <path d="M30 50 C14 32 3 30 2 40 C8 42 8 48 6 52 C14 50 16 56 14 61 C20 58 26 60 30 63Z" fill="url(#${u}n)" ${S(2)}/>
    ${mir(`<path d="M30 50 C14 32 3 30 2 40 C8 42 8 48 6 52 C14 50 16 56 14 61 C20 58 26 60 30 63Z" fill="url(#${u}n)" ${S(2)}/>`)}
    <path d="M68 82 C84 88 94 78 90 66" ${N} ${S(6)}/><path d="M68 82 C84 88 94 78 90 66" ${N} ${S(3.6, '#2e3a7a')}/>
    ${star(90, 62, 5, '#ffe680')}
    <path d="M38 30 C35 21 37 15 41 11 C42 17 43 22 45 27Z" fill="#ffe680" ${S(1.8)}/>${mir(`<path d="M38 30 C35 21 37 15 41 11 C42 17 43 22 45 27Z" fill="#ffe680" ${S(1.8)}/>`)}
    <path d="M50 24 C68 24 78 38 78 54 C78 74 66 88 50 88 C34 88 22 74 22 54 C22 38 32 24 50 24Z" fill="#2e3a7a" ${S()}/>
    <ellipse cx="50" cy="72" rx="15" ry="12" fill="#4a5ab0"/>
    <circle cx="32" cy="66" r="1.2" fill="#fff"/><circle cx="68" cy="62" r="1.4" fill="#fff"/><circle cx="44" cy="80" r="1" fill="#fff"/>
    <circle cx="60" cy="78" r="1.2" fill="#ffe680"/><circle cx="66" cy="38" r="1" fill="#fff"/><circle cx="30" cy="42" r="1.2" fill="#ffe680"/>
    ${sparkle(56, 70, 2.6, '#fff')}${sparkle(38, 74, 2, '#ffe680')}
    ${star(50, 34, 4.6, '#ffe680', 1.4)}
    ${eye(41, 52, 4.4)}${eye(59, 52, 4.4)}${sparkle(39.6, 50, 1.4)}${sparkle(57.6, 50, 1.4)}
    ${cheek(32, 60, '#ff8fd1')}${cheek(68, 60, '#ff8fd1')}<path d="M46 60 Q50 63 54 60" ${N} ${S(2.2, '#fff')}/>`;

  // No.037 ガチャモン
  const gachamon = (u, top, band, extra = '') => `
    <path d="M22 62 C13 62 11 70 15 73" ${N} ${S(2.4)}/><circle cx="15" cy="74" r="3.4" fill="#fff" ${S(1.8)}/>
    <path d="M78 58 C86 54 88 46 86 40" ${N} ${S(2.4)}/><circle cx="86" cy="38" r="3.4" fill="#fff" ${S(1.8)}/>
    <path d="M41 84 L39 90 M59 84 L61 90" ${S(2.6)}/><ellipse cx="38" cy="91" rx="5" ry="2.6" fill="#fff" ${S(1.8)}/><ellipse cx="62" cy="91" rx="5" ry="2.6" fill="#fff" ${S(1.8)}/>
    <path d="M20 56 A30 30 0 0 1 80 56 Z" fill="${top}" ${S()}/>
    <path d="M20 56 A30 30 0 0 0 80 56 Z" fill="#fff" ${S()}/>
    <rect x="18" y="52.6" width="64" height="6.8" rx="3.4" fill="${band}" ${S(2)}/>
    <ellipse cx="36" cy="38" rx="7" ry="4" fill="#fff" opacity=".6" transform="rotate(-30 36 38)"/>
    ${extra}
    ${eye(41, 67, 4)}${eye(59, 67, 4)}${cheek(32, 74, '#ff8fb8')}${cheek(68, 74, '#ff8fb8')}${open(50, 74, 3.4, 3.4)}`;
  A['pachimon.gachamon'] = (u) => `${shadow(24)}${gachamon(u, '#ff6fa5', '#ffd1e3')}`;

  // No.038 キンガチャモン
  A['pachimon.kingachamon'] = (u) => `${glow(u, '#ffe680')}
    <defs><linearGradient id="${u}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset=".5" stop-color="#ffc61a"/><stop offset="1" stop-color="#f0a500"/></linearGradient></defs>
    ${gachamon(u, `url(#${u}g)`, '#fff2a8', `<path d="M38 28 L40 16 L45 23 L50 13 L55 23 L60 16 L62 28Z" fill="#ffd23f" ${S(2)}/><circle cx="50" cy="23" r="2" fill="#ff6b8b"/>`)}
    ${sparkle(14, 30, 5, '#fff')}${sparkle(86, 20, 4, '#fff')}${sparkle(88, 78, 3.4, '#fff6c8')}${sparkle(12, 84, 3, '#fff6c8')}`;

  // No.039 ルナリス
  A['pachimon.runaris'] = (u) => `${glow(u, '#e8e0ff', 46, 50)}
    <path d="M78 14 C64 16 56 30 60 44 C64 58 78 64 90 60 C78 56 70 44 72 32 C74 22 78 16 78 14Z" fill="#ffe680" ${S(2)}/>
    <path d="M40 40 C34 24 34 10 40 6 C46 12 46 26 46 38Z" fill="#f4f1ff" ${S(2)}/><path d="M40 34 C38 26 38 18 40 12" ${N} ${S(1.6, '#ffc2dc')}/>
    <path d="M56 38 C60 26 70 20 76 22 C72 28 66 32 60 40Z" fill="#f4f1ff" ${S(2)}/>
    <ellipse cx="50" cy="62" rx="22" ry="23" fill="#faf8ff" ${S()}/>
    <ellipse cx="50" cy="72" rx="12" ry="9" fill="#efeaff"/>
    <path d="M52 44 C49 44 47 47 48.4 49.6 C47 49 46 47 46.6 45 C47.4 43 50 42.6 52 44Z" fill="#ffd23f" ${S(1)}/>
    ${happy(42, 59, 3.6)}${happy(58, 59, 3.6)}${cheek(34, 65, '#ffb3d1')}${cheek(66, 65, '#ffb3d1')}${smile(50, 66, 2.6)}
    ${cloud(86)}
    ${sparkle(16, 26, 4, '#fff')}${sparkle(24, 52, 2.6, '#ffe680')}${sparkle(84, 74, 3, '#fff')}`;

  // No.040 ニジノオオトリ
  A['pachimon.nijinoootori'] = (u) => {
    const cols = ['#ff6b6b', '#ffa94d', '#ffd93d', '#6bd68a', '#4cc9f0', '#9b7bff'];
    let fan = '';
    [-75, -45, -15, 15, 45, 75].forEach((a, i) => {
      fan += `<ellipse cx="50" cy="36" rx="7" ry="24" fill="${cols[i]}" ${S(2)} transform="rotate(${a} 50 62)"/>`;
      fan += `<circle cx="50" cy="20" r="3.2" fill="#fff" opacity=".8" transform="rotate(${a} 50 62)"/>`;
    });
    return `${glow(u, '#fff2c8', 48, 50)}${fan}
    <ellipse cx="50" cy="68" rx="18" ry="20" fill="#fff" ${S()}/>
    <path d="M32 64 C24 70 26 82 34 84 C36 78 38 72 40 68Z" fill="#fff" ${S(2)}/>${mir(`<path d="M32 64 C24 70 26 82 34 84 C36 78 38 72 40 68Z" fill="#fff" ${S(2)}/>`)}
    <path d="M28 80 L33 83 M72 80 L67 83" ${S(2.4, '#9b7bff')}/>
    <circle cx="50" cy="48" r="14" fill="#fff" ${S()}/>
    <path d="M46 35 C44 28 46 24 48 22 M50 34 L50 22 M54 35 C56 28 54 24 52 22" ${N} ${S(2, '#ff6b6b')}/>
    <circle cx="48" cy="22" r="2" fill="#ffd93d"/><circle cx="50" cy="21" r="2" fill="#6bd68a"/><circle cx="52" cy="22" r="2" fill="#4cc9f0"/>
    ${eye(44, 47, 3.4)}${eye(56, 47, 3.4)}${sparkle(42.8, 45.4, 1.2)}${sparkle(54.8, 45.4, 1.2)}
    <path d="M47 53 L53 53 L50 58Z" fill="#ffc61a" ${S(1.4)}/>${cheek(38, 53, '#ffb3c7', 3.2, 2)}${cheek(62, 53, '#ffb3c7', 3.2, 2)}
    <path d="M44 86 L42 92 M56 86 L58 92" ${S(2.2, '#e0942e')}/>
    ${sparkle(12, 20, 4.4, '#fff')}${sparkle(88, 26, 3.6, '#fff')}${sparkle(90, 84, 3, '#fff6c8')}`;
  };

  /* ================================================================
   * 家族（20人）
   * ================================================================ */

  // ひろ（メガネの30歳）
  A['family.hiro'] = () => `${shadow(22)}
    ${body(20, '#5b8def')}<path d="M42 64 L50 72 L58 64" ${N} ${S(2, '#fff')}/>
    <rect x="44" y="76" width="12" height="3" rx="1.5" fill="#4a78d4"/>
    ${hand(31, 84)}${hand(69, 82)}
    <rect x="65" y="70" width="8" height="10" rx="2" fill="#c98a5a" ${S(1.6)}/><ellipse cx="69" cy="81" rx="6" ry="2.4" fill="#e84a5f" ${S(1.4)}/>
    ${head()}
    <path d="M27 41 C25 20 38 14 52 15 C66 16 76 24 73 41 C70 32 64 27 55 28 C49 32 41 34 34 35 C31 36 29 38 27 41Z" fill="#2f2525" ${S(2)}/>
    <path d="M55 28 C58 30 62 30 66 29" ${N} ${S(1.2, '#4a3a3a')}/>
    ${dot(41, 45, 2.4)}${dot(59, 45, 2.4)}${roundGlasses('#2b2b2b')}
    ${cheek(33, 52, '#ffaaa0', 3.4, 2.2)}${cheek(67, 52, '#ffaaa0', 3.4, 2.2)}${smile(50, 53, 3)}`;

  // はる（29歳）
  A['family.haru'] = () => `${shadow(22)}
    <path d="M24 42 C22 18 78 18 76 42 L80 74 C70 80 30 80 20 74Z" fill="#6b4430" ${S(2)}/>
    ${body(19, '#ff8fb8')}<path d="M36 72 C44 76 56 76 64 72" ${N} ${S(1.6, '#fff')}/>
    <path d="M42 78 A8 8 0 0 1 58 78 Z" fill="#ff6fa5" ${S(1.8)}/><path d="M42 78 A8 8 0 0 0 58 78 Z" fill="#fff" ${S(1.8)}/>
    ${hand(41, 80)}${hand(59, 80)}
    ${head()}
    <path d="M27 41 C26 22 40 16 52 17 C64 18 75 26 73 41 C68 34 62 30 56 31 C52 35 46 37 40 36 C36 37 30 38 27 41Z" fill="#7a4e38" ${S(2)}/>
    ${star(68, 28, 4, '#ffd23f', 1.4)}
    ${happy(41, 45, 3.6)}${happy(59, 45, 3.6)}${cheek(33, 51, '#ff8fa3')}${cheek(67, 51, '#ff8fa3')}${open(50, 52, 3.6, 3.4)}`;

  // ゆたか（ひろの父）
  A['family.yutaka'] = () => `${shadow(22)}
    ${body(21, '#6aa58c')}<path d="M43 64 L50 70 L57 64 L54 62 L50 66 L46 62Z" fill="#fff" ${S(1.6)}/>
    <circle cx="50" cy="76" r="1.2" fill="#fff"/><circle cx="50" cy="83" r="1.2" fill="#fff"/>
    ${hand(31, 84)}${hand(69, 84)}
    ${head()}
    <path d="M27 40 C25 22 38 16 50 16 C64 16 76 24 73 40 C68 30 58 27 50 28 C42 28 32 32 27 40Z" fill="#a9a9a9" ${S(2)}/>
    <path d="M35 38 L44 38 M56 38 L65 38" ${S(2.6, '#8a8a8a')}/>
    ${happy(41, 45, 3.4)}${happy(59, 45, 3.4)}
    <path d="M32 47 L30 49 M68 47 L70 49" ${S(1.2)}/>
    ${cheek(34, 52, '#ffaaa0', 3.4, 2.2)}${cheek(66, 52, '#ffaaa0', 3.4, 2.2)}${smile(50, 53, 3.4)}`;

  // ゆみこ（ひろの母・メガネ・ミディアムヘア）
  A['family.yumiko'] = () => `${shadow(22)}
    <path d="M24 42 C22 16 78 16 76 42 L77 62 C68 66 32 66 23 62Z" fill="#6e5244" ${S(2)}/>
    ${body(20, '#e88aa8')}<path d="M50 64 L50 95" ${S(1.6)}/>
    <circle cx="46" cy="74" r="1.3" fill="#fff"/><circle cx="46" cy="82" r="1.3" fill="#fff"/><circle cx="46" cy="90" r="1.3" fill="#fff"/>
    ${hand(31, 84)}${hand(69, 84)}
    ${head()}
    <path d="M27 42 C25 22 38 16 50 17 C63 17 75 24 73 40 C70 34 64 30 58 30 C50 33 40 34 34 36 C31 37 29 39 27 42Z" fill="#7d5e4e" ${S(2)}/>
    ${dot(41, 45, 2.3)}${dot(59, 45, 2.3)}${roundGlasses('#b0566b', 45, 6)}
    ${cheek(33, 52, '#ff9fb0', 3.4, 2.2)}${cheek(67, 52, '#ff9fb0', 3.4, 2.2)}${smile(50, 53, 3)}`;

  // やす（ひろの兄・細身のオタク）
  A['family.yasu'] = () => `${shadow(18)}
    ${body(14, '#7a6fd0')}
    <path d="M45 72 C45 70 47 70 48 72 C49 70 51 70 51 72 C51 74 48 76 48 76 C48 76 45 74 45 72Z" fill="#ff8fb8"/>
    <rect x="38" y="77" width="24" height="10" rx="5" fill="#3a3a44" ${S(1.8)}/>
    <path d="M42 82 L46 82 M44 80 L44 84" ${S(1.4, '#fff')}/><circle cx="55" cy="81" r="1.2" fill="#ff6b6b"/><circle cx="58" cy="83" r="1.2" fill="#5cc8ff"/>
    ${hand(38, 84)}${hand(62, 84)}
    ${head(SK, 21, 21)}
    <path d="M28 42 C25 20 38 13 52 14 C66 15 77 23 72 42 C70 35 67 33 63 35 L61 28 L57 34 L53 27 L49 34 L45 27 L41 34 C36 33 31 36 28 42Z" fill="#2b2b2b" ${S(2)}/>
    <path d="M50 15 C47 7 54 5 57 10" ${N} ${S(2.2)}/>
    ${dot(41, 46, 2.4)}${dot(59, 46, 2.4)}${cheek(34, 52, '#ffaaa0', 3, 2)}${cheek(66, 52, '#ffaaa0', 3, 2)}${open(50, 53, 3, 3)}
    <path d="M70 26 L74 22 M73 30 L78 29" ${S(1.6, '#ff6b8b')}/>`;

  // よし（ひろの兄・美容師・いかつい）
  A['family.yoshi'] = () => `${shadow(22)}
    ${body(21, '#2f2f34')}<path d="M40 72 L60 72" ${S(1.4, '#555')}/>
    ${hand(31, 84)}${hand(70, 80)}
    <g transform="translate(74 78) rotate(-30)"><circle cx="-4" cy="6" r="3" ${N} ${S(1.8, '#c0c0c8')}/><circle cx="4" cy="6" r="3" ${N} ${S(1.8, '#c0c0c8')}/><path d="M-2 3 L3 -10 M2 3 L-3 -10" ${S(1.8, '#c0c0c8')}/></g>
    ${head()}
    <path d="M28.6 39 C28 33 29.6 29 33 27 L33.6 36Z" fill="#7a7a7a" opacity=".5"/>${mir(`<path d="M28.6 39 C28 33 29.6 29 33 27 L33.6 36Z" fill="#7a7a7a" opacity=".5"/>`)}
    <path d="M30 35 C27 16 44 7 60 9 C73 11 77 20 72 35 C66 27 56 24 46 26 C40 27 34 30 30 35Z" fill="#1f1a1a" ${S(2)}/>
    <path d="M44 14 C50 12 58 13 64 17" ${N} ${S(1.2, '#4a4040')}/>
    <path d="M34 39 L45 42 M66 39 L55 42" ${S(3.2)}/>
    <path d="M37 46 L45 46 M55 46 L63 46" ${S(2.8)}/>
    <path d="M33 50 C36 61 64 61 67 50 C64 64 36 64 33 50Z" fill="#7a6a62" opacity=".35"/>
    <path d="M45 55 L55 55" ${S(2.4)}/>
    <circle cx="28.5" cy="49.5" r="1.8" ${N} ${S(1.2, '#c0c0c8')}/>`;

  // 橋ジー（ひろのおじいちゃん・はげ）
  A['family.hashiji'] = () => `${shadow(22)}
    ${body(21, '#8c7a5b')}<path d="M50 64 L50 95" ${S(1.4)}/><circle cx="54" cy="76" r="1.2" fill="#e8dcc0"/><circle cx="54" cy="84" r="1.2" fill="#e8dcc0"/>
    <path d="M74 66 L76 95" ${S(2.6, '#8a5a3a')}/><path d="M74 66 C74 60 80 60 80 64" ${N} ${S(2.6, '#8a5a3a')}/>
    ${hand(31, 84)}${hand(74, 70)}
    ${head()}
    <path d="M27 46 C22 40 24 33 28 32 C30 36 31 41 31 46Z" fill="#f0f0f0" ${S(1.8)}/>${mir(`<path d="M27 46 C22 40 24 33 28 32 C30 36 31 41 31 46Z" fill="#f0f0f0" ${S(1.8)}/>`)}
    <ellipse cx="40" cy="27" rx="6" ry="3" fill="#fff" opacity=".8" transform="rotate(-20 40 27)"/>
    ${sparkle(30, 18, 3.2, '#ffe680')}
    <path d="M42 33 Q50 31 58 33 M44 36.5 Q50 35 56 36.5" ${N} ${S(1.2, '#d9a98a')}/>
    <path d="M35 40 Q40 38 45 40 M55 40 Q60 38 65 40" ${N} ${S(2.8, '#e8e8e8')}/>
    ${happy(41, 45, 3.4)}${happy(59, 45, 3.4)}
    <path d="M42 52 C46 49.5 50 52 50 52 C50 52 54 49.5 58 52 C56 56 52 55 50 54 C48 55 44 56 42 52Z" fill="#f0f0f0" ${S(1.6)}/>
    ${cheek(33, 51, '#ffaaa0', 3.2, 2)}${cheek(67, 51, '#ffaaa0', 3.2, 2)}`;

  // 橋バー（ひろのおばあちゃん）
  A['family.hashiba'] = () => `${shadow(22)}
    <circle cx="50" cy="16" r="8" fill="#cfcfcf" ${S(2)}/><path d="M44 12 L58 18" ${S(1.6, '#b07a4a')}/>
    <path d="M25 42 C23 18 77 18 75 42 L74 50 C66 46 34 46 26 50Z" fill="#cfcfcf" ${S(2)}/>
    ${body(21, '#a97fc4')}<path d="M38 70 L62 70 L64 95 L36 95Z" fill="#fff" ${S(1.8)}/>
    <path d="M44 80 L50 72 L56 80Z" fill="#fff" ${S(1.6)}/><path d="M45.5 79 L54.5 79 L54.5 76 L45.5 76Z" fill="#2f4f3f"/>
    ${hand(42, 80)}${hand(58, 80)}
    ${head()}
    <path d="M27 40 C27 24 40 18 50 20 C60 18 73 24 73 40 C68 32 58 28 50 30 C42 28 32 32 27 40Z" fill="#dadada" ${S(2)}/>
    ${happy(41, 45, 3.4)}${happy(59, 45, 3.4)}<path d="M32 46 L30 48 M68 46 L70 48" ${S(1.1)}/>
    ${cheek(33, 51, '#ff9fb0', 3.6, 2.2)}${cheek(67, 51, '#ff9fb0', 3.6, 2.2)}${smile(50, 53, 3)}`;

  // 澤ジー（ひろのおじいちゃん・はげてない・メガネ）
  A['family.sawaji'] = () => `${shadow(22)}
    ${body(21, '#6b8fb3')}<path d="M40 64 L40 95 M60 64 L60 95" ${S(1.4)}/><path d="M44 64 L50 70 L56 64" fill="#fff" ${S(1.6)}/>
    <path d="M47 70 L50 74 L53 70 L50 68Z" fill="#c43a28" ${S(1.2)}/>
    ${hand(31, 84)}${hand(69, 84)}
    ${head()}
    <path d="M27 41 C23 18 40 11 52 12 C67 13 78 21 73 41 C71 33 63 28 55 30 C47 28 34 30 27 41Z" fill="#f2f2f2" ${S(2)}/>
    <path d="M36 20 C40 16 46 15 50 16 M56 15 C62 16 66 19 68 22" ${N} ${S(1.2, '#cfcfcf')}/>
    ${dot(41, 46, 2.3)}${dot(59, 46, 2.3)}${squareGlasses('#555', 46, 2.2)}
    <path d="M36 39 Q41 37 46 39 M54 39 Q59 37 64 39" ${N} ${S(2.4, '#d0d0d0')}/>
    ${cheek(33, 53, '#ffaaa0', 3.2, 2)}${cheek(67, 53, '#ffaaa0', 3.2, 2)}${smile(50, 55, 3)}`;

  // 澤バー（伝説）
  A['family.sawaba'] = (u) => `${glow(u, '#fff2c0', 48, 50)}
    ${angelWings()}${mir(angelWings())}
    <circle cx="50" cy="17" r="7.5" fill="#d8d8d8" ${S(2)}/>
    <path d="M25 42 C23 18 77 18 75 42 L74 50 C66 46 34 46 26 50Z" fill="#d8d8d8" ${S(2)}/>
    ${body(20, '#d8c8f0')}<path d="M40 64 L50 80 L60 64" ${N} ${S(1.8, '#fff')}/>
    ${hand(40, 82)}${hand(60, 82)}
    ${head()}
    <path d="M27 40 C27 24 40 19 50 21 C60 19 73 24 73 40 C68 32 58 28 50 30 C42 28 32 32 27 40Z" fill="#e4e4e4" ${S(2)}/>
    ${halo(10)}
    ${happy(41, 45, 3.4)}${happy(59, 45, 3.4)}${cheek(33, 51, '#ffb3c7', 3.6, 2.2)}${cheek(67, 51, '#ffb3c7', 3.6, 2.2)}${smile(50, 53, 3.2)}
    ${cloud(90)}
    ${sparkle(14, 24, 4.4, '#ffe680')}${sparkle(86, 30, 3.6, '#ffe680')}${sparkle(88, 64, 3, '#fff')}`;

  // みちよ（はるの母・おばあちゃんと同じ名前）
  A['family.michiyo'] = () => `${shadow(22)}
    <path d="M24 42 C22 18 78 18 76 42 L76 58 C66 61 34 61 24 58Z" fill="#5a3a2a" ${S(2)}/>
    ${body(20, '#f2a65a')}<path d="M40 70 C46 74 54 74 60 70" ${N} ${S(1.6, '#fff')}/>
    <path d="M70 76 C76 72 80 66 80 60" ${N} ${S(5.6)}/><path d="M70 76 C76 72 80 66 80 60" ${N} ${S(3.4, '#f2a65a')}/>
    ${hand(31, 84)}${hand(80, 57, SK, 4.6)}
    <path d="M86 50 L88 47 M84 48 L84 44 M89 54 L92 53" ${S(1.4, '#ff8a4c')}/>
    ${head()}
    <path d="M27 40 C26 22 40 17 50 17 C60 17 74 22 73 40 L70 34 L63 36 L57 33 L50 36 L43 33 L37 36 L30 34Z" fill="#6a4532" ${S(2)}/>
    ${happy(41, 45, 3.6)}${happy(59, 45, 3.6)}${cheek(33, 51, '#ff8fa3')}${cheek(67, 51, '#ff8fa3')}${open(50, 52, 4, 3.6)}`;

  // こーいち（はるの父・気弱）
  A['family.kouichi'] = () => `${shadow(22)}
    ${body(20, '#9bb7d4')}<path d="M44 64 L50 69 L56 64" fill="#fff" ${S(1.6)}/>
    <path d="M50 69 L47 78 L50 86 L53 78Z" fill="#5b6fb0" ${S(1.4)}/>
    <path d="M70 72 C76 64 76 50 70 40" ${N} ${S(5.6)}/><path d="M70 72 C76 64 76 50 70 40" ${N} ${S(3.4, '#9bb7d4')}/>
    ${hand(31, 84)}
    ${head()}
    <path d="M28 40 C26 24 38 18 50 18 C62 18 74 24 72 40 C68 33 64 30 60 31 L56 27 C50 26 42 27 36 31 C32 33 30 36 28 40Z" fill="#555" ${S(2)}/>
    ${hand(69, 38)}
    <path d="M35 40 L45 37 M65 40 L55 37" ${S(2.2)}/>
    ${dot(41, 46, 2.3)}${dot(59, 46, 2.3)}
    <path d="M44 55 Q47 53 50 55 Q53 57 56 55" ${N} ${S(2)}/>
    ${cheek(34, 52, '#ffaaa0', 3.2, 2)}${cheek(66, 52, '#ffaaa0', 3.2, 2)}${sweat(78, 30)}`;

  // なつ（はるの妹・ちょっと体格大きめ）
  A['family.natsu'] = () => `${shadow(28)}
    <path d="M70 26 C84 22 92 36 87 52 C84 45 80 40 73 38Z" fill="#4a2e22" ${S(2)}/>
    <path d="M30 70 C20 66 12 70 10 76" ${N} ${S(6)}/><path d="M30 70 C20 66 12 70 10 76" ${N} ${S(3.6, '#5cc8a8')}/>
    ${mir(`<path d="M30 70 C20 66 12 70 10 76" ${N} ${S(6)}/><path d="M30 70 C20 66 12 70 10 76" ${N} ${S(3.6, '#5cc8a8')}/>`)}
    ${hand(10, 78)}${hand(90, 78)}
    ${body(26, '#5cc8a8', 63)}<path d="M40 72 C46 76 54 76 60 72" ${N} ${S(1.6, '#fff')}/>
    ${head(SK, 24, 22)}
    <circle cx="71" cy="30" r="3.6" fill="#ffd23f" ${S(1.6)}/>
    <path d="M26 41 C24 20 40 14 52 15 C66 16 77 24 74 41 C68 32 60 28 52 30 C44 28 33 32 26 41Z" fill="#5a3828" ${S(2)}/>
    ${happy(40, 45, 3.8)}${happy(60, 45, 3.8)}${cheek(31, 51, '#ff8fa3', 5, 3)}${cheek(69, 51, '#ff8fa3', 5, 3)}${open(50, 52, 4.2, 3.8)}`;

  // しゅんすけ（はるの弟・気弱）
  A['family.shunsuke'] = () => `${shadow(20)}
    ${body(18, '#f3d36b')}<path d="M44 64 C44 70 56 70 56 64" ${N} ${S(1.6)}/>
    <path d="M46 68 L45 75 M54 68 L55 75" ${S(1.4)}/><circle cx="45" cy="76.4" r="1.4" fill="#fff" ${S(1)}/><circle cx="55" cy="76.4" r="1.4" fill="#fff" ${S(1)}/>
    <rect x="40" y="81" width="20" height="8" rx="3" fill="#e8c24a" ${S(1.4)}/>
    ${hand(33, 85)}${hand(67, 85)}
    ${head()}
    <path d="M25 45 C22 16 78 16 75 45 C70 38 62 36 50 36 C38 36 30 38 25 45Z" fill="#2b2b2b" ${S(2)}/>
    <path d="M36 41 L45 38.6 M64 41 L55 38.6" ${S(2.2)}/>
    ${dot(41, 47, 2.3)}${dot(59, 47, 2.3)}
    <path d="M45 55 Q47.5 53 50 55 Q52.5 57 55 55" ${N} ${S(2)}/>
    ${cheek(34, 52, '#ffaaa0', 3.2, 2)}${cheek(66, 52, '#ffaaa0', 3.2, 2)}${sweat(23, 36)}${sweat(78, 40)}`;

  // みちよ（はるのおばあちゃん・何か押しながら歩く）
  A['family.michiyoba'] = () => {
    const curls = [[28, 34], [33, 25], [41, 19], [50, 17], [59, 19], [67, 25], [72, 34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#efefef" ${S(2)}/>`).join('');
    return `${shadow(30)}
    <g transform="translate(-10 0)">
      ${body(18, '#d98b8b')}<path d="M36 70 L64 70" ${S(1.4, '#fff')}/>
      ${curls}
      ${head()}
      ${[[36, 29], [43, 25.5], [50, 24.5], [57, 25.5], [64, 29]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.4" fill="#efefef" ${S(1.8)}/>`).join('')}
      ${happy(41, 45, 3.2)}${happy(59, 45, 3.2)}<path d="M32 46 L30 48 M68 46 L70 48" ${S(1.1)}/>
      ${cheek(33, 51, '#ff9fb0', 3.4, 2.2)}${cheek(67, 51, '#ff9fb0', 3.4, 2.2)}${smile(50, 53, 2.8)}
    </g>
    <path d="M62 66 L66 58 L72 58" ${N} ${S(2.6, '#777')}/>
    <rect x="62" y="68" width="30" height="17" rx="4" fill="#8f7fe0" ${S(2)}/>
    <path d="M66 72 L88 72 M66 77 L88 77 M66 82 L88 82" ${S(1, '#b3a8ef')}/>
    <path d="M60 68 L66 58" ${S(2.6, '#777')}/>
    ${hand(60, 66)}
    <circle cx="67" cy="90" r="4" fill="#555" ${S(1.6)}/><circle cx="87" cy="90" r="4" fill="#555" ${S(1.6)}/>
    <text x="77" y="81" font-size="8" font-weight="800" fill="#fff" text-anchor="middle" font-family="sans-serif">?</text>
    <path d="M4 70 L12 70 M2 76 L10 76 M6 82 L14 82" ${S(1.6, '#c8c0d8')}/>`;
  };

  // あいこばー（伝説）
  A['family.aikoba'] = (u) => {
    const curls = [[28, 34], [33, 25], [41, 19], [50, 17], [59, 19], [67, 25], [72, 34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#f2eef6" ${S(2)}/>`).join('');
    return `${glow(u, '#ffe0f0', 48, 50)}
    ${angelWings()}${mir(angelWings())}
    ${body(20, '#f7c6d9')}<path d="M40 64 L50 80 L60 64" ${N} ${S(1.8, '#fff')}/>
    ${hand(40, 82)}${hand(60, 82)}
    ${curls}${head()}
    ${[[36, 29], [43, 25.5], [50, 24.5], [57, 25.5], [64, 29]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.4" fill="#f2eef6" ${S(1.8)}/>`).join('')}
    ${halo(8)}
    ${happy(41, 45, 3.4)}${happy(59, 45, 3.4)}${cheek(33, 51, '#ff9fc7', 3.6, 2.2)}${cheek(67, 51, '#ff9fc7', 3.6, 2.2)}${smile(50, 53, 3.2)}
    ${cloud(90)}
    ${sparkle(14, 24, 4.4, '#ff9fc7')}${sparkle(86, 30, 3.6, '#ffe680')}${sparkle(12, 60, 3, '#fff')}`;
  };

  // よーこばちゃん（ひろのおば）
  A['family.yoko'] = () => {
    const curls = [[28, 36], [32, 26], [40, 20], [50, 18], [60, 20], [68, 26], [72, 36]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6.6" fill="#7a4434" ${S(2)}/>`).join('');
    return `${shadow(22)}
    ${body(20, '#7fc4e8')}<path d="M38 70 L62 70 M38 76 L62 76" ${S(1.2, '#5aa8d0')}/>
    ${hand(31, 84)}${hand(70, 78)}
    <path d="M66 74 L70 78 L74 74 L70 70Z" fill="#ff8fb8" ${S(1.4)}/><path d="M66 74 L62 72 L62 76Z M74 74 L78 72 L78 76Z" fill="#ffd23f" ${S(1.2)}/>
    ${curls}${head()}
    ${[[36, 29], [43, 25.5], [50, 24.5], [57, 25.5], [64, 29]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.4" fill="#7a4434" ${S(1.8)}/>`).join('')}
    <circle cx="27.5" cy="50" r="2" fill="#fff" ${S(1)}/><circle cx="72.5" cy="50" r="2" fill="#fff" ${S(1)}/>
    ${dot(41, 45, 2.3)}${dot(59, 45, 2.3)}${cheek(33, 51, '#ff9fb0', 3.4, 2.2)}${cheek(67, 51, '#ff9fb0', 3.4, 2.2)}${smile(50, 53, 3.4)}`;
  };

  // めぐちゃん・りえちゃん（そっくりのにぎやかなおば）
  const auntie = (shirt, word) => {
    const curls = [[26, 40], [27, 30], [33, 21], [42, 16], [50, 15], [58, 16], [67, 21], [73, 30], [74, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7.6" fill="#8a3b2f" ${S(2)}/>`).join('');
    return `${shadow(22)}
    <path d="M70 12 C70 4 96 4 96 12 C96 20 84 20 80 20 L74 26 L76 19 C72 18 70 16 70 12Z" fill="#fff" ${S(1.8)}/>
    <text x="83" y="15.6" font-size="8.5" font-weight="800" fill="#e84a5f" text-anchor="middle" font-family="sans-serif">${word}</text>
    ${body(20, shirt)}<path d="M40 70 L60 70" ${S(1.4, '#fff')}/>
    ${hand(31, 84)}${hand(72, 66)}
    ${curls}${head()}
    ${[[36, 29], [43, 25.5], [50, 24.5], [57, 25.5], [64, 29]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.4" fill="#8a3b2f" ${S(1.8)}/>`).join('')}
    <circle cx="27.5" cy="51" r="3" ${N} ${S(1.6, '#ffc61a')}/><circle cx="72.5" cy="51" r="3" ${N} ${S(1.6, '#ffc61a')}/>
    ${dot(41, 45, 2.3)}${dot(59, 45, 2.3)}<path d="M36 39 L45 40 M64 39 L55 40" ${S(2)}/>
    ${cheek(33, 51, '#ff8fa3', 3.6, 2.2)}${cheek(67, 51, '#ff8fa3', 3.6, 2.2)}
    <ellipse cx="50" cy="54" rx="4.6" ry="4" fill="#e8607a" ${S(2)}/>
    <path d="M14 50 L20 52 M12 58 L19 58 M14 66 L20 63" ${S(1.6, '#e84a5f')}/>`;
  };
  A['family.megu'] = () => auntie('#ff7a7a', '!!');
  A['family.rie'] = () => auntie('#7a9cff', '!?');

  // つばさ（めぐちゃんの旦那・メガネでいかつい）
  A['family.tsubasa'] = () => `${shadow(28)}
    ${body(26, '#3d3d44', 63)}<path d="M30 76 L70 76" ${S(1.4, '#5a5a62')}/>
    <path d="M28 76 C38 70 62 70 72 76 C62 82 38 82 28 76Z" fill="${SK}" ${S(2)}/>
    <path d="M28 76 C38 70 50 72 56 74" ${N} ${S(1.4, '#3d3d44')}/>
    ${head(SK, 23, 22)}
    <path d="M27 38 C27 18 73 18 73 38 C66 30 34 30 27 38Z" fill="#222" ${S(2)}/>
    <path d="M32 28 L68 28" ${S(1, '#555')}/>
    <path d="M33 38 L46 41 M67 38 L54 41" ${S(3.4)}/>
    <path d="M37 46.5 L45 46.5 M55 46.5 L63 46.5" ${S(2.8)}/>
    ${squareGlasses('#111', 46, 3)}
    <path d="M30 50 C33 63 67 63 70 50 C67 66 33 66 30 50Z" fill="#6a5a52" opacity=".4"/>
    <path d="M45 56 L55 56" ${S(2.4)}/>`;

  let counter = 0;
  function render(it) {
    const f = A[it.id];
    if (!f) return `<svg viewBox="0 0 100 100" class="art"><text x="50" y="62" font-size="40" text-anchor="middle">?</text></svg>`;
    const u = `a${(counter++).toString(36)}`;
    return `<svg viewBox="0 0 100 100" class="art" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${f(u)}</svg>`;
  }

  return { render, has: (id) => !!A[id] };
})();
