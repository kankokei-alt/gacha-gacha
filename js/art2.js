/* ガチャモン セカンドシリーズ — キャラクターのイラスト（手描きSVG・立体感のある塗り）
 *
 * js/art.js の部品（線の色・線のスタイルなど）を使い、さらに
 *  - 体のグラデーション（左上から光が当たる）
 *  - アニメ風の目（上が濃く下にキャラの色・ハイライト2つ）
 *  - にじむチーク、つや、やわらかい影
 * を足して描く。座標は 0〜100 の正方形、足もとは y=92 くらい。
 */
'use strict';

(() => {
  const { O, S, N, mir, leaf, flame, sparkle, star, cloud } = Art.parts;
  let n = 0;
  const gid = () => `x2${(n++).toString(36)}`;

  // 色を明るく（p > 0）・暗く（p < 0）
  function tone(hex, p) {
    const v = parseInt(hex.slice(1), 16);
    const to = p > 0 ? [255, 255, 255] : [42, 26, 48];
    const k = Math.abs(p);
    const c = [v >> 16, (v >> 8) & 255, v & 255].map((x, i) => Math.round(x + (to[i] - x) * k));
    return `#${((1 << 24) | (c[0] << 16) | (c[1] << 8) | c[2]).toString(16).slice(1)}`;
  }

  // 立体的な塗り（{ d: 定義, f: fill に入れる値 }）
  function shade(base, { cx = 0.36, cy = 0.28, r = 0.85, hi = 0.45, lo = -0.22 } = {}) {
    const id = gid();
    return {
      d: `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"><stop offset="0" stop-color="${tone(base, hi)}"/><stop offset=".55" stop-color="${base}"/><stop offset="1" stop-color="${tone(base, lo)}"/></radialGradient></defs>`,
      f: `url(#${id})`,
    };
  }
  // たての塗り（上→下）
  function vshade(top, bottom) {
    const id = gid();
    return { d: `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs>`, f: `url(#${id})` };
  }

  // アニメ風の目
  function eye(x, y, r = 4.8, iris = '#6b4fd8') {
    const id = gid();
    return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset=".25" stop-color="${O}"/><stop offset="1" stop-color="${iris}"/></linearGradient></defs>`
      + `<ellipse cx="${x}" cy="${y}" rx="${(r * 0.8).toFixed(2)}" ry="${r}" fill="url(#${id})"/>`
      + `<ellipse cx="${(x - r * 0.26).toFixed(2)}" cy="${(y - r * 0.4).toFixed(2)}" rx="${(r * 0.34).toFixed(2)}" ry="${(r * 0.4).toFixed(2)}" fill="#fff"/>`
      + `<circle cx="${(x + r * 0.32).toFixed(2)}" cy="${(y + r * 0.42).toFixed(2)}" r="${(r * 0.17).toFixed(2)}" fill="#fff" opacity=".95"/>`
      + `<path d="M${(x - r * 0.45).toFixed(2)} ${(y + r * 0.62).toFixed(2)} Q${x} ${(y + r * 0.9).toFixed(2)} ${(x + r * 0.45).toFixed(2)} ${(y + r * 0.62).toFixed(2)}" fill="none" stroke="${tone(iris, 0.5)}" stroke-width="1.1" stroke-linecap="round" opacity=".9"/>`;
  }
  // 閉じた目（にっこり）
  const smileEye = (x, y, w = 4.2) => `<path d="M${x - w} ${y + 1.2} Q${x} ${y - 3.8} ${x + w} ${y + 1.2}" ${N} ${S(2.6)}/>`;
  // にじむチーク
  function blush(x, y, c = '#ff6f9a', rx = 5.6, ry = 3.4) {
    const id = gid();
    return `<defs><radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity=".8"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#${id})"/>`;
  }
  // つや
  const gloss = (x, y, rx, ry, rot = -30, op = 0.7) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${op}" transform="rotate(${rot} ${x} ${y})"/>`;
  // 足もとのやわらかい影
  function ground(rx = 24, cy = 93) {
    const id = gid();
    return `<defs><radialGradient id="${id}"><stop offset="0" stop-color="#2a1a30" stop-opacity=".22"/><stop offset="1" stop-color="#2a1a30" stop-opacity="0"/></radialGradient></defs><ellipse cx="50" cy="${cy}" rx="${rx}" ry="4.2" fill="url(#${id})"/>`;
  }
  // 口
  const mouthW = (x, y, w = 3.6) => `<path d="M${x - w} ${y} Q${x - w / 2} ${y + w * 0.8} ${x} ${y} Q${x + w / 2} ${y + w * 0.8} ${x + w} ${y}" ${N} ${S(2.1)}/>`;
  const mouthO = (x, y, w = 4, h = 4.4) => `<path d="M${x - w} ${y} Q${x} ${y + h * 1.8} ${x + w} ${y} Q${x} ${y + 1} ${x - w} ${y}Z" fill="#c9405e" ${S(1.9)}/><path d="M${x - w * 0.5} ${y + h * 0.75} Q${x} ${y + h * 1.25} ${x + w * 0.5} ${y + h * 0.75}" fill="#ff8fa6"/>`;
  const add = (key, f) => Art.add(`pachimon2.${key}`, f);

  /* ================================================================
   * ハルカ地方のガチャモン
   * ================================================================ */

  // ハナポン（くさ）: あたまのつぼみは、うれしいことがあると少しひらく
  add('hanapon', () => {
    const b = shade('#9fdc84'), bud = shade('#ff8fbf', { cx: 0.4, cy: 0.25 });
    return `${ground()}${b.d}${bud.d}
    <path d="M50 40 L50 29" ${N} ${S(2.8, '#3f7f3a')}/>
    ${leaf(49, 35, -62, 0.62, '#7fcf62')}${leaf(51, 35, 62, 0.62, '#7fcf62')}
    <path d="M26 66 C17 62 15 72 21 76 C25 76 27 72 28 70Z" fill="#8fd16f" ${S(2.1)}/>
    ${mir(`<path d="M26 66 C17 62 15 72 21 76 C25 76 27 72 28 70Z" fill="#8fd16f" ${S(2.1)}/>`)}
    <path d="M50 38 C69 38 79 51 79 67 C79 83 67 91 50 91 C33 91 21 83 21 67 C21 51 31 38 50 38Z" fill="${b.f}" ${S()}/>
    <ellipse cx="50" cy="77" rx="15.5" ry="10" fill="#f2fbe8" opacity=".95"/>
    <path d="M40 80 Q50 84 60 80" ${N} ${S(1.2, '#bfe3a6')}/>
    ${gloss(34, 50, 6, 3.2)}
    <path d="M50 31 C41 30 36 22 38 10 C43 14 46 13 50 6 C54 13 57 14 62 10 C64 22 59 30 50 31Z" fill="${bud.f}" ${S(2.3)}/>
    <path d="M50 9 C48 16 48 24 50 30 M44 15 C44 21 46 26 49 30 M56 15 C56 21 54 26 51 30" ${N} ${S(1.1, '#e0629a')}/>
    ${gloss(43, 16, 2.2, 4, 15, 0.6)}
    ${eye(41, 61, 4.9, '#3f9a4e')}${eye(59, 61, 4.9, '#3f9a4e')}${blush(31, 68)}${blush(69, 68)}${mouthW(50, 68, 3.2)}
    <ellipse cx="38" cy="90" rx="7.5" ry="3.8" fill="#7fcf62" ${S(2.1)}/><ellipse cx="62" cy="90" rx="7.5" ry="3.8" fill="#7fcf62" ${S(2.1)}/>
    ${sparkle(80, 30, 3.4, '#ffd6e8')}`;
  });

  // ヤキイモン（ほのお・じめん）: いつもほかほか。だっこすると冬でもあたたかい
  add('yakiimon', () => {
    const b = shade('#a65fc4'), inside = vshade('#ffe28a', '#ffb43c');
    const steam = (x, d) => `<path d="M${x} 24 C${x - 4} ${18 - d} ${x + 4} ${14 - d} ${x} ${8 - d}" ${N} stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".85"/><path d="M${x} 24 C${x - 4} ${18 - d} ${x + 4} ${14 - d} ${x} ${8 - d}" ${N} stroke="#d9cce6" stroke-width="1.2" stroke-linecap="round"/>`;
    return `${ground(26)}${b.d}${inside.d}
    ${steam(40, 0)}${steam(51, 3)}${steam(62, 0)}
    ${flame(82, 80, 0.75)}
    <path d="M50 30 C71 30 81 46 81 64 C81 82 69 91 50 91 C31 91 19 82 19 64 C19 46 29 30 50 30Z" fill="${b.f}" ${S()}/>
    <path d="M24 47 C29 36 39 30 50 30 C61 30 71 36 76 47 L70 44 L65 50 L58 43 L51 50 L44 43 L37 50 L31 44Z" fill="${inside.f}" ${S(2.1)}/>
    <path d="M38 37 Q44 34 48 36 M54 35 Q60 34 64 38" ${N} ${S(1.3, '#ffcf6b')}/>
    <path d="M27 60 q3 -1 5 1 M70 72 q3 -1 5 1 M30 79 q3 -1 5 1 M68 58 q2 -1 4 1" ${N} ${S(1.5, '#6f3a8a')}/>
    ${gloss(31, 56, 4, 7, 20, 0.35)}
    ${eye(40, 62, 4.6, '#ff8a3d')}${eye(60, 62, 4.6, '#ff8a3d')}${blush(31, 70, '#ff9a6b')}${blush(69, 70, '#ff9a6b')}
    <ellipse cx="50" cy="68.5" rx="2.4" ry="1.7" fill="${O}"/>${mouthW(50, 71, 2.6)}
    <ellipse cx="38" cy="90" rx="7" ry="3.6" fill="#7a3f98" ${S(2)}/><ellipse cx="62" cy="90" rx="7" ry="3.6" fill="#7a3f98" ${S(2)}/>`;
  });

  // シズクラゲ（みず）: 雨の日だけ、そっと水たまりから顔を出す
  add('shizukurage', () => {
    const b = shade('#8fd6ff', { hi: 0.6 });
    const tent = (x, s) => `<path d="M${x} 64 C${x - 5 * s} 72 ${x + 5 * s} 78 ${x - 2 * s} 88" ${N} ${S(5.4)}/><path d="M${x} 64 C${x - 5 * s} 72 ${x + 5 * s} 78 ${x - 2 * s} 88" ${N} stroke="#bfe9ff" stroke-width="3" stroke-linecap="round"/>`;
    return `${ground(18, 95)}${b.d}
    ${tent(36, 1)}${tent(46, -1)}${tent(55, 1)}${tent(64, -1)}
    <path d="M21 62 C21 38 34 24 50 24 C66 24 79 38 79 62 C74 67 68 60 63 65 C58 69 55 62 50 65 C45 62 42 69 37 65 C32 60 26 67 21 62Z" fill="${b.f}" fill-opacity=".95" ${S()}/>
    <path d="M50 24 C47 18 48 12 50 6 C52 12 53 18 50 24Z" fill="#bfe9ff" ${S(1.8)}/>
    <path d="M30 40 C33 32 40 28 46 27" ${N} stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".85"/>
    <circle cx="68" cy="38" r="2" fill="#fff" opacity=".8"/><circle cx="72" cy="46" r="1.3" fill="#fff" opacity=".7"/>
    ${eye(41, 47, 4.8, '#2f7fd6')}${eye(59, 47, 4.8, '#2f7fd6')}${blush(31, 54, '#ff8fb8')}${blush(69, 54, '#ff8fb8')}${mouthO(50, 54, 3, 3)}
    <path d="M14 30 C14 26 18 24 18 20" ${N} ${S(1.6, '#8fd6ff')}/><circle cx="86" cy="26" r="2.4" fill="#bfe9ff" ${S(1.2)}/>`;
  });

  // クラゲリオン（みず・エスパー）: シズクラゲが進化。光るかさで、夜の海を案内する
  add('kurageriion', () => {
    const b = shade('#8aa6ff', { hi: 0.55 }), skirt = shade('#ffb3dc');
    const tent = (x, s, len) => `<path d="M${x} 66 C${x - 7 * s} 76 ${x + 7 * s} 84 ${x - 3 * s} ${66 + len}" ${N} ${S(5.6)}/><path d="M${x} 66 C${x - 7 * s} 76 ${x + 7 * s} 84 ${x - 3 * s} ${66 + len}" ${N} stroke="#d7e0ff" stroke-width="3.2" stroke-linecap="round"/>`;
    const glow = (x, y) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#fff6b0" ${S(1)}/><circle cx="${x}" cy="${y}" r="5" fill="#fff6b0" opacity=".3"/>`;
    return `${ground(20, 96)}${b.d}${skirt.d}
    ${tent(30, 1, 22)}${tent(41, -1, 28)}${tent(50, 1, 30)}${tent(59, -1, 28)}${tent(70, 1, 22)}
    <path d="M18 58 C14 64 18 72 24 70 C24 76 32 78 34 72 C36 78 44 78 44 72 C46 78 54 78 56 72 C56 78 64 78 66 72 C68 78 76 76 76 70 C82 72 86 64 82 58Z" fill="${skirt.f}" ${S(2)}/>
    <path d="M24 66 C26 69 28 70 30 69 M44 70 C46 73 48 73 50 72 M64 70 C66 72 68 72 70 70" ${N} ${S(1.1, '#e07ab4')}/>
    <path d="M16 60 C16 32 32 18 50 18 C68 18 84 32 84 60 C72 64 28 64 16 60Z" fill="${b.f}" ${S()}/>
    <path d="M38 22 L36 10 L44 18 L50 6 L56 18 L64 10 L62 22Z" fill="#ffd23f" ${S(2)}/><circle cx="50" cy="15" r="2.2" fill="#ff6fa5" ${S(1)}/>
    ${glow(26, 44)}${glow(74, 44)}${glow(34, 30)}${glow(66, 30)}
    <path d="M27 38 C30 30 37 25 44 23" ${N} stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".8"/>
    ${eye(41, 45, 5, '#b05cff')}${eye(59, 45, 5, '#b05cff')}${blush(31, 52, '#ff8fd0')}${blush(69, 52, '#ff8fd0')}${mouthW(50, 52, 3)}
    ${sparkle(10, 40, 3.6, '#fff6b0')}${sparkle(90, 50, 3, '#fff6b0')}`;
  });

  // デンデンムシ（でんき・むし）: 背中のからは電池。からっぽになると、ひなたでお昼ね
  add('denden', () => {
    const shell = shade('#ffd23f', { hi: 0.55 }), body = shade('#c8e08a');
    return `${ground(32)}${shell.d}${body.d}
    <path d="M12 88 C12 78 22 74 32 76 L74 76 C84 76 90 80 90 88Z" fill="${body.f}" ${S()}/>
    <path d="M20 84 C14 70 16 52 30 48 C42 46 46 60 42 78Z" fill="${body.f}" ${S()}/>
    <path d="M26 50 L21 33 M35 49 L40 33" ${S(2.3)}/>
    <circle cx="20.5" cy="30" r="6" fill="#fff" ${S(2)}/><circle cx="40.5" cy="30" r="6" fill="#fff" ${S(2)}/>
    ${eye(21.5, 30.5, 3.6, '#2f7fd6')}${eye(41.5, 30.5, 3.6, '#2f7fd6')}
    <circle cx="64" cy="56" r="23" fill="${shell.f}" ${S()}/>
    <path d="M64 56 m-3 0 a3 3 0 1 1 6 0 a7 7 0 1 1 -14 0 a11 11 0 1 1 22 0 a15.5 15.5 0 1 1 -31 0" ${N} ${S(2, '#c98a00')}/>
    <rect x="60" y="29" width="8" height="5" rx="1.6" fill="#c9ccd6" ${S(1.6)}/>
    <path d="M66 44 L58 57 L64 57 L60 68 L71 53 L65 53 L69 44Z" fill="#fff6c8" ${S(1.6)}/>
    ${gloss(52, 42, 5, 3, -35)}
    ${blush(26, 66, '#ff9a6b', 4.6, 2.8)}${mouthW(32, 64, 2.6)}
    <path d="M86 70 L92 64 L90 70 L95 68" ${N} ${S(1.6, '#e0b000')}/>`;
  });

  // シロップン（こおり）: 夏になると大人気。いちご味かブルーハワイ味かで毎日まよう
  add('shiroppun', () => {
    const ice = shade('#f7fbff', { hi: 0.9, lo: -0.08 }), cup = vshade('#e9f8ff', '#a9dcf6');
    return `${ground(22)}${ice.d}${cup.d}
    <path d="M42 86 L39 92 L61 92 L58 86Z" fill="#c4e8fb" ${S(2)}/>
    <path d="M22 64 L78 64 C76 79 65 87 50 87 C35 87 24 79 22 64Z" fill="${cup.f}" ${S()}/>
    <path d="M30 70 C34 78 42 82 50 82" ${N} stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>
    <path d="M20 65 C18 48 31 30 50 28 C69 30 82 48 80 65Z" fill="${ice.f}" ${S()}/>
    <path d="M27 50 C33 36 52 30 62 34 C58 40 54 38 52 44 C48 40 44 44 42 48 C38 44 32 50 27 50Z" fill="#ff6f9f" opacity=".9"/>
    <path d="M64 36 C72 42 76 50 77 58 C72 56 70 52 68 54 C66 48 62 46 64 36Z" fill="#4fb6ff" opacity=".85"/>
    <circle cx="34" cy="57" r="1" fill="#cfe6f5"/><circle cx="66" cy="62" r="1" fill="#cfe6f5"/><circle cx="52" cy="56" r="1" fill="#cfe6f5"/>
    <path d="M66 32 L84 12" ${S(5.2)}/><path d="M66 32 L84 12" stroke="#ffcf4a" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="86" cy="10" rx="4" ry="2.6" fill="#ffcf4a" ${S(1.6)} transform="rotate(-48 86 10)"/>
    ${eye(41, 57, 4.4, '#4fb6ff')}${eye(59, 57, 4.4, '#4fb6ff')}${blush(32, 63, '#ff8fb8')}${blush(68, 63, '#ff8fb8')}${mouthO(50, 62, 2.8, 2.8)}
    ${sparkle(14, 40, 3.6, '#bfe9ff')}${sparkle(88, 44, 2.6, '#bfe9ff')}`;
  });

  // チョウチン（ゴースト・ほのお）: 夏祭りの夜にふわふわ。おどかすつもりが、だいたい道案内になる
  add('chouchin', () => {
    const paper = vshade('#fff6e2', '#ffd9a8'), glowId = gid();
    const rib = (y, w) => `<path d="M${50 - w} ${y} Q50 ${y + 3.4} ${50 + w} ${y}" ${N} ${S(1.4, '#d9a46b')}/>`;
    return `<defs><radialGradient id="${glowId}"><stop offset="0" stop-color="#ffb86b" stop-opacity=".75"/><stop offset="1" stop-color="#ffb86b" stop-opacity="0"/></radialGradient></defs>
    <circle cx="50" cy="54" r="44" fill="url(#${glowId})"/>${paper.d}
    ${flame(14, 42, 0.75, '#b48cff', '#f3eaff')}${flame(87, 30, 0.6, '#b48cff', '#f3eaff')}
    <path d="M44 22 C44 13 56 13 56 22" ${N} ${S(2.4)}/>
    <path d="M35 29 C18 34 16 74 35 81 L65 81 C84 74 82 34 65 29Z" fill="${paper.f}" ${S()}/>
    ${rib(38, 23)}${rib(48, 26)}${rib(58, 26)}${rib(68, 24)}
    <path d="M23 55 C24 66 28 74 35 79 L65 79 C72 74 76 66 77 55 C68 60 32 60 23 55Z" fill="#ff5a5a" opacity=".85"/>
    <rect x="34" y="22" width="32" height="8" rx="2.4" fill="#4a3a4f"/><rect x="34" y="79" width="32" height="7" rx="2.4" fill="#4a3a4f"/>
    <rect x="37" y="24" width="10" height="2" rx="1" fill="#fff" opacity=".35"/>
    ${eye(40, 47, 5, '#ff7a2e')}${eye(60, 47, 5, '#ff7a2e')}${blush(30, 53, '#ff8a6b')}${blush(70, 53, '#ff8a6b')}
    <path d="M41 57 Q50 66 59 57Z" fill="#c9405e" ${S(2)}/>
    <path d="M47 61 C46 69 54 71 54 62" fill="#ff8fa6" ${S(1.6)}/>
    <path d="M48 86 L48 92 M52 86 L52 94" ${S(2)}/>`;
  });

  // ソラクジラ（ひこう・みず）: 雲の上をゆっくり泳ぐ。しおふきのあとには、小さな虹がかかる
  add('sorakujira', () => {
    const b = shade('#5b8def', { cx: 0.32, cy: 0.25 }), wing = shade('#ffffff', { hi: 0.2, lo: -0.12 });
    const rb = ['#ff6f91', '#ffb347', '#ffe066', '#6fd08c', '#5cc8ff'].map((c, i) => `<path d="M${14 + i * 2} 22 A${20 - i * 2} ${20 - i * 2} 0 0 1 ${54 - i * 2} 22" ${N} stroke="${c}" stroke-width="2.2" opacity=".9"/>`).join('');
    return `${b.d}${wing.d}${rb}
    <path d="M34 30 C32 22 28 18 22 16 M34 30 C36 22 40 18 46 16" ${N} ${S(2.6, '#9fdcff')}/>
    <circle cx="22" cy="15" r="2.4" fill="#bfe9ff" ${S(1)}/><circle cx="46" cy="15" r="2.4" fill="#bfe9ff" ${S(1)}/>
    ${cloud(92)}
    <path d="M82 54 C88 46 94 40 97 31 C91 33 87 37 85 41 C85 35 81 29 77 27 C79 35 81 43 80 49Z" fill="#4a7ad8" ${S(2)}/>
    <path d="M10 56 C10 38 32 28 56 31 C76 33 86 45 86 57 C86 71 72 79 50 79 C28 79 10 72 10 56Z" fill="${b.f}" ${S()}/>
    <path d="M16 63 C26 75 66 77 82 63 C74 73 62 77 48 77 C34 77 22 73 16 63Z" fill="#e6f0ff" ${S(1.6)}/>
    <path d="M54 32 C56 18 70 9 84 11 C77 15 75 19 75 23 C80 21 84 23 87 26 C76 28 64 31 59 36Z" fill="${wing.f}" ${S(2.1)}/>
    <path d="M62 30 C66 24 72 20 78 18 M64 34 C70 30 76 28 82 27" ${N} ${S(1.1, '#c8d6ee')}/>
    <path d="M40 68 C36 78 28 82 22 80 C26 76 30 72 33 66Z" fill="#4a7ad8" ${S(2)}/>
    ${gloss(26, 42, 8, 3.6, -20, 0.5)}
    ${eye(28, 52, 4.4, '#5cc8ff')}${eye(42, 52, 4.4, '#5cc8ff')}${blush(21, 59, '#ff8fb8')}${blush(49, 59, '#ff8fb8')}${mouthW(35, 60, 3)}
    ${sparkle(92, 12, 3.4, '#fff6b0')}${star(8, 34, 3.4, '#ffe680', 1.2)}`;
  });
})();
