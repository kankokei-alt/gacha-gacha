/* ガチャモン — ミニゲーム
 *
 * Mini.GAMES の play(ctx) が1回ぶんのゲームを動かし、終わったら ctx.end({ stars, record, text }) を呼ぶ。
 * ctx（js/app.js が用意）: box, stat(html), bar(0〜1|null), sfx, vib, toast(html), later(fn, ms), frame(fn), alive(),
 *                          countdown(fn), end(result), quitAs(label, fn)
 * 物理は js/phys.js、五目ならべのAIは js/gomoku.js
 */
'use strict';

const Mini = (() => {
  const TAU = Math.PI * 2;
  const rand = (a) => a[Math.floor(Math.random() * a.length)];
  const pick = (n, a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b.slice(0, n); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const emo = (id) => `<span class="emo">${Art.render(ITEMS[id])}</span>`;
  const debug = {};

  /* ---------------- キャラの画像（キャンバスに描く用） ---------------- */

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

  // 相手のガチャモン（名前つきアイコン）
  const foe = (id, name) => `<span class="mg-foe">${emo(id)}<b>${esc(name || ITEMS[id].name)}</b></span>`;

  // ボタンをならべて、押されたものを返す
  function ask(box, options) {
    return new Promise((resolve) => {
      box.innerHTML = options.map(([v, label, cls = '']) => `<button class="btn ${cls}" data-v="${v}">${label}</button>`).join('');
      box.querySelectorAll('[data-v]').forEach((b) => b.addEventListener('click', () => { box.innerHTML = ''; resolve(b.dataset.v); }, { once: true }));
    });
  }
  const wait = (ctx, ms) => new Promise((r) => ctx.later(r, ms));

  /* ================================================================
   * ① ガチャモン進化パズル（同じキャラがくっつくと進化）
   * ================================================================ */

  const EVO = ['mizupuku', 'piricchi', 'moririn', 'hinokokko', 'chibidoran', 'zabuzabu', 'morimorin', 'bouboumaru', 'doragonio', 'gachamon', 'kingachamon'].map((k) => `pachimon.${k}`);
  const EVO_R = [13, 17, 22, 27, 33, 40, 47, 55, 64, 74, 86];
  // 大きいほど少し重い（密度）
  const EVO_D = EVO_R.map((_, i) => 1 + i * 0.06);
  // 段ごとの色（くっきりした色で外わくをつける）
  const EVO_C = ['#1e88ff', '#f2b100', '#24a845', '#ff7a00', '#7b4dff', '#00a7c7', '#13804a', '#e8384f', '#3d4fd6', '#e8458b', '#d49a00'];
  const EVO_STARS = [6, 8, 9]; // この段まで進化させると ⭐1・⭐2・⭐3

  // 色の外わく＋白い中にキャラ
  function drawEvoBall(g, x, y, r, a, lv) {
    g.save();
    g.translate(x, y);
    g.rotate(a);
    g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fillStyle = EVO_C[lv]; g.fill();
    const ir = r - Math.max(2.5, r * 0.15);
    g.beginPath(); g.arc(0, 0, ir, 0, TAU); g.fillStyle = '#fff'; g.fill();
    g.save(); g.clip();
    const img = charImg(EVO[lv]);
    if (img.complete) g.drawImage(img, -ir * 1.12, -ir * 1.2, ir * 2.24, ir * 2.24);
    g.restore();
    g.beginPath(); g.arc(0, 0, r, 0, TAU); g.lineWidth = 1.5; g.strokeStyle = 'rgba(0,0,0,.3)'; g.stroke();
    g.restore();
  }

  function playEvo(ctx) {
    const W = 360, H = 470, LINE = 80, DROP_Y = 42;
    const { g, cv, pt } = stage(ctx.box, W, H);
    const strip = document.createElement('div');
    strip.className = 'mg-evo';
    strip.innerHTML = EVO.map((id, i) => `<span data-lv="${i}" style="--c:${EVO_C[i]}">${emo(id)}</span>`).join('<i>›</i>');
    ctx.box.appendChild(strip);

    const world = new Phys.World({ gravity: 1300, sub: 4, iters: 8, linDamp: 0.15, angDamp: 1.2 });
    world.seg(-12, -600, -12, H + 12, { r: 12, mu: 0.25 });
    world.seg(W + 12, -600, W + 12, H + 12, { r: 12, mu: 0.25 });
    world.seg(-40, H + 12, W + 40, H + 12, { r: 12, mu: 0.6 });
    debug.world = world;
    const add = (x, y, lv, vx = 0, vy = 0) => world.ball(x, y, EVO_R[lv], { lv, density: EVO_D[lv], e: 0.18, mu: 0.4, vx, vy });

    let score = 0, maxLv = -1, aimX = W / 2, hold = Math.floor(Math.random() * 3), next = Math.floor(Math.random() * 3), cool = 0, danger = 0, over = false;
    const merges = [], fx = [];
    const starsNow = () => EVO_STARS.filter((v) => maxLv >= v).length;
    const stat = () => ctx.stat(`${score}点 ・ ${'⭐'.repeat(starsNow()) || '☆'}`);
    stat();
    const reach = (lv) => {
      if (lv <= maxLv) return;
      maxLv = lv;
      strip.querySelectorAll('[data-lv]').forEach((s) => s.classList.toggle('got', Number(s.dataset.lv) <= maxLv));
      if (EVO_STARS.includes(lv)) { ctx.sfx.chime(); ctx.toast(`${'⭐'.repeat(starsNow())} ${ITEMS[EVO[lv]].name} に進化！`); }
    };

    world.onContact = (a, b) => {
      if (a.lv !== b.lv || a.merging || b.merging) return;
      a.merging = b.merging = true;
      merges.push([a, b]);
    };

    const nextLv = () => { const r = Math.random(); return r < 0.3 ? 0 : r < 0.55 ? 1 : r < 0.77 ? 2 : r < 0.92 ? 3 : 4; };
    const setAim = (e) => { aimX = clamp(pt(e).x, EVO_R[hold] + 1, W - EVO_R[hold] - 1); };
    cv.addEventListener('pointerdown', (e) => { if (!over) { cv.setPointerCapture(e.pointerId); setAim(e); } });
    cv.addEventListener('pointermove', (e) => { if (!over && e.buttons) setAim(e); });
    cv.addEventListener('pointerup', (e) => {
      if (over || cool > 0) return;
      setAim(e);
      add(aimX, DROP_Y, hold);
      ctx.sfx.tap();
      hold = next; next = nextLv();
      cool = 32;
      aimX = clamp(aimX, EVO_R[hold] + 1, W - EVO_R[hold] - 1);
    });

    function finish() {
      if (over) return;
      over = true;
      ctx.end({ stars: starsNow(), record: score, text: maxLv >= 0 ? `${ITEMS[EVO[maxLv]].name} まで進化したよ` : '' });
    }
    ctx.quitAs('おわる', finish);

    ctx.frame(() => {
      if (over) return false;
      world.step();
      // 同じ段どうしが触れたら、重さの中心に1つ上の段が生まれる（勢いは引きつぐ）
      merges.splice(0).forEach(([a, b]) => {
        if (a.dead || b.dead) return;
        world.remove(a); world.remove(b);
        const lv = a.lv + 1, m = a.m + b.m;
        const x = (a.x * a.m + b.x * b.m) / m, y = (a.y * a.m + b.y * b.m) / m;
        const vx = (a.vx * a.m + b.vx * b.m) / m, vy = (a.vy * a.m + b.vy * b.m) / m;
        score += ((lv + 1) * (lv + 2)) / 2;
        fx.push({ x, y, r: EVO_R[Math.min(lv, 10)], t: 0, c: EVO_C[Math.min(lv, 10)] });
        ctx.sfx.tone(260 + lv * 70, 0.16, { type: 'triangle', vol: 0.18, slide: 220 });
        if (lv <= 10) { add(x, y, lv, vx, vy - 60); reach(lv); }
        else { score += 100; ctx.sfx.fanfare('SE'); ctx.toast('👑 キンガチャモンどうしが合体！ +100'); }
        stat();
      });
      if (cool > 0) cool--;
      // 止まったコマが線より上に2秒いたらおしまい
      const top = world.balls.some((b) => b.age > 60 && b.y - b.r < LINE && Math.hypot(b.vx, b.vy) < 80);
      danger = top ? danger + 1 : Math.max(0, danger - 3);
      if (danger > 120) { ctx.sfx.drop(); finish(); return false; }

      const bg = g.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#fff9fc'); bg.addColorStop(1, '#ffeef5');
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      g.setLineDash([8, 6]); g.lineWidth = 2;
      g.strokeStyle = danger ? `rgba(232,56,79,${0.4 + 0.6 * Math.abs(Math.sin(danger / 5))})` : 'rgba(240,80,140,.3)';
      g.beginPath(); g.moveTo(0, LINE); g.lineTo(W, LINE); g.stroke();
      if (cool === 0) {
        g.strokeStyle = 'rgba(74,58,79,.18)';
        g.beginPath(); g.moveTo(aimX, DROP_Y); g.lineTo(aimX, H); g.stroke();
      }
      g.setLineDash([]);
      world.balls.forEach((b) => drawEvoBall(g, b.x, b.y, b.r, b.a, b.lv));
      fx.forEach((f) => {
        f.t++;
        g.beginPath(); g.arc(f.x, f.y, f.r * (1 + f.t / 9), 0, TAU);
        g.strokeStyle = `rgba(255,255,255,${1 - f.t / 14})`; g.lineWidth = 6; g.stroke();
      });
      fx.splice(0, fx.length, ...fx.filter((f) => f.t < 14));
      if (cool === 0) drawEvoBall(g, aimX, DROP_Y, EVO_R[hold], 0, hold);
      g.fillStyle = 'rgba(74,58,79,.55)'; g.font = 'bold 12px sans-serif'; g.textAlign = 'right'; g.fillText('つぎ', W - 40, 26);
      drawEvoBall(g, W - 20, 22, 14, 0, next);
      return true;
    });
  }

  /* ================================================================
   * ② UFOキャッチャー（アームも物理で動く）
   * ================================================================ */

  const UFO_TRIES = 5, UFO_CAPS = 15;

  function playUfo(ctx) {
    const W = 360, H = 440, FLOOR = H - 16, CHUTE = 80, PART = 228, RAIL = 30, HOME = 42, LMIN = 34;
    const { g } = stage(ctx.box, W, H);
    const btn = document.createElement('button');
    btn.className = 'btn primary big wide mg-ufo-btn';
    btn.innerHTML = '▶ おしているあいだ 右へうごく';
    ctx.box.appendChild(btn);

    const world = new Phys.World({ gravity: 1400, sub: 5, iters: 10, linDamp: 0.2, angDamp: 1.5 });
    debug.world = world;
    world.seg(-10, -200, -10, H, { r: 10 });
    world.seg(W + 10, -200, W + 10, H, { r: 10 });
    world.seg(-20, FLOOR + 10, W + 20, FLOOR + 10, { r: 10, mu: 0.7 });
    world.seg(CHUTE + 5, PART, CHUTE + 5, FLOOR, { r: 5, mu: 0.4 }); // 取り出し口のしきり（アクリル板）
    const pool = MACHINES.flatMap((m) => m.items).filter((it) => it.rarity !== 'SE');
    pick(UFO_CAPS, pool).forEach((it, i) => world.ball(CHUTE + 70 + Math.random() * (W - CHUTE - 100), FLOOR - 30 - i * 26, 23 + Math.random() * 5,
      { id: it.id, c: rand(CAPSULE_COLORS), density: 0.8, e: 0.3, mu: 0.55 }));
    for (let i = 0; i < 360; i++) world.step(); // 先に積もらせておく
    world.balls.filter((b) => b.x < CHUTE + 15).forEach((b) => world.remove(b));

    // アーム: 台車（cx）からワイヤー（長さ L）でぶら下がり、ふりこのようにゆれる
    const arms = [-1, 1].map((side) => ({ side, th: 0.75, up: world.seg(0, 0, 0, 0, { r: 3.5, kinematic: true, mu: 0.9, e: 0.1 }), fin: world.seg(0, 0, 0, 0, { r: 3.5, kinematic: true, mu: 0.9, e: 0.1 }) }));
    const claw = { cx: HOME, vx: 0, L: LMIN, phi: 0, dphi: 0, state: 'idle', t: 0, relax: 0 };
    debug.claw = claw;
    const OPEN = 0.75, SHUT = 0.1, ARM1 = 44, ARM2 = 34;
    let tries = UFO_TRIES, got = 0, over = false, hum = 0;
    const stat = () => ctx.stat(`のこり ${tries}回 ・ GET ${got}こ`);
    stat();

    const hub = () => ({ x: claw.cx + claw.L * Math.sin(claw.phi), y: RAIL + claw.L * Math.cos(claw.phi) });
    // アームの形（ふりこの角度ぶん、まるごと傾く）
    function armPts(a) {
      const h = hub(), s = a.side, c = Math.cos(claw.phi), sn = Math.sin(claw.phi);
      const rot = (x, y) => [h.x + x * c + y * sn, h.y - x * sn + y * c];
      const px = 12 * s, py = 10;
      const ex = px + Math.sin(a.th) * ARM1 * s, ey = py + Math.cos(a.th) * ARM1;
      const f = a.th - 0.95;
      const tx = ex + Math.sin(f) * ARM2 * s, ty = ey + Math.cos(f) * ARM2;
      return { p: rot(px, py), e: rot(ex, ey), t: rot(tx, ty) };
    }
    function placeArms(first) {
      arms.forEach((a) => {
        const q = armPts(a);
        if (first) { Object.assign(a.up, { ax: q.p[0], ay: q.p[1], bx: q.e[0], by: q.e[1] }); Object.assign(a.fin, { ax: q.e[0], ay: q.e[1], bx: q.t[0], by: q.t[1] }); }
        else { world.move(a.up, q.p[0], q.p[1], q.e[0], q.e[1]); world.move(a.fin, q.e[0], q.e[1], q.t[0], q.t[1]); }
      });
    }
    placeArms(true);

    const press = (on) => {
      if (over) return;
      if (on && claw.state === 'idle' && tries > 0) { claw.state = 'move'; tries--; stat(); ctx.sfx.click(); }
      else if (!on && claw.state === 'move') { claw.state = 'brake'; claw.t = 0; }
    };
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); btn.setPointerCapture(e.pointerId); press(true); });
    btn.addEventListener('pointerup', () => press(false));
    btn.addEventListener('pointercancel', () => press(false));

    const dt = 1 / 60;
    ctx.frame(() => {
      if (over) return false;
      const c = claw;
      c.t += dt;
      let target = 0; // 台車の目標速度
      if (c.state === 'move') target = 150;
      if (c.state === 'brake' && Math.abs(c.vx) < 1 && c.t > 0.35) { c.state = 'down'; c.t = 0; }
      if (c.state === 'down') {
        c.L += 130 * dt;
        // 本体がカプセルに乗るか、アームが深く押しつけられたら止まる（となりのカプセルは押しのけて下りる）
        const h = hub();
        const blocked = world.balls.some((b) => Math.hypot(b.x - h.x, b.y - h.y) < b.r + 16) || arms.some((a) => a.fin.pen > 7 || a.up.pen > 7);
        const tipY = Math.max(...arms.map((a) => armPts(a).t[1]));
        if (blocked || tipY >= FLOOR - 4) { c.state = 'close'; c.t = 0; ctx.sfx.tone(160, 0.2, { type: 'square', vol: 0.05 }); }
      }
      if (c.state === 'close') {
        // 力は弱め: 何かをはさんで押し返されたら、そこで止まる
        arms.forEach((a) => { if (!(a.fin.pen > 2 || a.up.pen > 2.5)) a.th = Math.max(SHUT, a.th - 1.4 * dt); });
        if (c.t > 0.8) { c.state = 'up'; c.t = 0; c.relax = 0.08 + Math.random() * 0.2; }
      }
      if (c.state === 'up') {
        c.L = Math.max(LMIN, c.L - 105 * dt);
        if (c.L <= LMIN) { c.state = 'back'; c.t = 0; }
      }
      if (c.state === 'up' || c.state === 'back') {
        // 上がりきるとアームが少しゆるむ（本物と同じ）
        if (c.L < LMIN + 40) arms.forEach((a) => { a.th = Math.min(OPEN, a.th + (c.relax / 0.8) * dt); });
      }
      if (c.state === 'back') {
        const left = c.cx - HOME;
        target = left > 2 ? -Math.min(150, left * 2.2 + 20) : 0;
        if (left <= 2 && Math.abs(c.vx) < 2) { c.state = 'drop'; c.t = 0; ctx.sfx.tone(240, 0.15, { type: 'square', vol: 0.05 }); }
      }
      if (c.state === 'drop') {
        arms.forEach((a) => { a.th = Math.min(OPEN, a.th + 1.8 * dt); });
        if (c.t > 1.6) {
          c.state = 'idle';
          if (tries <= 0) { over = true; ctx.end({ stars: Math.min(3, got), record: got }); return false; }
        }
      }
      // 台車はなめらかに加速・減速する
      const prevVx = c.vx;
      c.vx += clamp(target - c.vx, -700 * dt, 700 * dt);
      c.cx = clamp(c.cx + c.vx * dt, HOME, W - 34);
      if (c.cx >= W - 34 && c.state === 'move') { c.state = 'brake'; c.t = 0; }
      if (c.cx === HOME || c.cx === W - 34) c.vx = 0;
      // ふりこ: 台車の加速でゆれ、空気抵抗でおさまる
      const acc = (c.vx - prevVx) / dt;
      c.dphi += (-(1400 / c.L) * Math.sin(c.phi) - (acc / c.L) * Math.cos(c.phi)) * dt - 2.2 * c.dphi * dt;
      c.phi = clamp(c.phi + c.dphi * dt, -0.5, 0.5);
      if (Math.abs(c.vx) > 1 && ((hum += dt) > 0.12)) { hum = 0; ctx.sfx.tone(95, 0.1, { type: 'sawtooth', vol: 0.025 }); }
      placeArms(false);
      world.step();

      // 取り出し口に落ちたらGET
      world.balls.filter((b) => b.x < CHUTE && b.y > PART + 20).forEach((b) => {
        world.remove(b);
        got++;
        stat();
        ctx.sfx.fanfare('SR'); ctx.vib([30, 40, 30]);
        ctx.toast(`🎉 GET！ ${ITEMS[b.id].name}`);
      });
      draw();
      btn.disabled = !(c.state === 'idle' || c.state === 'move') || (tries <= 0 && c.state === 'idle');
      return true;
    });

    function draw() {
      const c = claw;
      // 奥のかべ（ライトの光）
      const bg = g.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#ffe4f1'); bg.addColorStop(0.5, '#f4e6ff'); bg.addColorStop(1, '#e5f2ff');
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      for (let x = 20; x < W; x += 40) {
        const lg = g.createLinearGradient(x - 14, 0, x + 14, 0);
        lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,.35)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = lg; g.fillRect(x - 14, RAIL, 28, FLOOR - RAIL);
      }
      // 上の電飾
      g.fillStyle = '#ff6fa5'; g.fillRect(0, 0, W, 16);
      const blink = Math.floor(Date.now() / 300) % 2;
      for (let i = 0; i < 18; i++) {
        g.beginPath(); g.arc(10 + i * 20, 8, 3.5, 0, TAU);
        g.fillStyle = (i + blink) % 2 ? '#fff6a8' : '#ffd23f'; g.fill();
      }
      // レール
      const rg = g.createLinearGradient(0, RAIL - 6, 0, RAIL + 4);
      rg.addColorStop(0, '#e9eef3'); rg.addColorStop(0.5, '#a9b4bf'); rg.addColorStop(1, '#7d8a96');
      g.fillStyle = rg; g.fillRect(0, RAIL - 8, W, 10);
      // 床
      const fg = g.createLinearGradient(0, FLOOR, 0, H);
      fg.addColorStop(0, '#d9c8ea'); fg.addColorStop(1, '#b9a3cf');
      g.fillStyle = fg; g.fillRect(0, FLOOR, W, H - FLOOR);
      // 取り出し口
      g.fillStyle = 'rgba(40,20,50,.18)'; g.fillRect(0, PART, CHUTE, FLOOR - PART);
      g.fillStyle = '#ff4f8f'; g.font = 'bold 15px sans-serif'; g.textAlign = 'center';
      g.fillText('GET', CHUTE / 2, PART + 26);
      g.font = 'bold 10px sans-serif'; g.fillStyle = 'rgba(74,58,79,.6)'; g.fillText('とりだし口', CHUTE / 2, PART + 42);

      // カプセル
      world.balls.forEach((b) => {
        g.save(); g.translate(b.x, b.y); g.rotate(b.a);
        g.beginPath(); g.arc(0, 0, b.r, 0, TAU); g.fillStyle = 'rgba(255,255,255,.95)'; g.fill();
        const img = charImg(b.id);
        if (img.complete) g.drawImage(img, -b.r * 0.82, -b.r * 0.9, b.r * 1.64, b.r * 1.64);
        g.beginPath(); g.arc(0, 0, b.r, Math.PI, 0); g.closePath();
        const cg = g.createLinearGradient(0, -b.r, 0, 0);
        cg.addColorStop(0, b.c); cg.addColorStop(1, `${b.c}aa`);
        g.fillStyle = cg; g.fill();
        g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(-b.r, -1.5, b.r * 2, 3);
        g.beginPath(); g.arc(0, 0, b.r, 0, TAU); g.lineWidth = 2; g.strokeStyle = 'rgba(74,58,79,.35)'; g.stroke();
        g.beginPath(); g.ellipse(-b.r * 0.35, -b.r * 0.55, b.r * 0.32, b.r * 0.16, -0.5, 0, TAU); g.fillStyle = 'rgba(255,255,255,.75)'; g.fill();
        g.restore();
      });

      // 台車・ワイヤー・アーム
      const h = hub();
      g.fillStyle = '#596572'; g.fillRect(c.cx - 16, RAIL - 12, 32, 16);
      g.fillStyle = '#8a97a3'; g.fillRect(c.cx - 16, RAIL - 12, 32, 5);
      g.strokeStyle = '#3d4650'; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(c.cx, RAIL + 2); g.lineTo(h.x, h.y); g.stroke();
      // 奥のつめ（3本目・見た目だけ）
      g.save(); g.translate(h.x, h.y); g.rotate(-c.phi);
      g.strokeStyle = 'rgba(95,107,119,.55)'; g.lineWidth = 6; g.lineCap = 'round';
      const mid = (arms[0].th + arms[1].th) / 2;
      g.beginPath(); g.moveTo(0, 10); g.lineTo(0, 10 + Math.cos(mid) * ARM1); g.lineTo(0, 10 + Math.cos(mid) * ARM1 + ARM2 * 0.8); g.stroke();
      g.restore();
      arms.forEach((a) => {
        const q = armPts(a);
        g.lineCap = 'round'; g.lineJoin = 'round';
        g.strokeStyle = '#4f5a66'; g.lineWidth = 8;
        g.beginPath(); g.moveTo(...q.p); g.lineTo(...q.e); g.lineTo(...q.t); g.stroke();
        g.strokeStyle = '#c3ccd5'; g.lineWidth = 3;
        g.beginPath(); g.moveTo(...q.p); g.lineTo(...q.e); g.lineTo(...q.t); g.stroke();
        g.fillStyle = '#4f5a66'; g.beginPath(); g.arc(...q.e, 4.5, 0, TAU); g.fill();
        g.fillStyle = '#ff8fb8'; g.beginPath(); g.arc(...q.t, 3.5, 0, TAU); g.fill();
      });
      // 本体（金属のドーム）
      g.save(); g.translate(h.x, h.y); g.rotate(-c.phi);
      const dg = g.createLinearGradient(-20, 0, 20, 0);
      dg.addColorStop(0, '#7d8a96'); dg.addColorStop(0.35, '#f2f5f8'); dg.addColorStop(1, '#6b7884');
      g.fillStyle = dg;
      g.beginPath(); g.moveTo(-24, 14); g.quadraticCurveTo(-24, -10, 0, -10); g.quadraticCurveTo(24, -10, 24, 14); g.closePath(); g.fill();
      g.fillStyle = '#ff6fa5'; g.fillRect(-24, 11, 48, 6);
      g.restore();

      // ガラスの映りこみ
      g.fillStyle = 'rgba(255,255,255,.18)';
      g.beginPath(); g.moveTo(W * 0.55, 16); g.lineTo(W * 0.68, 16); g.lineTo(W * 0.38, H); g.lineTo(W * 0.25, H); g.fill();
      g.fillStyle = 'rgba(255,255,255,.12)';
      g.beginPath(); g.moveTo(W * 0.74, 16); g.lineTo(W * 0.78, 16); g.lineTo(W * 0.48, H); g.lineTo(W * 0.44, H); g.fill();
      if (c.state === 'idle' && tries > 0) {
        g.fillStyle = 'rgba(74,58,79,.6)'; g.font = 'bold 13px sans-serif'; g.textAlign = 'center';
        g.fillText('ボタンをおしてスタート', W / 2 + 30, 80);
      }
    }
  }

  /* ================================================================
   * ③ 五目ならべ（ガチャモンと対決）
   * ================================================================ */

  const GOMOKU_FOES = [
    { lv: 1, id: 'pachimon.moririn', label: '普通' },
    { lv: 2, id: 'pachimon.gachamon', label: '強い' },
    { lv: 3, id: 'pachimon.garakushion', label: '超強い' },
  ];

  async function playGomoku(ctx) {
    ctx.box.innerHTML = `<p class="center">だれと対決する？</p><div class="mg-levels">${GOMOKU_FOES.map((f) => `
      <button class="card mg-level" data-lv="${f.lv}">${emo(f.id)}<span><b>${f.label}</b><small>${esc(ITEMS[f.id].name)} ・ 勝ったら ${'⭐'.repeat(f.lv)}</small></span></button>`).join('')}</div>
      <p class="muted small center">先に5つならべたほうが勝ち。あなたが先手（黒）です</p>`;
    const lv = await new Promise((r) => ctx.box.querySelectorAll('[data-lv]').forEach((b) => b.addEventListener('click', () => r(Number(b.dataset.lv)))));
    if (!ctx.alive()) return;
    const foeDef = GOMOKU_FOES[lv - 1];
    const N = Gomoku.N, S = 360, M = 18, CELL = (S - M * 2) / (N - 1);
    ctx.box.innerHTML = `<div class="mg-vs"><span class="mg-me">⚫ あなた</span><span class="muted">VS</span>${foe(foeDef.id)}<span>⚪</span></div>`;
    const { g, cv, pt } = stage(ctx.box, S, S);
    const msg = document.createElement('p');
    msg.className = 'center mg-msg';
    ctx.box.appendChild(msg);
    const board = new Int8Array(N * N);
    let ghost = -1, last = -1, turn = 1, over = false, line = null, moves = 0;
    const say = (t) => { msg.innerHTML = t; };
    ctx.stat(`${foeDef.label} ・ ${'⭐'.repeat(lv)}`);
    say('打ちたいところをタップ → もう一度タップで置く');

    function draw() {
      const wood = g.createLinearGradient(0, 0, S, S);
      wood.addColorStop(0, '#f3cf8e'); wood.addColorStop(1, '#e2ac62');
      g.fillStyle = wood; g.fillRect(0, 0, S, S);
      g.strokeStyle = 'rgba(110,70,30,.75)'; g.lineWidth = 1;
      for (let i = 0; i < N; i++) {
        g.beginPath(); g.moveTo(M, M + i * CELL); g.lineTo(S - M, M + i * CELL); g.stroke();
        g.beginPath(); g.moveTo(M + i * CELL, M); g.lineTo(M + i * CELL, S - M); g.stroke();
      }
      g.fillStyle = 'rgba(110,70,30,.9)';
      [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11]].forEach(([x, y]) => { g.beginPath(); g.arc(M + x * CELL, M + y * CELL, 3, 0, TAU); g.fill(); });
      const stone = (i, c, alpha = 1) => {
        const x = M + (i % N) * CELL, y = M + Math.floor(i / N) * CELL, r = CELL * 0.46;
        g.globalAlpha = alpha;
        g.beginPath(); g.arc(x + 1, y + 2, r, 0, TAU); g.fillStyle = 'rgba(0,0,0,.25)'; g.fill();
        const sg = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
        if (c === 1) { sg.addColorStop(0, '#666'); sg.addColorStop(1, '#111'); } else { sg.addColorStop(0, '#fff'); sg.addColorStop(1, '#d6d2cc'); }
        g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = sg; g.fill();
        g.globalAlpha = 1;
      };
      for (let i = 0; i < N * N; i++) if (board[i]) stone(i, board[i]);
      if (ghost >= 0 && !board[ghost]) stone(ghost, 1, 0.45);
      if (last >= 0) { g.fillStyle = '#ff3b6b'; g.beginPath(); g.arc(M + (last % N) * CELL, M + Math.floor(last / N) * CELL, 3.2, 0, TAU); g.fill(); }
      if (line) {
        g.strokeStyle = '#ff3b6b'; g.lineWidth = 4;
        line.forEach((i) => { g.beginPath(); g.arc(M + (i % N) * CELL, M + Math.floor(i / N) * CELL, CELL * 0.5, 0, TAU); g.stroke(); });
      }
    }
    draw();

    function place(i, c) {
      board[i] = c; last = i; moves++;
      ctx.sfx.tone(c === 1 ? 420 : 520, 0.06, { type: 'square', vol: 0.06 });
      if (Gomoku.isFive(board, i)) { line = Gomoku.fiveLine(board, i); over = true; }
      draw();
    }

    cv.addEventListener('pointerdown', (e) => {
      if (over || turn !== 1) return;
      const p = pt(e);
      const x = Math.round((p.x - M) / CELL), y = Math.round((p.y - M) / CELL);
      if (x < 0 || y < 0 || x >= N || y >= N) return;
      const i = y * N + x;
      if (board[i]) return;
      if (ghost !== i) { ghost = i; ctx.sfx.tap(); draw(); return; }
      ghost = -1;
      place(i, 1);
      if (over) { say('🎉 5つならんだ！'); ctx.later(() => ctx.end({ stars: lv, record: lv, text: `${foeDef.label}の${ITEMS[foeDef.id].name}に勝った！` }), 1200); return; }
      if (moves >= N * N) { over = true; ctx.later(() => ctx.end({ stars: 0, record: null, text: '引き分け' }), 800); return; }
      turn = 2;
      say(`${esc(ITEMS[foeDef.id].name)}がかんがえ中…`);
      ctx.later(() => {
        const j = Gomoku.choose(board, 2, lv);
        place(j, 2);
        turn = 1;
        if (over) { say('😢 5つならべられた…'); ctx.sfx.drop(); ctx.later(() => ctx.end({ stars: 0, record: null, text: `${ITEMS[foeDef.id].name}の勝ち。また挑戦してね` }), 1500); return; }
        say('あなたの番です');
      }, 350);
    });
  }

  /* ================================================================
   * ④ ポーカー（5枚ドロー・ガチャモンと10回勝負）
   * ================================================================ */

  const PK_HANDS = 10, PK_CHIPS = 100, PK_ANTE = 5;
  const SUITS = ['♠', '♥', '♦', '♣'];
  const RANKS = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
  const HAND_NAMES = ['ハイカード', 'ワンペア', 'ツーペア', 'スリーカード', 'ストレート', 'フラッシュ', 'フルハウス', 'フォーカード', 'ストレートフラッシュ'];

  // 役の強さ [役, くらべる数字…]（大きいほど強い）
  function handValue(cards) {
    const rs = cards.map((c) => c.r).sort((a, b) => b - a);
    const cnt = {};
    rs.forEach((r) => { cnt[r] = (cnt[r] || 0) + 1; });
    const groups = Object.entries(cnt).map(([r, n]) => [n, Number(r)]).sort((a, b) => b[0] - a[0] || b[1] - a[1]);
    const flush = cards.every((c) => c.s === cards[0].s);
    const uniq = [...new Set(rs)];
    let straight = 0;
    if (uniq.length === 5) {
      if (uniq[0] - uniq[4] === 4) straight = uniq[0];
      else if (uniq.join() === '14,5,4,3,2') straight = 5;
    }
    const kick = groups.map((x) => x[1]);
    if (straight && flush) return [8, straight];
    if (groups[0][0] === 4) return [7, ...kick];
    if (groups[0][0] === 3 && groups[1][0] === 2) return [6, ...kick];
    if (flush) return [5, ...rs];
    if (straight) return [4, straight];
    if (groups[0][0] === 3) return [3, ...kick];
    if (groups[0][0] === 2 && groups[1][0] === 2) return [2, ...kick];
    if (groups[0][0] === 2) return [1, ...kick];
    return [0, ...rs];
  }
  const cmpHand = (a, b) => { for (let i = 0; i < Math.max(a.length, b.length); i++) if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) - (b[i] || 0); return 0; };

  // AIから見た手の強さ（0〜1）
  function strength(cards, beforeDraw) {
    const v = handValue(cards);
    let s = [0.08, 0.38, 0.66, 0.78, 0.86, 0.9, 0.95, 0.98, 1][v[0]];
    if (v[0] === 0) s += (v[1] - 8) * 0.015;
    if (v[0] === 1) s += (v[1] - 8) * 0.018;
    if (beforeDraw && v[0] < 4) {
      const suits = {};
      cards.forEach((c) => { suits[c.s] = (suits[c.s] || 0) + 1; });
      if (Math.max(...Object.values(suits)) === 4) s += 0.12;
      const u = [...new Set(cards.map((c) => c.r))].sort((a, b) => a - b);
      for (let i = 0; i + 3 < u.length; i++) if (u[i + 3] - u[i] === 3) s += 0.08;
    }
    return clamp(s, 0, 1);
  }

  // AIが交換するカード（番号）
  function aiDiscard(cards) {
    const v = handValue(cards);
    if (v[0] >= 4 && v[0] !== 7) return [];
    const byRank = {};
    cards.forEach((c, i) => { (byRank[c.r] ||= []).push(i); });
    if (v[0] >= 1) {
      const keep = new Set(Object.values(byRank).filter((x) => x.length >= 2).flat());
      return cards.map((_, i) => i).filter((i) => !keep.has(i));
    }
    const suits = {};
    cards.forEach((c, i) => { (suits[c.s] ||= []).push(i); });
    const fl = Object.values(suits).find((x) => x.length === 4);
    if (fl) return cards.map((_, i) => i).filter((i) => !fl.includes(i));
    const order = cards.map((c, i) => [c.r, i]).sort((a, b) => b[0] - a[0]);
    return order.slice(2).map((x) => x[1]);
  }

  function cardHTML(c, { back = false, sel = false, i = -1 } = {}) {
    if (back) return '<span class="pk-card back"></span>';
    const red = c.s === 1 || c.s === 2;
    return `<span class="pk-card ${red ? 'red' : ''} ${sel ? 'sel' : ''}" ${i >= 0 ? `data-i="${i}"` : ''}><b>${RANKS[c.r] || c.r}</b><i>${SUITS[c.s]}</i></span>`;
  }

  async function playPoker(ctx) {
    const foeId = rand(['pachimon.gachamon', 'pachimon.mirakurun', 'pachimon.obaketto', 'pachimon.robocchi']);
    const fname = ITEMS[foeId].name;
    const chips = { p: PK_CHIPS, a: PK_CHIPS };
    ctx.box.innerHTML = `
      <div class="pk">
        <div class="pk-row">${foe(foeId)}<span class="pk-chips">🪙 <b id="pkA"></b></span></div>
        <div class="pk-hand" id="pkAH"></div>
        <div class="pk-pot"><span id="pkPot"></span><span id="pkMsg"></span></div>
        <div class="pk-hand me" id="pkPH"></div>
        <div class="pk-row"><span class="mg-me">あなた</span><span class="pk-chips">🪙 <b id="pkP"></b></span></div>
        <div class="pk-btns" id="pkBtns"></div>
      </div>
      <p class="muted small center">役が強いほうが勝ち。${PK_HANDS}回勝負して、コインが多いほうの勝ち（勝ったら⭐）</p>`;
    const $ = (id) => ctx.box.querySelector(`#${id}`);
    let pot = 0, deck = [], ph = [], ah = [], showA = false, sel = new Set(), picking = false;
    const render = () => {
      $('pkA').textContent = chips.a; $('pkP').textContent = chips.p; $('pkPot').textContent = `ポット ${pot}`;
      $('pkAH').innerHTML = ah.map((c) => cardHTML(c, { back: !showA })).join('');
      $('pkPH').innerHTML = ph.map((c, i) => cardHTML(c, { sel: sel.has(i), i })).join('');
    };
    const say = (t) => { $('pkMsg').innerHTML = t; };
    $('pkPH').addEventListener('click', (e) => {
      const el = e.target.closest('[data-i]');
      if (!el || !picking) return;
      const i = Number(el.dataset.i);
      if (sel.has(i)) sel.delete(i); else sel.add(i);
      ctx.sfx.tap();
      render();
      $('pkBtns').querySelector('[data-v="draw"]').textContent = sel.size ? `${sel.size}枚かえる` : 'このまま';
    });
    const pay = (who, n) => { n = Math.min(n, chips[who]); chips[who] -= n; pot += n; render(); return n; };
    const deal = () => deck.pop();

    // かけ（1巡）: 'p' か 'a' がおりたらその人を返す
    async function betting(size, first) {
      const bet = { p: 0, a: 0 };
      let actor = first, checks = 0, raised = 0;
      for (let guard = 0; guard < 6; guard++) {
        const other = actor === 'p' ? 'a' : 'p';
        const facing = bet[other] - bet[actor];
        const amt = Math.min(size, chips.p, chips.a);
        let act;
        if (actor === 'p') {
          const opts = facing > 0
            ? [['fold', 'おりる'], ['call', `コール ${facing}`, 'primary'], ...(raised < 1 && amt > 0 ? [['raise', `レイズ +${amt}`, 'ticket']] : [])]
            : [['check', 'チェック'], ...(amt > 0 ? [['bet', `ベット ${amt}`, 'primary']] : [])];
          act = await ask($('pkBtns'), opts);
          if (!ctx.alive()) return null;
        } else {
          await wait(ctx, 700);
          const s = strength(ah, size < 20) + (Math.random() - 0.5) * 0.12;
          if (facing > 0) act = s > 0.8 && raised < 1 && amt > 0 && Math.random() < 0.6 ? 'raise' : s > (size < 20 ? 0.32 : 0.42) || Math.random() < 0.08 ? 'call' : 'fold';
          else act = amt > 0 && (s > 0.6 || Math.random() < 0.12) ? 'bet' : 'check';
          say(`${fname}: ${{ fold: 'おりる', call: 'コール', raise: 'レイズ！', check: 'チェック', bet: 'ベット！' }[act]}`);
        }
        if (act === 'fold') return actor;
        if (act === 'check') { if (++checks >= 2) return null; }
        if (act === 'call') { bet[actor] += pay(actor, facing); ctx.sfx.coin(); return null; }
        if (act === 'bet' || act === 'raise') { bet[actor] += pay(actor, facing + amt); if (act === 'raise') raised++; ctx.sfx.coin(); }
        actor = other;
      }
      return null;
    }

    for (let hand = 1; hand <= PK_HANDS; hand++) {
      if (chips.p < PK_ANTE || chips.a < PK_ANTE) break;
      ctx.stat(`${hand} / ${PK_HANDS}回戦`);
      deck = pick(52, Array.from({ length: 52 }, (_, i) => ({ r: (i % 13) + 2, s: Math.floor(i / 13) })));
      pot = 0; showA = false; sel = new Set();
      pay('p', PK_ANTE); pay('a', PK_ANTE);
      ph = [deal(), deal(), deal(), deal(), deal()].sort((a, b) => a.r - b.r);
      ah = [deal(), deal(), deal(), deal(), deal()];
      render();
      ctx.sfx.click();
      const first = hand % 2 ? 'p' : 'a';
      say(`あなたの手: <b>${HAND_NAMES[handValue(ph)[0]]}</b>`);
      let folded = await betting(10, first);
      if (!ctx.alive()) return;
      if (!folded) {
        // 交換
        picking = true;
        say('かえたいカードをタップ');
        await ask($('pkBtns'), [['draw', 'このまま', 'primary']]);
        if (!ctx.alive()) return;
        picking = false;
        ph = ph.map((c, i) => (sel.has(i) ? deal() : c)).sort((a, b) => a.r - b.r);
        const ad = aiDiscard(ah);
        ah = ah.map((c, i) => (ad.includes(i) ? deal() : c));
        sel = new Set();
        render();
        say(`${fname}は ${ad.length ? `${ad.length}枚かえた` : 'かえなかった'} ・ あなたの手: <b>${HAND_NAMES[handValue(ph)[0]]}</b>`);
        folded = await betting(20, first);
        if (!ctx.alive()) return;
      }
      let winner;
      if (folded) {
        winner = folded === 'p' ? 'a' : 'p';
        say(winner === 'p' ? `${fname}がおりた！` : 'おりました');
      } else {
        showA = true;
        const vp = handValue(ph), va = handValue(ah), d = cmpHand(vp, va);
        winner = d > 0 ? 'p' : d < 0 ? 'a' : null;
        say(`あなた <b>${HAND_NAMES[vp[0]]}</b> ・ ${fname} <b>${HAND_NAMES[va[0]]}</b><br>${winner === 'p' ? '🎉 あなたの勝ち！' : winner === 'a' ? `😢 ${fname}の勝ち` : '引き分け'}`);
      }
      if (winner) { chips[winner] += pot; } else { chips.p += Math.floor(pot / 2); chips.a += pot - Math.floor(pot / 2); }
      if (winner === 'p') ctx.sfx.fanfare('R'); else if (winner === 'a') ctx.sfx.drop();
      pot = 0;
      render();
      await ask($('pkBtns'), [['next', hand < PK_HANDS ? '次の勝負へ' : '結果を見る', 'primary']]);
      if (!ctx.alive()) return;
    }
    const win = chips.p > chips.a;
    ctx.end({ stars: win ? 1 : 0, record: win ? chips.p : null, text: `あなた ${chips.p}枚 ・ ${fname} ${chips.a}枚` });
  }

  /* ================================================================
   * ⑤ 電気イスゲーム（12脚のイスで心理戦）
   * ================================================================ */

  const EC_GOAL = 40, EC_SHOCKS = 3;

  async function playChair(ctx) {
    const foeId = rand(['pachimon.piricchi', 'pachimon.biribiricchi', 'pachimon.robocchi']);
    const fname = ITEMS[foeId].name;
    const P = { p: { pts: 0, shocks: 0 }, a: { pts: 0, shocks: 0 } };
    let chairs = Array.from({ length: 12 }, (_, i) => i + 1);
    ctx.box.innerHTML = `
      <div class="ec-score">
        <div class="ec-pl" id="ecP"></div>
        <div class="ec-pl foe" id="ecA"></div>
      </div>
      <div class="ec-ring" id="ecRing">
        ${chairs.map((n) => { const ang = (n / 12) * TAU - Math.PI / 2; return `<button class="ec-chair" data-n="${n}" style="left:${50 + Math.cos(ang) * 40}%;top:${50 + Math.sin(ang) * 40}%"><b>${n}</b></button>`; }).join('')}
        <div class="ec-center" id="ecMsg"></div>
      </div>
      <div class="pk-btns" id="ecBtns"></div>
      <p class="muted small center">先に${EC_GOAL}点で勝ち。ビリビリを${EC_SHOCKS}回うけたら負け。<br>セーフならイスの番号が点数に、ビリビリなら点数が0に！</p>`;
    const $ = (id) => ctx.box.querySelector(`#${id}`);
    const ring = $('ecRing');
    const say = (t) => { $('ecMsg').innerHTML = t; };
    const render = () => {
      const pl = (who, label) => `<b>${label}</b><span class="ec-pts">${P[who].pts}<small>点</small></span><span class="ec-sh">${'⚡'.repeat(P[who].shocks)}${'・'.repeat(EC_SHOCKS - P[who].shocks)}</span>`;
      $('ecP').innerHTML = pl('p', 'あなた');
      $('ecA').innerHTML = `${emo(foeId)}${pl('a', esc(fname))}`;
      ring.querySelectorAll('.ec-chair').forEach((b) => { b.classList.toggle('gone', !chairs.includes(Number(b.dataset.n))); b.classList.remove('pick', 'trap', 'sit', 'zap'); });
    };
    render();

    // イスを1つえらんでもらう（もう一度タップで決定）
    const choose = (prompt) => new Promise((resolve) => {
      say(prompt);
      let cur = 0;
      const on = (e) => {
        const b = e.target.closest('.ec-chair');
        if (!b || b.classList.contains('gone')) return;
        const n = Number(b.dataset.n);
        ring.querySelectorAll('.ec-chair').forEach((x) => x.classList.toggle('pick', x === b));
        ctx.sfx.tap();
        if (cur === n) return;
        cur = n;
        ask($('ecBtns'), [['ok', `${n}番に決める`, 'primary']]).then(() => { ring.removeEventListener('click', on); resolve(cur); });
      };
      ring.addEventListener('click', on);
    });

    // あいての考え方: 大きい番号・勝ちが決まる番号ほど、すわられやすい／仕掛けられやすい
    const sitWeights = (who) => chairs.map((c) => (c / 12) ** 1.4 + (P[who].pts + c >= EC_GOAL ? 2.5 : 0) + 0.12);
    const sample = (ws) => { const t = ws.reduce((a, b) => a + b, 0); let r = Math.random() * t; for (let i = 0; i < ws.length; i++) { r -= ws[i]; if (r <= 0) return i; } return ws.length - 1; };
    function aiTrap() {
      if (Math.random() < 0.2) return rand(chairs);
      return chairs[sample(sitWeights('p').map((w) => w * w))];
    }
    function aiSit() {
      const tw = sitWeights('a'), tot = tw.reduce((a, b) => a + b, 0);
      const util = chairs.map((c, i) => {
        const p = tw[i] / tot;
        return (1 - p) * (c + (P.a.pts + c >= EC_GOAL ? 30 : 0)) - p * (P.a.pts + 6 + P.a.shocks * 8);
      });
      return chairs[sample(util.map((u) => Math.exp((u - Math.max(...util)) / 2.5)))];
    }

    async function turn(attacker) {
      const sitter = attacker === 'p' ? 'a' : 'p';
      let trap, seat;
      if (attacker === 'p') {
        trap = await choose(`⚡ <b>あなたが仕掛ける番</b><br>ビリビリにするイスをえらんでね<br><small>（${esc(fname)}には見えないよ）</small>`);
        if (!ctx.alive()) return;
        render();
        ring.querySelector(`[data-n="${trap}"]`).classList.add('trap');
        say(`${esc(fname)}がイスをえらんでいる…`);
        await wait(ctx, 1200);
        seat = aiSit();
      } else {
        say(`${esc(fname)}がどこかに<br>電流を仕掛けた…`);
        await wait(ctx, 1000);
        trap = aiTrap();
        seat = await choose('🪑 <b>あなたがすわる番</b><br>セーフだと思うイスをえらんでね');
        if (!ctx.alive()) return;
        render();
      }
      const el = ring.querySelector(`[data-n="${seat}"]`);
      el.classList.add('sit');
      say(`${sitter === 'p' ? 'あなた' : esc(fname)}が <b>${seat}番</b> にすわった…<br>スイッチ…`);
      ctx.sfx.tone(300, 0.4, { type: 'sine', vol: 0.08, slide: 400 });
      await wait(ctx, 1500);
      if (!ctx.alive()) return;
      if (seat === trap) {
        P[sitter].shocks++;
        P[sitter].pts = 0;
        el.classList.add('zap');
        ring.classList.add('shock');
        ctx.sfx.tone(70, 0.6, { type: 'sawtooth', vol: 0.2 }); ctx.sfx.noise(0.5, 0.4); ctx.vib([80, 40, 80, 40, 120]);
        say(`⚡⚡ <b>ビリビリ！</b> ⚡⚡<br>${sitter === 'p' ? 'あなた' : esc(fname)}の点数が0に…`);
        ctx.later(() => ring.classList.remove('shock'), 700);
      } else {
        P[sitter].pts += seat;
        chairs = chairs.filter((c) => c !== seat);
        ctx.sfx.coin();
        say(`✨ <b>セーフ！</b> +${seat}点<br><small>仕掛けられていたのは ${trap}番</small>`);
      }
      render();
      ring.querySelector(`[data-n="${seat}"]`).classList.add(seat === trap ? 'zap' : 'sit');
      await ask($('ecBtns'), [['next', '次へ', 'primary']]);
    }

    let attacker = Math.random() < 0.5 ? 'p' : 'a';
    say(`${attacker === 'a' ? 'あなた' : esc(fname)}が先にすわる番`);
    await wait(ctx, 1400);
    let result = null;
    for (let n = 1; ctx.alive() && !result; n++) {
      ctx.stat(`${n}ターン目`);
      await turn(attacker);
      if (!ctx.alive()) return;
      for (const w of ['p', 'a']) {
        const o = w === 'p' ? 'a' : 'p';
        if (P[w].pts >= EC_GOAL) result = w;
        else if (P[o].shocks >= EC_SHOCKS) result = w;
      }
      if (!result && chairs.length <= 1) result = P.p.pts > P.a.pts ? 'p' : P.a.pts > P.p.pts ? 'a' : 'draw';
      attacker = attacker === 'p' ? 'a' : 'p';
    }
    const why = P.p.shocks >= EC_SHOCKS || P.a.shocks >= EC_SHOCKS ? 'ビリビリ3回で決着' : chairs.length <= 1 ? 'イスが残り1脚で決着' : `${EC_GOAL}点に到達`;
    ctx.end({ stars: result === 'p' ? 1 : 0, record: result === 'p' ? P.p.pts : null, text: `${why}（あなた ${P.p.pts}点 ・ ${fname} ${P.a.pts}点）` });
  }

  /* ---------------- 一覧 ---------------- */

  const GAMES = [
    {
      id: 'evo', icon: '🫧', name: 'ガチャモン進化パズル', play: playEvo, needs: EVO, best: (v) => `${v}点`, better: (a, b) => a > b,
      desc: `同じキャラをくっつけて進化！ ${EVO_STARS.map((lv, i) => `${ITEMS[EVO[lv]].name}で${'⭐'.repeat(i + 1)}`).join('・')}`,
    },
    {
      id: 'ufo', icon: '🕹️', name: 'UFOキャッチャー', play: playUfo, best: (v) => `${v}こ`, better: (a, b) => a > b,
      needs: MACHINES.flatMap((m) => m.items).filter((it) => it.rarity !== 'SE').map((it) => it.id),
      desc: `${UFO_TRIES}回のうちにカプセルをGET！ 1こで⭐・2こで⭐⭐・3こで⭐⭐⭐`,
    },
    {
      id: 'gomoku', icon: '⚫', name: '五目ならべ', play: playGomoku, needs: GOMOKU_FOES.map((f) => f.id), best: (v) => `${GOMOKU_FOES[v - 1].label}に勝利`, better: (a, b) => a > b,
      desc: 'ガチャモンと対決！ 普通に勝って⭐・強いに勝って⭐⭐・超強いに勝って⭐⭐⭐',
    },
    {
      id: 'poker', icon: '🃏', name: 'ポーカー', play: playPoker, needs: [], best: (v) => `コイン${v}枚`, better: (a, b) => a > b,
      desc: `5枚のカードで役をつくる。ガチャモンと${PK_HANDS}回勝負して、コインが多ければ⭐`,
    },
    {
      id: 'chair', icon: '⚡', name: '電気イスゲーム', play: playChair, needs: [], best: (v) => `${v}点で勝利`, better: (a, b) => a > b,
      desc: `12脚のイスで心理戦。ビリビリを避けて先に${EC_GOAL}点で⭐`,
    },
  ];
  // 画面に出すキャラ（相手）も先に読みこむ
  GAMES.forEach((g) => { g.needs = g.needs || []; });

  return { GAMES, preload, debug };
})();
