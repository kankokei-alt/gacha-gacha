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
  // ねむそうな目
  const sleepyEyes = (x, y, w = 4.4) => `<path d="M${x - w} ${y} Q${x} ${y + 3.8} ${x + w} ${y}" ${N} ${S(2.6)}/>`;
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
  // たまご形の体: 中心 cx、上 top、はば w（片側）、下 bot
  const egg = (cx, top, w, bot) => {
    const h = bot - top, mid = top + h * 0.55;
    return `M${cx} ${top} C${cx + w * 0.76} ${top} ${cx + w} ${top + h * 0.3} ${cx + w} ${mid} C${cx + w} ${bot - h * 0.1} ${cx + w * 0.6} ${bot} ${cx} ${bot} C${cx - w * 0.6} ${bot} ${cx - w} ${bot - h * 0.1} ${cx - w} ${mid} C${cx - w} ${top + h * 0.3} ${cx - w * 0.76} ${top} ${cx} ${top}Z`;
  };
  const feet = (c, y = 90, dx = 12, rx = 7.2) => `<ellipse cx="${50 - dx}" cy="${y}" rx="${rx}" ry="3.7" fill="${c}" ${S(2.1)}/><ellipse cx="${50 + dx}" cy="${y}" rx="${rx}" ry="3.7" fill="${c}" ${S(2.1)}/>`;
  // 顔（目・チーク・口）
  const face = ({ y = 60, dx = 10, r = 4.8, iris = '#6b4fd8', cheek = '#ff6f9a', cy = 7, cdx = 19, mouth = 'w', my = 7, x = 50 } = {}) => {
    const m = { w: mouthW(x, y + my, 3.2), o: mouthO(x, y + my - 1, 3, 3), s: `<path d="M${x - 3.4} ${y + my} Q${x} ${y + my + 3.6} ${x + 3.4} ${y + my}" ${N} ${S(2.1)}/>`, n: '' }[mouth] ?? mouth;
    return `${eye(x - dx, y, r, iris)}${eye(x + dx, y, r, iris)}${blush(x - cdx, y + cy, cheek)}${blush(x + cdx, y + cy, cheek)}${m}`;
  };
  const brow = (y, dx = 10, k = 1) => `<path d="M${50 - dx - 5} ${y - 2 * k} L${50 - dx + 4} ${y + 1.4 * k}" ${S(2.4)}/><path d="M${50 + dx + 5} ${y - 2 * k} L${50 + dx - 4} ${y + 1.4 * k}" ${S(2.4)}/>`;

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

  // ショウブリン（くさ）: ハナポンが進化。菖蒲（しょうぶ）の花をかざり、勝負ごとが大好き
  add('shoburin', () => {
    const b = shade('#7fcf7a'), pet = shade('#8a5cd6', { hi: 0.5 });
    const blade = `<path d="M33 84 C26 64 18 40 12 14 C22 34 32 58 40 80Z" fill="#5fb85a" ${S(2.1)}/><path d="M34 80 C27 62 20 40 14 20" ${N} ${S(1.1, '#3f7f3a')}/>`;
    return `${ground(24)}${b.d}${pet.d}${blade}${mir(blade)}
    <path d="${egg(50, 36, 26, 91)}" fill="${b.f}" ${S()}/>
    <ellipse cx="50" cy="77" rx="14" ry="10" fill="#effbe6"/>
    ${gloss(36, 48, 5.4, 3, -30)}
    <path d="M50 37 L50 30" ${S(2.4, '#3f7f3a')}/>
    <path d="M50 30 C42 30 34 24 32 16 C40 16 46 20 50 26 C54 20 60 16 68 16 C66 24 58 30 50 30Z" fill="${pet.f}" ${S(2.1)}/>
    <path d="M50 28 C46 20 46 10 50 4 C54 10 54 20 50 28Z" fill="${pet.f}" ${S(2.1)}/>
    <path d="M40 21 L45 25 M60 21 L55 25" ${S(2.2, '#ffd23f')}/><path d="M50 10 L50 20" ${S(1.6, '#ffd23f')}/>
    ${face({ y: 58, iris: '#3f9a4e' })}${brow(51, 10, 0.6)}
    ${feet('#5fb85a')}`;
  });

  // ショウブオウ（くさ・フェアリー）: 花の都をおさめる王。ひとふりの葉の剣で、風に花びらをまかせる
  add('shobuou', () => {
    const b = shade('#5fbf72', { hi: 0.5 }), cape = shade('#3f9a5e'), pet = shade('#7b4dd6', { hi: 0.55 });
    const flower = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M0 0 C-8 0 -14 -5 -16 -12 C-8 -12 -3 -8 0 -3 C3 -8 8 -12 16 -12 C14 -5 8 0 0 0Z" fill="${pet.f}" ${S(2.2 / k)}/><path d="M0 -2 C-4 -9 -4 -18 0 -24 C4 -18 4 -9 0 -2Z" fill="${pet.f}" ${S(2.2 / k)}/><path d="M-8 -7 L-4 -4 M8 -7 L4 -4" ${S(2 / k, '#ffd23f')}/></g>`;
    return `${ground(32)}${b.d}${cape.d}${pet.d}
    <path d="M22 50 C10 62 8 80 14 92 L86 92 C92 80 90 62 78 50Z" fill="${cape.f}" ${S()}/>
    <path d="M20 70 C16 76 16 84 18 90 M80 70 C84 76 84 84 82 90" ${N} ${S(1.2, '#2f7a46')}/>
    <path d="M84 88 L94 18" ${S(5)}/><path d="M84 88 L94 18" stroke="#9be08a" stroke-width="3" stroke-linecap="round"/>
    <path d="M94 18 C98 10 96 4 92 2 C90 8 90 12 94 18Z" fill="#9be08a" ${S(1.8)}/>
    <path d="${egg(50, 32, 27, 90)}" fill="${b.f}" ${S()}/>
    <path d="M36 64 L50 78 L64 64" ${N} ${S(2.4, '#ffd23f')}/><circle cx="50" cy="78" r="3" fill="#ff8fb8" ${S(1.4)}/>
    ${gloss(36, 44, 6, 3.2, -30)}
    ${flower(34, 34, 0.7)}${flower(66, 34, 0.7)}${flower(50, 28, 0.95)}
    ${face({ y: 54, iris: '#7b4dd6', mouth: 's' })}${brow(47, 10, 0.5)}
    ${feet('#3f9a5e', 91)}
    ${sparkle(12, 30, 4, '#e6d8ff')}${sparkle(8, 60, 3, '#ffd6e8')}${sparkle(30, 12, 3, '#e6d8ff')}`;
  });

  // ヤキイモンガ（ほのお・じめん）: ヤキイモンが進化。はちまきをしめて、冬の商店街をかけまわる
  add('yakiimonga', () => {
    const b = shade('#9b4fbf'), inside = vshade('#ffe28a', '#ffa83c');
    return `${ground(28)}${b.d}${inside.d}
    ${flame(18, 44, 0.9)}${flame(82, 44, 0.9)}
    <path d="M50 22 C74 22 84 42 84 62 C84 82 70 92 50 92 C30 92 16 82 16 62 C16 42 26 22 50 22Z" fill="${b.f}" ${S()}/>
    <path d="M22 40 C28 28 38 22 50 22 C62 22 72 28 78 40 L72 37 L66 44 L58 36 L50 44 L42 36 L34 44 L28 37Z" fill="${inside.f}" ${S(2.1)}/>
    <path d="M18 52 C36 46 64 46 82 52 L82 59 C64 53 36 53 18 59Z" fill="#fff" ${S(2)}/>
    <path d="M30 52 L32 57 M40 50 L41 55 M50 50 L50 55 M60 50 L59 55 M70 52 L68 57" ${S(1.4, '#ff5a5a')}/>
    <path d="M80 54 L92 48 L90 56 L95 60Z" fill="#fff" ${S(1.8)}/>
    <path d="M26 74 q3 -1 5 1 M70 80 q3 -1 5 1 M72 66 q2 -1 4 1" ${N} ${S(1.5, '#5f2a7a')}/>
    ${face({ y: 66, iris: '#ff7a2e', cheek: '#ff9a6b', mouth: 's', my: 8 })}${brow(60, 10, 0.9)}
    <circle cx="20" cy="76" r="8" fill="#8a45ad" ${S()}/><circle cx="80" cy="76" r="8" fill="#8a45ad" ${S()}/>
    ${feet('#6f3a8a', 91, 13)}`;
  });

  // カマドラゴ（ほのお・ドラゴン）: かまどの竜。おなかの火で、なんでもふっくら焼きあげる
  add('kamadorago', () => {
    const b = shade('#d9784a', { hi: 0.4 }), fire = shade('#ffb43c', { cx: 0.5, cy: 0.7, hi: 0.6, lo: -0.1 });
    const bricks = [[22, 68], [78, 68], [19, 82], [81, 82], [27, 56], [73, 56]].map(([x, y]) => `<path d="M${x - 5} ${y} L${x + 5} ${y}" ${S(1.4, '#a14f2c')}/>`).join('');
    return `${ground(34)}${b.d}${fire.d}
    <path d="M76 78 C88 80 96 72 94 60 C90 66 86 68 80 68Z" fill="#c4643a" ${S(2.1)}/>${flame(95, 56, 0.8)}
    <path d="M24 48 C10 40 4 28 8 18 C14 26 20 28 28 30Z" fill="#ff8a5c" ${S(2.1)}/>${mir(`<path d="M24 48 C10 40 4 28 8 18 C14 26 20 28 28 30Z" fill="#ff8a5c" ${S(2.1)}/>`)}
    <path d="M14 90 C12 60 28 30 50 30 C72 30 88 60 86 90Z" fill="${b.f}" ${S()}/>
    ${bricks}
    <path d="M34 90 C34 72 40 64 50 64 C60 64 66 72 66 90Z" fill="#3a2430" ${S(2.2)}/>
    <path d="M38 90 C38 80 44 72 50 70 C56 72 62 80 62 90Z" fill="${fire.f}"/>
    ${flame(50, 88, 1.1, '#ff5a2e', '#ffe066')}
    <path d="M38 32 L34 18 L44 28Z" fill="#ffe0b0" ${S(1.8)}/><path d="M62 32 L66 18 L56 28Z" fill="#ffe0b0" ${S(1.8)}/>
    ${gloss(34, 40, 6, 3, -30, 0.45)}
    ${face({ y: 48, dx: 9, iris: '#ff5a2e', cheek: '#ffb36b', mouth: 's', my: 7, cdx: 17 })}
    <path d="M45 56 L46.4 59 L48 56.4Z M55 56 L53.6 59 L52 56.4Z" fill="#fff" ${S(0.9)}/>
    ${sparkle(20, 70, 3, '#ffe066')}`;
  });

  // オーロラゲ（みず・エスパー）: クラゲリオンが進化。北の空のオーロラは、この子の足のゆらめき
  add('aurorage', () => {
    const b = shade('#7fe0e6', { hi: 0.6 });
    const ribbon = (x, c, d) => { const id = gid(); return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".95"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs><path d="M${x - 4} 60 C${x - 10 + d} 72 ${x + 6 + d} 82 ${x - 2} 98 L${x + 6} 98 C${x + 12 + d} 82 ${x - 2 + d} 72 ${x + 4} 60Z" fill="url(#${id})"/>`; };
    return `${b.d}
    ${ribbon(26, '#6fe3a8', -4)}${ribbon(38, '#5cc8ff', 4)}${ribbon(50, '#b48cff', -4)}${ribbon(62, '#ff8fd0', 4)}${ribbon(74, '#6fe3a8', -4)}
    <path d="M12 58 C12 28 30 12 50 12 C70 12 88 28 88 58 C80 64 70 56 62 62 C56 56 50 64 50 64 C50 64 44 56 38 62 C30 56 20 64 12 58Z" fill="${b.f}" fill-opacity=".92" ${S()}/>
    <path d="M24 38 C27 28 36 20 46 18" ${N} stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".85"/>
    <path d="M36 16 C40 8 46 6 50 2 C54 6 60 8 64 16 C58 14 54 14 50 10 C46 14 42 14 36 16Z" fill="#e6f8ff" ${S(1.8)}/><circle cx="50" cy="9" r="2.4" fill="#ff8fd0" ${S(1)}/>
    ${face({ y: 40, r: 5.2, iris: '#b05cff', cheek: '#ff8fd0', mouth: 's', my: 8 })}
    ${sparkle(10, 22, 4, '#fff6b0')}${sparkle(90, 28, 3.6, '#e6d8ff')}${star(84, 80, 3.2, '#fff6b0', 1.2)}${star(14, 84, 2.6, '#e6d8ff', 1)}`;
  });

  // スズメチュン（ひこう）: 朝いちばんに電線にならんで、町じゅうを起こしてまわる
  add('suzume', () => {
    const b = shade('#e8c9a0'), cap = shade('#9a5c34');
    return `${ground(24)}${b.d}${cap.d}
    <path d="M74 72 C86 72 92 64 92 58 C86 62 80 62 76 60Z" fill="#7a4a2a" ${S(2.1)}/>
    <path d="${egg(50, 36, 27, 90)}" fill="${b.f}" ${S()}/>
    <path d="M24 56 C22 42 34 34 50 34 C66 34 78 42 76 56 C68 50 32 50 24 56Z" fill="${cap.f}" ${S(2.1)}/>
    <ellipse cx="50" cy="76" rx="15" ry="10" fill="#fff8ee"/>
    <ellipse cx="29" cy="66" rx="6" ry="5" fill="#fff" ${S(1.6)}/><ellipse cx="29" cy="67" rx="2.6" ry="2.2" fill="${O}"/>
    <ellipse cx="71" cy="66" rx="6" ry="5" fill="#fff" ${S(1.6)}/><ellipse cx="71" cy="67" rx="2.6" ry="2.2" fill="${O}"/>
    <path d="M22 66 C14 64 12 74 18 78 C22 78 25 74 26 72Z" fill="#9a5c34" ${S(2)}/>${mir(`<path d="M22 66 C14 64 12 74 18 78 C22 78 25 74 26 72Z" fill="#9a5c34" ${S(2)}/>`)}
    ${eye(41, 59, 4.4, '#8a5a3a')}${eye(59, 59, 4.4, '#8a5a3a')}
    <path d="M45 65 L55 65 L50 70Z" fill="#4a3a4f" ${S(1.4)}/>
    ${gloss(38, 41, 5, 2.4, -20, 0.5)}
    <path d="M42 88 L38 93 M42 88 L42 94 M58 88 L62 93 M58 88 L58 94" ${S(2, '#d98a4e')}/>
    <path d="M78 24 l3 -3 M84 28 l4 -2 M84 34 l4 0" ${S(1.6, '#c9a0a0')}/>`;
  });

  // ハヤブサン（ひこう）: スズメチュンが進化。だれよりも速く飛び、郵便をとどけるのが仕事
  add('hayabusan', () => {
    const b = shade('#6f86b8', { hi: 0.5 }), w = shade('#4f6496');
    const wing = `<path d="M30 54 C16 44 4 44 0 48 C6 52 8 54 10 58 C4 58 2 62 2 64 C10 66 20 64 30 62Z" fill="${w.f}" ${S(2.1)}/><path d="M6 50 C14 52 20 54 26 56 M6 62 C14 62 20 61 26 60" ${N} ${S(1.1, '#9fb2dc')}/>`;
    return `${ground(22, 95)}${b.d}${w.d}
    ${wing}${mir(wing)}
    <path d="M58 80 L78 94 L72 82 L88 84 L64 72Z" fill="${w.f}" ${S(2)}/>
    <path d="${egg(50, 30, 21, 86)}" fill="${b.f}" ${S()}/>
    <ellipse cx="50" cy="72" rx="12" ry="11" fill="#f2f4fa"/>
    <path d="M44 68 l2 1.6 l2 -1.6 M52 68 l2 1.6 l2 -1.6 M48 75 l2 1.6 l2 -1.6" ${N} ${S(1.2, '#9fb2dc')}/>
    <path d="M30 46 C34 34 66 34 70 46 C62 42 38 42 30 46Z" fill="#3f4f7a"/>
    <circle cx="42" cy="50" r="6.4" fill="#ffe066" ${S(1.6)}/><circle cx="58" cy="50" r="6.4" fill="#ffe066" ${S(1.6)}/>
    ${eye(42, 50, 3.8, '#3f6fd6')}${eye(58, 50, 3.8, '#3f6fd6')}<path d="M34 42 L45 45 M66 42 L55 45" ${S(2.6)}/>
    <path d="M46 56 L54 56 L50 63Z" fill="#ffc83f" ${S(1.6)}/>
    <rect x="62" y="70" width="14" height="10" rx="2" fill="#fff" ${S(1.6)}/><path d="M62 70 L69 76 L76 70" ${N} ${S(1.4)}/>
    <path d="M86 30 L98 30 M84 38 L96 38 M88 22 L96 22" ${S(1.8, '#b7c4e4')}/>`;
  });

  // カルガモン（みず・ひこう）: 多摩湖でおさんぽ。うしろには、いつも小さな子がついてくる
  add('karugamon', () => {
    const b = shade('#a8805c'), water = vshade('#bfe9ff', '#7fc8f0');
    const baby = `<g transform="translate(88 80) scale(.32)"><path d="${egg(0, -30, 22, 16)}" fill="#ffe08a" ${S(2.4 / .38)}/>${eye(-7, -10, 4.2, '#8a5a3a')}${eye(7, -10, 4.2, '#8a5a3a')}<path d="M-5 -2 L5 -2 L0 4Z" fill="#ffb23f" ${S(2 / .38)}/></g>`;
    return `${water.d}${b.d}
    <path d="M4 84 C20 78 34 90 50 84 C66 78 80 90 96 84 L96 96 L4 96Z" fill="${water.f}" ${S(1.8)}/>
    <path d="M70 70 C82 66 90 60 92 52 C84 56 78 58 72 58Z" fill="#6b4a33" ${S(2)}/>
    <path d="M20 70 C18 50 30 34 50 34 C68 34 78 48 76 66 C76 80 64 88 48 88 C32 88 22 82 20 70Z" fill="${b.f}" ${S()}/>
    <path d="M30 70 C36 62 56 62 66 70 C60 80 38 82 30 70Z" fill="#c9a882"/>
    <path d="M36 70 l3 2 M46 68 l2 3 M56 69 l1 3" ${S(1.1, '#8a6a4a')}/>
    <path d="M28 54 L40 56 M72 54 L60 56" ${S(2.4, '#5a3e2a')}/>
    ${eye(39, 54, 4.4, '#8a5a3a')}${eye(61, 54, 4.4, '#8a5a3a')}${blush(30, 63)}${blush(70, 63)}
    <path d="M38 62 C38 58 62 58 62 62 C62 68 56 70 50 70 C44 70 38 68 38 62Z" fill="#3a3a44" ${S(1.8)}/>
    <path d="M44 66 C46 70 54 70 56 66 C56 69 53 71 50 71 C47 71 44 69 44 66Z" fill="#ffd23f"/>
    <circle cx="46" cy="62" r="1" fill="#8a8a96"/><circle cx="54" cy="62" r="1" fill="#8a8a96"/>
    ${baby}`;
  });

  // アマガエルン（みず）: あじさいの葉っぱのかさが自慢。雨がふると、うれしくて歌いだす
  add('amagaerun', () => {
    const b = shade('#7fd65a', { hi: 0.5 }), um = shade('#7f8fff', { cx: 0.4, cy: 0.3 });
    return `${ground(24)}${b.d}${um.d}
    <path d="M70 46 L72 82" ${S(2.4, '#3f7f3a')}/>
    <path d="M44 30 C52 12 88 10 98 30 C90 26 84 30 80 32 C76 26 68 26 64 32 C60 26 52 26 44 30Z" fill="${um.f}" ${S(2.1)}/>
    <circle cx="58" cy="22" r="2" fill="#c9d0ff"/><circle cx="72" cy="18" r="2" fill="#ffc9e6"/><circle cx="84" cy="22" r="2" fill="#c9d0ff"/>
    <path d="M71 14 L71 8" ${S(2, '#3f7f3a')}/>
    <circle cx="36" cy="46" r="11" fill="${b.f}" ${S()}/><circle cx="64" cy="46" r="11" fill="${b.f}" ${S()}/>
    <path d="M18 74 C16 58 30 48 50 48 C70 48 84 58 82 74 C80 86 66 90 50 90 C34 90 20 86 18 74Z" fill="${b.f}" ${S()}/>
    <ellipse cx="50" cy="78" rx="18" ry="9" fill="#f2fbe0"/>
    ${eye(36, 46, 5.4, '#3f9a4e')}${eye(64, 46, 5.4, '#3f9a4e')}
    <path d="M36 62 Q50 70 64 62" ${N} ${S(2.2)}/>${blush(28, 64, '#ff8fa3')}${blush(72, 64, '#ff8fa3')}
    <path d="M70 78 C76 74 80 78 76 82" fill="#7fd65a" ${S(2)}/>
    <path d="M22 88 C18 92 26 94 30 90 M78 88 C82 92 74 94 70 90" fill="#6cc44a" ${S(2)}/>
    <path d="M12 36 C10 40 14 42 14 38Z M18 20 C16 24 20 26 20 22Z M90 50 C88 54 92 56 92 52Z" fill="#9fdcff" ${S(1.2)}/>`;
  });

  // ケロオウジ（みず）: アマガエルンが進化。はすの葉のマントで、池の王子さまをつとめる
  add('keroouji', () => {
    const b = shade('#5fc45a', { hi: 0.5 }), cape = shade('#ff6f91');
    return `${ground(28)}${b.d}${cape.d}
    <path d="M24 56 C12 66 10 82 16 92 L84 92 C90 82 88 66 76 56Z" fill="${cape.f}" ${S()}/>
    <path d="M20 60 C26 66 30 64 32 62 M80 60 C74 66 70 64 68 62" ${N} ${S(1.2, '#d94f75')}/>
    <circle cx="35" cy="36" r="11" fill="${b.f}" ${S()}/><circle cx="65" cy="36" r="11" fill="${b.f}" ${S()}/>
    <path d="M18 66 C16 50 30 38 50 38 C70 38 84 50 82 66 C80 82 66 90 50 90 C34 90 20 82 18 66Z" fill="${b.f}" ${S()}/>
    <ellipse cx="50" cy="74" rx="18" ry="11" fill="#eefbdc"/>
    <path d="M40 26 L42 14 L46 22 L50 12 L54 22 L58 14 L60 26Z" fill="#ffd23f" ${S(2)}/><circle cx="50" cy="20" r="1.8" fill="#5cc8ff"/>
    ${eye(35, 36, 5.2, '#2f7fd6')}${eye(65, 36, 5.2, '#2f7fd6')}
    <path d="M38 54 Q50 62 62 54" ${N} ${S(2.2)}/>${blush(28, 54)}${blush(72, 54)}
    <path d="M44 62 L50 66 L56 62" fill="#fff" ${S(1.6)}/>
    <ellipse cx="84" cy="70" rx="10" ry="5" fill="#6fc85a" ${S(1.8)} transform="rotate(-20 84 70)"/><path d="M84 70 L92 66" ${S(1.2, '#3f7f3a')}/>
    ${feet('#4fae4a', 91, 13)}${sparkle(14, 24, 3.4, '#fff6b0')}`;
  });

  // ドングリン（くさ）: 八国山の森で、ころころ転がって遊ぶ。ぼうしは毎日ぴかぴかにみがく
  add('donguri', () => {
    const b = shade('#c98a4e', { hi: 0.4 }), cap = shade('#8a6038');
    let hatch = '';
    for (let i = 0; i < 6; i++) hatch += `<path d="M${26 + i * 9} 30 L${32 + i * 9} 46" ${S(1.1, '#5f3f22')}/><path d="M${32 + i * 9} 30 L${26 + i * 9} 46" ${S(1.1, '#5f3f22')}/>`;
    return `${ground(22)}${b.d}${cap.d}
    <path d="M24 44 C24 64 30 90 50 90 C70 90 76 64 76 44Z" fill="${b.f}" ${S()}/>
    ${gloss(36, 56, 4, 8, 10, 0.4)}
    <path d="M20 44 C18 30 34 22 50 22 C66 22 82 30 80 44 C70 48 30 48 20 44Z" fill="${cap.f}" ${S()}/>
    <g clip-path="none" opacity=".7">${hatch}</g>
    <path d="M50 22 C50 16 52 12 56 10" ${N} ${S(2.6, '#5f3f22')}/>
    ${face({ y: 60, dx: 9, iris: '#8a5a3a', cdx: 16, mouth: 's', my: 8 })}
    ${feet('#9a6a3e', 90, 10, 6)}
    ${leaf(80, 86, 70, 0.5, '#8fd16f')}`;
  });

  // クヌギダー（くさ）: ドングリンが進化。森の見張り番。枝のうでで、小鳥のおうちを守る
  add('kunugida', () => {
    const b = shade('#a8784a', { hi: 0.35 }), cap = shade('#6f4a2a');
    const branch = `<path d="M22 58 C12 54 8 44 10 36 C14 40 18 44 24 48Z" fill="#8a5a34" ${S(2)}/>${leaf(10, 36, -40, 0.55, '#6cc46a')}${leaf(12, 42, -100, 0.45, '#8fd16f')}`;
    return `${ground(30)}${b.d}${cap.d}${branch}${mir(branch)}
    <path d="M20 46 C20 70 22 92 50 92 C78 92 80 70 80 46Z" fill="${b.f}" ${S()}/>
    <path d="M30 56 C32 66 30 78 34 86 M68 54 C66 64 70 76 66 86 M50 76 C48 82 52 86 50 90" ${N} ${S(1.4, '#7a5030')}/>
    <path d="M24 84 C30 80 36 84 40 82 C44 86 50 84 54 86 C58 82 66 86 72 82 C74 86 78 86 78 84" fill="#7fc85a" ${S(1.6)}/>
    <path d="M14 46 C12 28 30 16 50 16 C70 16 88 28 86 46 C72 52 28 52 14 46Z" fill="${cap.f}" ${S()}/>
    <path d="M22 38 C34 42 66 42 78 38 M26 30 C38 34 62 34 74 30" ${N} ${S(1.4, '#4a3020')}/>
    <path d="M50 16 C50 10 54 6 58 4" ${N} ${S(2.8, '#4a3020')}/>
    ${face({ y: 60, dx: 10, iris: '#6b8a3e', mouth: 's', my: 8 })}${brow(53, 10, 0.5)}
    <g transform="translate(72 22) scale(.5)"><path d="${egg(0, -12, 12, 10)}" fill="#e8c9a0" ${S(4)}/>${eye(-4, -2, 3, '#8a5a3a')}${eye(4, -2, 3, '#8a5a3a')}<path d="M-3 4 L3 4 L0 7Z" fill="#4a3a4f"/></g>`;
  });

  // タヌポン（ノーマル）: 葉っぱをのせて化けるのが得意。でも、しっぽだけはいつも出ている
  add('tanupon', () => {
    const b = shade('#b8987a'), mask = '#5f4a3e';
    const ear = `<path d="M30 40 C24 32 26 24 32 22 C38 24 42 30 40 38Z" fill="#8a6a50" ${S(2.1)}/>`;
    return `${ground(26)}${b.d}
    <path d="M72 78 C86 82 94 72 90 62 C86 66 80 68 76 68Z" fill="#8a6a50" ${S(2.1)}/>
    <path d="M84 64 l4 4 M80 68 l3 4" ${S(1.6, mask)}/>
    ${ear}${mir(ear)}
    <path d="${egg(50, 32, 28, 90)}" fill="${b.f}" ${S()}/>
    <ellipse cx="50" cy="76" rx="16" ry="11" fill="#f6ecdf"/>
    <path d="M26 58 C28 48 38 46 46 54 C42 64 30 66 26 58Z" fill="${mask}"/><path d="M74 58 C72 48 62 46 54 54 C58 64 70 66 74 58Z" fill="${mask}"/>
    ${eye(38, 56, 4.4, '#ffb23f')}${eye(62, 56, 4.4, '#ffb23f')}
    <ellipse cx="50" cy="63" rx="3" ry="2.2" fill="${O}"/>${mouthW(50, 66, 2.6)}${blush(30, 68, '#ff9a8a')}${blush(70, 68, '#ff9a8a')}
    ${leaf(50, 32, 20, 0.7, '#7fcf62')}
    ${feet('#6f5440', 90, 12, 6.6)}`;
  });

  // ポンポコリン（ノーマル）: タヌポンが進化。おなかの太鼓で、お祭りの音頭をとる
  add('ponpokorin', () => {
    const b = shade('#a8876a'), hat = shade('#e8c56a');
    const ear = `<path d="M28 40 C22 32 24 24 30 22 C36 24 40 30 38 38Z" fill="#7a5c44" ${S(2.1)}/>`;
    return `${ground(32)}${b.d}${hat.d}${ear}${mir(ear)}
    <path d="M72 82 C90 86 98 74 94 62 C88 68 82 70 76 70Z" fill="#7a5c44" ${S(2.1)}/>
    <path d="M50 30 C74 30 86 48 86 66 C86 84 72 92 50 92 C28 92 14 84 14 66 C14 48 26 30 50 30Z" fill="${b.f}" ${S()}/>
    <circle cx="50" cy="72" r="18" fill="#f8eedf" ${S(2)}/><circle cx="50" cy="72" r="12" fill="none" ${S(1.2, '#e0c9a8')}/>
    <path d="M26 54 C28 44 38 42 46 50 C42 60 30 62 26 54Z" fill="#5a463a"/><path d="M74 54 C72 44 62 42 54 50 C58 60 70 62 74 54Z" fill="#5a463a"/>
    ${eye(38, 52, 4.2, '#ffb23f')}${eye(62, 52, 4.2, '#ffb23f')}
    <ellipse cx="50" cy="58" rx="3" ry="2.2" fill="${O}"/><path d="M44 61 Q50 67 56 61" ${N} ${S(2.1)}/>
    <path d="M14 30 C14 22 32 16 50 16 C68 16 86 22 86 30 C70 34 30 34 14 30Z" fill="${hat.f}" ${S(2.1)}/>
    <path d="M34 22 C36 12 64 12 66 22Z" fill="${hat.f}" ${S(2.1)}/>
    <path d="M18 70 L30 62" ${S(3.4, '#8a5a34')}/><circle cx="31" cy="61" r="3" fill="#ff6f91" ${S(1.4)}/>
    <path d="M82 70 L70 62" ${S(3.4, '#8a5a34')}/><circle cx="69" cy="61" r="3" fill="#ff6f91" ${S(1.4)}/>
    <text x="80" y="22" font-size="9" font-weight="800" fill="#d94f75" font-family="sans-serif">ポン</text>`;
  });

  // ニャンコロ（ノーマル）: 三毛もようのこねこ。日だまりを見つけるのは、だれよりも早い
  add('nyankoro', () => {
    const b = shade('#fff8f0', { hi: 0.6, lo: -0.1 });
    const ear = `<path d="M28 44 L26 22 L44 36Z" fill="#fff8f0" ${S(2.1)}/><path d="M30 38 L29 28 L38 35Z" fill="#ffb3c7"/>`;
    return `${ground(26)}${b.d}
    <path d="M74 80 C90 82 94 66 86 58 C82 54 76 58 80 62" ${N} ${S(5.4)}/><path d="M74 80 C90 82 94 66 86 58 C82 54 76 58 80 62" ${N} stroke="#ffa94d" stroke-width="3.2" stroke-linecap="round"/>
    ${ear}${mir(ear.replace(/#fff8f0/, '#4a3a4f'))}
    <path d="${egg(50, 32, 28, 90)}" fill="${b.f}" ${S()}/>
    <path d="M24 46 C30 34 44 32 48 40 C44 50 32 54 24 46Z" fill="#ffa94d"/>
    <path d="M60 34 C70 34 78 42 76 52 C68 48 62 42 60 34Z" fill="#4a3a4f"/>
    <path d="M60 78 C66 74 74 76 74 84 C68 86 62 84 60 78Z" fill="#ffa94d"/>
    ${face({ y: 58, iris: '#3fbf8f', cheek: '#ff8fb8', mouth: 'w', my: 7 })}
    <ellipse cx="50" cy="63" rx="2" ry="1.4" fill="#ff8fa3"/>
    <path d="M36 65 L24 63 M36 68 L24 70 M64 65 L76 63 M64 68 L76 70" ${S(1.1)}/>
    ${feet('#fff8f0', 90, 11, 6.4)}`;
  });

  // ネコマタン（ノーマル・ゴースト）: ニャンコロが進化。しっぽが2本になって、ふしぎな火をともす
  add('nekomatan', () => {
    const b = shade('#b9a6e8', { hi: 0.5 });
    const ear = `<path d="M28 42 L24 18 L46 34Z" fill="#a08ad8" ${S(2.1)}/><path d="M30 36 L28 25 L39 33Z" fill="#ffb3e0"/>`;
    const tail = (d) => `<path d="${d}" ${N} ${S(5.4)}/><path d="${d}" ${N} stroke="#a08ad8" stroke-width="3.2" stroke-linecap="round"/>`;
    return `${ground(26)}${b.d}
    ${tail('M72 80 C88 80 92 62 84 48')}${tail('M72 84 C94 92 102 72 96 58')}${flame(84, 46, 0.75, '#7fd6ff', '#fff')}${flame(96, 56, 0.7, '#b48cff', '#fff')}
    ${ear}${mir(ear)}
    <path d="${egg(50, 30, 27, 90)}" fill="${b.f}" ${S()}/>
    <ellipse cx="50" cy="76" rx="14" ry="10" fill="#efe8ff"/>
    <path d="M42 30 L46 38 L50 30 L54 38 L58 30" ${N} ${S(1.6, '#7d63c9')}/>
    ${face({ y: 56, iris: '#ffb23f', cheek: '#ff8fd0', mouth: 'w', my: 7 })}
    <ellipse cx="50" cy="61" rx="2" ry="1.4" fill="#ff8fa3"/>
    <path d="M36 63 L24 61 M36 66 L24 68 M64 63 L76 61 M64 66 L76 68" ${S(1.1)}/>
    <path d="M30 80 C40 86 60 86 70 80" ${N} ${S(2.4, '#ff6f91')}/><circle cx="50" cy="85" r="3" fill="#ffd23f" ${S(1.4)}/>
    ${feet('#a08ad8', 90, 11, 6.4)}`;
  });

  // シバワン（ノーマル）: 東村山の朝のおさんぽ名人。くるんとしたしっぽがチャームポイント
  add('shibawan', () => {
    const b = shade('#f0a95e', { hi: 0.4 });
    const ear = `<path d="M26 46 L28 22 L44 36Z" fill="#e8994a" ${S(2.1)}/><path d="M29 40 L30 28 L38 35Z" fill="#fff0dc"/>`;
    return `${ground(26)}${b.d}
    <path d="M74 66 C90 62 92 46 82 44 C74 44 76 54 82 54" ${N} ${S(6.4)}/><path d="M74 66 C90 62 92 46 82 44 C74 44 76 54 82 54" ${N} stroke="#f0a95e" stroke-width="4.2" stroke-linecap="round"/>
    ${ear}${mir(ear)}
    <path d="${egg(50, 32, 28, 90)}" fill="${b.f}" ${S()}/>
    <path d="M26 60 C30 52 40 52 50 58 C60 52 70 52 74 60 C74 74 64 82 50 82 C36 82 26 74 26 60Z" fill="#fff6ea"/>
    <ellipse cx="41" cy="44" rx="3" ry="1.6" fill="#fff6ea"/><ellipse cx="59" cy="44" rx="3" ry="1.6" fill="#fff6ea"/>
    ${eye(40, 54, 4.4, '#8a5a3a')}${eye(60, 54, 4.4, '#8a5a3a')}
    <ellipse cx="50" cy="62" rx="3.4" ry="2.4" fill="${O}"/>${mouthW(50, 65, 3)}
    <path d="M52 66 C52 72 58 72 57 66Z" fill="#ff8fa6" ${S(1.4)}/>
    ${blush(32, 64, '#ff9a8a')}${blush(68, 64, '#ff9a8a')}
    ${feet('#fff6ea', 90, 12, 6.6)}`;
  });

  // ハムモチ（ノーマル）: ほっぺにひまわりの種を10こ入れられる。おもちのようにのびる
  add('hamumochi', () => {
    const b = shade('#f5d6b0', { hi: 0.6 });
    return `${ground(28)}${b.d}
    <circle cx="30" cy="40" r="8" fill="#f0c49a" ${S(2.1)}/><circle cx="30" cy="40" r="4" fill="#ffb3c7"/>
    <circle cx="70" cy="40" r="8" fill="#f0c49a" ${S(2.1)}/><circle cx="70" cy="40" r="4" fill="#ffb3c7"/>
    <path d="M50 36 C74 36 86 52 86 68 C86 84 72 91 50 91 C28 91 14 84 14 68 C14 52 26 36 50 36Z" fill="${b.f}" ${S()}/>
    <path d="M30 40 C40 46 60 46 70 40 C66 52 34 52 30 40Z" fill="#e8a86a" opacity=".55"/>
    <ellipse cx="50" cy="78" rx="18" ry="10" fill="#fffaf2"/>
    <circle cx="24" cy="66" r="9" fill="#ffe6d0" ${S(1.6)}/><circle cx="76" cy="66" r="9" fill="#ffe6d0" ${S(1.6)}/>
    ${eye(40, 58, 4.4, '#8a5a3a')}${eye(60, 58, 4.4, '#8a5a3a')}
    <ellipse cx="50" cy="64" rx="2.2" ry="1.6" fill="#ff8fa3"/>${mouthW(50, 67, 2.4)}
    ${blush(26, 66, '#ff8fa3', 4.6, 3)}${blush(74, 66, '#ff8fa3', 4.6, 3)}
    <path d="M50 70 C55 74 56 82 50 88 C44 82 45 74 50 70Z" fill="#4a3a4f" ${S(1.2)}/><path d="M48 75 C47 79 47 83 49 86 M52 75 C53 79 53 83 51 86" ${N} stroke="#fff" stroke-width="1" opacity=".8"/>
    <circle cx="44" cy="80" r="3.4" fill="#f5d6b0" ${S(1.6)}/><circle cx="56" cy="80" r="3.4" fill="#f5d6b0" ${S(1.6)}/>`;
  });

  // ピヨコロ（ノーマル・ひこう）: からをかぶったまま歩きまわる。ぬぐと少し恥ずかしい
  add('piyokoro', () => {
    const b = shade('#ffe066', { hi: 0.55 }), shell = shade('#ffffff', { hi: 0.2, lo: -0.1 });
    return `${ground(24)}${b.d}${shell.d}
    <path d="M24 62 C16 58 14 68 20 72 C24 72 26 68 27 66Z" fill="#ffd23f" ${S(2)}/>${mir(`<path d="M24 62 C16 58 14 68 20 72 C24 72 26 68 27 66Z" fill="#ffd23f" ${S(2)}/>`)}
    <path d="${egg(50, 38, 27, 90)}" fill="${b.f}" ${S()}/>
    <path d="M24 50 C24 30 36 20 50 20 C64 20 76 30 76 50 L70 44 L64 52 L58 44 L50 52 L42 44 L36 52 L30 44Z" fill="${shell.f}" ${S(2.1)}/>
    <ellipse cx="40" cy="30" rx="3" ry="2" fill="#f0e6d6"/><ellipse cx="60" cy="34" rx="2" ry="1.4" fill="#f0e6d6"/>
    ${eye(41, 62, 4.6, '#ff9a3c')}${eye(59, 62, 4.6, '#ff9a3c')}${blush(32, 70)}${blush(68, 70)}
    <path d="M45 68 L55 68 L50 74Z" fill="#ff9a3c" ${S(1.6)}/>
    <path d="M42 88 L38 93 M42 88 L42 94 M42 88 L46 93 M58 88 L54 93 M58 88 L58 94 M58 88 L62 93" ${S(2, '#ff9a3c')}/>`;
  });

  // オニギリン（ノーマル）: 遠足の日は大いそがし。中身はなにか、本人もわからない
  add('onigirin', () => {
    const rice = shade('#ffffff', { hi: 0.2, lo: -0.12 }), nori = shade('#2f4a3a', { hi: 0.25, lo: -0.2 });
    let grains = '';
    [[38, 34], [56, 30], [64, 44], [30, 52], [72, 58], [44, 46]].forEach(([x, y], i) => { grains += `<ellipse cx="${x}" cy="${y}" rx="2.4" ry="1.4" fill="#eef1f6" ${S(0.8, '#cfd6e2')} transform="rotate(${i * 40} ${x} ${y})"/>`; });
    return `${ground(28)}${rice.d}${nori.d}
    <path d="M50 18 C58 18 64 26 72 40 C80 54 86 66 84 78 C82 88 72 90 50 90 C28 90 18 88 16 78 C14 66 20 54 28 40 C36 26 42 18 50 18Z" fill="${rice.f}" ${S()}/>
    ${grains}
    <path d="M30 72 L70 72 L72 90 L28 90Z" fill="${nori.f}" ${S(2.1)}/>
    <path d="M34 76 L66 76" ${S(1, '#4f6a5a')}/>
    <circle cx="50" cy="26" r="5" fill="#e8384f" ${S(1.6)}/><ellipse cx="48.4" cy="24.4" rx="1.6" ry="1" fill="#fff" opacity=".7"/>
    ${face({ y: 56, dx: 10, iris: '#3f9a4e', mouth: 's', my: 7 })}`;
  });

  // マンジュウン（ノーマル）: ふかしたてが自慢。おなかの焼き印は、ひみつの花のマーク
  add('manjuun', () => {
    const b = shade('#fff4e4', { hi: 0.5, lo: -0.15 });
    const steam = (x, d) => `<path d="M${x} 30 C${x - 4} ${24 - d} ${x + 4} ${20 - d} ${x} ${14 - d}" ${N} stroke="#e8dde8" stroke-width="2.6" stroke-linecap="round"/>`;
    return `${ground(32)}${b.d}${steam(36, 0)}${steam(50, 4)}${steam(64, 0)}
    <path d="M14 74 C14 50 30 36 50 36 C70 36 86 50 86 74 C86 86 72 90 50 90 C28 90 14 86 14 74Z" fill="${b.f}" ${S()}/>
    <path d="M18 82 C30 88 70 88 82 82" ${N} ${S(1.4, '#e8d2b8')}/>
    ${gloss(32, 48, 7, 3, -24, 0.7)}
    <g transform="translate(50 76)" opacity=".75"><circle r="6" fill="none" stroke="#a8784a" stroke-width="1.6"/>${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-3.4" rx="1.8" ry="3" fill="#a8784a" transform="rotate(${a})"/>`).join('')}</g>
    ${face({ y: 58, dx: 11, iris: '#c98a4e', mouth: 'w', my: 6 })}`;
  });

  // クロソバン（ほのお）: 東村山名物・黒焼きそばの子。黒いソースは見た目よりやさしい味
  add('kurosoban', () => {
    const b = shade('#4a3a3a', { hi: 0.35, lo: -0.25 }), plate = vshade('#ffffff', '#e2e8f0');
    let noodles = '';
    for (let i = 0; i < 6; i++) noodles += `<path d="M${22 + i * 2} ${50 + i * 6} C${34} ${44 + i * 6} ${44} ${56 + i * 6} ${54} ${48 + i * 6} C${64} ${42 + i * 6} ${70} ${54 + i * 6} ${78 - i * 2} ${48 + i * 6}" ${N} ${S(1.6, '#6b5656')}/>`;
    return `${ground(36)}${plate.d}${b.d}
    <ellipse cx="50" cy="86" rx="44" ry="8" fill="${plate.f}" ${S(2.1)}/>
    <path d="M16 82 C14 60 28 36 50 36 C72 36 86 60 84 82Z" fill="${b.f}" ${S()}/>
    ${noodles}
    <path d="M30 42 L34 46 L30 48Z M64 40 L68 44 L64 46Z M74 56 L78 60 L74 62Z" fill="#e8384f" ${S(1)}/>
    <circle cx="40" cy="44" r="1.4" fill="#5fb85a"/><circle cx="58" cy="44" r="1.4" fill="#5fb85a"/><circle cx="28" cy="62" r="1.4" fill="#5fb85a"/><circle cx="72" cy="70" r="1.4" fill="#5fb85a"/>
    <path d="M70 30 L92 10 M74 34 L96 16" ${S(2.4, '#c98a4e')}/>
    <ellipse cx="50" cy="66" rx="20" ry="11" fill="#4a3a3a" opacity=".5"/>
    ${face({ y: 62, dx: 10, iris: '#ff7a2e', cheek: '#ff7a6b', mouth: 's', my: 7 })}
    ${flame(14, 70, 0.6)}`;
  });

  // タコヤキン（ほのお・みず）: 外はカリッと中はトロッと。つまようじは大事なアンテナ
  add('takoyakin', () => {
    const b = shade('#e8a85a', { hi: 0.4 });
    let bonito = '';
    [[40, 30, 20], [58, 28, -30], [66, 38, 50]].forEach(([x, y, r]) => { bonito += `<path d="M${x} ${y} q4 -3 8 0 q-4 3 -8 0Z" fill="#f2c9a0" ${S(1)} transform="rotate(${r} ${x} ${y})"/>`; });
    return `${ground(28)}${b.d}
    <path d="M70 80 C80 86 88 82 90 74 C86 78 80 78 76 74" fill="#ff8a7a" ${S(2)}/><circle cx="82" cy="80" r="1.4" fill="#fff"/>
    <circle cx="50" cy="60" r="31" fill="${b.f}" ${S()}/>
    <path d="M22 50 C28 34 44 28 56 30 C70 32 80 42 80 52 C72 48 64 52 58 48 C52 52 46 48 40 52 C34 48 28 54 22 50Z" fill="#5a3022" ${S(1.6)}/>
    <path d="M28 46 L34 40 L40 46 L46 38 L52 46 L58 38 L64 46 L70 40 L76 46" ${N} stroke="#fffbe6" stroke-width="2.6" stroke-linejoin="round"/>
    <circle cx="36" cy="42" r="1.2" fill="#5fb85a"/><circle cx="62" cy="40" r="1.2" fill="#5fb85a"/><circle cx="50" cy="36" r="1.2" fill="#5fb85a"/>
    ${bonito}
    <path d="M58 30 L68 8" ${S(2.4, '#e0c08a')}/>
    ${gloss(30, 66, 3, 6, 20, 0.35)}
    ${face({ y: 64, dx: 10, iris: '#d9772e', cheek: '#ff7a6b', mouth: 'o', my: 9 })}`;
  });

  // ダンゴロ（むし・じめん）: おどろくと丸まって転がる。そのまま坂道を下りきってしまう
  add('dangoro', () => {
    const b = shade('#8a96a8', { hi: 0.45 });
    let segs = '';
    for (let i = 1; i < 5; i++) segs += `<path d="M${18 + i * 2} ${76 - i * 7} C${36} ${70 - i * 9} ${64} ${70 - i * 9} ${82 - i * 2} ${76 - i * 7}" ${N} ${S(1.8, '#5f6a7a')}/>`;
    return `${ground(32)}${b.d}
    <path d="M24 84 L20 92 M34 86 L32 94 M44 87 L44 95 M56 87 L56 95 M66 86 L68 94 M76 84 L80 92" ${S(2.2)}/>
    <path d="M12 84 C12 56 30 36 50 36 C70 36 88 56 88 84 Z" fill="${b.f}" ${S()}/>
    ${segs}
    ${gloss(32, 50, 7, 3, -30, 0.55)}
    <path d="M44 72 C38 62 30 60 24 64 M56 72 C62 62 70 60 76 64" ${N} ${S(1.8)}/>
    <ellipse cx="50" cy="80" rx="19" ry="11" fill="#d6dce6" ${S(2.1)}/>
    ${eye(43, 79, 4.2, '#5f6a7a')}${eye(57, 79, 4.2, '#5f6a7a')}
    ${blush(34, 84, '#ff9ab0', 4, 2.4)}${blush(66, 84, '#ff9ab0', 4, 2.4)}${mouthW(50, 85, 2.2)}`;
  });

  // ホタルン（むし・でんき）: 北山公園の初夏の夜に、おしりの明かりでおしゃべりする
  add('hotarun', () => {
    const b = shade('#4a4a5e', { hi: 0.4 }), lamp = shade('#fff27a', { cx: 0.5, cy: 0.5, hi: 0.6, lo: -0.1 }), glowId = gid();
    return `<defs><radialGradient id="${glowId}"><stop offset="0" stop-color="#fff27a" stop-opacity=".8"/><stop offset="1" stop-color="#fff27a" stop-opacity="0"/></radialGradient></defs>
    ${ground(20)}${b.d}${lamp.d}
    <circle cx="50" cy="76" r="22" fill="url(#${glowId})"/>
    <ellipse cx="30" cy="48" rx="12" ry="7" fill="#e6f0ff" fill-opacity=".8" ${S(1.8)} transform="rotate(-30 30 48)"/>
    <ellipse cx="70" cy="48" rx="12" ry="7" fill="#e6f0ff" fill-opacity=".8" ${S(1.8)} transform="rotate(30 70 48)"/>
    <ellipse cx="50" cy="76" rx="15" ry="12" fill="${lamp.f}" ${S()}/>
    <path d="${egg(50, 34, 19, 74)}" fill="${b.f}" ${S()}/>
    <path d="M36 42 C40 32 60 32 64 42 C58 40 42 40 36 42Z" fill="#ff5a5a" ${S(1.6)}/>
    <path d="M44 34 L38 20 M56 34 L62 20" ${S(2)}/><circle cx="38" cy="19" r="2.2" fill="#fff27a" ${S(1.2)}/><circle cx="62" cy="19" r="2.2" fill="#fff27a" ${S(1.2)}/>
    ${face({ y: 52, dx: 8, r: 4.4, iris: '#ffd23f', cheek: '#ff8fb8', cdx: 14, mouth: 'w', my: 7 })}
    ${sparkle(20, 76, 3, '#fff27a')}${sparkle(84, 70, 2.6, '#fff27a')}`;
  });

  // ヒカリン（むし・でんき）: ホタルンが進化。ちょうちんのような明かりで、夜道をてらしてくれる
  add('hikarin', () => {
    const b = shade('#3f4a6e', { hi: 0.45 }), lamp = shade('#fff27a', { cx: 0.5, cy: 0.45, hi: 0.7, lo: -0.05 }), glowId = gid();
    const wing = `<path d="M34 44 C20 30 6 32 6 42 C6 52 20 54 34 50Z" fill="#e6f0ff" fill-opacity=".85" ${S(1.8)}/><path d="M30 46 C22 42 14 42 10 44" ${N} ${S(1, '#a9c2f0')}/>`;
    return `<defs><radialGradient id="${glowId}"><stop offset="0" stop-color="#fff27a" stop-opacity=".9"/><stop offset="1" stop-color="#fff27a" stop-opacity="0"/></radialGradient></defs>
    ${ground(22)}${b.d}${lamp.d}
    <circle cx="50" cy="74" r="30" fill="url(#${glowId})"/>
    ${wing}${mir(wing)}
    <path d="M32 62 C30 76 38 90 50 90 C62 90 70 76 68 62Z" fill="${lamp.f}" ${S()}/>
    <path d="M34 70 Q50 74 66 70 M36 80 Q50 84 64 80" ${N} ${S(1.2, '#e0c040')}/>
    <path d="${egg(50, 28, 21, 66)}" fill="${b.f}" ${S()}/>
    <path d="M34 36 C40 24 60 24 66 36 C58 33 42 33 34 36Z" fill="#ff5a5a" ${S(1.6)}/>
    <path d="M42 28 L34 12 M58 28 L66 12" ${S(2)}/>${flame(34, 12, 0.4, '#fff27a', '#fff')}${flame(66, 12, 0.4, '#fff27a', '#fff')}
    ${face({ y: 46, dx: 9, r: 4.6, iris: '#ffd23f', cheek: '#ff8fb8', cdx: 15, mouth: 's', my: 7 })}
    ${sparkle(14, 74, 3.4, '#fff27a')}${sparkle(88, 66, 3, '#fff27a')}${sparkle(84, 88, 2.4, '#fff27a')}`;
  });

  // ホタルビメ（むし・フェアリー）: ヒカリンが進化。ホタルたちのお姫さま。ひと晩だけの光の舞踏会をひらく
  add('hotarubime', () => {
    const b = shade('#3a3f6e', { hi: 0.5 }), gown = shade('#fff27a', { cx: 0.5, cy: 0.3, hi: 0.7, lo: -0.15 }), glowId = gid();
    const wing = `<path d="M38 44 C24 24 4 24 4 38 C4 50 22 54 38 50Z" fill="#e6f0ff" fill-opacity=".8" ${S(1.8)}/><path d="M38 52 C24 56 10 64 14 74 C20 80 32 70 40 58Z" fill="#e6f0ff" fill-opacity=".7" ${S(1.8)}/>`;
    const bug = (x, y) => `<circle cx="${x}" cy="${y}" r="4" fill="#fff27a" opacity=".35"/><circle cx="${x}" cy="${y}" r="1.8" fill="#fff9b0"/>`;
    return `<defs><radialGradient id="${glowId}"><stop offset="0" stop-color="#fff9b0" stop-opacity=".9"/><stop offset="1" stop-color="#fff27a" stop-opacity="0"/></radialGradient></defs>
    ${b.d}${gown.d}
    <circle cx="50" cy="66" r="36" fill="url(#${glowId})"/>
    ${wing}${mir(wing)}
    <path d="M38 56 C30 70 22 84 18 92 L82 92 C78 84 70 70 62 56Z" fill="${gown.f}" ${S()}/>
    <path d="M18 92 C26 86 32 92 40 86 C46 92 54 92 60 86 C68 92 74 86 82 92" ${N} ${S(1.4, '#e0c040')}/>
    <path d="M30 76 Q50 82 70 76" ${N} ${S(1.2, '#e0c040')}/>
    <path d="${egg(50, 22, 18, 60)}" fill="${b.f}" ${S()}/>
    <path d="M36 30 C42 20 58 20 64 30 C58 28 42 28 36 30Z" fill="#ff7aa8" ${S(1.6)}/>
    <path d="M40 22 L42 12 L46 18 L50 8 L54 18 L58 12 L60 22Z" fill="#ffe680" ${S(1.8)}/><circle cx="50" cy="16" r="1.6" fill="#ff7aa8"/>
    ${face({ y: 40, dx: 8, r: 4.6, iris: '#ffd23f', cheek: '#ff8fd0', cdx: 13, mouth: 's', my: 7 })}
    ${bug(10, 20)}${bug(88, 16)}${bug(92, 40)}${bug(8, 86)}${bug(90, 84)}${bug(24, 10)}`;
  });

  // ミツバッチ（むし）: 花から花へ、はちみつ集め。つぼからこっそりなめるのが楽しみ
  add('mitsubacchi', () => {
    const b = shade('#ffd23f', { hi: 0.5 }), pot = shade('#e8a85a');
    return `${ground(24)}${b.d}${pot.d}
    <ellipse cx="32" cy="38" rx="12" ry="8" fill="#e6f6ff" fill-opacity=".85" ${S(1.8)} transform="rotate(-30 32 38)"/>
    <ellipse cx="68" cy="38" rx="12" ry="8" fill="#e6f6ff" fill-opacity=".85" ${S(1.8)} transform="rotate(30 68 38)"/>
    <path d="M50 88 L50 94" ${S(2.4)}/>
    <path d="${egg(50, 34, 26, 88)}" fill="${b.f}" ${S()}/>
    <path d="M26 70 C36 74 64 74 74 70 L72 78 C62 82 38 82 28 78Z" fill="#4a3a4f"/>
    <path d="M30 82 C40 86 60 86 70 82 L64 87 C56 90 44 90 36 87Z" fill="#4a3a4f"/>
    <path d="M42 34 L36 20 M58 34 L64 20" ${S(2)}/><circle cx="36" cy="19" r="2.6" fill="#4a3a4f"/><circle cx="64" cy="19" r="2.6" fill="#4a3a4f"/>
    ${face({ y: 54, iris: '#c98a00', mouth: 'w', my: 7 })}
    <path d="M70 62 C66 62 66 76 72 80 L84 80 C90 76 90 62 86 62Z" fill="${pot.f}" ${S(2)}/>
    <path d="M68 62 L88 62" ${S(3)}/><path d="M71 64 C74 70 76 66 78 70" ${N} stroke="#ffb43c" stroke-width="2.6" stroke-linecap="round"/>`;
  });

  // ジョオウバチ（むし・フェアリー）: ミツバッチが進化。花畑の女王さま。おやつのはちみつは自分でつくる
  add('jooubachi', () => {
    const b = shade('#ffc61a', { hi: 0.5 });
    const wing = `<path d="M34 46 C20 30 6 34 8 46 C10 56 24 56 34 52Z" fill="#e6f6ff" fill-opacity=".85" ${S(1.8)}/><path d="M30 48 C22 44 14 44 12 46" ${N} ${S(1, '#a9c2f0')}/>`;
    return `${ground(28)}${b.d}${wing}${mir(wing)}
    <path d="M50 88 L50 95" ${S(2.4)}/>
    <path d="${egg(50, 30, 28, 90)}" fill="${b.f}" ${S()}/>
    <path d="M24 70 C36 74 64 74 76 70 L74 78 C62 82 38 82 26 78Z" fill="#4a3a4f"/>
    <path d="M30 82 C40 86 60 86 70 82 L64 88 C56 91 44 91 36 88Z" fill="#4a3a4f"/>
    ${[30, 36, 43, 50, 57, 64, 70].map((x, i) => `<circle cx="${x}" cy="${62 + [0, 2, 3.2, 3.6, 3.2, 2, 0][i]}" r="2.4" fill="#fff" ${S(1.1)}/>`).join('')}
    <path d="M38 30 L40 16 L45 24 L50 12 L55 24 L60 16 L62 30Z" fill="#ff7aa8" ${S(2)}/><circle cx="50" cy="22" r="2" fill="#fff6b0" ${S(1)}/>
    ${face({ y: 46, iris: '#c98a00', cheek: '#ff7aa8', mouth: 's', my: 6 })}
    <path d="M82 84 L86 50" ${S(2.4, '#c98a4e')}/>${star(86, 48, 6, '#ffe066')}`;
  });

  // カマキリン（むし・かくとう）: 草むらのボクサー。かまのパンチは、じつはとてもやさしい
  add('kamakirin', () => {
    const b = shade('#8fd65a', { hi: 0.5 });
    const arm = `<path d="M32 62 C22 58 18 48 22 40 C26 44 28 48 30 52" ${N} ${S(5.4)}/><path d="M32 62 C22 58 18 48 22 40 C26 44 28 48 30 52" ${N} stroke="#7fcf4a" stroke-width="3.2" stroke-linecap="round"/><path d="M22 40 C18 34 22 28 28 30 C26 34 26 36 24 40Z" fill="#a8e070" ${S(1.8)}/>`;
    return `${ground(22)}${b.d}
    <path d="M40 86 L34 94 M60 86 L66 94 M46 88 L44 95 M54 88 L56 95" ${S(2.2)}/>
    <path d="M40 64 C34 76 38 90 50 90 C62 90 66 76 60 64Z" fill="#7fcf4a" ${S()}/>
    <path d="M42 74 Q50 77 58 74 M42 82 Q50 85 58 82" ${N} ${S(1.2, '#5fa83a')}/>
    ${arm}${mir(arm)}
    <path d="M26 30 C26 18 38 14 50 14 C62 14 74 18 74 30 C74 46 60 60 50 60 C40 60 26 46 26 30Z" fill="${b.f}" ${S()}/>
    <ellipse cx="34" cy="28" rx="8" ry="10" fill="#c8f08a" ${S(1.8)}/><ellipse cx="66" cy="28" rx="8" ry="10" fill="#c8f08a" ${S(1.8)}/>
    ${eye(34, 29, 5.4, '#3f9a4e')}${eye(66, 29, 5.4, '#3f9a4e')}
    <path d="M44 16 L38 4 M56 16 L62 4" ${S(1.8)}/>
    <path d="M44 48 Q50 53 56 48" ${N} ${S(2)}/>${blush(36, 44, '#ff8fa3', 4, 2.6)}${blush(64, 44, '#ff8fa3', 4, 2.6)}
    <path d="M10 34 L4 30 M10 40 L3 40 M90 34 L96 30 M90 40 L97 40" ${S(1.6, '#c9e8a0')}/>`;
  });

  // カミナリコ（でんき）: 夏の夕立といっしょにやってくる。小さな太鼓をたたくと、ゴロッと鳴る
  add('kaminariko', () => {
    const b = shade('#9aa6c8', { hi: 0.55 });
    return `${ground(26)}${b.d}
    <path d="M22 62 C12 62 10 50 18 46 C16 36 28 30 34 36 C36 24 54 20 60 30 C68 24 82 30 80 42 C90 44 90 60 80 62 C84 72 74 80 66 76 C62 86 46 86 42 78 C34 84 22 78 24 70 C16 70 16 62 22 62Z" fill="${b.f}" ${S()}/>
    <path d="M40 30 L36 18 L45 26Z" fill="#ffd23f" ${S(1.8)}/><path d="M60 30 L64 18 L55 26Z" fill="#ffd23f" ${S(1.8)}/>
    ${gloss(32, 42, 6, 3, -30, 0.6)}
    ${face({ y: 54, iris: '#ffd23f', mouth: 'o', my: 8 })}
    <circle cx="16" cy="78" r="6" fill="#ff6f6f" ${S(1.8)}/><circle cx="16" cy="78" r="2.6" fill="#ffd23f"/>
    <circle cx="84" cy="78" r="6" fill="#ff6f6f" ${S(1.8)}/><circle cx="84" cy="78" r="2.6" fill="#ffd23f"/>
    <path d="M44 84 L38 94 L46 92 L42 100" ${N} stroke="#ffd23f" stroke-width="3" stroke-linejoin="round"/>
    <path d="M60 84 L56 92 L62 91 L58 98" ${N} stroke="#ffd23f" stroke-width="2.4" stroke-linejoin="round"/>`;
  });

  // ゴロゴロン（でんき・ひこう）: カミナリコが進化。まわりの太鼓をひとまわりたたくと、町じゅうに雷が鳴る
  add('gorogoron', () => {
    const b = shade('#7f8cb8', { hi: 0.5 });
    let drums = '';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2, x = 50 + Math.cos(a) * 40, y = 52 + Math.sin(a) * 38;
      drums += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6.4" fill="#ff6f6f" ${S(1.8)}/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="#ffd23f"/>`;
    }
    return `${b.d}
    <ellipse cx="50" cy="52" rx="40" ry="38" fill="none" ${S(3.4, '#c98a4e')}/>
    ${drums}
    <path d="M28 64 C18 64 16 52 24 48 C22 38 34 32 40 38 C42 26 58 24 62 34 C70 28 82 36 78 46 C86 48 86 62 76 64 C78 74 68 80 62 76 C58 84 44 84 40 76 C32 80 24 74 28 64Z" fill="${b.f}" ${S()}/>
    <path d="M40 34 L35 20 L46 30Z" fill="#ffd23f" ${S(1.8)}/><path d="M60 34 L65 20 L54 30Z" fill="#ffd23f" ${S(1.8)}/>
    ${face({ y: 54, dx: 10, iris: '#ffd23f', mouth: 's', my: 8 })}${brow(48, 10, 0.8)}
    <path d="M48 80 L42 92 L50 90 L46 100" ${N} stroke="#ffd23f" stroke-width="3.2" stroke-linejoin="round"/>`;
  });

  // デンキュウン（でんき・はがね）: いいことを思いつくと、あたまがぱっと光る
  add('denkyun', () => {
    const glass = shade('#fff7c2', { hi: 0.7, lo: -0.08 }), base = vshade('#d6dce6', '#8a96a8'), glowId = gid();
    return `<defs><radialGradient id="${glowId}"><stop offset="0" stop-color="#fff27a" stop-opacity=".7"/><stop offset="1" stop-color="#fff27a" stop-opacity="0"/></radialGradient></defs>
    ${ground(16)}${glass.d}${base.d}
    <circle cx="50" cy="40" r="34" fill="url(#${glowId})"/>
    <path d="M18 18 L10 10 M82 18 L90 10 M50 4 L50 -2 M12 42 L4 42 M88 42 L96 42" ${S(2.4, '#ffd23f')}/>
    <path d="M36 70 C30 60 22 52 22 40 C22 24 34 12 50 12 C66 12 78 24 78 40 C78 52 70 60 64 70Z" fill="${glass.f}" ${S()}/>
    <path d="M44 66 L44 50 C44 44 56 44 56 50 L56 66" ${N} ${S(1.6, '#e0a000')}/>
    <path d="M30 32 C32 24 38 19 44 17" ${N} stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".9"/>
    <path d="M36 70 L64 70 L62 86 C60 92 40 92 38 86Z" fill="${base.f}" ${S()}/>
    <path d="M37 76 L63 74 M37 81 L63 79 M38 86 L62 84" ${S(1.6, '#6b7686')}/>
    ${face({ y: 38, dx: 9, r: 4.4, iris: '#ff9a3c', cdx: 16, cy: 6, mouth: 'w', my: 7 })}`;
  });

  // ネジマキン（はがね）: 背中のネジを巻くと、とことこ歩く。止まるとちょっとさみしそう
  add('nejimakin', () => {
    const b = vshade('#ffb3b3', '#f07a7a'), tin = vshade('#e8eef6', '#aab4c2');
    return `${ground(24)}${b.d}${tin.d}
    <path d="M78 52 L90 52" ${S(3)}/><path d="M90 42 C98 42 98 52 90 52 C98 52 98 62 90 62 C84 62 84 42 90 42Z" fill="#ffd23f" ${S(2)}/>
    <rect x="24" y="26" width="52" height="42" rx="12" fill="${tin.f}" ${S()}/>
    <rect x="30" y="32" width="40" height="28" rx="8" fill="#fff" ${S(1.6)}/>
    <path d="M50 26 L50 16" ${S(2.4)}/><circle cx="50" cy="13" r="4" fill="#ff6f6f" ${S(1.8)}/>
    <rect x="28" y="64" width="44" height="22" rx="8" fill="${b.f}" ${S()}/>
    <circle cx="40" cy="72" r="2.4" fill="#ffd23f" ${S(1.2)}/><circle cx="60" cy="72" r="2.4" fill="#ffd23f" ${S(1.2)}/>
    <rect x="16" y="66" width="10" height="14" rx="4" fill="#aab4c2" ${S(1.8)}/><rect x="74" y="66" width="10" height="14" rx="4" fill="#aab4c2" ${S(1.8)}/>
    <rect x="32" y="86" width="12" height="6" rx="2" fill="#6b7686" ${S(1.8)}/><rect x="56" y="86" width="12" height="6" rx="2" fill="#6b7686" ${S(1.8)}/>
    ${face({ y: 44, dx: 9, r: 4.4, iris: '#3f6fd6', cdx: 15, cy: 6, mouth: 's', my: 7 })}
    ${gloss(30, 30, 4, 2, -20, 0.6)}`;
  });

  // ゼンマイザー（はがね）: ネジマキンが進化。からだじゅうの歯車で、どんな仕事もこなす
  add('zenmaizer', () => {
    const tin = vshade('#d6e2f2', '#8a9ab0');
    const gear = (x, y, r, c) => { let t = ''; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; t += `<rect x="${(x + Math.cos(a) * r - 2.4).toFixed(1)}" y="${(y + Math.sin(a) * r - 2.4).toFixed(1)}" width="4.8" height="4.8" rx="1" fill="${c}" ${S(1.2)}/>`; } return `${t}<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" ${S(1.6)}/><circle cx="${x}" cy="${y}" r="${r * 0.35}" fill="#fff" ${S(1.2)}/>`; };
    return `${ground(30)}${tin.d}
    <path d="M24 56 L10 44" ${S(5)}/><path d="M24 56 L10 44" ${S(3, '#aab4c2')}/><circle cx="9" cy="42" r="5" fill="#ffd23f" ${S(1.8)}/>
    <path d="M76 56 L90 44" ${S(5)}/><path d="M76 56 L90 44" ${S(3, '#aab4c2')}/><circle cx="91" cy="42" r="5" fill="#ffd23f" ${S(1.8)}/>
    <rect x="22" y="20" width="56" height="44" rx="14" fill="${tin.f}" ${S()}/>
    <rect x="28" y="26" width="44" height="30" rx="9" fill="#fff" ${S(1.6)}/>
    <path d="M40 20 L36 8 M60 20 L64 8" ${S(2.2)}/><circle cx="36" cy="7" r="3" fill="#ff6f6f" ${S(1.4)}/><circle cx="64" cy="7" r="3" fill="#ff6f6f" ${S(1.4)}/>
    <rect x="24" y="60" width="52" height="26" rx="10" fill="${tin.f}" ${S()}/>
    ${gear(40, 73, 6, '#ffd23f')}${gear(58, 72, 4.6, '#ff9a6b')}
    <rect x="30" y="86" width="14" height="7" rx="3" fill="#5f6a7a" ${S(1.8)}/><rect x="56" y="86" width="14" height="7" rx="3" fill="#5f6a7a" ${S(1.8)}/>
    ${face({ y: 40, dx: 10, r: 4.6, iris: '#3f6fd6', cdx: 16, cy: 6, mouth: 's', my: 7 })}${brow(34, 10, 0.5)}`;
  });

  // ギアキング（はがね・でんき）: ゼンマイザーが進化。巨大な歯車の王。この子が止まると町の時計も止まる
  add('gearking', () => {
    const b = shade('#c9d2de', { hi: 0.55 }), gold = shade('#ffd23f', { hi: 0.5 });
    let teeth = '';
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; teeth += `<rect x="-5" y="-42" width="10" height="10" rx="2" fill="${b.f}" ${S(2)} transform="translate(50 56) rotate(${(a * 180) / Math.PI})"/>`; }
    const mini = (x, y, r) => { let t = ''; for (let i = 0; i < 8; i++) { const a = (i / 8) * 360; t += `<rect x="-2.2" y="${-r - 3}" width="4.4" height="4.4" rx="1" fill="${gold.f}" ${S(1.1)} transform="translate(${x} ${y}) rotate(${a})"/>`; } return `${t}<circle cx="${x}" cy="${y}" r="${r}" fill="${gold.f}" ${S(1.6)}/><circle cx="${x}" cy="${y}" r="${r * 0.35}" fill="#fff" ${S(1)}/>`; };
    return `${ground(32, 95)}${b.d}${gold.d}
    ${teeth}
    <circle cx="50" cy="56" r="34" fill="${b.f}" ${S()}/>
    <circle cx="50" cy="56" r="26" fill="#eef2f8" ${S(1.6)}/>
    <path d="M34 22 L36 10 L42 18 L50 6 L58 18 L64 10 L66 22Z" fill="${gold.f}" ${S(2)}/><circle cx="50" cy="15" r="2" fill="#5cc8ff"/>
    ${mini(14, 20, 6)}${mini(88, 84, 7)}
    <path d="M86 18 L80 30 L86 30 L80 42" ${N} stroke="#ffd23f" stroke-width="3" stroke-linejoin="round"/>
    ${face({ y: 52, dx: 10, r: 5, iris: '#3f6fd6', cdx: 17, cy: 7, mouth: 's', my: 8 })}${brow(45, 10, 0.6)}
    ${gloss(32, 34, 6, 3, -40, 0.6)}`;
  });

  // ナベブタン（はがね・みず）: こうらは鍋のふた。雨の日は自分で自分の傘になる
  add('nabebutan', () => {
    const lid = shade('#d6dce6', { hi: 0.6 }), skin = shade('#8fd6a8');
    return `${ground(34)}${lid.d}${skin.d}
    <ellipse cx="26" cy="84" rx="7" ry="5" fill="${skin.f}" ${S(2)}/><ellipse cx="74" cy="84" rx="7" ry="5" fill="${skin.f}" ${S(2)}/>
    <path d="M80 72 C88 72 92 66 90 62 C86 66 82 66 80 66Z" fill="${skin.f}" ${S(1.8)}/>
    <path d="M10 74 C10 50 28 36 50 36 C72 36 90 50 90 74 C80 80 20 80 10 74Z" fill="${lid.f}" ${S()}/>
    <path d="M16 70 C28 74 72 74 84 70" ${N} ${S(1.4, '#9aa6b6')}/>
    <ellipse cx="50" cy="34" rx="10" ry="5" fill="#4a3a4f"/><ellipse cx="50" cy="31" rx="8" ry="3.4" fill="#6b5a70"/>
    ${gloss(30, 48, 9, 3.4, -24, 0.7)}
    <path d="M32 76 C32 62 68 62 68 76 C68 88 58 92 50 92 C42 92 32 88 32 76Z" fill="${skin.f}" ${S()}/>
    ${face({ y: 76, dx: 8, r: 4.2, iris: '#2f7fd6', cdx: 14, cy: 6, mouth: 'w', my: 6 })}`;
  });

  // ドスコイン（かくとう）: ちびっこ力士。しこをふむと、地面がちょっとだけゆれる
  add('dosukoin', () => {
    const b = shade('#ffd9bf', { hi: 0.5 });
    return `${ground(30)}${b.d}
    <path d="${egg(50, 30, 30, 90)}" fill="${b.f}" ${S()}/>
    <ellipse cx="50" cy="22" rx="12" ry="7" fill="#3a2a3a" ${S(1.8)}/><path d="M42 18 C46 12 54 12 58 18" fill="#3a2a3a" ${S(1.6)}/>
    <path d="M24 72 C34 78 66 78 76 72 L76 82 C66 88 34 88 24 82Z" fill="#3f6fd6" ${S(2.1)}/>
    <path d="M44 78 L44 90 L56 90 L56 78" fill="#3f6fd6" ${S(2)}/>
    <path d="M42 64 Q50 68 58 64" ${N} ${S(1.4, '#e8b090')}/>
    <circle cx="16" cy="62" r="8" fill="${b.f}" ${S(2)}/><circle cx="84" cy="62" r="8" fill="${b.f}" ${S(2)}/>
    ${face({ y: 48, dx: 10, iris: '#8a5a3a', mouth: 's', my: 7 })}${brow(41, 10, 0.7)}
    ${feet('#ffcfb0', 91, 14, 7.6)}`;
  });

  // オオゼキン（かくとう）: ドスコインが進化。化粧まわしの花は、自分で育てた菖蒲
  add('oozekin', () => {
    const b = shade('#ffd2b5', { hi: 0.45 }), apron = vshade('#7b4dd6', '#5a35a8');
    return `${ground(34)}${b.d}${apron.d}
    <path d="M50 22 C78 22 90 42 90 62 C90 84 74 92 50 92 C26 92 10 84 10 62 C10 42 22 22 50 22Z" fill="${b.f}" ${S()}/>
    <ellipse cx="50" cy="16" rx="13" ry="7" fill="#3a2a3a" ${S(1.8)}/><path d="M40 12 C46 4 54 4 60 12" fill="#3a2a3a" ${S(1.6)}/>
    <path d="M14 66 C30 74 70 74 86 66 L86 76 C70 84 30 84 14 76Z" fill="#2f4fa8" ${S(2.1)}/>
    <path d="M36 74 L36 94 L64 94 L64 74" fill="${apron.f}" ${S(2)}/>
    <path d="M50 92 C44 86 44 80 50 78 C56 80 56 86 50 92Z" fill="#c9a8ff" ${S(1.4)}/><path d="M42 84 C46 84 48 86 50 90 M58 84 C54 84 52 86 50 90" ${N} ${S(1.2, '#ffd23f')}/>
    <path d="M36 94 C40 96 46 94 50 96 C54 94 60 96 64 94" ${N} ${S(1.6, '#ffd23f')}/>
    <circle cx="10" cy="56" r="9" fill="${b.f}" ${S(2)}/><circle cx="90" cy="56" r="9" fill="${b.f}" ${S(2)}/>
    ${face({ y: 44, dx: 11, iris: '#8a5a3a', mouth: 's', my: 8 })}${brow(36, 11, 0.9)}`;
  });

  // ヨコヅナン（かくとう）: オオゼキンが進化。土俵の王者。白い綱をしめると、だれも動かせない
  add('yokozunan', () => {
    const b = shade('#ffcfae', { hi: 0.45 }), rope = shade('#ffffff', { hi: 0.2, lo: -0.15 });
    let shide = '';
    [36, 48, 60].forEach((x) => { shide += `<path d="M${x} 62 L${x + 4} 66 L${x} 70 L${x + 4} 74 L${x} 78" ${N} stroke="#fff" stroke-width="3.4" stroke-linejoin="round"/><path d="M${x} 62 L${x + 4} 66 L${x} 70 L${x + 4} 74 L${x} 78" ${N} ${S(1, '#9aa6b6')}/>`; });
    return `${ground(36)}${b.d}${rope.d}
    <path d="M50 20 C80 20 94 40 94 62 C94 86 76 94 50 94 C24 94 6 86 6 62 C6 40 20 20 50 20Z" fill="${b.f}" ${S()}/>
    <ellipse cx="50" cy="14" rx="14" ry="7" fill="#3a2a3a" ${S(1.8)}/><path d="M38 10 C46 0 54 0 62 10" fill="#3a2a3a" ${S(1.6)}/>
    <path d="M10 56 C30 66 70 66 90 56 L90 66 C70 76 30 76 10 66Z" fill="${rope.f}" ${S(2.4)}/>
    <path d="M16 59 L22 66 M28 62 L34 69 M66 62 L72 69 M78 59 L84 66" ${S(1.2, '#c9d0dc')}/>
    <path d="M12 76 C30 84 70 84 88 76 L88 84 C70 92 30 92 12 84Z" fill="#4a3f8a" ${S(2.1)}/>
    ${shide}
    <circle cx="6" cy="52" r="10" fill="${b.f}" ${S(2)}/><circle cx="94" cy="52" r="10" fill="${b.f}" ${S(2)}/>
    ${face({ y: 40, dx: 11, iris: '#8a5a3a', mouth: 's', my: 8 })}${brow(32, 11, 1.1)}
    ${sparkle(8, 20, 4, '#ffe680')}${sparkle(92, 24, 3.4, '#ffe680')}`;
  });

  // コマワール（かくとう）: いちど回りだすと止まらない。目が回ってからが本番
  add('komawaru', () => {
    const b = shade('#ff8a6b', { hi: 0.45 });
    return `${ground(18, 94)}${b.d}
    <path d="M50 92 L46 80 L54 80Z" fill="#8a96a8" ${S(1.8)}/>
    <path d="M12 52 C12 40 30 30 50 30 C70 30 88 40 88 52 C88 66 66 82 50 82 C34 82 12 66 12 52Z" fill="${b.f}" ${S()}/>
    <path d="M14 50 C30 58 70 58 86 50" ${N} ${S(4, '#ffd23f')}/><path d="M20 62 C34 70 66 70 80 62" ${N} ${S(3, '#5cc8ff')}/>
    <rect x="46" y="16" width="8" height="16" rx="3" fill="#c98a4e" ${S(1.8)}/>
    ${face({ y: 44, dx: 11, r: 4.4, iris: '#e8384f', cdx: 19, cy: 6, mouth: 's', my: 7 })}${brow(37, 11, 0.6)}
    <path d="M4 40 C2 52 6 62 12 70 M96 40 C98 52 94 62 88 70" ${N} ${S(1.8, '#ffb3a0')}/>
    <path d="M30 88 C40 92 60 92 70 88" ${N} ${S(1.4, '#c9c0cc')}/>`;
  });

  // ニョロリン（どく）: いつもとぐろを巻いてお昼ね。舌をちろちろ出すのはあいさつ
  add('nyororin', () => {
    const b = shade('#b07ad8', { hi: 0.5 });
    return `${ground(28)}${b.d}
    <path d="M20 84 C20 72 36 68 50 68 C64 68 82 72 82 84 C82 92 20 92 20 84Z" fill="${b.f}" ${S()}/>
    <path d="M28 72 C28 62 40 58 50 58 C62 58 72 62 72 72 C72 80 28 80 28 72Z" fill="${b.f}" ${S()}/>
    <path d="M34 80 Q50 86 66 80 M38 70 Q50 74 62 70" ${N} ${S(1.2, '#8a52b8')}/>
    <circle cx="30" cy="84" r="2" fill="#7fe0a0"/><circle cx="70" cy="86" r="2" fill="#7fe0a0"/><circle cx="60" cy="74" r="1.6" fill="#7fe0a0"/>
    <path d="M50 60 C38 60 30 52 30 42 C30 30 40 24 50 24 C60 24 70 30 70 42 C70 52 62 60 50 60Z" fill="${b.f}" ${S()}/>
    <ellipse cx="50" cy="50" rx="11" ry="6" fill="#efe0ff"/>
    ${eye(41, 40, 4.4, '#7fe0a0')}${eye(59, 40, 4.4, '#7fe0a0')}${blush(33, 47, '#ff8fd0')}${blush(67, 47, '#ff8fd0')}
    <path d="M50 54 L50 60 L47 64 M50 60 L53 64" ${N} ${S(1.6, '#ff5a7a')}/>${mouthW(50, 52, 2.4)}`;
  });

  // オロチン（どく・ドラゴン）: ニョロリンが進化。3つのあたまは、いつも晩ごはんのメニューでもめている
  add('orochin', () => {
    const b = shade('#8f5ac8', { hi: 0.5 });
    const head = (x, y, iris, m) => `<path d="M${x} ${y + 14} C${x - 12} ${y + 14} ${x - 14} ${y} ${x - 10} ${y - 6} C${x - 6} ${y - 12} ${x + 6} ${y - 12} ${x + 10} ${y - 6} C${x + 14} ${y} ${x + 12} ${y + 14} ${x} ${y + 14}Z" fill="${b.f}" ${S()}/>${eye(x - 5, y - 1, 3.4, iris)}${eye(x + 5, y - 1, 3.4, iris)}${m}`;
    return `${ground(32)}${b.d}
    <path d="M14 86 C14 70 34 64 50 64 C66 64 86 70 86 86 C86 94 14 94 14 86Z" fill="${b.f}" ${S()}/>
    <path d="M24 82 Q50 90 76 82" ${N} ${S(1.2, '#6f3fa8')}/>
    <path d="M30 70 C24 56 22 44 24 36 M50 66 C50 50 50 40 50 30 M70 70 C76 56 78 44 76 36" ${N} ${S(12)}/>
    <path d="M30 70 C24 56 22 44 24 36 M50 66 C50 50 50 40 50 30 M70 70 C76 56 78 44 76 36" ${N} stroke="#8f5ac8" stroke-width="7.4" stroke-linecap="round"/>
    ${head(24, 30, '#7fe0a0', mouthW(24, 37, 2))}${head(76, 30, '#ffd23f', `<path d="M73 36 Q76 40 79 36Z" fill="#c9405e" ${S(1.2)}/>`)}${head(50, 20, '#ff7aa8', `<path d="M46 27 Q50 30 54 27" ${N} ${S(1.6)}/>`)}
    <path d="M45 8 L42 2 M55 8 L58 2" ${S(1.8, '#ffd23f')}/>
    <circle cx="36" cy="80" r="2" fill="#7fe0a0"/><circle cx="66" cy="78" r="2" fill="#7fe0a0"/>`;
  });

  // ドクダミン（どく・くさ）: においは強いけれど、じつは薬にもなる、たよれるやつ
  add('dokudami', () => {
    const b = shade('#6fbf6a', { hi: 0.5 });
    const petal = (a) => `<ellipse cx="50" cy="12" rx="5.6" ry="8" fill="#fff" ${S(1.6)} transform="rotate(${a} 50 22)"/>`;
    return `${ground(26)}${b.d}
    <path d="M50 90 C30 82 16 66 18 50 C20 38 34 32 44 40 C46 42 48 44 50 48 C52 44 54 42 56 40 C66 32 80 38 82 50 C84 66 70 82 50 90Z" fill="${b.f}" ${S()}/>
    <path d="M50 48 L50 86 M50 62 L36 52 M50 62 L64 52 M50 74 L38 68 M50 74 L62 68" ${N} ${S(1.2, '#3f8a46')}/>
    <path d="M50 40 L50 28" ${S(2.2, '#3f7f3a')}/>
    ${petal(0)}${petal(90)}${petal(180)}${petal(270)}
    <path d="M50 12 C53 16 53 26 50 30 C47 26 47 16 50 12Z" fill="#ffd23f" ${S(1.4)}/>
    ${face({ y: 60, dx: 9, r: 4.4, iris: '#a35ccf', cheek: '#ff8fd0', cdx: 16, cy: 6, mouth: 's', my: 7 })}
    <path d="M20 30 C16 26 18 22 22 24 M80 30 C84 26 82 22 78 24" ${N} ${S(1.4, '#b48cff')}/>`;
  });

  // ペンギュン（こおり・みず）: マフラーが自慢。すべって転ぶのも、ちょっとした特技
  add('penguin', () => {
    const b = shade('#4a5a8a', { hi: 0.45 });
    return `${ground(24)}${b.d}
    <path d="M24 64 C14 62 12 74 18 78 C22 76 24 72 26 70Z" fill="#3f4a76" ${S(2)}/>${mir(`<path d="M24 64 C14 62 12 74 18 78 C22 76 24 72 26 70Z" fill="#3f4a76" ${S(2)}/>`)}
    <path d="${egg(50, 28, 26, 90)}" fill="${b.f}" ${S()}/>
    <path d="M30 56 C30 44 40 40 50 46 C60 40 70 44 70 56 C70 76 62 88 50 88 C38 88 30 76 30 56Z" fill="#fff"/>
    <path d="M26 58 C36 64 64 64 74 58 L74 66 C64 72 36 72 26 66Z" fill="#ff6f91" ${S(2)}/>
    <path d="M64 66 L68 82 L74 80 L70 64Z" fill="#ff6f91" ${S(1.8)}/><path d="M66 78 L72 76" ${S(1.2, '#fff')}/>
    ${eye(42, 48, 4.2, '#2f7fd6')}${eye(58, 48, 4.2, '#2f7fd6')}${blush(36, 55, '#ff8fb8', 4, 2.4)}${blush(64, 55, '#ff8fb8', 4, 2.4)}
    <path d="M46 52 L54 52 L50 57Z" fill="#ffb23f" ${S(1.6)}/>
    ${feet('#ffb23f', 91, 10, 6.4)}
    ${gloss(36, 36, 5, 2.4, -30, 0.5)}`;
  });

  // コウテイペン（こおり・みず）: ペンギュンが進化。氷の国の皇帝。足もとのひなを、いつも守っている
  add('kouteipen', () => {
    const b = shade('#3f4a76', { hi: 0.45 }), chick = shade('#c9ced8', { hi: 0.5 });
    return `${ground(30)}${b.d}${chick.d}
    <path d="M22 60 C10 60 6 76 12 82 C18 80 22 74 24 70Z" fill="#323c66" ${S(2)}/>${mir(`<path d="M22 60 C10 60 6 76 12 82 C18 80 22 74 24 70Z" fill="#323c66" ${S(2)}/>`)}
    <path d="${egg(50, 18, 30, 90)}" fill="${b.f}" ${S()}/>
    <path d="M28 50 C28 38 40 34 50 40 C60 34 72 38 72 50 C72 74 64 88 50 88 C36 88 28 74 28 50Z" fill="#fff8e6"/>
    <path d="M28 42 C24 46 24 54 28 58 C32 52 32 46 28 42Z" fill="#ffc83f" ${S(1.6)}/><path d="M72 42 C76 46 76 54 72 58 C68 52 68 46 72 42Z" fill="#ffc83f" ${S(1.6)}/>
    <path d="M38 20 L40 8 L45 15 L50 4 L55 15 L60 8 L62 20Z" fill="#cdeffd" ${S(2)}/><circle cx="50" cy="12" r="1.8" fill="#5cc8ff"/>
    ${eye(42, 36, 4.2, '#2f7fd6')}${eye(58, 36, 4.2, '#2f7fd6')}
    <path d="M45 41 L55 41 L50 47Z" fill="#ffb23f" ${S(1.6)}/>
    <g transform="translate(50 82) scale(.42)"><path d="${egg(0, -24, 20, 16)}" fill="${chick.f}" ${S(2.4 / .42)}/><ellipse cx="0" cy="-8" rx="12" ry="9" fill="#fff"/>${eye(-6, -9, 4.4, '#2f7fd6')}${eye(6, -9, 4.4, '#2f7fd6')}<path d="M-3 -3 L3 -3 L0 1Z" fill="#4a3a4f"/></g>
    ${feet('#ffb23f', 92, 16, 6)}`;
  });

  // ユキウサ（こおり）: 雪の朝に生まれる雪うさぎ。南天の葉っぱの耳と、赤い実の目
  add('yukiusa', () => {
    const b = shade('#ffffff', { hi: 0.3, lo: -0.12 });
    const ear = (x, r) => `<path d="M${x} 46 C${x - 6} 34 ${x - 4} 18 ${x} 12 C${x + 4} 18 ${x + 6} 34 ${x} 46Z" fill="#4fae5a" ${S(2)} transform="rotate(${r} ${x} 46)"/><path d="M${x} 44 L${x} 16" ${S(1, '#2f7a46')} transform="rotate(${r} ${x} 46)"/>`;
    return `${ground(30)}${b.d}
    ${ear(42, -14)}${ear(58, 14)}
    <path d="M12 82 C12 60 30 44 52 44 C74 44 88 60 88 80 C88 90 76 92 50 92 C24 92 12 90 12 82Z" fill="${b.f}" ${S()}/>
    ${gloss(30, 56, 8, 3, -24, 0.9)}
    <circle cx="40" cy="66" r="4.4" fill="#e8384f" ${S(1.6)}/><circle cx="38.6" cy="64.6" r="1.4" fill="#fff"/>
    <circle cx="60" cy="66" r="4.4" fill="#e8384f" ${S(1.6)}/><circle cx="58.6" cy="64.6" r="1.4" fill="#fff"/>
    ${blush(31, 73, '#ff9ab8')}${blush(69, 73, '#ff9ab8')}${mouthW(50, 73, 2.6)}
    ${sparkle(16, 34, 3.4, '#cdeffd')}${sparkle(84, 40, 3, '#cdeffd')}
    <path d="M8 92 C30 88 70 88 92 92" ${N} ${S(1.4, '#cdeffd')}/>`;
  });

  // ユキノミヤ（こおり・フェアリー）: ユキウサが進化。雪の宮のお姫さま。歩いたあとに雪の結晶がさく
  add('yukinomiya', () => {
    const b = shade('#f4f9ff', { hi: 0.4, lo: -0.15 }), robe = shade('#a8dcff', { hi: 0.5 });
    const flake = (x, y, r) => `<g transform="translate(${x} ${y})" stroke="#9fd8ff" stroke-width="1.6" stroke-linecap="round">${[0, 60, 120].map((a) => `<path d="M0 ${-r} L0 ${r} M-${r * 0.35} ${-r * 0.65} L0 ${-r * 0.4} L${r * 0.35} ${-r * 0.65}" transform="rotate(${a})"/>`).join('')}</g>`;
    const ear = (x, r) => `<path d="M${x} 40 C${x - 8} 26 ${x - 6} 8 ${x} 2 C${x + 6} 8 ${x + 8} 26 ${x} 40Z" fill="${b.f}" ${S(2)} transform="rotate(${r} ${x} 40)"/><path d="M${x} 36 C${x - 3} 26 ${x - 2} 14 ${x} 8 C${x + 2} 14 ${x + 3} 26 ${x} 36Z" fill="#ffd6e6" transform="rotate(${r} ${x} 40)"/>`;
    return `${ground(32)}${b.d}${robe.d}
    ${ear(40, -12)}${ear(60, 12)}
    <path d="M28 60 C20 72 16 86 14 92 L86 92 C84 86 80 72 72 60Z" fill="${robe.f}" ${S()}/>
    <path d="M14 92 C24 86 30 92 40 86 C48 92 52 92 60 86 C70 92 76 86 86 92" ${N} ${S(1.4, '#fff')}/>
    <path d="${egg(50, 30, 24, 72)}" fill="${b.f}" ${S()}/>
    <path d="M36 34 L38 22 L43 29 L50 18 L57 29 L62 22 L64 34Z" fill="#cdeffd" ${S(1.8)}/><circle cx="50" cy="27" r="2" fill="#7fb8ff"/>
    ${face({ y: 50, dx: 9, r: 4.6, iris: '#e8384f', cheek: '#ff9ab8', cdx: 16, cy: 7, mouth: 's', my: 7 })}
    ${flake(14, 30, 6)}${flake(88, 22, 5)}${flake(86, 70, 4.4)}${flake(10, 66, 4)}`;
  });

  // コオリンゴ（こおり・くさ）: 冬の果樹園で、ひと晩でこおってしまったりんご。かじるとシャリッ
  add('kooringo', () => {
    const b = shade('#ff5a6a', { hi: 0.45 }), ice = shade('#d9f4ff', { hi: 0.6, lo: -0.08 });
    return `${ground(26)}${b.d}${ice.d}
    <path d="M50 34 C40 26 22 28 18 46 C14 66 28 90 50 88 C72 90 86 66 82 46 C78 28 60 26 50 34Z" fill="${b.f}" ${S()}/>
    <path d="M22 42 C26 32 40 30 50 36 C60 30 74 32 78 42 L74 50 L70 44 L64 54 L58 44 L52 52 L46 44 L40 54 L34 44 L28 52Z" fill="${ice.f}" fill-opacity=".95" ${S(2)}/>
    <path d="M50 36 C50 28 52 22 56 18" ${N} ${S(2.6, '#6b4a33')}/>
    ${leaf(56, 22, 60, 0.55, '#7fcf62')}
    ${gloss(30, 60, 4, 7, 15, 0.45)}
    ${face({ y: 64, dx: 10, iris: '#2f7fd6', cheek: '#ffc0c8', mouth: 'w', my: 7 })}
    ${sparkle(14, 26, 3.4, '#bfe9ff')}${sparkle(86, 30, 3, '#bfe9ff')}`;
  });

  // カラカサン（ゴースト）: 古い番傘から生まれた。一本足でぴょんぴょん、げたの音でやってくる
  add('karakasan', () => {
    const b = shade('#ff6f6f', { cx: 0.4, cy: 0.2, hi: 0.4 });
    let ribs = '';
    [-30, -15, 0, 15, 30].forEach((a) => { ribs += `<path d="M50 14 L${50 + a * 1.25} 62" ${S(1.2, '#c94a4a')}/>`; });
    return `${ground(16, 95)}${b.d}
    <path d="M50 62 L50 84" ${S(5.4)}/><path d="M50 62 L50 84" stroke="#c98a4e" stroke-width="3.2" stroke-linecap="round"/>
    <rect x="40" y="84" width="20" height="5" rx="2" fill="#8a5a34" ${S(1.8)}/><path d="M44 89 L44 93 M56 89 L56 93" ${S(2.4)}/>
    <path d="M42 84 L50 80 L58 84" ${N} ${S(1.6, '#e8384f')}/>
    <path d="M50 14 C30 16 12 40 10 62 C18 58 24 64 30 60 C36 64 44 58 50 62 C56 58 64 64 70 60 C76 64 82 58 90 62 C88 40 70 16 50 14Z" fill="${b.f}" ${S()}/>
    ${ribs}
    <path d="M30 30 C36 24 42 21 48 20" ${N} stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>
    <circle cx="50" cy="12" r="3" fill="#4a3a4f"/>
    ${face({ y: 50, dx: 10, iris: '#ffd23f', cheek: '#ffb3c7', mouth: `<path d="M44 58 Q50 64 56 58Z" fill="#c9405e" ${S(1.8)}/><path d="M48 61 C47 68 55 70 54 61" fill="#ff8fa6" ${S(1.4)}/>`, my: 8 })}`;
  });

  // ヨザクラ（ゴースト・フェアリー）: 春の夜、桜並木にだけあらわれる。ひらひらの袖で花びらを舞わせる
  add('yozakura', () => {
    const b = shade('#ffe6f0', { hi: 0.5, lo: -0.1 }), robe = shade('#8a5cd6', { cx: 0.5, cy: 0.2, hi: 0.4 }), glowId = gid();
    const petal = (x, y, r) => `<path d="M0 -5 C3 -5 4 -1 2 2 L0 1 L-2 2 C-4 -1 -3 -5 0 -5Z" fill="#ffb3cf" ${S(0.8)} transform="translate(${x} ${y}) rotate(${r}) scale(1.2)"/>`;
    const sleeve = `<path d="M34 54 C22 56 10 66 8 80 C16 84 26 80 34 72Z" fill="${robe.f}" ${S(2.1)}/><path d="M12 76 C18 78 24 76 30 72" ${N} ${S(1.2, '#ffb3cf')}/>`;
    return `<defs><radialGradient id="${glowId}"><stop offset="0" stop-color="#ffb3e6" stop-opacity=".7"/><stop offset="1" stop-color="#ffb3e6" stop-opacity="0"/></radialGradient></defs>
    ${b.d}${robe.d}
    <circle cx="50" cy="56" r="44" fill="url(#${glowId})"/>
    <path d="M78 10 C70 12 66 20 70 28 C64 22 66 12 74 8 C76 8 78 9 78 10Z" fill="#fff6b0" ${S(1.4)}/>
    ${sleeve}${mir(sleeve)}
    <path d="M36 54 C30 70 28 84 32 94 C40 88 46 94 50 88 C54 94 60 88 68 94 C72 84 70 70 64 54Z" fill="${robe.f}" ${S()}/>
    <path d="M40 60 L50 70 L60 60" ${N} ${S(2, '#ffd6e6')}/><path d="M40 78 Q50 82 60 78" ${N} ${S(1.2, '#c9a8ff')}/>
    <path d="${egg(50, 18, 19, 58)}" fill="${b.f}" ${S()}/>
    <path d="M31 36 C31 22 40 16 50 16 C60 16 69 22 69 36 C64 30 58 28 50 28 C42 28 36 30 31 36Z" fill="#4a3a6e" ${S(2)}/>
    <g transform="translate(64 22)">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-4" rx="3" ry="4" fill="#ffb3cf" ${S(1)} transform="rotate(${a})"/>`).join('')}<circle r="1.8" fill="#ffd23f"/></g>
    ${face({ y: 40, dx: 8, r: 4.4, iris: '#ff6fa5', cheek: '#ff8fb8', cdx: 13, cy: 6, mouth: 's', my: 7 })}
    ${petal(12, 30, 20)}${petal(88, 44, -30)}${petal(20, 92, 60)}${petal(84, 86, 10)}${petal(30, 8, -20)}`;
  });

  // ザシキン（ゴースト・フェアリー）: 古いおうちのたたみの部屋にすんでいる。この子がいる家はしあわせになる
  add('zashikin', () => {
    const skin = shade('#ffe4d0', { hi: 0.4 }), kimono = shade('#ff6f7a', { hi: 0.4 });
    return `${ground(24)}${skin.d}${kimono.d}
    <path d="M30 60 C24 72 22 84 24 92 L76 92 C78 84 76 72 70 60Z" fill="${kimono.f}" ${S()}/>
    <path d="M40 60 L50 72 L60 60" ${N} ${S(2, '#fff')}/><path d="M26 80 L74 80" ${S(5, '#ffd23f')}/><path d="M26 80 L74 80" ${S(1.2, '#c98a00')}/>
    <circle cx="30" cy="88" r="1.8" fill="#fff"/><circle cx="66" cy="70" r="1.8" fill="#fff"/><circle cx="40" cy="70" r="1.4" fill="#fff"/>
    <path d="${egg(50, 22, 22, 64)}" fill="${skin.f}" ${S()}/>
    <path d="M27 50 C25 30 36 20 50 20 C64 20 75 30 73 50 L70 50 C70 40 66 36 62 36 L38 36 C34 36 30 40 30 50Z" fill="#3a2a3a" ${S(2)}/>
    <path d="M38 36 L62 36 L62 40 L38 40Z" fill="#3a2a3a"/>
    ${face({ y: 48, dx: 8, r: 4.2, iris: '#8a5a3a', cheek: '#ff8fa3', cdx: 14, cy: 6, mouth: 'w', my: 7 })}
    <circle cx="80" cy="80" r="9" fill="#fff" ${S(2)}/><path d="M72 76 C78 80 84 76 88 80 M73 84 C78 82 82 86 87 84 M80 71 L80 89" ${N} ${S(1.6, '#ff5a7a')}/>`;
  });

  // ユメバク（エスパー）: こわい夢をむしゃむしゃ食べてくれる。代わりに楽しい夢をおいていく
  add('yumebaku', () => {
    const b = shade('#c9b8f0', { hi: 0.55 });
    return `${ground(28)}${b.d}
    <path d="M70 20 C70 12 80 8 86 14 C92 10 98 18 94 24 C98 30 90 36 84 32 C78 36 70 30 72 26 C66 26 66 20 70 20Z" fill="#fff" ${S(1.6)}/>${star(84, 22, 3.6, '#ffe066', 1)}
    <circle cx="74" cy="38" r="2.4" fill="#fff" ${S(1.2)}/><circle cx="70" cy="44" r="1.6" fill="#fff" ${S(1)}/>
    <ellipse cx="28" cy="44" rx="6" ry="8" fill="#b8a4e8" ${S(2)}/><ellipse cx="72" cy="50" rx="6" ry="8" fill="#b8a4e8" ${S(2)}/>
    <path d="M50 40 C72 40 84 54 84 68 C84 84 70 91 50 91 C30 91 16 84 16 68 C16 54 28 40 50 40Z" fill="${b.f}" ${S()}/>
    <path d="M40 64 C40 58 60 58 60 64 C60 72 56 76 50 76 C44 76 40 72 40 64Z" fill="#d6c8f6" ${S(2)}/><ellipse cx="46" cy="70" rx="1.4" ry="2" fill="${O}"/><ellipse cx="54" cy="70" rx="1.4" ry="2" fill="${O}"/>
    <ellipse cx="50" cy="80" rx="15" ry="8" fill="#efe8ff"/>
    ${sleepyEyes(39, 54)}${sleepyEyes(61, 54)}${blush(29, 64, '#ff8fd0')}${blush(71, 64, '#ff8fd0')}
    <path d="M24 46 C26 34 40 30 48 34 L44 44 C38 40 30 42 24 46Z" fill="#7f8fff" ${S(1.8)}/><circle cx="22" cy="48" r="3.4" fill="#fff" ${S(1.4)}/>
    ${feet('#a890dc', 90, 13, 6.6)}`;
  });

  // ユメノバク（エスパー・フェアリー）: ユメバクが進化。夜空をわたり、町じゅうの悪い夢をひと晩で食べる
  add('yumenobaku', () => {
    const b = shade('#5a4fa8', { hi: 0.5 }), glowId = gid();
    let stars = '';
    [[34, 58], [48, 72], [62, 60], [70, 76], [40, 82], [56, 84]].forEach(([x, y]) => { stars += `<circle cx="${x}" cy="${y}" r="1.4" fill="#fff6b0"/>`; });
    return `<defs><radialGradient id="${glowId}"><stop offset="0" stop-color="#b48cff" stop-opacity=".6"/><stop offset="1" stop-color="#b48cff" stop-opacity="0"/></radialGradient></defs>
    ${b.d}<circle cx="50" cy="60" r="44" fill="url(#${glowId})"/>
    <path d="M84 8 C76 10 72 18 76 26 C70 20 72 10 80 6 C82 6 84 7 84 8Z" fill="#fff6b0" ${S(1.4)}/>
    ${cloud(92)}
    <ellipse cx="24" cy="44" rx="6" ry="8" fill="#4a3f8a" ${S(2)}/>
    <path d="M50 32 C76 32 90 50 90 66 C90 82 74 88 50 88 C26 88 10 82 10 66 C10 50 24 32 50 32Z" fill="${b.f}" ${S()}/>
    ${stars}
    <path d="M30 40 C34 30 48 26 58 30 L52 44 C46 40 36 40 30 40Z" fill="#ffe066" ${S(1.8)}/>${star(30, 40, 4, '#ffe066', 1.2)}
    ${face({ x: 50, y: 50, dx: 10, r: 4.6, iris: '#ffe066', cheek: '#ff8fd0', cdx: 17, cy: 7, mouth: 'n' })}
    <path d="M40 62 C40 56 60 56 60 62 C60 70 56 74 50 74 C44 74 40 70 40 62Z" fill="#7a6fc8" ${S(2)}/><ellipse cx="46" cy="68" rx="1.4" ry="2" fill="${O}"/><ellipse cx="54" cy="68" rx="1.4" ry="2" fill="${O}"/>
    <path d="M90 50 C96 46 98 54 94 56" ${N} ${S(1.6, '#c9b8f0')}/>
    ${sparkle(12, 18, 3.4, '#fff6b0')}${sparkle(94, 34, 3, '#e6d8ff')}`;
  });

  // チリリン（エスパー・ひこう）: 夏の軒先でゆれる風鈴。鳴った音で、風のきげんがわかる
  add('chiririn', () => {
    const glass = shade('#e6f6ff', { hi: 0.7, lo: -0.06 });
    return `${ground(14, 96)}${glass.d}
    <path d="M50 4 L50 14" ${S(1.6)}/>
    <path d="M22 54 C22 30 34 14 50 14 C66 14 78 30 78 54 Z" fill="${glass.f}" fill-opacity=".92" ${S()}/>
    <path d="M28 30 C32 22 38 18 44 17" ${N} stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".9"/>
    <path d="M58 38 C62 34 70 36 70 40 C70 44 62 46 58 42 L54 46 L54 34Z" fill="#ff7a5c" ${S(1.2)}/><circle cx="66" cy="39" r="0.9" fill="${O}"/>
    <path d="M26 46 C30 48 34 44 38 46 M62 50 C66 48 70 52 74 50" ${N} ${S(1.2, '#5cc8ff')}/>
    <ellipse cx="50" cy="54" rx="28" ry="3" fill="#cdeffd" ${S(2)}/>
    <path d="M50 54 L50 70" ${S(1.4)}/><circle cx="50" cy="60" r="2.4" fill="#ffd23f" ${S(1)}/>
    <path d="M42 70 L58 70 L58 94 L42 94Z" fill="#fff6c8" ${S(1.8)}/><path d="M46 76 L54 76 M46 82 L54 82 M46 88 L52 88" ${S(1, '#c9b07a')}/>
    ${face({ y: 34, dx: 9, r: 4.4, iris: '#2f7fd6', cdx: 16, cy: 6, mouth: 'o', my: 9 })}
    <path d="M10 30 C14 28 16 32 20 30 M80 22 C84 20 86 24 90 22" ${N} ${S(1.4, '#9fdcff')}/>`;
  });

  // ホシクズン（フェアリー）: 流れ星のかけら。ねがいごとをきくと、きらきらがふえる
  add('hoshikuzu', () => {
    const b = shade('#ffe066', { cx: 0.4, cy: 0.35, hi: 0.6 });
    let d = '';
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 18 : 38; d += `${i ? 'L' : 'M'}${(50 + Math.cos(a) * r).toFixed(1)} ${(56 + Math.sin(a) * r).toFixed(1)} `; }
    return `${ground(22)}${b.d}
    <path d="M80 30 C88 22 94 16 98 8 M72 22 C76 16 80 12 84 6" ${N} stroke="#ffe6a8" stroke-width="3" stroke-linecap="round"/>
    <path d="${d}Z" fill="${b.f}" stroke="${O}" stroke-width="2.4" stroke-linejoin="round"/>
    ${gloss(40, 42, 5, 2.4, -30, 0.7)}
    ${face({ y: 56, dx: 8, r: 4.2, iris: '#ff9a3c', cdx: 14, cy: 6, mouth: 'w', my: 6 })}
    ${sparkle(14, 30, 4, '#fff6b0')}${sparkle(88, 70, 3.4, '#ffd6e8')}${sparkle(20, 84, 3, '#fff6b0')}`;
  });

  // タンポポン（くさ・ひこう）: 春の土手でひと休み。くしゃみをすると、わた毛がとんでいく
  add('tanpopon', () => {
    const b = shade('#9be07a', { hi: 0.5 }), puff = gid();
    let seeds = '';
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; seeds += `<path d="M50 30 L${(50 + Math.cos(a) * 22).toFixed(1)} ${(30 + Math.sin(a) * 22).toFixed(1)}" ${S(0.8, '#d6dce6')}/><circle cx="${(50 + Math.cos(a) * 22).toFixed(1)}" cy="${(30 + Math.sin(a) * 22).toFixed(1)}" r="2.4" fill="#fff" ${S(0.8, '#c9d0dc')}/>`; }
    const fly = (x, y) => `<path d="M${x} ${y} L${x} ${y + 6}" ${S(0.8, '#9aa6b6')}/><path d="M${x - 3} ${y} C${x - 2} ${y - 3} ${x + 2} ${y - 3} ${x + 3} ${y}" fill="#fff" ${S(0.8, '#9aa6b6')}/>`;
    return `<defs><radialGradient id="${puff}"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#eef2f8"/></radialGradient></defs>
    ${ground(24)}${b.d}
    <circle cx="50" cy="30" r="22" fill="url(#${puff})" opacity=".95"/>${seeds}
    <path d="${egg(50, 46, 24, 90)}" fill="${b.f}" ${S()}/>
    ${leaf(26, 76, -80, 0.55, '#6cc46a')}${leaf(74, 76, 80, 0.55, '#6cc46a')}
    ${face({ y: 66, dx: 9, r: 4.4, iris: '#3f9a4e', cdx: 16, cy: 6, mouth: 'o', my: 8 })}
    ${fly(86, 20)}${fly(92, 36)}${fly(10, 22)}`;
  });

  // カミフーセン（ひこう）: ぽんぽんとつくと、ふわっと浮かぶ。空気が抜けるとちょっとしぼむ
  add('kamifusen', () => {
    const cols = ['#ff6f91', '#ffd23f', '#5cc8ff', '#7fd65a', '#b48cff', '#ffa94d'];
    let seg = '';
    cols.forEach((c, i) => { const x0 = 20 + i * 10; seg += `<path d="M50 20 C${x0 - 4} 30 ${x0 - 4} 70 50 84 C${x0 + 14} 70 ${x0 + 14} 30 50 20Z" fill="${c}" opacity=".95"/>`; });
    const cid = gid();
    return `<defs><clipPath id="${cid}"><circle cx="50" cy="52" r="32"/></clipPath></defs>
    ${ground(20, 96)}
    <g clip-path="url(#${cid})"><rect x="0" y="0" width="100" height="100" fill="#fff"/>${cols.map((c, i) => `<path d="M${18 + i * 11} 10 C${12 + i * 11} 40 ${12 + i * 11} 64 ${18 + i * 11} 94 L${29 + i * 11} 94 C${23 + i * 11} 64 ${23 + i * 11} 40 ${29 + i * 11} 10Z" fill="${c}"/>`).join('')}</g>
    <circle cx="50" cy="52" r="32" fill="none" ${S()}/>
    <circle cx="50" cy="52" r="16" fill="#fff" ${S(1.8)}/>
    ${gloss(34, 34, 7, 3, -40, 0.7)}
    <circle cx="50" cy="20" r="3" fill="#fff" ${S(1.6)}/>
    ${face({ y: 50, dx: 7, r: 3.8, iris: '#2f7fd6', cdx: 11, cy: 5, mouth: 'w', my: 5.6 })}
    <path d="M24 90 C30 88 34 92 40 90 M62 90 C68 88 72 92 78 90" ${N} ${S(1.4, '#c9c0cc')}/>`;
  });

  // タコアゲン（ひこう）: お正月の空の主役。糸がからまるのが、いちばんのなやみ
  add('takoagen', () => {
    const paper = vshade('#fff8ea', '#ffe6c4');
    return `${paper.d}
    <path d="M50 74 C40 82 56 88 44 96 M50 74 C60 82 46 88 58 96" ${N} ${S(2.4, '#ff6f91')}/>
    <path d="M78 20 C86 40 92 70 98 96" ${N} ${S(1, '#9aa6b6')}/>
    <path d="M20 14 L80 14 L80 74 L20 74Z" fill="${paper.f}" ${S()}/>
    <path d="M20 14 L80 74 M80 14 L20 74" ${S(1.2, '#c9b07a')}/>
    <path d="M24 18 L76 18 L76 30 L24 30Z" fill="#e8384f" opacity=".85"/><path d="M24 62 L76 62 L76 70 L24 70Z" fill="#3f6fd6" opacity=".8"/>
    <circle cx="50" cy="46" r="16" fill="#fff" ${S(1.6)}/>
    ${face({ y: 44, dx: 8, r: 4.6, iris: '#e8384f', cdx: 14, cy: 6, mouth: 's', my: 7 })}${brow(37, 8, 0.6)}
    <path d="M10 30 C14 28 16 32 20 30 M84 40 C88 38 90 42 94 40" ${N} ${S(1.4, '#9fdcff')}/>`;
  });

  // タツノコロ（ドラゴン・みず）: 多摩湖の水草のかげで生まれる、竜の子ども。しっぽをくるんと巻いてねむる
  add('tatsunokoro', () => {
    const b = shade('#5cc8b8', { hi: 0.5 });
    return `${ground(18)}${b.d}
    <path d="M50 70 C62 76 64 90 52 90 C44 90 44 82 50 82" ${N} ${S(7.4)}/><path d="M50 70 C62 76 64 90 52 90 C44 90 44 82 50 82" ${N} stroke="#5cc8b8" stroke-width="5" stroke-linecap="round"/>
    <path d="M36 30 C30 40 30 60 38 72 C44 80 56 78 60 70 C64 60 62 44 58 36Z" fill="${b.f}" ${S()}/>
    <path d="M40 46 Q48 48 56 46 M40 56 Q48 58 58 56 M42 66 Q48 68 56 66" ${N} ${S(1.2, '#3fa898')}/>
    <path d="M58 40 C66 38 70 46 64 52 Z" fill="#9fe6d8" ${S(1.8)}/>
    <path d="M30 26 C30 14 42 10 50 14 C60 12 70 20 66 32 C64 38 54 40 46 38 C38 38 30 34 30 26Z" fill="${b.f}" ${S()}/>
    <path d="M62 28 C70 28 76 30 76 34 C72 36 66 34 62 34Z" fill="${b.f}" ${S(1.8)}/>
    <path d="M40 12 C38 6 40 2 44 2 C44 6 44 8 46 12 M52 12 C54 6 58 4 60 6 C58 8 56 10 56 14" fill="#ffd23f" ${S(1.6)}/>
    ${eye(44, 25, 4.4, '#2f7fd6')}${eye(56, 25, 4.4, '#2f7fd6')}${blush(38, 32, '#ff8fb8', 4, 2.4)}${blush(62, 32, '#ff8fb8', 4, 2.4)}
    <circle cx="20" cy="40" r="3" fill="#bfe9ff" ${S(1.2)}/><circle cx="16" cy="30" r="2" fill="#bfe9ff" ${S(1)}/>`;
  });

  // タツノスケ（ドラゴン・みず）: タツノコロが進化。ひげをなでるのがくせ。湖のパトロールをしている
  add('tatsunosuke', () => {
    const b = shade('#3fb8a8', { hi: 0.5 });
    return `${ground(22)}${b.d}
    <path d="M54 74 C70 80 74 94 58 94 C46 94 46 84 54 84" ${N} ${S(8.4)}/><path d="M54 74 C70 80 74 94 58 94 C46 94 46 84 54 84" ${N} stroke="#3fb8a8" stroke-width="6" stroke-linecap="round"/>
    <path d="M34 30 C26 44 26 64 36 76 C44 84 60 82 64 72 C68 60 66 42 60 32Z" fill="${b.f}" ${S()}/>
    <path d="M36 46 Q48 48 60 46 M36 58 Q48 60 62 58 M40 70 Q48 72 58 70" ${N} ${S(1.2, '#2f9888')}/>
    <path d="M62 36 C74 32 80 44 72 52 C70 46 66 42 62 42Z" fill="#9fe6d8" ${S(1.8)}/>
    <path d="M26 26 C26 12 40 6 50 10 C62 8 74 16 70 30 C68 38 56 40 46 40 C36 40 26 36 26 26Z" fill="${b.f}" ${S()}/>
    <path d="M66 26 C76 26 84 28 84 32 C80 36 72 34 66 34Z" fill="${b.f}" ${S(1.8)}/>
    <path d="M82 32 C90 34 94 42 90 46 M80 34 C84 40 84 48 80 50" ${N} ${S(1.6, '#ffe066')}/>
    <path d="M36 10 L32 0 L42 6Z M56 8 L60 -2 L64 8Z" fill="#ffd23f" ${S(1.6)}/>
    ${eye(42, 24, 4.6, '#ffd23f')}${eye(56, 24, 4.6, '#ffd23f')}${brow(18, 7, 0.6).replace(/50 - /g, '49 - ')}
    ${blush(36, 32, '#ff8fb8', 4, 2.4)}${blush(62, 32, '#ff8fb8', 4, 2.4)}`;
  });

  // ソウリュウマル（ドラゴン・ひこう）: タツノスケが進化。雲をつきぬけて空をかける青い竜。宝の玉をだいじにしている
  add('souryumaru', () => {
    const b = shade('#3f8fe0', { hi: 0.5 }), pearl = shade('#ffffff', { hi: 0.3, lo: -0.15 });
    const body = 'M88 88 C70 96 52 86 56 70 C60 56 80 58 80 44 C80 30 62 24 50 30';
    return `${b.d}${pearl.d}
    ${cloud(94)}
    <path d="${body}" ${N} ${S(17)}/><path d="${body}" ${N} stroke="#3f8fe0" stroke-width="12.6" stroke-linecap="round"/>
    <path d="${body}" ${N} stroke="#bfe0ff" stroke-width="3" stroke-dasharray="3 5" stroke-linecap="round"/>
    <path d="M70 60 L76 52 L80 60 M66 76 L60 70 M84 40 L92 36 L90 44" ${N} ${S(2, '#ffd23f')}/>
    <path d="M14 30 C14 16 28 8 40 12 C52 8 62 16 58 30 C56 40 44 42 34 42 C24 42 14 38 14 30Z" fill="${b.f}" ${S()}/>
    <path d="M14 30 C8 30 4 34 4 38 C10 40 14 38 16 36Z" fill="${b.f}" ${S(1.8)}/>
    <path d="M6 36 C0 40 -2 50 4 54 M8 38 C6 46 8 52 12 54" ${N} ${S(1.6, '#ffe066')}/>
    <path d="M26 12 L20 0 L32 6Z M42 10 L46 -2 L52 8Z" fill="#ffd23f" ${S(1.6)}/>
    <path d="M44 14 C52 10 60 14 62 22 C58 18 52 16 46 18Z" fill="#bfe0ff" ${S(1.4)}/>
    ${eye(28, 26, 4.6, '#ffd23f')}${eye(42, 26, 4.6, '#ffd23f')}<path d="M22 19 L31 22 M48 19 L39 22" ${S(2.4)}/>
    ${blush(22, 34, '#ff8fb8', 4, 2.4)}${mouthW(35, 35, 2.6)}
    <circle cx="80" cy="18" r="9" fill="${pearl.f}" ${S(2)}/>${gloss(77, 15, 3, 2, -30, 0.9)}
    <path d="M72 26 C68 30 66 34 68 38" ${N} ${S(2.4, '#3f8fe0')}/>
    ${sparkle(94, 6, 3, '#fff6b0')}${sparkle(66, 8, 2.4, '#fff6b0')}`;
  });

  // モグリン（じめん）: 地下でトンネルをほりつづける。ヘルメットのライトは自分でつけた
  add('mogurin', () => {
    const b = shade('#7a6a8a', { hi: 0.45 }), dirt = vshade('#c99a6e', '#a8784a'), hat = shade('#ffd23f', { hi: 0.5 });
    return `${dirt.d}${b.d}${hat.d}
    <path d="M6 92 C10 74 30 70 50 70 C70 70 90 74 94 92Z" fill="${dirt.f}" ${S()}/>
    <circle cx="24" cy="84" r="2" fill="#8a6038"/><circle cx="72" cy="86" r="2.4" fill="#8a6038"/><circle cx="60" cy="78" r="1.6" fill="#8a6038"/>
    <path d="M22 76 C20 50 32 36 50 36 C68 36 80 50 78 76Z" fill="${b.f}" ${S()}/>
    <path d="M18 72 C10 70 8 78 14 82 L18 80 L16 76 L20 78 L22 74Z" fill="#ffc6d6" ${S(1.8)}/>${mir(`<path d="M18 72 C10 70 8 78 14 82 L18 80 L16 76 L20 78 L22 74Z" fill="#ffc6d6" ${S(1.8)}/>`)}
    <path d="M26 46 C26 30 74 30 74 46 C64 42 36 42 26 46Z" fill="${hat.f}" ${S(2.1)}/>
    <path d="M22 46 L78 46" ${S(3.4)}/>
    <circle cx="50" cy="34" r="5" fill="#fff6b0" ${S(1.8)}/><path d="M56 30 L66 22 M58 36 L70 36" ${S(1.6, '#ffd23f')}/>
    ${sleepyEyes(41, 56)}${sleepyEyes(59, 56)}
    <ellipse cx="50" cy="62" rx="4" ry="3" fill="#ff8fa3" ${S(1.6)}/>${blush(32, 62, '#ff9ab8')}${blush(68, 62, '#ff9ab8')}${mouthW(50, 67, 2.4)}`;
  });

  // ハニワン（じめん・ゴースト）: 東村山の遺跡から出てきた、いぬのはにわ。目と口のあなから、風の音がする
  add('haniwan', () => {
    const b = shade('#d9945e', { hi: 0.35 });
    const hole = (x, y, rx, ry) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#4a2a1a" ${S(1.6)}/><ellipse cx="${x}" cy="${y + ry * 0.3}" rx="${rx * 0.6}" ry="${ry * 0.5}" fill="#2a1410"/>`;
    return `${ground(30)}${b.d}
    <path d="M78 54 C88 50 92 40 88 34 C84 38 80 42 76 44Z" fill="${b.f}" ${S(2)}/>
    <rect x="22" y="70" width="10" height="20" rx="4" fill="${b.f}" ${S(2)}/><rect x="68" y="70" width="10" height="20" rx="4" fill="${b.f}" ${S(2)}/>
    <rect x="36" y="72" width="10" height="18" rx="4" fill="${b.f}" ${S(2)}/><rect x="54" y="72" width="10" height="18" rx="4" fill="${b.f}" ${S(2)}/>
    <path d="M18 56 C18 46 30 42 50 42 C70 42 82 46 82 56 C82 70 70 76 50 76 C30 76 18 70 18 56Z" fill="${b.f}" ${S()}/>
    <path d="M24 30 L22 12 L36 24Z" fill="${b.f}" ${S(2)}/><path d="M76 30 L78 12 L64 24Z" fill="${b.f}" ${S(2)}/>
    <path d="M26 44 C24 28 36 20 50 20 C64 20 76 28 74 44 C70 54 30 54 26 44Z" fill="${b.f}" ${S()}/>
    <path d="M26 58 C40 62 60 62 74 58" ${N} ${S(1.4, '#a8683a')}/>
    ${hole(40, 34, 4, 3)}${hole(60, 34, 4, 3)}${hole(50, 44, 4.4, 2.6)}
    ${blush(31, 41, '#ff8a6b', 4, 2.4)}${blush(69, 41, '#ff8a6b', 4, 2.4)}
    <path d="M30 66 L34 62 M44 66 L48 62 M58 66 L62 62" ${S(1.2, '#a8683a')}/>`;
  });

  // ドグウン（じめん・エスパー）: 大むかしの土偶。ゴーグルのような目で、遠い未来まで見える…らしい
  add('dogun', () => {
    const b = shade('#c98a5e', { hi: 0.35 });
    const swirl = (x, y) => `<path d="M${x} ${y} m-4 0 a4 4 0 1 1 8 0 a2.4 2.4 0 1 1 -4.8 0" ${N} ${S(1.3, '#8a5030')}/>`;
    return `${ground(28)}${b.d}
    <path d="M30 56 C18 54 10 60 12 68 C18 70 26 66 32 64Z" fill="${b.f}" ${S(2)}/>${mir(`<path d="M30 56 C18 54 10 60 12 68 C18 70 26 66 32 64Z" fill="${b.f}" ${S(2)}/>`)}
    <path d="M32 54 C30 66 30 80 36 90 L64 90 C70 80 70 66 68 54Z" fill="${b.f}" ${S()}/>
    ${swirl(42, 66)}${swirl(58, 66)}${swirl(50, 80)}
    <path d="M36 86 L36 92 M64 86 L64 92" ${S(5)}/>
    <path d="M20 34 C20 18 34 10 50 10 C66 10 80 18 80 34 C80 48 66 56 50 56 C34 56 20 48 20 34Z" fill="${b.f}" ${S()}/>
    <path d="M30 14 L26 4 L38 10Z M70 14 L74 4 L62 10Z M50 10 L50 2" ${S(2)}/>
    <ellipse cx="37" cy="34" rx="11" ry="8.4" fill="#f5e6d6" ${S(2.2)}/><ellipse cx="63" cy="34" rx="11" ry="8.4" fill="#f5e6d6" ${S(2.2)}/>
    ${eye(37, 34, 4.6, '#3fbfb0')}${eye(63, 34, 4.6, '#3fbfb0')}
    <path d="M26 34 L48 34 M52 34 L74 34" ${S(0.8, '#c9a07a')} opacity=".6"/>
    ${blush(24, 46, '#ff8a6b', 4, 2.4)}${blush(76, 46, '#ff8a6b', 4, 2.4)}<path d="M46 47 Q50 51 54 47" ${N} ${S(2)}/>
    ${sparkle(88, 14, 3, '#9fe6d8')}`;
  });

  // イシコロン（じめん・はがね）: 川原でいちばんまるい石。ときどき、きらりと光るつぶがまざっている
  add('ishikoron', () => {
    const b = shade('#a8a4b8', { hi: 0.5 });
    return `${ground(30)}${b.d}
    <path d="M16 72 C14 54 30 40 50 40 C72 40 86 54 84 72 C82 86 68 90 50 90 C32 90 18 86 16 72Z" fill="${b.f}" ${S()}/>
    <path d="M22 54 C26 46 34 42 42 42 C36 46 30 50 26 58Z" fill="#7fc85a" ${S(1.4)}/>
    <circle cx="68" cy="56" r="2.2" fill="#fff6b0" ${S(0.8)}/><circle cx="30" cy="80" r="1.6" fill="#bfe9ff" ${S(0.8)}/><circle cx="74" cy="78" r="1.4" fill="#ffd6e8" ${S(0.8)}/>
    <path d="M60 46 L64 50 M66 66 L72 64" ${S(1.2, '#8a8698')}/>
    ${gloss(34, 52, 6, 2.6, -24, 0.55)}
    ${face({ y: 66, dx: 10, iris: '#6b7686', mouth: 'w', my: 7 })}`;
  });

  // ササブネン（みず・くさ）: 笹の葉の舟。小川をくだって、いつか海を見るのが夢
  add('sasabune', () => {
    const b = shade('#6fc46a', { hi: 0.5 }), water = vshade('#bfe9ff', '#7fc8f0');
    return `${water.d}${b.d}
    <path d="M2 84 C18 78 32 90 50 84 C68 78 82 90 98 84 L98 98 L2 98Z" fill="${water.f}" ${S(1.8)}/>
    <path d="M8 62 C20 80 80 80 92 62 C84 66 74 66 70 60 C64 66 36 66 30 60 C26 66 16 66 8 62Z" fill="${b.f}" ${S()}/>
    <path d="M30 60 C36 50 46 46 50 34 C54 46 64 50 70 60 C60 64 40 64 30 60Z" fill="${b.f}" ${S()}/>
    <path d="M50 36 L50 46 M50 60 L50 62" ${N} ${S(1.2, '#3f8a46')}/>
    <path d="M50 34 L50 14" ${S(2)}/><path d="M50 14 L66 24 L50 30Z" fill="#fff6c8" ${S(1.8)}/>
    ${face({ y: 54, dx: 7, r: 3.8, iris: '#2f7fd6', cdx: 12, cy: 4, mouth: 'w', my: 4.6 })}
    <path d="M14 90 C18 88 22 92 26 90 M74 92 C78 90 82 94 86 92" ${N} ${S(1.2, '#fff')}/>`;
  });

  // ムササビン（ひこう・ノーマル）: 八国山の夜に、木から木へすーっとすべる。着地はだいたい失敗
  add('musasabin', () => {
    const b = shade('#b89878', { hi: 0.45 });
    return `${ground(30)}${b.d}
    <path d="M50 40 C34 40 16 46 6 56 C12 60 10 68 14 72 C24 66 34 70 40 76 L60 76 C66 70 76 66 86 72 C90 68 88 60 94 56 C84 46 66 40 50 40Z" fill="${b.f}" ${S()}/>
    <path d="M14 60 C24 58 32 62 38 68 M86 60 C76 58 68 62 62 68" ${N} ${S(1.2, '#8a6a50')}/>
    <path d="M44 76 C42 86 46 94 50 96 C54 94 58 86 56 76Z" fill="#a8876a" ${S(2)}/>
    <circle cx="34" cy="30" r="7" fill="${b.f}" ${S(2)}/><circle cx="66" cy="30" r="7" fill="${b.f}" ${S(2)}/>
    <path d="M30 50 C28 34 38 24 50 24 C62 24 72 34 70 50 C68 62 60 66 50 66 C40 66 32 62 30 50Z" fill="${b.f}" ${S()}/>
    <ellipse cx="50" cy="56" rx="12" ry="8" fill="#fff4e6"/>
    ${eye(41, 44, 5.4, '#8a5a3a')}${eye(59, 44, 5.4, '#8a5a3a')}
    <ellipse cx="50" cy="53" rx="2.2" ry="1.6" fill="${O}"/>${mouthW(50, 56, 2.2)}${blush(33, 52, '#ff9a8a', 4, 2.4)}${blush(67, 52, '#ff9a8a', 4, 2.4)}
    ${star(88, 16, 3, '#fff6b0', 1)}`;
  });

  /* ---------------- 伝説の三聖獣 ---------------- */

  const aura = (c) => { const id = gid(); return `<defs><radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity=".75"/><stop offset=".6" stop-color="${c}" stop-opacity=".25"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs><circle cx="50" cy="52" r="48" fill="url(#${id})"/>`; };

  // ハッコクライ（でんき）: 八国山の峰にすむ雷の聖獣。たてがみの稲妻は、遠くの国まで見わたす目
  add('hakkokurai', () => {
    const b = shade('#ffd23f', { hi: 0.5 }), mane = shade('#6f4fd8', { hi: 0.4 });
    let spikes = '';
    [-150, -120, -90, -60, -30, -170, -10].forEach((a) => { const r = (a * Math.PI) / 180, x = 50 + Math.cos(r) * 30, y = 44 + Math.sin(r) * 28; spikes += `<path d="M${(50 + Math.cos(r) * 18).toFixed(1)} ${(44 + Math.sin(r) * 16).toFixed(1)} L${x.toFixed(1)} ${y.toFixed(1)} L${(50 + Math.cos(r + 0.25) * 20).toFixed(1)} ${(44 + Math.sin(r + 0.25) * 18).toFixed(1)}Z" fill="${mane.f}" ${S(1.8)}/>`; });
    const paw = (x) => `<path d="M${x - 9} 92 C${x - 9} 80 ${x - 6} 72 ${x} 72 C${x + 6} 72 ${x + 9} 80 ${x + 9} 92Z" fill="${b.f}" ${S(2.1)}/><path d="M${x - 3} 88 L${x - 3} 92 M${x + 3} 88 L${x + 3} 92" ${S(1.4)}/>`;
    return `${aura('#b48cff')}${b.d}${mane.d}
    <path d="M10 20 L20 34 L14 36 L24 50" ${N} stroke="#fff27a" stroke-width="3.4" stroke-linejoin="round"/><path d="M90 20 L80 34 L86 36 L76 50" ${N} stroke="#fff27a" stroke-width="3.4" stroke-linejoin="round"/>
    <path d="M24 92 C22 70 34 56 50 56 C66 56 78 70 76 92Z" fill="${b.f}" ${S()}/>
    <path d="M38 64 L44 72 L40 74 L48 84" ${N} ${S(2, '#6f4fd8')}/><path d="M62 64 L56 72 L60 74 L52 84" ${N} ${S(2, '#6f4fd8')}/>
    ${paw(36)}${paw(64)}
    ${spikes}
    <path d="M28 46 C28 30 38 22 50 22 C62 22 72 30 72 46 C72 60 62 68 50 68 C38 68 28 60 28 46Z" fill="${b.f}" ${S()}/>
    <path d="M38 24 L34 8 L44 20Z M62 24 L66 8 L56 20Z" fill="#fff6c8" ${S(1.8)}/>
    <path d="M46 24 L50 14 L54 24 L50 30Z" fill="#6f4fd8" ${S(1.6)}/>
    <path d="M38 56 C42 64 58 64 62 56 C60 66 40 66 38 56Z" fill="#fff6c8" ${S(1.6)}/>
    ${eye(41, 44, 4.6, '#6f4fd8')}${eye(59, 44, 4.6, '#6f4fd8')}<path d="M33 37 L45 40 M67 37 L55 40" ${S(2.6)}/>
    <ellipse cx="50" cy="52" rx="3" ry="2" fill="${O}"/>${mouthW(50, 55, 2.6)}
    ${sparkle(14, 66, 4, '#fff27a')}${sparkle(86, 66, 4, '#fff27a')}${sparkle(50, 4, 3, '#fff27a')}`;
  });

  // ホムラジシ（ほのお）: 炎の聖獣。祭りの夜、太鼓の音にあわせて、たてがみの炎が高くのぼる
  add('homurajishi', () => {
    const b = shade('#ff8a3d', { hi: 0.45 }), mane = shade('#e8384f', { hi: 0.35 });
    let flames = '';
    [-160, -130, -100, -80, -50, -20, 160, 20].forEach((a) => { const r = (a * Math.PI) / 180; flames += flame(50 + Math.cos(r) * 26, 50 + Math.sin(r) * 24 + 6, 1.15, '#ff5a2e', '#ffd23f'); });
    const paw = (x) => `<path d="M${x - 9} 92 C${x - 9} 80 ${x - 6} 72 ${x} 72 C${x + 6} 72 ${x + 9} 80 ${x + 9} 92Z" fill="${b.f}" ${S(2.1)}/><path d="M${x - 3} 88 L${x - 3} 92 M${x + 3} 88 L${x + 3} 92" ${S(1.4)}/>`;
    return `${aura('#ff9a3c')}${b.d}${mane.d}
    <path d="M24 92 C22 70 34 56 50 56 C66 56 78 70 76 92Z" fill="${b.f}" ${S()}/>
    <path d="M36 66 C42 70 58 70 64 66 M38 76 C44 80 56 80 62 76" ${N} ${S(1.4, '#d9602a')}/>
    ${paw(36)}${paw(64)}
    ${flames}
    <circle cx="50" cy="48" r="24" fill="${mane.f}" ${S()}/>
    <path d="M30 48 C30 34 40 28 50 28 C60 28 70 34 70 48 C70 62 60 70 50 70 C40 70 30 62 30 48Z" fill="${b.f}" ${S()}/>
    <circle cx="36" cy="34" r="5" fill="#ffb36b" ${S(1.8)}/><circle cx="64" cy="34" r="5" fill="#ffb36b" ${S(1.8)}/>
    <path d="M44 30 C46 26 54 26 56 30 C54 34 46 34 44 30Z" fill="#ffd23f" ${S(1.4)}/>
    ${eye(41, 46, 4.6, '#ffd23f')}${eye(59, 46, 4.6, '#ffd23f')}<path d="M33 39 L45 42 M67 39 L55 42" ${S(2.6)}/>
    <path d="M42 54 C42 50 58 50 58 54 C58 58 54 60 50 60 C46 60 42 58 42 54Z" fill="#ffe0b0" ${S(1.6)}/>
    <ellipse cx="50" cy="54" rx="3" ry="2" fill="${O}"/><path d="M45 60 Q50 64 55 60" ${N} ${S(2)}/>
    <path d="M44 60 L45 63 L47 60.6Z M56 60 L55 63 L53 60.6Z" fill="#fff" ${S(0.9)}/>
    ${blush(31, 56, '#ffd23f', 4, 2.4)}${blush(69, 56, '#ffd23f', 4, 2.4)}`;
  });

  // タマミズチ（みず・ドラゴン）: 多摩湖の底にねむる水の聖獣。目をさますと、湖面に丸い虹がうかぶ
  add('tamamizuchi', () => {
    const b = shade('#3fc4d8', { hi: 0.5 }), fin = shade('#bff0ff', { hi: 0.4 });
    const body = 'M30 92 C10 86 8 66 26 62 C44 58 56 76 72 70 C88 64 86 44 72 40';
    let drops = '';
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; drops += `<path d="M0 -4 C2 -1 2.4 1.4 0 2.6 C-2.4 1.4 -2 -1 0 -4Z" fill="#bff0ff" ${S(0.9)} transform="translate(${(56 + Math.cos(a) * 40).toFixed(1)} ${(48 + Math.sin(a) * 40).toFixed(1)})"/>`; }
    return `${aura('#5cc8ff')}${b.d}${fin.d}
    <circle cx="56" cy="48" r="40" fill="none" stroke="#bff0ff" stroke-width="2.4" stroke-dasharray="2 6" stroke-linecap="round"/>${drops}
    <path d="${body}" ${N} ${S(19)}/><path d="${body}" ${N} stroke="#3fc4d8" stroke-width="14.6" stroke-linecap="round"/>
    <path d="M26 64 L22 54 L32 60 M54 70 L52 60 L62 68 M80 58 L88 52 L86 62" fill="${fin.f}" ${S(1.6)}/>
    <path d="${body}" ${N} stroke="#e6fbff" stroke-width="3" stroke-dasharray="2 6" stroke-linecap="round"/>
    <path d="M52 38 C50 22 62 12 76 14 C90 16 94 30 88 40 C84 48 72 50 64 48 C56 46 52 44 52 38Z" fill="${b.f}" ${S()}/>
    <path d="M60 16 C56 6 60 0 66 0 C64 6 66 10 68 14 M80 14 C82 4 88 2 92 4 C88 8 86 12 86 16" fill="${fin.f}" ${S(1.6)}/>
    <path d="M86 36 C94 36 98 42 96 46 C92 48 88 44 86 42Z" fill="${b.f}" ${S(1.8)}/>
    <path d="M94 44 C98 50 96 58 90 60 M90 44 C92 52 88 58 84 58" ${N} ${S(1.6, '#e6fbff')}/>
    ${eye(66, 30, 4.6, '#5cc8ff')}${eye(80, 30, 4.6, '#5cc8ff')}<path d="M60 24 L69 26 M86 24 L77 26" ${S(2.4)}/>
    ${blush(60, 38, '#ff8fd0', 4, 2.4)}${mouthW(74, 39, 2.6)}
    <circle cx="74" cy="18" r="3" fill="#fff" ${S(1.4)}/>`;
  });

  /* ---------------- 幻 ---------------- */

  // ハルル（エスパー・フェアリー）: 春の日にだけ姿を見せる幻のガチャモン。見た人は、その年ずっとしあわせになる
  add('haruru', () => {
    const b = shade('#ffc6e0', { hi: 0.6, lo: -0.12 }), bubble = gid();
    const ear = `<path d="M36 34 C26 26 24 12 32 8 C40 10 44 22 42 32Z" fill="#ffc6e0" ${S(2)}/><path d="M36 30 C30 24 30 16 33 13 C38 16 40 22 39 29Z" fill="#fff0f7"/>`;
    const petal = (x, y, r, k = 1) => `<path d="M0 -5 C3 -5 4 -1 2 2 L0 1 L-2 2 C-4 -1 -3 -5 0 -5Z" fill="#ffb3cf" ${S(0.8)} transform="translate(${x} ${y}) rotate(${r}) scale(${k})"/>`;
    return `<defs><radialGradient id="${bubble}" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#ffffff" stop-opacity=".9"/><stop offset=".7" stop-color="#ffe6f3" stop-opacity=".35"/><stop offset="1" stop-color="#d6b8ff" stop-opacity=".6"/></radialGradient></defs>
    ${b.d}
    <circle cx="50" cy="50" r="44" fill="url(#${bubble})" stroke="#e6d0ff" stroke-width="1.6"/>
    ${['#ff6f91', '#ffb347', '#ffe066', '#6fd08c', '#5cc8ff', '#b48cff'].map((c, i) => `<path d="M${12 + i * 1.6} 50 A${38 - i * 1.6} ${38 - i * 1.6} 0 0 1 ${20 + i * 1.6} 22" ${N} stroke="${c}" stroke-width="1.6" opacity=".7"/>`).join('')}
    <path d="M62 72 C78 76 84 64 80 56 C78 50 84 46 88 50" ${N} ${S(4.2)}/><path d="M62 72 C78 76 84 64 80 56 C78 50 84 46 88 50" ${N} stroke="#ffc6e0" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M88 44 C86 40 92 38 92 42 C92 38 98 40 96 44 C95 47 90 50 90 50 C90 50 89 47 88 44Z" fill="#ff6f91" ${S(1.2)}/>
    ${ear}${mir(ear)}
    <path d="M40 62 C36 72 40 80 50 80 C60 80 64 72 60 62Z" fill="${b.f}" ${S(2.1)}/>
    <ellipse cx="42" cy="80" rx="4" ry="2.6" fill="#ffc6e0" ${S(1.6)}/><ellipse cx="58" cy="80" rx="4" ry="2.6" fill="#ffc6e0" ${S(1.6)}/>
    <path d="M28 46 C28 32 38 26 50 26 C62 26 72 32 72 46 C72 58 62 64 50 64 C38 64 28 58 28 46Z" fill="${b.f}" ${S()}/>
    ${eye(41, 46, 5.4, '#b05cff')}${eye(59, 46, 5.4, '#b05cff')}${sparkle(39.6, 44, 1.4)}${sparkle(57.6, 44, 1.4)}
    ${blush(32, 54, '#ff7aa8')}${blush(68, 54, '#ff7aa8')}${mouthW(50, 54, 2.6)}
    <g transform="translate(50 28)">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-3.6" rx="2.6" ry="3.6" fill="#ff9ec4" ${S(0.9)} transform="rotate(${a})"/>`).join('')}<circle r="1.6" fill="#ffd23f"/></g>
    ${petal(14, 70, 20)}${petal(84, 80, -30)}${petal(24, 14, 60, 0.9)}${petal(80, 14, 10, 0.9)}
    ${sparkle(10, 34, 3.4, '#fff6b0')}${sparkle(90, 28, 3, '#e6d8ff')}${sparkle(30, 90, 3, '#ffd6e8')}`;
  });
})();
