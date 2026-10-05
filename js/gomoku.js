/* ガチャモン — 五目ならべのAI
 *
 * 盤は 15×15。0 = 空き、1 = 黒（あなた・先手）、2 = 白（ガチャモン）。
 * 5つ以上ならべたら勝ち（禁じ手なし）。
 * level 1 普通: 形の点数で選ぶが、ときどき見落とす
 * level 2 強い: 形の点数でいちばん良い手
 * level 3 超強い: 先読み（アルファベータ法）で数手先まで読む
 */
'use strict';

const Gomoku = (() => {
  const N = 15;
  const FIVE = 1e7, OPEN4 = 1e5, FOUR = 1.2e4, OPEN3 = 5000;
  const PATS = [
    ['xxxxx', FIVE],
    ['_xxxx_', OPEN4],
    ['xxxx_', FOUR], ['_xxxx', FOUR], ['xxx_x', FOUR], ['x_xxx', FOUR], ['xx_xx', FOUR],
    ['_xxx__', OPEN3], ['__xxx_', OPEN3], ['_xx_x_', OPEN3], ['_x_xx_', OPEN3],
    ['_xxx_', 1500],
    ['xxx__', 500], ['__xxx', 500], ['xx_x_', 500], ['_x_xx', 500], ['x_xx_', 500], ['_xx_x', 500], ['x__xx', 500], ['xx__x', 500], ['x_x_x', 500],
    ['__xx__', 150], ['_xx__', 120], ['__xx_', 120], ['_x_x_', 100], ['_x__x_', 80],
    ['xx___', 30], ['___xx', 30], ['x_x__', 25], ['__x_x', 25], ['x__x_', 20], ['_x__x', 20],
    ['_x_', 5],
  ];

  // まわり8マス（片側4マスずつ）の並びごとの点数を先に計算しておく
  // 状態: 0 空き / 1 自分 / 2 ふさがり（相手の石・盤の外）
  const TABLE = new Float64Array(6561);
  for (let code = 0; code < 6561; code++) {
    let s = '', c = code;
    const cells = [];
    for (let k = 0; k < 8; k++) { cells.push(c % 3); c = Math.floor(c / 3); }
    // cells[0..3] = 中心の左側（遠い順）, cells[4..7] = 右側（近い順）
    for (let k = 0; k < 4; k++) s += '_xo'[cells[k]];
    s += 'x';
    for (let k = 4; k < 8; k++) s += '_xo'[cells[k]];
    let best = 0;
    for (const [p, v] of PATS) {
      if (v <= best) continue;
      for (let i = Math.max(0, 5 - p.length); i <= 4 && i + p.length <= 9; i++) {
        if (s.substr(i, p.length) === p && p[4 - i] === 'x') { best = v; break; }
      }
    }
    TABLE[code] = best;
  }

  const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];
  const at = (b, x, y) => (x < 0 || y < 0 || x >= N || y >= N ? -1 : b[y * N + x]);

  // (x, y) に color を置いたときの、各方向の形の点数
  function dirScore(b, x, y, color, dx, dy) {
    let code = 0, mul = 1;
    for (let k = -4; k <= 4; k++) {
      if (!k) continue;
      const v = at(b, x + dx * k, y + dy * k);
      code += (v === 0 ? 0 : v === color ? 1 : 2) * mul;
      mul *= 3;
    }
    return TABLE[code];
  }

  // 1マスの価値（4方向の合計＋組み合わせボーナス）
  function cellScore(b, x, y, color) {
    let sum = 0, fours = 0, threes = 0, five = false, open4 = false;
    for (const [dx, dy] of DIRS) {
      const v = dirScore(b, x, y, color, dx, dy);
      sum += v;
      if (v >= FIVE) five = true;
      else if (v >= OPEN4) open4 = true;
      else if (v >= FOUR) fours++;
      else if (v >= OPEN3) threes++;
    }
    if (five) return FIVE;
    if (open4 || fours >= 2 || (fours && threes)) sum += OPEN4;
    else if (threes >= 2) sum += 2e4;
    return sum;
  }

  function candidates(b) {
    const out = [];
    let any = false;
    for (let i = 0; i < N * N; i++) {
      if (b[i]) { any = true; continue; }
      const x = i % N, y = (i / N) | 0;
      let near = false;
      for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) { const v = at(b, x + dx, y + dy); if (v > 0) { near = true; break; } }
      if (near) out.push(i);
    }
    if (!any) out.push(7 * N + 7);
    return out;
  }

  // color が打つ候補を、攻め＋守りの価値の高い順に
  function ranked(b, color, defW = 1) {
    const opp = 3 - color;
    return candidates(b).map((i) => {
      const x = i % N, y = (i / N) | 0;
      const att = cellScore(b, x, y, color), def = cellScore(b, x, y, opp);
      return { i, att, def, v: att + def * defW };
    }).sort((p, q) => q.v - p.v);
  }

  // 盤全体の評価（color から見て）。石の並びの始まりごとに形の点数を数える
  function evaluate(b, color) {
    let mine = 0, theirs = 0;
    for (let i = 0; i < N * N; i++) {
      const c = b[i];
      if (!c) continue;
      const x = i % N, y = (i / N) | 0;
      for (const [dx, dy] of DIRS) {
        if (at(b, x - dx, y - dy) === c) continue;
        const v = dirScore(b, x, y, c, dx, dy);
        if (c === color) mine += v; else theirs += v;
      }
    }
    return mine - theirs * 1.3;
  }

  function isFive(b, i) {
    const c = b[i], x = i % N, y = (i / N) | 0;
    for (const [dx, dy] of DIRS) {
      let n = 1;
      for (let k = 1; at(b, x + dx * k, y + dy * k) === c; k++) n++;
      for (let k = 1; at(b, x - dx * k, y - dy * k) === c; k++) n++;
      if (n >= 5) return true;
    }
    return false;
  }
  // 勝ちになった5つの石の位置
  function fiveLine(b, i) {
    const c = b[i], x = i % N, y = (i / N) | 0;
    for (const [dx, dy] of DIRS) {
      const line = [i];
      for (let k = 1; at(b, x + dx * k, y + dy * k) === c; k++) line.push((y + dy * k) * N + x + dx * k);
      for (let k = 1; at(b, x - dx * k, y - dy * k) === c; k++) line.push((y - dy * k) * N + x - dx * k);
      if (line.length >= 5) return line;
    }
    return [i];
  }

  // 相手の「次に5になる」点があるなら、そこをふさぐ手だけにしぼる
  function forced(list) {
    const win = list.filter((m) => m.att >= FIVE);
    if (win.length) return win.slice(0, 1);
    const block = list.filter((m) => m.def >= FIVE);
    if (block.length) return block;
    return null;
  }

  const WIN = 1e9;
  function search(b, color, depth, alpha, beta, width) {
    const list = ranked(b, color, 0.9);
    if (!list.length) return 0;
    if (list[0].att >= FIVE) return WIN + depth;
    const moves = forced(list) || list.slice(0, width);
    let best = -Infinity;
    for (const m of moves) {
      b[m.i] = color;
      const v = depth <= 1 ? evaluate(b, color) : -search(b, 3 - color, depth - 1, -beta, -alpha, Math.max(6, width - 2));
      b[m.i] = 0;
      if (v > best) best = v;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    return best;
  }

  // 四を打ちつづけて勝てる手順（VCF）があれば、その最初の手
  function vcf(b, color, depth) {
    if (depth <= 0) return -1;
    const opp = 3 - color;
    for (const i of candidates(b)) {
      const x = i % N, y = (i / N) | 0;
      const v = cellScore(b, x, y, color);
      if (v >= FIVE) return i;
      if (v < FOUR) continue;
      b[i] = color;
      // 相手は5になる点をふさぐしかない
      const fives = candidates(b).filter((j) => cellScore(b, j % N, (j / N) | 0, color) >= FIVE);
      let win = false;
      if (fives.length >= 2) win = true;
      else if (fives.length === 1) {
        const j = fives[0];
        b[j] = opp;
        if (!isFive(b, j) && !candidates(b).some((k) => cellScore(b, k % N, (k / N) | 0, opp) >= FIVE)) win = vcf(b, color, depth - 1) >= 0;
        b[j] = 0;
      }
      b[i] = 0;
      if (win) return i;
    }
    return -1;
  }

  function choose(board, color, level) {
    const b = Int8Array.from(board);
    const list = ranked(b, color, level === 1 ? 0.8 : 0.95);
    if (!list.length) return -1;
    const f = forced(list);
    if (level === 1) {
      if (list[0].att >= FIVE) return list[0].i;
      // ときどき相手の4を見落とす
      if (f && Math.random() < 0.85) return f[0].i;
      const top = list.slice(0, 6);
      if (Math.random() < 0.35) return top[Math.floor(Math.random() * top.length)].i;
      const pool = top.slice(0, 3);
      return pool[Math.floor(Math.random() * pool.length)].i;
    }
    if (f) return f[0].i;
    if (level === 2) {
      const best = list.filter((m) => m.v >= list[0].v * 0.97);
      return best[Math.floor(Math.random() * best.length)].i;
    }
    // 超強い: 四の連続で勝てるならそれを打ち、なければ5手先まで読む
    const win = vcf(b, color, 8);
    if (win >= 0) return win;
    let bestV = -Infinity, bestI = list[0].i;
    for (const m of list.slice(0, 12)) {
      b[m.i] = color;
      const v = -search(b, 3 - color, 4, -Infinity, -bestV, 10) + m.v * 1e-3;
      b[m.i] = 0;
      if (v > bestV) { bestV = v; bestI = m.i; }
    }
    return bestI;
  }

  return { N, choose, isFive, fiveLine };
})();

if (typeof module !== 'undefined') module.exports = Gomoku;
