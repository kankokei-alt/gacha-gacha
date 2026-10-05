/* ガチャモン — ミニゲーム
 *
 * Mini.GAMES の play(ctx) が1回ぶんのゲームを動かし、終わったら ctx.end({ stars, record }) を呼ぶ。
 * ctx（js/app.js が用意）: box, stat(html), bar(0〜1|null), sfx, vib, later(fn, ms), frame(fn), alive(),
 *                          countdown(fn), end(result), counter(name), quitAs(label, fn)
 */
'use strict';

const Mini = (() => {
  const rand = (a) => a[Math.floor(Math.random() * a.length)];
  const pick = (n, a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b.slice(0, n); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------------- キャラの画像（キャンバスに描く用） ---------------- */

  const debug = {};
  const imgs = {};
  function charImg(id) {
    if (!imgs[id]) {
      const img = new Image();
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(Art.render(ITEMS[id]))}`;
      imgs[id] = img;
    }
    return imgs[id];
  }
  const preload = (ids) => Promise.all(ids.map((id) => charImg(id).decode().catch(() => {})));

  function tint(hex, p) {
    const n = parseInt(hex.slice(1), 16);
    const ch = (v) => Math.round(v + (255 - v) * p);
    return `rgb(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
  }

  // 丸いコマ（背景の色＋キャラ）
  function drawBall(g, b, color, id, { ring = 0, scale = 1 } = {}) {
    const r = b.r * scale;
    g.save();
    g.translate(b.x, b.y);
    g.rotate(b.ang || 0);
    g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2);
    g.fillStyle = color; g.fill();
    g.save(); g.clip();
    g.beginPath(); g.arc(-r * 0.3, -r * 0.35, r * 0.55, 0, Math.PI * 2); g.fillStyle = 'rgba(255,255,255,.35)'; g.fill();
    const img = id && charImg(id);
    if (img && img.complete) g.drawImage(img, -r * 1.2, -r * 1.28, r * 2.4, r * 2.4);
    g.restore();
    g.lineWidth = ring ? 4 : 2;
    g.strokeStyle = ring ? '#fff' : 'rgba(74,58,79,.25)';
    g.stroke();
    if (ring) { g.lineWidth = 2; g.strokeStyle = '#ff6fa5'; g.beginPath(); g.arc(0, 0, r + 3, 0, Math.PI * 2); g.stroke(); }
    g.restore();
  }

  // 論理サイズ W×H のキャンバスを横幅いっぱいに置く
  function stage(box, W, H) {
    const cv = document.createElement('canvas');
    cv.className = 'mg-canvas';
    box.appendChild(cv);
    const cssW = box.clientWidth || 320;
    const k = cssW / W;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.style.width = `${cssW}px`;
    cv.style.height = `${H * k}px`;
    cv.width = Math.round(cssW * dpr);
    cv.height = Math.round(H * k * dpr);
    const g = cv.getContext('2d');
    g.setTransform(k * dpr, 0, 0, k * dpr, 0, 0);
    const pt = (e) => { const r = cv.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }; };
    return { cv, g, pt };
  }

  /* ---------------- かんたんな物理（丸だけ・ベルレ積分） ---------------- */

  class World {
    constructor(W, H, { gravity = 1800, sub = 3, iters = 6, floor = H } = {}) {
      Object.assign(this, { W, H, gravity, sub, iters, floor, bodies: [], rects: [], onHit: null });
    }
    add(x, y, r, props = {}) {
      const b = { x, y, px: x, py: y, r, m: r * r, ang: 0, age: 0, ...props };
      this.bodies.push(b);
      return b;
    }
    remove(b) { b.dead = true; this.bodies = this.bodies.filter((x) => x !== b); }
    step() {
      const dt = 1 / 60 / this.sub;
      for (let s = 0; s < this.sub; s++) {
        for (const b of this.bodies) {
          if (b.held) { b.px = b.x; b.py = b.y; continue; }
          let vx = (b.x - b.px) * 0.995, vy = (b.y - b.py) * 0.995;
          const v = Math.hypot(vx, vy), max = b.r * 0.5;
          if (v > max) { vx *= max / v; vy *= max / v; }
          b.px = b.x; b.py = b.y;
          b.x += vx; b.y += vy + this.gravity * dt * dt;
          b.ang += vx / b.r;
        }
        for (let it = 0; it < this.iters; it++) this.collide();
      }
      this.bodies.forEach((b) => { b.age++; });
    }
    collide() {
      const bs = this.bodies, n = bs.length;
      for (let i = 0; i < n; i++) {
        const a = bs[i];
        for (let j = i + 1; j < n; j++) {
          const b = bs[j];
          const dx = b.x - a.x, dy = b.y - a.y, min = a.r + b.r;
          if (Math.abs(dx) >= min || Math.abs(dy) >= min) continue;
          const d2 = dx * dx + dy * dy;
          if (d2 >= min * min || d2 < 1e-6) continue;
          const d = Math.sqrt(d2), ov = (min - d) / d;
          const wa = a.held ? 0 : b.held ? 1 : b.m / (a.m + b.m), wb = b.held ? 0 : a.held ? 1 : a.m / (a.m + b.m);
          a.x -= dx * ov * wa; a.y -= dy * ov * wa;
          b.x += dx * ov * wb; b.y += dy * ov * wb;
          if (this.onHit) this.onHit(a, b);
        }
      }
      for (const b of bs) {
        if (b.held) continue;
        if (b.x < b.r) { b.x = b.r; }
        if (b.x > this.W - b.r) { b.x = this.W - b.r; }
        if (b.y > this.floor - b.r) { b.y = this.floor - b.r; b.px = b.x - (b.x - b.px) * 0.85; }
        for (const q of this.rects) {
          const cx = clamp(b.x, q.x0, q.x1), cy = clamp(b.y, q.y0, q.y1);
          const dx = b.x - cx, dy = b.y - cy, d2 = dx * dx + dy * dy;
          if (d2 >= b.r * b.r) continue;
          if (d2 < 1e-6) { b.y = q.y0 - b.r; continue; }
          const d = Math.sqrt(d2);
          b.x = cx + (dx / d) * b.r; b.y = cy + (dy / d) * b.r;
        }
      }
    }
  }

  /* ================================================================
   * ① ガチャモン進化パズル（同じキャラをくっつけると進化）
   * ================================================================ */

  const EVO = ['mizupuku', 'piricchi', 'moririn', 'hinokokko', 'chibidoran', 'zabuzabu', 'morimorin', 'bouboumaru', 'doragonio', 'gachamon', 'kingachamon'].map((k) => `pachimon.${k}`);
  const EVO_R = [13, 17, 22, 27, 33, 40, 47, 55, 64, 74, 86];
  const EVO_C = ['#9fdcff', '#ffe066', '#a8e58c', '#ffb36b', '#b9a2ff', '#6cc8ff', '#5ccf7a', '#ff8a6b', '#8796ff', '#ff9ad5', '#ffd23f'];
  const EVO_STARS = [6, 8, 9]; // この段まで進化させると ⭐1・⭐2・⭐3

  function playEvo(ctx) {
    const W = 360, H = 470, LINE = 78;
    const { g, cv, pt } = stage(ctx.box, W, H);
    const strip = document.createElement('div');
    strip.className = 'mg-evo';
    strip.innerHTML = EVO.map((id, i) => `<span data-lv="${i}"><span class="emo">${Art.render(ITEMS[id])}</span></span>`).join('<i>›</i>');
    ctx.box.appendChild(strip);
    const world = new World(W, H, { gravity: 1500 });
    let score = 0, maxLv = -1, aimX = W / 2, next = Math.floor(Math.random() * 3), hold = Math.floor(Math.random() * 3), ready = 0, danger = 0, over = false;
    const merges = [];
    const fx = [];

    const reach = (lv) => {
      if (lv <= maxLv) return;
      maxLv = lv;
      $$('.mg-evo > span').forEach((s) => s.classList.toggle('got', Number(s.dataset.lv) <= maxLv));
      const st = EVO_STARS.filter((v) => lv >= v).length;
      if (EVO_STARS.includes(lv)) { ctx.sfx.chime(); ctx.toast(`${'⭐'.repeat(st)} ${ITEMS[EVO[lv]].name} に進化！`); }
    };
    const stat = () => ctx.stat(`${score}点 ・ ${'⭐'.repeat(EVO_STARS.filter((v) => maxLv >= v).length) || '☆'}`);
    stat();

    world.onHit = (a, b) => {
      if (a.lv !== b.lv || a.merging || b.merging) return;
      a.merging = b.merging = true;
      merges.push([a, b]);
    };

    const setAim = (e) => { aimX = clamp(pt(e).x, EVO_R[hold], W - EVO_R[hold]); };
    cv.addEventListener('pointerdown', (e) => { if (!over) { cv.setPointerCapture(e.pointerId); setAim(e); } });
    cv.addEventListener('pointermove', (e) => { if (!over && e.buttons) setAim(e); });
    cv.addEventListener('pointerup', (e) => {
      if (over || ready > 0) return;
      setAim(e);
      world.add(aimX, 40, EVO_R[hold], { lv: hold });
      ctx.sfx.tap();
      hold = next;
      next = Math.floor(Math.random() * 5 * Math.random() + Math.random() * 1.2); // 小さいのが出やすい
      next = clamp(next, 0, 4);
      ready = 30;
      aimX = clamp(aimX, EVO_R[hold], W - EVO_R[hold]);
    });

    function finish() {
      if (over) return;
      over = true;
      const stars = EVO_STARS.filter((v) => maxLv >= v).length;
      ctx.end({ stars, record: score, text: maxLv >= 0 ? `${ITEMS[EVO[maxLv]].name} まで進化したよ` : '' });
    }
    ctx.quitAs('おわる', finish);

    ctx.frame(() => {
      if (over) return false;
      world.step();
      merges.splice(0).forEach(([a, b]) => {
        if (a.dead || b.dead) return;
        world.remove(a); world.remove(b);
        const lv = a.lv + 1, x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
        score += ((lv + 1) * (lv + 2)) / 2;
        fx.push({ x, y, r: EVO_R[Math.min(lv, 10)], t: 0, c: EVO_C[Math.min(lv, 10)] });
        ctx.sfx.tone(300 + lv * 70, 0.15, { type: 'triangle', vol: 0.18, slide: 200 });
        if (lv <= 10) { world.add(x, y, EVO_R[lv], { lv }); reach(lv); }
        else { score += 100; ctx.sfx.fanfare('SE'); ctx.toast('👑 キンガチャモンどうしが合体！ +100'); }
        stat();
      });
      if (ready > 0) ready--;
      // 線の上に1.5秒以上とどまったらおしまい
      const top = world.bodies.some((b) => b.age > 70 && b.y - b.r < LINE);
      danger = top ? danger + 1 : Math.max(0, danger - 2);
      if (danger > 100) { ctx.sfx.drop(); finish(); return false; }

      g.clearRect(0, 0, W, H);
      g.fillStyle = '#fff8fb'; g.fillRect(0, 0, W, H);
      g.setLineDash([8, 6]); g.lineWidth = 2;
      g.strokeStyle = danger ? `rgba(240,64,95,${0.4 + 0.6 * Math.abs(Math.sin(danger / 6))})` : 'rgba(240,80,140,.3)';
      g.beginPath(); g.moveTo(0, LINE); g.lineTo(W, LINE); g.stroke();
      if (ready === 0) {
        g.strokeStyle = 'rgba(74,58,79,.15)';
        g.beginPath(); g.moveTo(aimX, 40); g.lineTo(aimX, H); g.stroke();
      }
      g.setLineDash([]);
      world.bodies.forEach((b) => drawBall(g, b, EVO_C[b.lv], EVO[b.lv]));
      fx.forEach((f) => {
        f.t++;
        g.beginPath(); g.arc(f.x, f.y, f.r * (1 + f.t / 10), 0, Math.PI * 2);
        g.strokeStyle = `rgba(255,255,255,${1 - f.t / 15})`; g.lineWidth = 5; g.stroke();
      });
      fx.splice(0, fx.length, ...fx.filter((f) => f.t < 15));
      if (ready === 0) drawBall(g, { x: aimX, y: 40, r: EVO_R[hold] }, EVO_C[hold], EVO[hold]);
      // つぎ
      g.fillStyle = 'rgba(74,58,79,.5)'; g.font = 'bold 12px sans-serif'; g.fillText('つぎ', W - 58, 18);
      drawBall(g, { x: W - 24, y: 22, r: 13 }, EVO_C[next], EVO[next]);
      return true;
    });
  }

  /* ================================================================
   * ② ガチャモンつなげ（同じキャラを3つ以上なぞって消す）
   * ================================================================ */

  const CHAIN_SEC = 60, CHAIN_R = 25, CHAIN_N = 52;
  const CHAIN_STARS = [3000, 6000, 9000];
  const chainScore = (n) => n * (n + 1) * 10;

  function playChain(ctx) {
    const W = 360, H = 440;
    const { g, cv, pt } = stage(ctx.box, W, H);
    const kinds = pick(5, MACHINES[0].items.filter((it) => it.rarity === 'N' && it.id !== 'pachimon.obaketto'));
    const colors = ['#ffb3c7', '#9fdcff', '#ffe58a', '#a8e58c', '#c9b5ff'];
    const world = new World(W, H, { gravity: 1400 });
    const spawn = (n) => { for (let i = 0; i < n; i++) world.add(CHAIN_R + Math.random() * (W - CHAIN_R * 2), -CHAIN_R - i * 22, CHAIN_R, { k: Math.floor(Math.random() * 5) }); };
    spawn(CHAIN_N);
    let score = 0, chain = [], playing = false, over = false, end = 0;
    const pops = [];
    debug.world = world;
    const stat = () => ctx.stat(`${score}点 ・ ${'⭐'.repeat(CHAIN_STARS.filter((v) => score >= v).length) || '☆'}`);
    stat();

    const hitAt = (p, slack = 1) => world.bodies.find((b) => Math.hypot(b.x - p.x, b.y - p.y) < b.r * slack);
    function boom(b) {
      const gone = world.bodies.filter((x) => Math.hypot(x.x - b.x, x.y - b.y) < 100);
      gone.forEach((x) => { world.remove(x); pops.push({ x: x.x, y: x.y, t: 0 }); });
      const add = gone.length * 40 + 100;
      score += add;
      ctx.sfx.noise(0.3, 0.5); ctx.sfx.fanfare('R'); ctx.vib(60);
      ctx.toast(`💥 ボム！ +${add}`);
      spawn(gone.length);
      stat();
    }
    cv.addEventListener('pointerdown', (e) => {
      if (!playing) return;
      cv.setPointerCapture(e.pointerId);
      const b = hitAt(pt(e));
      if (!b) return;
      if (b.bomb) { boom(b); return; }
      chain = [b];
      ctx.sfx.tone(520, 0.08, { type: 'triangle', vol: 0.15 });
    });
    cv.addEventListener('pointermove', (e) => {
      if (!playing || !chain.length) return;
      const b = hitAt(pt(e), 0.9);
      if (!b || b.bomb) return;
      if (b === chain[chain.length - 2]) { chain.pop(); return; }
      const last = chain[chain.length - 1];
      if (chain.includes(b) || b.k !== chain[0].k || Math.hypot(b.x - last.x, b.y - last.y) > CHAIN_R * 2 * 1.5) return;
      chain.push(b);
      ctx.sfx.tone(520 + chain.length * 60, 0.08, { type: 'triangle', vol: 0.15 });
    });
    const release = () => {
      if (!playing || !chain.length) return;
      const c = chain;
      chain = [];
      if (c.length < 3) return;
      const add = chainScore(c.length);
      score += add;
      const last = c[c.length - 1];
      c.forEach((b) => { world.remove(b); pops.push({ x: b.x, y: b.y, t: 0 }); });
      ctx.sfx.pop(); ctx.vib(20);
      if (c.length >= 7) {
        world.add(last.x, last.y, CHAIN_R, { bomb: true });
        spawn(c.length - 1);
        ctx.toast(`🔗 ${c.length}つなぎ！ +${add} ・ ボム出現`);
      } else {
        spawn(c.length);
        if (c.length >= 5) ctx.toast(`🔗 ${c.length}つなぎ！ +${add}`);
      }
      stat();
    };
    cv.addEventListener('pointerup', release);
    cv.addEventListener('pointercancel', release);

    ctx.countdown(() => {
      playing = true;
      end = Date.now() + CHAIN_SEC * 1000;
    });

    ctx.frame(() => {
      if (over) return false;
      world.step();
      if (playing) {
        const left = end - Date.now();
        ctx.bar(left / (CHAIN_SEC * 1000));
        if (left <= 0) {
          playing = false; over = true;
          release();
          ctx.end({ stars: CHAIN_STARS.filter((v) => score >= v).length, record: score });
          return false;
        }
      }
      g.clearRect(0, 0, W, H);
      g.fillStyle = '#fff8fb'; g.fillRect(0, 0, W, H);
      world.bodies.forEach((b) => {
        if (b.bomb) {
          drawBall(g, b, '#ffd23f', null);
          g.font = `${b.r * 1.2}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('💣', b.x, b.y + 2);
          return;
        }
        drawBall(g, b, colors[b.k], kinds[b.k].id, { ring: chain.includes(b), scale: chain.includes(b) ? 1.08 : 1 });
      });
      if (chain.length > 1) {
        g.strokeStyle = 'rgba(255,111,165,.8)'; g.lineWidth = 6; g.lineCap = 'round'; g.lineJoin = 'round';
        g.beginPath(); chain.forEach((b, i) => (i ? g.lineTo(b.x, b.y) : g.moveTo(b.x, b.y))); g.stroke();
        g.fillStyle = '#ff6fa5'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center';
        const l = chain[chain.length - 1];
        g.fillText(chain.length, l.x, l.y - l.r - 8);
      }
      pops.forEach((p) => {
        p.t++;
        g.beginPath(); g.arc(p.x, p.y, CHAIN_R * (0.6 + p.t / 8), 0, Math.PI * 2);
        g.strokeStyle = `rgba(255,200,80,${1 - p.t / 14})`; g.lineWidth = 4; g.stroke();
      });
      pops.splice(0, pops.length, ...pops.filter((p) => p.t < 14));
      return true;
    });
  }

  /* ================================================================
   * ③ UFOキャッチャー
   * ================================================================ */

  const UFO_TRIES = 5, UFO_CAPS = 18;

  function playUfo(ctx) {
    const W = 360, H = 430, CHUTE = 78, HOME = 40, TOP = 34;
    const { g } = stage(ctx.box, W, H);
    const btn = document.createElement('button');
    btn.className = 'btn primary big wide mg-ufo-btn';
    btn.textContent = '▶ おしているあいだ 右へうごく';
    ctx.box.appendChild(btn);

    const world = new World(W, H, { gravity: 1500 });
    world.rects.push({ x0: CHUTE, y0: 260, x1: CHUTE + 10, y1: H });
    const pool = MACHINES.flatMap((m) => m.items).filter((it) => it.rarity !== 'SE');
    const caps = pick(UFO_CAPS, pool);
    caps.forEach((it, i) => world.add(CHUTE + 60 + Math.random() * (W - CHUTE - 90), H - 40 - i * 28, 24 + Math.random() * 6, { id: it.id, c: rand(CAPSULE_COLORS) }));
    for (let i = 0; i < 300; i++) world.step(); // 先に積もらせておく
    world.bodies.filter((b) => b.x < CHUTE + 10).forEach((b) => world.remove(b));

    debug.world = world;
    const claw = { x: HOME, y: TOP, open: 1, state: 'idle', held: null, slip: 0, wait: 0 };
    let tries = UFO_TRIES, got = 0, over = false;
    const stat = () => ctx.stat(`のこり ${tries}回 ・ GET ${got}こ`);
    stat();

    const press = (on) => {
      if (over) return;
      if (on && claw.state === 'idle' && tries > 0) { claw.state = 'move'; tries--; stat(); ctx.sfx.click(); }
      else if (!on && claw.state === 'move') claw.state = 'down';
    };
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); btn.setPointerCapture(e.pointerId); press(true); });
    btn.addEventListener('pointerup', () => press(false));
    btn.addEventListener('pointercancel', () => press(false));

    const tipY = () => claw.y + 34;
    function grab() {
      // つめの真下にいちばん近いカプセル
      const cand = world.bodies.filter((b) => Math.abs(b.x - claw.x) < b.r && Math.abs(b.y - b.r - tipY()) < b.r * 0.9)
        .sort((a, b) => Math.abs(a.x - claw.x) - Math.abs(b.x - claw.x));
      const b = cand[0];
      if (!b) return;
      const q = 1 - Math.abs(b.x - claw.x) / b.r; // 1 = ど真ん中
      if (q < 0.5) return;
      claw.held = b;
      b.held = true;
      // ずれているほど、運ぶとちゅうで落ちやすい
      claw.slip = q > 0.85 ? (Math.random() < 0.4 ? 1 : 0) : Math.random() < 0.85 ? 1 : 0;
      claw.slipAt = 0.2 + Math.random() * 0.75;
      claw.from = claw.x;
    }
    const letGo = () => { if (claw.held) { claw.held.held = false; claw.held = null; } };

    ctx.frame(() => {
      if (over) return false;
      const c = claw;
      if (c.state === 'move') { c.x = Math.min(W - 30, c.x + 2.2); if (c.x >= W - 30) c.state = 'down'; }
      else if (c.state === 'down') {
        c.y += 2.6;
        const touch = world.bodies.some((b) => Math.abs(b.x - c.x) < b.r * 0.8 && b.y - b.r <= tipY());
        if (touch || tipY() >= H - 6) { c.state = 'close'; c.wait = 0; ctx.sfx.tone(200, 0.15, { type: 'square', vol: 0.05 }); }
      } else if (c.state === 'close') {
        c.open = Math.max(0.15, c.open - 0.05);
        if (++c.wait > 22) { grab(); c.state = 'up'; }
      } else if (c.state === 'up') {
        c.y = Math.max(TOP, c.y - 2.2);
        if (c.y <= TOP) c.state = 'back';
      } else if (c.state === 'back') {
        c.x = Math.max(HOME, c.x - 2.2);
        if (c.held && c.slip && (c.from - c.x) / Math.max(1, c.from - HOME) > c.slipAt) { letGo(); c.slip = 0; ctx.sfx.drop(); }
        if (c.x <= HOME) { c.state = 'drop'; c.wait = 0; }
      } else if (c.state === 'drop') {
        c.open = Math.min(1, c.open + 0.06);
        if (c.open > 0.6) { if (c.held) c.held.carried = true; letGo(); }
        if (++c.wait > 70) {
          c.state = 'idle';
          if (tries <= 0) { over = true; ctx.end({ stars: Math.min(3, got), record: got }); return false; }
        }
      }
      if (c.state === 'up' && c.held && c.slip && Math.random() < 0.004) { letGo(); c.slip = 0; ctx.sfx.drop(); }
      if (c.held) { c.held.x = c.x; c.held.y = tipY() + c.held.r * 0.55; }
      world.step();
      // アームで運んだカプセルだけが取り出し口に入れる
      world.bodies.forEach((b) => { if (!b.carried && !b.held && b.x < CHUTE + 10 + b.r) b.x = CHUTE + 10 + b.r; });
      // 取り出し口に落ちたらGET
      world.bodies.filter((b) => !b.held && b.x < CHUTE && b.y > H - 70).forEach((b) => {
        world.remove(b);
        got++;
        stat();
        ctx.sfx.fanfare('SR'); ctx.vib([30, 40, 30]);
        ctx.toast(`🎉 GET！ ${ITEMS[b.id].name}`);
      });

      g.clearRect(0, 0, W, H);
      const bg = g.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#eaf6ff'); bg.addColorStop(1, '#fff2f8');
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      g.fillStyle = '#ffe3ee'; g.fillRect(0, 260, CHUTE, H - 260);
      g.fillStyle = '#f0508c'; g.font = 'bold 16px sans-serif'; g.textAlign = 'center'; g.fillText('GET', CHUTE / 2, H - 20);
      g.fillStyle = '#d6c4d0'; g.fillRect(CHUTE, 260, 10, H - 260);
      g.fillStyle = '#c8b6c2'; g.fillRect(0, 10, W, 5);
      world.bodies.forEach((b) => {
        g.save(); g.translate(b.x, b.y); g.rotate(b.ang);
        g.beginPath(); g.arc(0, 0, b.r, 0, Math.PI * 2); g.fillStyle = 'rgba(255,255,255,.92)'; g.fill();
        g.beginPath(); g.arc(0, 0, b.r, Math.PI, 0); g.closePath(); g.fillStyle = b.c; g.globalAlpha = 0.85; g.fill(); g.globalAlpha = 1;
        const img = charImg(b.id);
        if (img.complete) g.drawImage(img, -b.r * 0.8, -b.r * 0.85, b.r * 1.6, b.r * 1.6);
        g.beginPath(); g.arc(0, 0, b.r, 0, Math.PI * 2); g.strokeStyle = 'rgba(74,58,79,.3)'; g.lineWidth = 2; g.stroke();
        g.restore();
      });
      // アーム
      g.strokeStyle = '#8a97a3'; g.lineWidth = 4;
      g.beginPath(); g.moveTo(c.x, 12); g.lineTo(c.x, c.y); g.stroke();
      g.fillStyle = '#ff8fb8'; g.beginPath(); g.ellipse(c.x, c.y + 6, 20, 10, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#6b7884'; g.lineWidth = 4; g.lineCap = 'round';
      const spread = 6 + c.open * 18;
      [-1, 1].forEach((s) => {
        g.beginPath(); g.moveTo(c.x + s * 12, c.y + 10);
        g.lineTo(c.x + s * (12 + spread * 0.6), c.y + 24);
        g.lineTo(c.x + s * (spread * 0.5), tipY()); g.stroke();
      });
      if (c.state === 'idle' && tries > 0) {
        g.fillStyle = 'rgba(74,58,79,.5)'; g.font = 'bold 13px sans-serif'; g.textAlign = 'center';
        g.fillText('ボタンをおしてスタート', W / 2 + 30, 70);
      }
      btn.disabled = !(c.state === 'idle' || c.state === 'move') || tries <= 0 && c.state === 'idle';
      return true;
    });
  }

  /* ================================================================
   * ④ お絵かきロジック（ピクロス）
   * ================================================================ */

  const LOGIC_MISS = 5;
  const PICS = [
    ['ガチャモン', '#ff8fb8', '.##....##./.###..###./.########./##########/#..####..#/#..####..#/##########/###....###/.###..###./..######..'],
    ['ねこ', '#ffb36b', '.#......#./.##....##./.########./##########/#..####..#/##########/###.##.###/.###..###./..######../...####...'],
    ['おすし', '#ff7a5c', '........../........../...####.../.########./##########/........../.########./#.#.#.#.##/##########/.########.'],
    ['ハート', '#ff6b8b', '........../.###..###./#..####.##/#.########/##########/.########./..######../...####.../....##..../..........'],
    ['チケット', '#f5b301', '........../##########/#........#/.#.####.#./#........#/.#.####.#./#........#/##########/........../..........'],
    ['おうち', '#5cc8ff', '....##..../...####.../..######../.########./##########/.#......#./.#.##.#.#./.#.##.#.#./.#....#.#./##########'],
    ['さかな', '#3fa3e8', '........../...####.../.#######.#/###.######/##########/.#######.#/...####.../........../........../..........'],
    ['かさ', '#a98bff', '....##..../..######../.########./##########/#.#.##.#.#/....##..../....##..../....##..../.#..##..../..###.....'],
    ['ほし', '#ffd23f', '....##..../....##..../...####.../##########/.########./..######../..######../.###..###./.##....##./##......##'],
    ['ねずみ', '#a89f94', '##......##/###....###/.########./.########./.#.####.#./.########./..######../...#..#.../....##..../..........'],
    ['おにぎり', '#4a3a4f', '....##..../...####.../..######../.########./.########./##########/##......##/##......##/.#......#./..######..'],
    ['ちょうちょ', '#f28cc0', '.##....##./####..####/#####.####/.###..###./..#.##.#../....##..../..#.##.#../.###..###./.###..###./..#....#..'],
  ].map(([name, color, s]) => ({ name, color, pic: s.split('/').map((r) => [...r].map((c) => (c === '#' ? 1 : 0))) }));

  const clueOf = (line) => { const r = []; let n = 0; line.forEach((v) => { if (v) n++; else if (n) { r.push(n); n = 0; } }); if (n) r.push(n); return r; };

  // 1列ぶんの「かならず塗る／かならず空く」マスを求める（-1 = まだわからない）
  function lineSolve(clue, cur) {
    const n = cur.length, c1 = new Array(n).fill(false), c0 = new Array(n).fill(false), tmp = new Array(n).fill(0);
    let ok = false;
    const rec = (i, pos) => {
      if (i === clue.length) {
        for (let k = pos; k < n; k++) if (cur[k] === 1) return;
        ok = true;
        for (let k = 0; k < n; k++) { if (k < pos && tmp[k]) c1[k] = true; else c0[k] = true; }
        return;
      }
      const len = clue[i];
      for (let s = pos; s + len <= n; s++) {
        if (s > pos && cur[s - 1] === 1) break;
        let fit = true;
        for (let k = s; k < s + len; k++) if (cur[k] === 0) { fit = false; break; }
        const end = s + len;
        if (fit && end < n && cur[end] === 1) fit = false;
        if (fit) {
          for (let k = pos; k < s; k++) tmp[k] = 0;
          for (let k = s; k < end; k++) tmp[k] = 1;
          if (end < n) tmp[end] = 0;
          rec(i + 1, Math.min(n, end + 1));
        }
      }
    };
    rec(0, 0);
    return ok ? cur.map((v, k) => (v !== -1 ? v : c1[k] && !c0[k] ? 1 : c0[k] && !c1[k] ? 0 : -1)) : null;
  }

  // 当てずっぽうなしで解けるか
  function solvable(pic) {
    const N = pic.length;
    const rows = pic.map(clueOf), cols = pic[0].map((_, c) => clueOf(pic.map((r) => r[c])));
    const gr = pic.map((r) => r.map(() => -1));
    for (let changed = true; changed;) {
      changed = false;
      for (let r = 0; r < N; r++) {
        const nl = lineSolve(rows[r], gr[r]); if (!nl) return false;
        nl.forEach((v, c) => { if (v !== gr[r][c]) { gr[r][c] = v; changed = true; } });
      }
      for (let c = 0; c < N; c++) {
        const nl = lineSolve(cols[c], gr.map((r) => r[c])); if (!nl) return false;
        nl.forEach((v, r) => { if (v !== gr[r][c]) { gr[r][c] = v; changed = true; } });
      }
    }
    return gr.every((r) => r.every((v) => v !== -1));
  }

  // 左右対称のふしぎな生きもの（ナゾモン）
  function randomPic() {
    for (let t = 0; t < 300; t++) {
      const pic = Array.from({ length: 10 }, () => { const h = Array.from({ length: 5 }, () => (Math.random() < 0.55 ? 1 : 0)); return [...h, ...h.slice().reverse()]; });
      if (pic.flat().filter(Boolean).length > 30 && solvable(pic)) return pic;
    }
    return PICS[0].pic;
  }

  function playLogic(ctx) {
    const n = ctx.counter('logic');
    const puzzle = n < PICS.length ? PICS[n] : { name: `ナゾモン No.${String(n - PICS.length + 1).padStart(3, '0')}`, color: rand(CAPSULE_COLORS), pic: randomPic() };
    const sol = puzzle.pic, N = sol.length;
    const rows = sol.map(clueOf), cols = sol[0].map((_, c) => clueOf(sol.map((r) => r[c])));
    const st = sol.map((r) => r.map(() => 0)); // 0 空 / 1 塗り / 2 しるし / 3 まちがい
    let miss = 0, mode = 1, over = false;
    const t0 = Date.now();

    ctx.box.innerHTML = `
      <div class="lg-wrap">
        <div class="lg" style="--n:${N}">
          <div class="lg-corner"></div>
          ${cols.map((c, i) => `<div class="lg-cc" data-c="${i}">${(c.length ? c : [0]).map((v) => `<b>${v}</b>`).join('')}</div>`).join('')}
          ${rows.map((r, y) => `<div class="lg-rc" data-r="${y}">${(r.length ? r : [0]).map((v) => `<b>${v}</b>`).join('')}</div>${
            sol[y].map((_, x) => `<div class="lg-cell${x % 5 === 4 && x < N - 1 ? ' bx' : ''}${y % 5 === 4 && y < N - 1 ? ' by' : ''}" data-x="${x}" data-y="${y}"></div>`).join('')}`).join('')}
        </div>
      </div>
      <div class="lg-tools">
        <button class="lg-mode on" data-mode="1">■ ぬる</button>
        <button class="lg-mode" data-mode="2">× しるし</button>
      </div>
      <p class="muted small center">数字は、その列でつづけて塗るマスの数。<br>ちがうマスを塗ると1ミス（${LOGIC_MISS}ミスでおしまい）</p>`;
    const grid = ctx.box.querySelector('.lg');
    const cell = (x, y) => grid.querySelector(`[data-x="${x}"][data-y="${y}"]`);
    const stat = () => {
      const s = miss === 0 ? 3 : miss <= 2 ? 2 : 1;
      ctx.stat(`${'❤️'.repeat(LOGIC_MISS - miss)}${'🤍'.repeat(miss)} ${'⭐'.repeat(s)}`);
    };
    stat();
    const tick = () => { if (!over && ctx.alive()) { const s = Math.floor((Date.now() - t0) / 1000); ctx.box.querySelector('.lg-corner').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; ctx.later(tick, 500); } };
    tick();

    const paint = (x, y) => {
      const el = cell(x, y);
      el.className = el.className.replace(/ (on|x|ng)\b/g, '');
      el.classList.add(...({ 1: ['on'], 2: ['x'], 3: ['x', 'ng'] }[st[y][x]] || []));
    };
    // 塗り終わった列は残りに自動でしるし
    function checkLines(x, y) {
      const rowDone = sol[y].every((v, i) => !v || st[y][i] === 1);
      const colDone = sol.every((r, i) => !r[x] || st[i][x] === 1);
      if (rowDone) { sol[y].forEach((v, i) => { if (!v && st[y][i] === 0) { st[y][i] = 2; paint(i, y); } }); grid.querySelector(`[data-r="${y}"]`).classList.add('done'); }
      if (colDone) { sol.forEach((r, i) => { if (!r[x] && st[i][x] === 0) { st[i][x] = 2; paint(x, i); } }); grid.querySelector(`[data-c="${x}"]`).classList.add('done'); }
      if (rowDone || colDone) ctx.sfx.tone(880, 0.1, { type: 'triangle', vol: 0.1 });
    }
    function act(x, y, action) {
      if (over) return false;
      const v = st[y][x];
      if (action === 'fill') {
        if (v !== 0) return true;
        if (sol[y][x]) { st[y][x] = 1; paint(x, y); ctx.sfx.tone(600, 0.05, { type: 'triangle', vol: 0.08 }); checkLines(x, y); }
        else {
          st[y][x] = 3; paint(x, y); miss++; stat();
          ctx.sfx.drop(); ctx.vib(80);
          cell(x, y).classList.add('shake');
          if (miss >= LOGIC_MISS) { over = true; ctx.later(() => ctx.end({ stars: 0, record: null, text: `「${puzzle.name}」はまた今度。ミスが${LOGIC_MISS}回になったよ` }), 600); }
          return false;
        }
        if (sol.every((r, yy) => r.every((s, xx) => !s || st[yy][xx] === 1))) {
          over = true;
          grid.classList.add('solved');
          grid.style.setProperty('--pc', puzzle.color);
          ctx.box.querySelector('.lg-tools').innerHTML = `<p class="lg-name">「${puzzle.name}」の完成！</p>`;
          const sec = Math.round((Date.now() - t0) / 1000);
          ctx.later(() => ctx.end({ stars: miss === 0 ? 3 : miss <= 2 ? 2 : 1, record: sec, text: `「${puzzle.name}」ができた！ ミス${miss}回` }), 1400);
        }
      } else if (action === 'mark' && v === 0) { st[y][x] = 2; paint(x, y); }
      else if (action === 'unmark' && v === 2) { st[y][x] = 0; paint(x, y); }
      return true;
    }

    // なぞると同じ行（または列）にまとめて塗れる
    let drag = null;
    const at = (e) => { const el = document.elementFromPoint(e.clientX, e.clientY); return el && el.closest('.lg-cell'); };
    grid.addEventListener('pointerdown', (e) => {
      const el = e.target.closest('.lg-cell');
      if (!el || over) return;
      grid.setPointerCapture(e.pointerId);
      const x = Number(el.dataset.x), y = Number(el.dataset.y);
      const action = mode === 1 ? 'fill' : st[y][x] === 2 ? 'unmark' : 'mark';
      drag = { x, y, action, axis: null };
      if (!act(x, y, action)) drag = null;
    });
    grid.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const el = at(e);
      if (!el) return;
      let x = Number(el.dataset.x), y = Number(el.dataset.y);
      if (x === drag.x && y === drag.y) return;
      drag.axis ||= x !== drag.x ? 'x' : 'y';
      if (drag.axis === 'x') y = drag.y; else x = drag.x;
      if (!act(x, y, drag.action)) drag = null;
    });
    const up = () => { drag = null; };
    grid.addEventListener('pointerup', up);
    grid.addEventListener('pointercancel', up);
    ctx.box.querySelectorAll('.lg-mode').forEach((b) => b.addEventListener('click', () => {
      mode = Number(b.dataset.mode);
      ctx.box.querySelectorAll('.lg-mode').forEach((x) => x.classList.toggle('on', x === b));
    }));
  }

  /* ---------------- 一覧 ---------------- */

  const $$ = (s) => [...document.querySelectorAll(s)];
  const GAMES = [
    {
      id: 'evo', icon: '🫧', name: 'ガチャモン進化パズル', play: playEvo, needs: EVO, best: (v) => `${v}点`, better: (a, b) => a > b,
      desc: `同じキャラをくっつけて進化！ ${EVO_STARS.map((lv, i) => `${ITEMS[EVO[lv]].name}で${'⭐'.repeat(i + 1)}`).join('・')}`,
    },
    {
      id: 'chain', icon: '🔗', name: 'ガチャモンつなげ', play: playChain, best: (v) => `${v}点`, better: (a, b) => a > b,
      needs: MACHINES[0].items.filter((it) => it.rarity === 'N').map((it) => it.id),
      desc: `${CHAIN_SEC}秒で同じキャラを3つ以上なぞって消そう。7つ以上でボム！ ${CHAIN_STARS.map((v, i) => `${v}点で${'⭐'.repeat(i + 1)}`).join('・')}`,
    },
    {
      id: 'ufo', icon: '🕹️', name: 'UFOキャッチャー', play: playUfo, best: (v) => `${v}こ`, better: (a, b) => a > b,
      needs: MACHINES.flatMap((m) => m.items).filter((it) => it.rarity !== 'SE').map((it) => it.id),
      desc: `${UFO_TRIES}回のうちにカプセルをGET！ 1こで⭐・2こで⭐⭐・3こで⭐⭐⭐`,
    },
    {
      id: 'logic', icon: '🧩', name: 'お絵かきロジック', play: playLogic, needs: [], best: (v) => `${Math.floor(v / 60)}分${v % 60}秒`, better: (a, b) => a < b,
      desc: `数字をヒントにマスを塗って絵を完成させよう。ノーミスで⭐⭐⭐（${LOGIC_MISS}ミスでおしまい）`,
    },
  ];

  return { GAMES, preload, solvable, PICS, debug };
})();
