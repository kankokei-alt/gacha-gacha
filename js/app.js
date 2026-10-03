/* ぽけっとガチャ — アプリ本体 */
(() => {
  'use strict';

  const KEY = 'pocket-gacha-v1';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => Number(n).toLocaleString('ja-JP');
  const rand = (a) => a[Math.floor(Math.random() * a.length)];

  function today(d = new Date()) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function daysBetween(a, b) {
    return Math.round((new Date(`${b}T00:00:00`) - new Date(`${a}T00:00:00`)) / 86400000);
  }
  function fmtDate(iso) {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  /* ---------------- 状態 ---------------- */

  const newDaily = (date) => ({ date, pulls: 0, saves: 0, opened: 0, newItems: 0, claimed: {}, allClear: false });

  function defaultState() {
    return {
      v: 1,
      coins: 1000,
      tickets: 1,
      shards: 0,
      xp: 0,
      totalPulls: 0,
      collection: {},
      obtainedAt: {},
      machineStats: {},
      pending: null,
      savings: [],
      goal: null,
      goalsDone: [],
      login: { last: null, streak: 0, best: 0, total: 0 },
      daily: newDaily(today()),
      achievements: {},
      selected: 'sweets',
      settings: { sound: true, vib: true },
      tipDismissed: false,
      createdAt: new Date().toISOString(),
    };
  }

  function load() {
    const base = defaultState();
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return base;
      const s = JSON.parse(raw);
      return { ...base, ...s, settings: { ...base.settings, ...s.settings }, login: { ...base.login, ...s.login } };
    } catch (e) {
      return base;
    }
  }

  let S = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 容量不足など */ }
  }

  const mstat = (id) => (S.machineStats[id] ||= { pulls: 0, sinceNew: 0 });
  const machine = (id) => MACHINES.find((m) => m.id === id) || MACHINES[0];
  const owned = (it) => (S.collection[it.id] || 0) > 0;

  /* ---------------- レベル ---------------- */

  function levelInfo(xp) {
    let lv = 1, need = 100, rest = xp;
    while (rest >= need) { rest -= need; lv++; need = 100 + (lv - 1) * 50; }
    return { lv, cur: rest, need };
  }
  const level = () => levelInfo(S.xp).lv;
  function titleFor(lv) {
    let t = TITLES[0][1];
    TITLES.forEach(([l, name]) => { if (lv >= l) t = name; });
    return t;
  }
  const isUnlocked = (m) => level() >= m.unlock;

  function addXp(n) {
    const before = level();
    S.xp += n;
    const after = level();
    for (let lv = before + 1; lv <= after; lv++) {
      S.coins += 200;
      S.tickets += 1;
      const unlocked = MACHINES.filter((m) => m.unlock === lv);
      afterModal(() => showLevelUp(lv, unlocked));
    }
  }

  /* ---------------- 本日のおすすめ ---------------- */

  function featuredId() {
    const t = today();
    let h = 0;
    for (const c of t) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return MACHINES[h % MACHINES.length].id;
  }
  function cost(m) {
    return m.id === featuredId() ? Math.round((m.price * 0.8) / 10) * 10 : m.price;
  }

  /* ---------------- サウンド ---------------- */

  const Sound = {
    ctx: null,
    get on() { return S.settings.sound; },
    ensure() {
      if (!this.on) return null;
      try {
        this.ctx ||= new (window.AudioContext || window.webkitAudioContext)();
        if (this.ctx.state === 'suspended') this.ctx.resume();
      } catch (e) { return null; }
      return this.ctx;
    },
    tone(freq, dur, { type = 'sine', vol = 0.15, at = 0, slide = 0 } = {}) {
      const c = this.ensure(); if (!c) return;
      const t = c.currentTime + at;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(c.destination);
      o.start(t); o.stop(t + dur + 0.02);
    },
    noise(dur, vol = 0.2, at = 0) {
      const c = this.ensure(); if (!c) return;
      const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 2400;
      src.buffer = buf; g.gain.value = vol;
      src.connect(f).connect(g).connect(c.destination);
      src.start(c.currentTime + at);
    },
    coin() { this.tone(1320, 0.08, { type: 'square', vol: 0.05 }); this.tone(1980, 0.25, { type: 'square', vol: 0.05, at: 0.07 }); },
    click() { this.noise(0.04, 0.35); this.tone(220, 0.05, { type: 'triangle', vol: 0.1 }); },
    drop() { this.tone(260, 0.18, { vol: 0.3, slide: -150 }); this.tone(200, 0.12, { vol: 0.2, at: 0.22, slide: -80 }); this.tone(190, 0.08, { vol: 0.1, at: 0.36 }); },
    tap() { this.tone(500 + Math.random() * 200, 0.08, { type: 'triangle', vol: 0.15 }); },
    pop() { this.noise(0.08, 0.4); this.tone(700, 0.15, { vol: 0.2, slide: 600 }); },
    fanfare(r) {
      const seqs = {
        N: [523, 659, 784],
        R: [523, 659, 784, 1047],
        SR: [523, 659, 784, 1047, 1319, 1568],
        SE: [392, 523, 659, 784, 1047, 1319, 1568, 2093],
      };
      (seqs[r] || seqs.N).forEach((f, i) => this.tone(f, 0.25, { type: 'triangle', vol: 0.12, at: i * 0.08 }));
    },
    chime() { [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.3, { type: 'sine', vol: 0.12, at: i * 0.09 })); },
  };
  const vib = (p) => { if (S.settings.vib && navigator.vibrate) navigator.vibrate(p); };

  /* ---------------- 演出ユーティリティ ---------------- */

  function toast(html, cls = '') {
    const el = document.createElement('div');
    el.className = `toast ${cls}`;
    el.innerHTML = html;
    $('#toasts').appendChild(el);
    setTimeout(() => el.classList.add('out'), 2600);
    setTimeout(() => el.remove(), 3100);
  }

  function confetti(n = 60) {
    const box = $('#confetti');
    const colors = ['#ff6b8b', '#ffd166', '#06d6a0', '#4cc9f0', '#b388ff', '#ff9f1c'];
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      p.style.left = `${Math.random() * 100}%`;
      p.style.background = rand(colors);
      p.style.animationDelay = `${Math.random() * 0.4}s`;
      p.style.animationDuration = `${1.6 + Math.random() * 1.4}s`;
      p.style.setProperty('--dx', `${(Math.random() - 0.5) * 200}px`);
      p.style.setProperty('--r', `${Math.random() * 720}deg`);
      box.appendChild(p);
      setTimeout(() => p.remove(), 3500);
    }
  }

  function emo(it, cls = '') {
    return `<span class="emo ${it.fx ? `fx-${it.fx}` : ''} ${cls}">${it.emoji}</span>`;
  }

  /* ---------------- モーダル ---------------- */

  const modalQueue = [];
  let modalOpen = false;

  function openModal(html, onMount) {
    $('#modalBody').innerHTML = html;
    $('#modal').classList.remove('hidden');
    modalOpen = true;
    $$('[data-close]', $('#modalBody')).forEach((b) => b.addEventListener('click', closeModal));
    if (onMount) onMount($('#modalBody'));
  }
  function closeModal() {
    $('#modal').classList.add('hidden');
    modalOpen = false;
    flushQueue();
  }
  function afterModal(fn) {
    modalQueue.push(fn);
    flushQueue();
  }
  function flushQueue() {
    if (modalOpen || overlayOpen) return;
    const fn = modalQueue.shift();
    if (fn) fn();
  }
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });

  /* ---------------- 実績 ---------------- */

  function checkAchievements() {
    ACHIEVEMENTS.forEach((a) => {
      if (S.achievements[a.id] || !a.test(S)) return;
      S.achievements[a.id] = new Date().toISOString();
      S.coins += a.reward;
      setTimeout(() => {
        toast(`<b>🏅 実績「${esc(a.name)}」達成！</b><br>🪙 +${fmt(a.reward)}`, 'gold');
        Sound.chime();
      }, 400);
    });
    save();
  }

  /* ---------------- ログインボーナス ---------------- */

  function checkDay() {
    const t = today();
    if (S.daily.date !== t) S.daily = newDaily(t);
    if (S.login.last === t) return;
    const gap = S.login.last ? daysBetween(S.login.last, t) : null;
    S.login.streak = gap === 1 ? S.login.streak + 1 : 1;
    S.login.best = Math.max(S.login.best, S.login.streak);
    S.login.total += 1;
    S.login.last = t;
    const idx = (S.login.streak - 1) % 7;
    const rw = LOGIN_REWARDS[idx];
    S.coins += rw.coins;
    S.tickets += 1 + (rw.tickets || 0);
    save();
    checkAchievements();
    afterModal(() => showLoginBonus(idx, rw));
  }

  function showLoginBonus(idx, rw) {
    const stamps = LOGIN_REWARDS.map((r, i) => `
      <div class="stamp ${i < idx ? 'done' : ''} ${i === idx ? 'today' : ''}">
        <small>${i + 1}日目</small>
        <span>${i < idx ? '💮' : i === 6 ? '🎁' : '🪙'}</span>
        <small>${r.coins}${r.tickets ? `+🎫${r.tickets}` : ''}</small>
      </div>`).join('');
    openModal(`
      <h3 class="center">🌞 ログインボーナス</h3>
      <p class="center big-text">${S.login.streak}日連続ログイン！</p>
      <div class="stamps">${stamps}</div>
      <p class="center reward-line">🪙 +${rw.coins}　🎫 +${1 + (rw.tickets || 0)}</p>
      <p class="center muted">毎日きてくれると、無料チケットがもらえるよ</p>
      <button class="btn primary wide" data-close>うけとる</button>`);
    Sound.chime();
    renderAll();
  }

  function showLevelUp(lv, unlocked) {
    Sound.fanfare('SR');
    confetti(80);
    openModal(`
      <h3 class="center">🎊 レベルアップ！</h3>
      <p class="center lvup">Lv.${lv}</p>
      <p class="center">称号: <b>${esc(titleFor(lv))}</b></p>
      <p class="center reward-line">🪙 +200　🎫 +1</p>
      ${unlocked.map((m) => `<div class="unlock-card" style="--c:${m.color}">${m.icon} 新しいガチャ<br><b>${esc(m.name)}</b> が登場！</div>`).join('')}
      <button class="btn primary wide" data-close>やったー！</button>`);
    renderAll();
  }

  /* ---------------- ガチャマシン描画 ---------------- */

  function shade(hex, pct) {
    const n = parseInt(hex.slice(1), 16);
    const t = pct < 0 ? 0 : 255, p = Math.abs(pct) / 100;
    const ch = (v) => Math.round((t - v) * p + v);
    const r = ch(n >> 16), g = ch((n >> 8) & 255), b = ch(n & 255);
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
  }

  function seeded(str) {
    let h = 2166136261;
    for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
  }

  function capsuleSVG(color, r = 13) {
    const top = color === 'rainbow' ? 'url(#rainbowGrad)' : color === 'gold' ? 'url(#goldGrad)' : color;
    return `<circle r="${r}" fill="#ffffffee" stroke="#00000022"/>
      <path d="M${-r} 0 A${r} ${r} 0 0 1 ${r} 0 Z" fill="${top}"/>
      <line x1="${-r}" y1="0" x2="${r}" y2="0" stroke="#00000030" stroke-width="1.5"/>
      <ellipse cx="${-r * 0.35}" cy="${-r * 0.5}" rx="${r * 0.3}" ry="${r * 0.18}" fill="#fff" opacity=".7"/>`;
  }

  const CX = 120, CY = 110, GR = 84; // 球体
  const HX = 88, HY = 290;           // ハンドル中心

  function machineSVG(m) {
    const c = m.color;
    const rnd = seeded(m.id);
    let caps = '';
    for (let y = 176; y >= 70; y -= 24) {
      const half = Math.sqrt(GR * GR - (y - CY) * (y - CY)) - 14;
      const off = ((176 - y) / 24) % 2 ? 12 : 0;
      for (let x = CX - half + off; x <= CX + half; x += 25) {
        const jx = x + (rnd() - 0.5) * 6, jy = y + (rnd() - 0.5) * 6;
        caps += `<g transform="translate(${jx.toFixed(1)} ${jy.toFixed(1)}) rotate(${Math.floor(rnd() * 360)})">${capsuleSVG(CAPSULE_COLORS[Math.floor(rnd() * CAPSULE_COLORS.length)], 12)}</g>`;
      }
    }
    return `
<svg id="machineSvg" viewBox="0 0 240 365" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ガチャマシン">
  <defs>
    <radialGradient id="glass" cx="35%" cy="28%" r="80%">
      <stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".45" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#cfe9ff" stop-opacity=".35"/>
    </radialGradient>
    <linearGradient id="bodyGrad" x1="0" x2="1">
      <stop offset="0" stop-color="${shade(c, -8)}"/><stop offset=".45" stop-color="${shade(c, 12)}"/><stop offset="1" stop-color="${shade(c, -18)}"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0" x2="1"><stop offset="0" stop-color="#ffe680"/><stop offset=".5" stop-color="#ffbf00"/><stop offset="1" stop-color="#ffdf6b"/></linearGradient>
    <linearGradient id="rainbowGrad" x1="0" x2="1">
      <stop offset="0" stop-color="#ff6b6b"/><stop offset=".25" stop-color="#ffd166"/><stop offset=".5" stop-color="#06d6a0"/><stop offset=".75" stop-color="#4cc9f0"/><stop offset="1" stop-color="#b388ff"/>
    </linearGradient>
    <clipPath id="globeClip"><circle cx="${CX}" cy="${CY}" r="${GR}"/></clipPath>
  </defs>
  <rect x="100" y="12" width="40" height="18" rx="6" fill="${shade(c, -25)}"/>
  <circle cx="${CX}" cy="${CY}" r="${GR + 5}" fill="${shade(c, -25)}"/>
  <circle cx="${CX}" cy="${CY}" r="${GR}" fill="#eef8ff"/>
  <g clip-path="url(#globeClip)"><g id="globeCaps">${caps}</g></g>
  <circle cx="${CX}" cy="${CY}" r="${GR}" fill="url(#glass)"/>
  <path d="M62 78 Q78 44 116 34" stroke="#fff" stroke-width="9" stroke-linecap="round" fill="none" opacity=".75"/>
  <rect x="16" y="188" width="208" height="18" rx="9" fill="${shade(c, -25)}"/>
  <rect x="26" y="200" width="188" height="155" rx="18" fill="url(#bodyGrad)"/>
  <rect x="44" y="216" width="152" height="34" rx="9" fill="#fff"/>
  <text x="120" y="239" text-anchor="middle" font-size="16" font-weight="800" fill="${shade(c, -45)}">${m.icon} ${cost(m)}円</text>
  <rect x="150" y="262" width="44" height="50" rx="9" fill="#ffffffdd"/>
  <rect x="169" y="270" width="6" height="24" rx="3" fill="#555"/>
  <text x="172" y="306" font-size="9" font-weight="800" text-anchor="middle" fill="#777">COIN</text>
  <g id="handleRot" transform="rotate(0 ${HX} ${HY})">
    <circle cx="${HX}" cy="${HY}" r="34" fill="#f6f6f6" stroke="#cfcfcf" stroke-width="3"/>
    <rect x="${HX - 36}" y="${HY - 8}" width="72" height="16" rx="8" fill="#d8d8d8" stroke="#b3b3b3" stroke-width="2"/>
    <circle cx="${HX}" cy="${HY}" r="6" fill="#9a9a9a"/>
  </g>
  <g id="turnArrow" class="turn-arrow">
    <path d="M${HX + 30} ${HY - 40} A44 44 0 0 1 ${HX + 44} ${HY + 4}" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
    <path d="M${HX + 36} ${HY + 2} L${HX + 45} ${HY + 14} L${HX + 52} ${HY}" fill="#fff"/>
  </g>
  <circle id="handleHit" cx="${HX}" cy="${HY}" r="52" fill="transparent"/>
  <rect x="146" y="318" width="54" height="32" rx="12" fill="#3a3a3a"/>
  <rect x="150" y="322" width="46" height="12" rx="6" fill="#222"/>
  <g transform="translate(173 334)"><g id="dropCap" class="drop-cap hidden"></g></g>
</svg>`;
  }

  /* ---------------- ガチャを回す ---------------- */

  const turn = { phase: 'idle', angle: 0, target: 0, dragging: false, lastA: 0, moved: 0, raf: 0 };

  function pickCapsuleColor(it) {
    if (it.rarity === 'SE' && Math.random() < 0.6) return 'rainbow';
    if (it.rarity === 'SR' && Math.random() < 0.5) return 'gold';
    if (it.rarity === 'N' && Math.random() < 0.03) return 'gold'; // たまにフェイク
    return rand(CAPSULE_COLORS);
  }

  function roll(m) {
    const st = mstat(m.id);
    const missing = m.items.filter((it) => !owned(it));
    let pool = m.items;
    let pity = false;
    if (missing.length && st.sinceNew >= PITY - 1) { pool = missing; pity = true; }
    const total = pool.reduce((a, it) => a + RARITY[it.rarity].weight, 0);
    let r = Math.random() * total;
    for (const it of pool) {
      r -= RARITY[it.rarity].weight;
      if (r < 0) return { item: it, pity };
    }
    return { item: pool[pool.length - 1], pity };
  }

  function startPull(useTicket) {
    Sound.ensure();
    if (S.pending) {
      hint(S.pending.dropped ? 'さきにカプセルをあけてね！' : 'ハンドルを回してね！', true);
      return;
    }
    const m = machine(S.selected);
    if (!isUnlocked(m)) return;
    const price = cost(m);
    if (useTicket) {
      if (S.tickets < 1) { toast('🎫 チケットがありません'); return; }
      S.tickets -= 1;
    } else {
      if (S.coins < price) {
        toast('🪙 コインが足りません<br><small>「がまん貯金」やミッションでもらえるよ</small>');
        return;
      }
      S.coins -= price;
    }
    const { item, pity } = roll(m);
    S.pending = { machine: m.id, item: item.id, cap: pickCapsuleColor(item), pity, dropped: false };
    mstat(m.id).pulls += 1;
    S.totalPulls += 1;
    S.daily.pulls += 1;
    save();
    Sound.coin();
    vib(20);
    setPhase('ready');
    renderHeader();
    renderGacha();
    $('#machineWrap').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function setPhase(p) {
    turn.phase = p;
    const wrap = $('#machineWrap');
    wrap.dataset.phase = p;
    if (p === 'ready') {
      turn.angle = 0; turn.target = 0;
      setHandle(0);
      hint('ハンドルを右に回してね ↻ タップでもOK');
    } else if (p === 'dropped') {
      showDropCap();
      hint('カプセルが出てきた！タップしてあけよう 👇');
    } else if (p === 'idle') {
      $('#dropCap')?.classList.add('hidden');
      hint('');
    }
  }

  function hint(text, flash = false) {
    const h = $('#turnHint');
    h.textContent = text;
    if (flash) { h.classList.remove('flash'); void h.offsetWidth; h.classList.add('flash'); }
  }

  function setHandle(a) {
    $('#handleRot')?.setAttribute('transform', `rotate(${a} ${HX} ${HY})`);
  }

  function addAngle(d) {
    if (turn.phase !== 'ready' || d <= 0) return;
    const prev = turn.angle;
    turn.angle = Math.min(360, prev + d);
    setHandle(turn.angle);
    if (Math.floor(turn.angle / 90) > Math.floor(prev / 90)) {
      Sound.click();
      vib(15);
      const g = $('#globeCaps');
      g.classList.remove('shake'); void g.getBBox(); g.classList.add('shake');
    }
    if (turn.angle >= 360) finishTurn();
  }

  function animateTo() {
    cancelAnimationFrame(turn.raf);
    let last = performance.now();
    const step = (now) => {
      const dt = now - last; last = now;
      if (turn.phase !== 'ready') return;
      const d = Math.min(turn.target - turn.angle, dt * 0.6);
      if (d > 0) addAngle(d);
      if (turn.phase === 'ready' && turn.angle < turn.target) turn.raf = requestAnimationFrame(step);
    };
    turn.raf = requestAnimationFrame(step);
  }

  function finishTurn() {
    turn.phase = 'dropping';
    turn.dragging = false;
    cancelAnimationFrame(turn.raf);
    setHandle(0);
    S.pending.dropped = true;
    save();
    setTimeout(() => { Sound.drop(); vib([30, 40, 20]); setPhase('dropped'); }, 250);
  }

  function showDropCap() {
    const dc = $('#dropCap');
    if (!dc || !S.pending) return;
    dc.innerHTML = capsuleSVG(S.pending.cap, 14);
    dc.classList.remove('hidden', 'fall');
    void dc.getBBox();
    dc.classList.add('fall');
  }

  function pointerAngle(e) {
    const svg = $('#machineSvg');
    const pt = svg.createSVGPoint();
    pt.x = HX; pt.y = HY;
    const c = pt.matrixTransform(svg.getScreenCTM());
    return Math.atan2(e.clientY - c.y, e.clientX - c.x);
  }

  function bindMachine() {
    const hit = $('#handleHit');
    hit.addEventListener('pointerdown', (e) => {
      Sound.ensure();
      if (turn.phase === 'idle') {
        hint('まずは下のボタンでコインを入れてね 🪙', true);
        $('#btnCoin').classList.remove('nudge'); void $('#btnCoin').offsetWidth; $('#btnCoin').classList.add('nudge');
        return;
      }
      if (turn.phase !== 'ready') return;
      e.preventDefault();
      hit.setPointerCapture(e.pointerId);
      turn.dragging = true;
      turn.lastA = pointerAngle(e);
      turn.moved = 0;
    });
    hit.addEventListener('pointermove', (e) => {
      if (!turn.dragging) return;
      const a = pointerAngle(e);
      let d = a - turn.lastA;
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      turn.lastA = a;
      turn.moved += Math.abs(d);
      if (d > 0) {
        addAngle((d * 180) / Math.PI);
        turn.target = Math.max(turn.target, turn.angle);
      }
    });
    const up = () => {
      if (!turn.dragging) return;
      turn.dragging = false;
      if (turn.moved < 0.15 && turn.phase === 'ready') {
        turn.target = Math.min(360, (Math.floor(Math.max(turn.angle, turn.target) / 90) + 1) * 90);
        animateTo();
      }
    };
    hit.addEventListener('pointerup', up);
    hit.addEventListener('pointercancel', up);
    hit.addEventListener('lostpointercapture', up);

    $('#dropCap').addEventListener('click', () => {
      if (turn.phase === 'dropped' && S.pending) openPending();
    });
  }

  /* ---------------- カプセルを開ける ---------------- */

  let overlayOpen = false;

  function openPending() {
    const p = S.pending;
    const it = ITEMS[p.item];
    if (!it) { S.pending = null; save(); setPhase('idle'); renderGacha(); return; }
    $('#dropCap').classList.add('hidden');
    showCapsule(it, p.cap, () => {
      S.pending = null;
      const res = grantItem(it);
      setPhase('idle');
      return { ...res, pity: p.pity, again: true };
    });
  }

  function grantItem(it) {
    const isNew = !owned(it);
    const st = mstat(it.machine);
    S.collection[it.id] = (S.collection[it.id] || 0) + 1;
    let shards = 0;
    if (isNew) {
      S.obtainedAt[it.id] = new Date().toISOString();
      S.daily.newItems += 1;
      st.sinceNew = 0;
    } else {
      shards = RARITY[it.rarity].shards;
      S.shards += shards;
      st.sinceNew += 1;
    }
    save();
    addXp(10 + (isNew ? 15 : 0) + RARITY[it.rarity].xp);
    checkAchievements();
    return { isNew, shards };
  }

  function showCapsule(it, capColor, onReveal) {
    overlayOpen = true;
    const ov = $('#openOverlay');
    const cap = $('#bigCap');
    const r = it.rarity;
    let taps = r === 'N' ? (Math.random() < 0.25 ? 2 : 1) : r === 'R' ? (Math.random() < 0.5 ? 2 : 1) : 3;
    cap.className = 'big-cap';
    cap.style.setProperty('--cap', capColor === 'gold' ? 'linear-gradient(90deg,#ffe680,#ffbf00,#ffdf6b)'
      : capColor === 'rainbow' ? 'linear-gradient(90deg,#ff6b6b,#ffd166,#06d6a0,#4cc9f0,#b388ff)' : capColor);
    $('#peek').innerHTML = it.emoji;
    $('#rays').className = 'rays';
    $('#result').classList.add('hidden');
    $('#openHint').classList.remove('hidden');
    $('#openHint').textContent = 'タップしてあけよう！';
    ov.classList.remove('hidden');
    requestAnimationFrame(() => cap.classList.add('enter'));
    let tapCount = 0;
    let done = false;

    const onTap = () => {
      if (done) return;
      tapCount++;
      cap.classList.remove('wiggle', 'wiggle2', 'wiggle3');
      void cap.offsetWidth;
      if (tapCount < taps) {
        cap.classList.add(tapCount === 1 ? 'wiggle2' : 'wiggle3');
        Sound.tap();
        vib(25 * tapCount);
        if (tapCount === 2 && (r === 'SR' || r === 'SE')) {
          cap.classList.add(r === 'SE' ? 'glow-rainbow' : 'glow-gold');
          $('#openHint').textContent = 'な、なにか光ってる…!?';
        } else {
          $('#openHint').textContent = 'もうちょっと…！';
        }
        return;
      }
      done = true;
      cap.removeEventListener('click', onTap);
      cap.classList.add('opened');
      $('#openHint').classList.add('hidden');
      Sound.pop();
      vib(r === 'N' ? 30 : [40, 60, 40, 60, 80]);
      const res = onReveal();
      setTimeout(() => showResult(it, res), 380);
    };
    cap.addEventListener('click', onTap);
  }

  function showResult(it, res) {
    const r = it.rarity;
    const m = machine(it.machine);
    $('#rays').className = `rays on r-${r}`;
    Sound.fanfare(r);
    if (res.isNew && r !== 'N') confetti(r === 'SE' ? 140 : r === 'SR' ? 90 : 40);
    else if (res.isNew) confetti(25);
    const price = cost(m);
    const canAgain = res.again && S.coins >= price && isUnlocked(m);
    const box = $('#result');
    box.innerHTML = `
      <div class="res-card r-${r}">
        <span class="badge r-${r}">${RARITY[r].label}</span>
        <div class="res-emo">${emo(it)}</div>
        ${res.isNew ? '<div class="new-badge">NEW!</div>' : `<div class="dup">かぶっちゃった… 💎 かけら +${res.shards}</div>`}
        <h3>${esc(it.name)}</h3>
        <p class="desc">${esc(it.desc)}</p>
        ${res.pity ? '<p class="pity-msg">🛟 天井ボーナス発動！</p>' : ''}
        <p class="muted">${esc(m.name)} ${ownedIn(S, m.items)}/${m.items.length}</p>
      </div>
      <div class="res-buttons">
        ${res.again ? `<button class="btn primary" id="resAgain" ${canAgain ? '' : 'disabled'}>もう1回 🪙${price}</button>` : ''}
        <button class="btn" id="resClose">とじる</button>
      </div>`;
    box.classList.remove('hidden');
    $('#resClose').addEventListener('click', closeOverlay);
    $('#resAgain')?.addEventListener('click', () => { closeOverlay(); startPull(false); });
    renderAll();
  }

  function closeOverlay() {
    $('#openOverlay').classList.add('hidden');
    overlayOpen = false;
    renderAll();
    flushQueue();
  }

  /* ---------------- 描画: ヘッダー ---------------- */

  function renderHeader() {
    const li = levelInfo(S.xp);
    $('#lvNum').textContent = `Lv.${li.lv}`;
    $('#lvTitle').textContent = titleFor(li.lv);
    $('#xpFill').style.width = `${(li.cur / li.need) * 100}%`;
    $('#coins').textContent = fmt(S.coins);
    $('#tickets').textContent = fmt(S.tickets);
    $('#shards').textContent = fmt(S.shards);
    $('#missionDot').classList.toggle('hidden', !hasClaimable());
  }

  /* ---------------- 描画: ガチャ ---------------- */

  let renderedMachine = null;

  function renderGacha() {
    const m = machine(S.selected);
    const fid = featuredId();
    $('#machinePicker').innerHTML = MACHINES.map((x) => {
      const lock = !isUnlocked(x);
      return `<button class="pick ${x.id === m.id ? 'active' : ''} ${lock ? 'locked' : ''}" data-id="${x.id}" style="--c:${x.color}">
        <span class="pick-icon">${lock ? '🔒' : x.icon}</span>
        <span class="pick-name">${lock ? `Lv.${x.unlock}で解放` : esc(x.name)}</span>
        <span class="pick-prog">${lock ? '' : `${ownedIn(S, x.items)}/${x.items.length}`}</span>
        ${x.id === fid && !lock ? '<span class="pick-sale">SALE</span>' : ''}
      </button>`;
    }).join('');

    $('#machineName').textContent = m.name;
    $('#featuredBadge').classList.toggle('hidden', m.id !== fid);
    const key = `${m.id}:${cost(m)}`;
    if (renderedMachine !== key) {
      $('#machineWrap').innerHTML = machineSVG(m);
      $('#machineWrap').style.setProperty('--c', m.color);
      renderedMachine = key;
      bindMachine();
      if (S.pending) setPhase(S.pending.dropped ? 'dropped' : 'ready');
      else setPhase('idle');
    }
    document.documentElement.style.setProperty('--machine', m.color);

    const st = mstat(m.id);
    const got = ownedIn(S, m.items);
    const complete = got === m.items.length;
    const left = PITY - st.sinceNew;
    $('#machineInfo').innerHTML = `
      <div class="info-chip">📖 ${got}/${m.items.length} ${complete ? '🎉コンプ！' : ''}</div>
      ${complete ? '' : `<div class="info-chip ${left <= 1 ? 'hot' : ''}">🛟 ${left <= 1 ? '次はNEW確定！' : `あと${left}回以内にNEW確定`}</div>`}
      <div class="info-chip">🔄 ${st.pulls}回</div>`;

    const price = cost(m);
    const busy = !!S.pending;
    $('#btnCoin').innerHTML = busy ? (S.pending.dropped ? '👇 カプセルをあけよう' : '↻ ハンドルを回そう') : `🪙 ${fmt(price)} でまわす`;
    $('#btnCoin').disabled = !busy && S.coins < price;
    $('#btnTicket').innerHTML = `🎫 無料 <small>×${S.tickets}</small>`;
    $('#btnTicket').disabled = busy || S.tickets < 1;

    const totalW = m.items.reduce((a, it) => a + RARITY[it.rarity].weight, 0);
    $('#lineup').innerHTML = `<summary>ラインナップと出やすさ</summary>
      <div class="lineup-grid">${m.items.map((it) => {
        const p = ((RARITY[it.rarity].weight / totalW) * 100).toFixed(1);
        const show = it.rarity !== 'SE' || owned(it);
        return `<div class="lu ${owned(it) ? '' : 'unowned'}">
          <span class="lu-emo">${show ? emo(it) : '❔'}</span>
          <span class="lu-name">${show ? esc(it.name) : 'シークレット'}</span>
          <span class="badge r-${it.rarity}">${RARITY[it.rarity].short}</span>
          <span class="lu-p">${p}%</span></div>`;
      }).join('')}</div>`;

    renderInstallTip();
  }

  $('#machinePicker').addEventListener('click', (e) => {
    const b = e.target.closest('.pick');
    if (!b) return;
    const m = machine(b.dataset.id);
    if (!isUnlocked(m)) { toast(`🔒 Lv.${m.unlock} になると遊べるよ`); return; }
    if (S.pending && S.pending.machine !== m.id) { toast('さきにカプセルをあけてね！'); return; }
    S.selected = m.id;
    save();
    renderGacha();
  });
  $('#btnCoin').addEventListener('click', () => startPull(false));
  $('#btnTicket').addEventListener('click', () => startPull(true));

  function renderInstallTip() {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    const box = $('#installTip');
    if (standalone || S.tipDismissed) { box.innerHTML = ''; return; }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    box.innerHTML = `<div class="tip">📲 ${ios ? '共有ボタン →「ホーム画面に追加」' : 'メニュー →「ホーム画面に追加」'}でアプリのように使えます
      <button class="tip-x" aria-label="とじる">×</button></div>`;
    $('.tip-x', box).addEventListener('click', () => { S.tipDismissed = true; save(); renderInstallTip(); });
  }

  /* ---------------- 描画: ずかん ---------------- */

  function renderZukan() {
    const all = allItems();
    const got = ownedIn(S, all);
    const html = MACHINES.map((m) => {
      if (!isUnlocked(m)) {
        return `<div class="zk-sec locked"><h3>🔒 ？？？</h3><p class="muted">Lv.${m.unlock} で解放されます</p></div>`;
      }
      const g = ownedIn(S, m.items);
      return `<div class="zk-sec" style="--c:${m.color}">
        <h3>${m.icon} ${esc(m.name)} <small>${g}/${m.items.length}</small></h3>
        <div class="bar"><i style="width:${(g / m.items.length) * 100}%"></i></div>
        <div class="zk-grid">${m.items.map((it) => {
          const n = S.collection[it.id] || 0;
          const secretHidden = !n && it.rarity === 'SE';
          return `<button class="zk-item r-${it.rarity} ${n ? '' : 'unowned'}" data-id="${it.id}">
            ${secretHidden ? '<span class="emo">❔</span>' : emo(it)}
            ${n > 1 ? `<span class="cnt">×${n}</span>` : ''}
          </button>`;
        }).join('')}</div></div>`;
    }).join('');
    $('#tab-zukan').innerHTML = `
      <div class="card hero">
        <div class="hero-row"><div><small>コレクション</small><div class="hero-num">${got}<small> / ${all.length}</small></div></div>
        <div class="ring" style="--p:${(got / all.length) * 100}"><span>${Math.floor((got / all.length) * 100)}%</span></div></div>
        <p class="muted">かぶったアイテムは 💎かけら になります。かけらがたまったら、まだ持っていないアイテムと交換できるよ（${S.shards}こ所持）</p>
      </div>${html}`;
  }

  $('#tab-zukan').addEventListener('click', (e) => {
    const b = e.target.closest('.zk-item');
    if (b) showItemDetail(ITEMS[b.dataset.id]);
  });

  function showItemDetail(it) {
    const n = S.collection[it.id] || 0;
    const hidden = !n && it.rarity === 'SE';
    const price = RARITY[it.rarity].cost;
    openModal(`
      <div class="detail r-${it.rarity}">
        <span class="badge r-${it.rarity}">${RARITY[it.rarity].label}</span>
        <div class="res-emo ${n ? '' : 'sil'}">${hidden ? '<span class="emo">❔</span>' : emo(it)}</div>
        <h3>${hidden ? '？？？' : esc(it.name)}</h3>
        ${n ? `<p class="desc">${esc(it.desc)}</p>
          <p class="muted">所持数 ${n}こ ・ はじめて出会った日 ${S.obtainedAt[it.id] ? fmtDate(S.obtainedAt[it.id]) : '-'}</p>`
          : `<p class="muted">まだ出会っていません</p>
          <button class="btn primary wide" id="exBtn" ${S.shards >= price ? '' : 'disabled'}>💎 ${price} で交換する</button>
          <p class="muted small">所持 💎${S.shards}</p>`}
        <button class="btn wide" data-close>とじる</button>
      </div>`, (root) => {
      $('#exBtn', root)?.addEventListener('click', () => {
        if (S.shards < price) return;
        S.shards -= price;
        save();
        closeModal();
        showCapsule(it, it.rarity === 'SE' ? 'rainbow' : it.rarity === 'SR' ? 'gold' : rand(CAPSULE_COLORS), () => grantItem(it));
      });
    });
  }

  /* ---------------- 描画: がまん貯金 ---------------- */

  function monthKey(iso) { const d = new Date(iso); return `${d.getFullYear()}-${d.getMonth() + 1}`; }

  function renderSave() {
    const total = savedTotal(S);
    const now = new Date();
    const thisMonth = S.savings.filter((x) => monthKey(x.date) === `${now.getFullYear()}-${now.getMonth() + 1}`);
    const monthSum = thisMonth.reduce((a, x) => a + x.amount, 0);

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = `${d.getFullYear()}-${d.getMonth() + 1}`;
      months.push({ label: `${d.getMonth() + 1}月`, sum: S.savings.filter((x) => monthKey(x.date) === k).reduce((a, x) => a + x.amount, 0) });
    }
    const maxM = Math.max(1, ...months.map((x) => x.sum));

    let goalHtml;
    if (S.goal) {
      const prog = Math.max(0, total - S.goal.base);
      const pct = Math.min(100, (prog / S.goal.amount) * 100);
      goalHtml = `<div class="card goal">
        <div class="goal-head"><span>🎁 ご褒美目標</span><button class="link" id="goalEdit">変更</button></div>
        <h3>${esc(S.goal.name)}</h3>
        <div class="bar big"><i style="width:${pct}%"></i></div>
        <p class="goal-nums"><b>${fmt(prog)}円</b> / ${fmt(S.goal.amount)}円 ${pct >= 100 ? '' : `<span class="muted">あと${fmt(S.goal.amount - prog)}円</span>`}</p>
        ${pct >= 100 ? '<p class="center">🎉 目標たっせい！リアルでご褒美を買っちゃおう！</p><button class="btn primary wide" id="goalDone">ご褒美を買った！次の目標へ</button>' : ''}
      </div>`;
    } else {
      goalHtml = `<div class="card goal">
        <div class="goal-head"><span>🎁 ご褒美目標</span></div>
        <p class="muted">がまんしたお金で、本当にほしいものを買おう。</p>
        <input id="goalName" placeholder="ほしいもの（例: カフェでケーキ）" maxlength="30">
        <input id="goalAmount" type="number" inputmode="numeric" placeholder="金額（円）" min="100" step="100">
        <button class="btn primary wide" id="goalSet">目標をきめる</button>
      </div>`;
    }

    const hist = S.savings.slice(0, 50).map((x) => `
      <li><span class="h-date">${fmtDate(x.date)}</span><span class="h-note">${esc(x.note || 'リアルガチャ')}</span>
      <b>${fmt(x.amount)}円</b><button class="h-del" data-id="${x.id}" aria-label="けす">×</button></li>`).join('');

    $('#tab-save').innerHTML = `
      <div class="card hero pig">
        <small>これまでの がまん貯金</small>
        <div class="hero-num">${fmt(total)}<small>円</small></div>
        <p class="muted">今月 ${fmt(monthSum)}円（${thisMonth.length}回）・ 合計 ${S.savings.length}回がまん</p>
      </div>
      <div class="card">
        <h3>💪 リアルガチャをがまんした！</h3>
        <p class="muted small">がまんした金額と同じだけ 🪙コイン がもらえます</p>
        <div class="amount-grid">
          ${[200, 300, 400, 500].map((a) => `<button class="btn amount" data-amt="${a}">${a}円</button>`).join('')}
          <button class="btn amount" data-amt="custom">その他</button>
        </div>
        <input id="saveNote" placeholder="メモ（例: 駅前のねこガチャ）" maxlength="30">
      </div>
      ${goalHtml}
      <div class="card">
        <h3>📊 月ごとのがまん</h3>
        <div class="chart">${months.map((x) => `<div class="col"><span class="val">${x.sum ? fmt(x.sum) : ''}</span><i style="height:${(x.sum / maxM) * 100}%"></i><small>${x.label}</small></div>`).join('')}</div>
      </div>
      ${S.goalsDone.length ? `<div class="card"><h3>🏆 かなえたご褒美</h3><ul class="done-list">${S.goalsDone.map((g) => `<li>🎁 ${esc(g.name)} <span class="muted">${fmt(g.amount)}円</span></li>`).join('')}</ul></div>` : ''}
      <div class="card"><h3>📝 りれき</h3>${hist ? `<ul class="history">${hist}</ul>` : '<p class="muted">まだ記録がありません</p>'}</div>`;
  }

  $('#tab-save').addEventListener('click', (e) => {
    const amt = e.target.closest('[data-amt]');
    if (amt) {
      let a = amt.dataset.amt;
      if (a === 'custom') {
        const v = prompt('がまんした金額（円）を入力してね', '300');
        if (v === null) return;
        a = parseInt(String(v).replace(/[^\d]/g, ''), 10);
        if (!a || a < 1 || a > 100000) { toast('金額を正しく入力してね'); return; }
      }
      recordSave(Number(a), $('#saveNote').value.trim());
      return;
    }
    const del = e.target.closest('.h-del');
    if (del) {
      const rec = S.savings.find((x) => x.id === del.dataset.id);
      if (rec && confirm(`${fmt(rec.amount)}円の記録をけしますか？\n（もらったコインも ${fmt(rec.amount)} へります）`)) {
        S.savings = S.savings.filter((x) => x !== rec);
        S.coins = Math.max(0, S.coins - rec.amount);
        save();
        renderAll();
      }
      return;
    }
    if (e.target.id === 'goalSet') {
      const name = $('#goalName').value.trim();
      const amount = parseInt($('#goalAmount').value, 10);
      if (!name || !amount || amount < 100) { toast('ほしいものと金額（100円以上）を入れてね'); return; }
      S.goal = { name, amount, base: savedTotal(S), createdAt: new Date().toISOString() };
      save();
      renderSave();
      toast(`🎁 目標「${esc(name)}」スタート！`);
    }
    if (e.target.id === 'goalEdit') {
      openModal(`<h3>🎁 目標を変更</h3>
        <input id="gName" value="${esc(S.goal.name)}" maxlength="30">
        <input id="gAmt" type="number" inputmode="numeric" value="${S.goal.amount}">
        <button class="btn primary wide" id="gSave">保存</button>
        <button class="btn wide danger" id="gDel">目標をやめる</button>
        <button class="btn wide" data-close>キャンセル</button>`, (root) => {
        $('#gSave', root).addEventListener('click', () => {
          const n = $('#gName', root).value.trim(), a = parseInt($('#gAmt', root).value, 10);
          if (!n || !a || a < 100) { toast('ほしいものと金額（100円以上）を入れてね'); return; }
          S.goal.name = n; S.goal.amount = a; save(); closeModal(); renderAll(); checkGoal();
        });
        $('#gDel', root).addEventListener('click', () => { S.goal = null; save(); closeModal(); renderAll(); });
      });
    }
    if (e.target.id === 'goalDone') {
      S.goalsDone.unshift({ name: S.goal.name, amount: S.goal.amount, doneAt: new Date().toISOString() });
      S.goal = null;
      save();
      confetti(100);
      Sound.fanfare('SE');
      renderAll();
    }
  });

  function recordSave(amount, note) {
    Sound.ensure();
    S.savings.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, amount, note, date: new Date().toISOString() });
    S.coins += amount;
    S.daily.saves += 1;
    save();
    Sound.coin();
    setTimeout(() => Sound.chime(), 150);
    vib([20, 40, 20]);
    confetti(40);
    $('#saveNote') && ($('#saveNote').value = '');
    checkAchievements();
    renderAll();
    openModal(`
      <div class="center praise">
        <div class="praise-emo">🐷💕</div>
        <h3>${esc(rand(PRAISES))}</h3>
        <p class="reward-line">がまん貯金 +${fmt(amount)}円<br>🪙 コイン +${fmt(amount)}</p>
        <p class="muted">がまん貯金の合計: <b>${fmt(savedTotal(S))}円</b></p>
        <button class="btn primary wide" id="goGacha">さっそく回しにいく 🎰</button>
        <button class="btn wide" data-close>とじる</button>
      </div>`, (root) => {
      $('#goGacha', root).addEventListener('click', () => { closeModal(); switchTab('gacha'); });
    });
    checkGoal();
  }

  function checkGoal() {
    if (!S.goal || S.goal.doneAt) return;
    if (savedTotal(S) - S.goal.base >= S.goal.amount) {
      S.goal.doneAt = new Date().toISOString();
      save();
      checkAchievements();
      afterModal(() => {
        confetti(120);
        Sound.fanfare('SE');
        openModal(`<div class="center"><div class="praise-emo">🏆</div><h3>ご褒美目標たっせい！</h3>
          <p>「${esc(S.goal.name)}」の分（${fmt(S.goal.amount)}円）を<br>がまんでためました！</p>
          <p class="muted">リアルで買って、自分をたっぷりほめてあげてね💐</p>
          <button class="btn primary wide" data-close>やったー！</button></div>`);
      });
    }
  }

  /* ---------------- 描画: ミッション ---------------- */

  function missionProgress(ms) { return Math.min(ms.goal, S.daily[ms.key] || 0); }
  function hasClaimable() {
    const anyMission = DAILY_MISSIONS.some((ms) => !S.daily.claimed[ms.id] && missionProgress(ms) >= ms.goal);
    const allClaimed = DAILY_MISSIONS.every((ms) => S.daily.claimed[ms.id]);
    return anyMission || (allClaimed && !S.daily.allClear);
  }

  function renderMission() {
    const li = levelInfo(S.xp);
    const next = MACHINES.find((m) => m.unlock > li.lv);
    const allClaimed = DAILY_MISSIONS.every((ms) => S.daily.claimed[ms.id]);
    const idx = (Math.max(1, S.login.streak) - 1) % 7;
    const unlockedCount = Object.keys(S.achievements).length;

    $('#tab-mission').innerHTML = `
      <div class="card level-card">
        <div class="hero-row">
          <div><small>いまの称号</small><h3>${esc(titleFor(li.lv))}</h3>
          <p class="muted">Lv.${li.lv} ・ つぎまで ${li.need - li.cur} XP</p></div>
          <div class="lv-big">Lv<b>${li.lv}</b></div>
        </div>
        <div class="bar"><i style="width:${(li.cur / li.need) * 100}%"></i></div>
        ${next ? `<p class="muted small">Lv.${next.unlock} で「${esc(next.name)}」が登場！</p>` : ''}
      </div>
      <div class="card">
        <h3>🔥 ${S.login.streak}日連続ログイン <small class="muted">（最高 ${S.login.best}日）</small></h3>
        <div class="stamps small">${LOGIN_REWARDS.map((r, i) => `<div class="stamp ${i <= idx ? 'done' : ''}"><small>${i + 1}</small><span>${i <= idx ? '💮' : i === 6 ? '🎁' : '🪙'}</span></div>`).join('')}</div>
      </div>
      <div class="card">
        <h3>📋 きょうのミッション</h3>
        <ul class="missions">${DAILY_MISSIONS.map((ms) => {
          const p = missionProgress(ms);
          const claimed = S.daily.claimed[ms.id];
          return `<li class="${claimed ? 'claimed' : ''}">
            <span class="m-icon">${ms.icon}</span>
            <div class="m-body"><span>${ms.label}</span><div class="bar"><i style="width:${(p / ms.goal) * 100}%"></i></div></div>
            ${claimed ? '<span class="m-done">✅</span>'
              : `<button class="btn mini ${p >= ms.goal ? 'primary' : ''}" data-claim="${ms.id}" ${p >= ms.goal ? '' : 'disabled'}>${p >= ms.goal ? `🪙${ms.reward}` : `${p}/${ms.goal}`}</button>`}
          </li>`;
        }).join('')}</ul>
        <div class="allclear ${allClaimed ? 'ready' : ''}">
          <span>🌈 ぜんぶクリアボーナス 🪙${ALL_CLEAR_BONUS.coins} + 🎫${ALL_CLEAR_BONUS.tickets}</span>
          ${S.daily.allClear ? '<span>✅</span>' : `<button class="btn mini ${allClaimed ? 'primary' : ''}" id="allClear" ${allClaimed ? '' : 'disabled'}>うけとる</button>`}
        </div>
      </div>
      <div class="card">
        <h3>🏅 実績 <small class="muted">${unlockedCount}/${ACHIEVEMENTS.length}</small></h3>
        <div class="ach-grid">${ACHIEVEMENTS.map((a) => {
          const got = S.achievements[a.id];
          return `<div class="ach ${got ? 'got' : ''}"><span class="ach-icon">${got ? a.icon : '🔒'}</span>
            <b>${esc(a.name)}</b><small>${esc(a.desc)}</small><small class="ach-rw">🪙${fmt(a.reward)}</small></div>`;
        }).join('')}</div>
      </div>`;
  }

  $('#tab-mission').addEventListener('click', (e) => {
    const c = e.target.closest('[data-claim]');
    if (c) {
      const ms = DAILY_MISSIONS.find((x) => x.id === c.dataset.claim);
      if (!ms || S.daily.claimed[ms.id] || missionProgress(ms) < ms.goal) return;
      S.daily.claimed[ms.id] = true;
      S.coins += ms.reward;
      save();
      Sound.coin();
      toast(`📋 ミッション達成！ 🪙 +${ms.reward}`);
      renderAll();
      return;
    }
    if (e.target.id === 'allClear') {
      if (S.daily.allClear || !DAILY_MISSIONS.every((ms) => S.daily.claimed[ms.id])) return;
      S.daily.allClear = true;
      S.coins += ALL_CLEAR_BONUS.coins;
      S.tickets += ALL_CLEAR_BONUS.tickets;
      save();
      Sound.fanfare('R');
      confetti(60);
      toast(`🌈 ぜんぶクリア！ 🪙 +${ALL_CLEAR_BONUS.coins} 🎫 +${ALL_CLEAR_BONUS.tickets}`, 'gold');
      renderAll();
    }
  });

  /* ---------------- 設定 ---------------- */

  function encodeBackup() { return btoa(unescape(encodeURIComponent(JSON.stringify(S)))); }
  function decodeBackup(str) { return JSON.parse(decodeURIComponent(escape(atob(str.trim())))); }

  function showSettings() {
    openModal(`
      <h3>⚙️ せってい</h3>
      <label class="switch"><input type="checkbox" id="setSound" ${S.settings.sound ? 'checked' : ''}> 🔊 サウンド</label>
      <label class="switch"><input type="checkbox" id="setVib" ${S.settings.vib ? 'checked' : ''}> 📳 バイブレーション（Android）</label>
      <h4>💾 バックアップ</h4>
      <p class="muted small">データはこの端末の中だけに保存されています。機種変更のときは「コピー」した文字をメモなどに保存して、新しい端末で「読みこむ」してください。</p>
      <div class="row2"><button class="btn" id="bkCopy">コピー</button><button class="btn" id="bkLoad">読みこむ</button></div>
      <textarea id="bkText" rows="3" placeholder="ここにバックアップの文字をはりつけ"></textarea>
      <h4>📖 あそびかた</h4>
      <ul class="howto">
        <li>🐷 本物のガチャガチャをがまんしたら「がまん貯金」に記録 → 同じ金額の🪙コインがもらえる</li>
        <li>🎰 コインを入れてハンドルを回し、カプセルをタップしてあけよう</li>
        <li>🛟 ${PITY}回つづけてかぶると、次は必ずNEWが出る</li>
        <li>💎 かぶりは「かけら」に。ずかんから欲しいものと交換できる</li>
        <li>🎁 ご褒美目標をきめると、がまんしたお金で本物のご褒美が買える</li>
      </ul>
      <button class="btn wide danger" id="resetAll">データをぜんぶ消す</button>
      <button class="btn primary wide" data-close>とじる</button>`, (root) => {
      $('#setSound', root).addEventListener('change', (e) => { S.settings.sound = e.target.checked; save(); });
      $('#setVib', root).addEventListener('change', (e) => { S.settings.vib = e.target.checked; save(); });
      $('#bkCopy', root).addEventListener('click', async () => {
        const code = encodeBackup();
        $('#bkText', root).value = code;
        try { await navigator.clipboard.writeText(code); toast('📋 コピーしました'); } catch (e) { $('#bkText', root).select(); toast('文字を長押ししてコピーしてね'); }
      });
      $('#bkLoad', root).addEventListener('click', () => {
        try {
          const d = decodeBackup($('#bkText', root).value);
          if (typeof d.coins !== 'number' || typeof d.collection !== 'object') throw new Error('bad');
          if (!confirm('いまのデータを上書きして読みこみますか？')) return;
          localStorage.setItem(KEY, JSON.stringify(d));
          location.reload();
        } catch (e) { toast('読みこめませんでした。文字をたしかめてね'); }
      });
      $('#resetAll', root).addEventListener('click', () => {
        if (!confirm('本当にすべてのデータを消しますか？')) return;
        if (!confirm('ずかんも、がまん貯金の記録も消えます。よろしいですか？')) return;
        localStorage.removeItem(KEY);
        location.reload();
      });
    });
  }
  $('#settingsBtn').addEventListener('click', showSettings);
  $('#lvBtn').addEventListener('click', () => switchTab('mission'));

  /* ---------------- タブ ---------------- */

  let currentTab = 'gacha';
  function switchTab(t) {
    currentTab = t;
    $$('.tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.tab === t));
    $$('.tab').forEach((s) => s.classList.toggle('active', s.id === `tab-${t}`));
    if (t === 'zukan' && !S.daily.opened) { S.daily.opened = 1; save(); }
    renderAll();
    window.scrollTo({ top: 0 });
  }
  $$('.tabbar button').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));

  function renderAll() {
    renderHeader();
    if (currentTab === 'gacha') renderGacha();
    if (currentTab === 'zukan') renderZukan();
    if (currentTab === 'save') renderSave();
    if (currentTab === 'mission') renderMission();
  }

  // iPhone Safari は user-scalable=no を無視するので、ピンチ拡大はここで止める
  // （ダブルタップ拡大は CSS の touch-action: manipulation で止めている）
  document.addEventListener('gesturestart', (e) => e.preventDefault());

  /* ---------------- 起動 ---------------- */

  checkDay();
  checkAchievements();
  renderAll();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const before = S.daily.date;
      checkDay();
      if (before !== S.daily.date) renderAll();
    }
  });

  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  window.__gacha = { get state() { return S; } }; // デバッグ用
})();
