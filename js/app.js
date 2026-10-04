/* ガチャモン — アプリ本体 */
(() => {
  'use strict';

  const KEY_V1 = 'pocket-gacha-v1';
  const KEY = 'pocket-gacha-v2';
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
  const monthOf = (iso) => { const d = new Date(iso); return `${d.getFullYear()}-${d.getMonth() + 1}`; };
  const thisMonth = () => monthOf(new Date().toISOString());

  /* ---------------- 状態 ---------------- */

  function defaultState() {
    return {
      v: 2,
      tickets: 5,
      xp: 0,
      totalPulls: 0,
      collection: {},
      obtainedAt: {},
      machineStats: {},
      pending: null,
      prizes: [],      // { id, prize, won, usedAt }
      gaman: [],       // { id, note, date, status: pending|ok|ng|legacy|gift, tickets, msg, decidedAt }
      gifts: {},       // 受けとったプレゼントのID
      admin: null,     // { pub, name, fp, pairedAt }
      login: { last: null, streak: 0, best: 0, total: 0 },
      achievements: {},
      selected: MACHINES[0].id,
      settings: { sound: true, vib: true },
      tipDismissed: false,
      createdAt: new Date().toISOString(),
    };
  }

  // 旧バージョン（コイン制）のデータを引きつぐ
  function migrateV1(o) {
    const s = defaultState();
    s.tickets = (o.tickets || 0) + Math.floor((o.coins || 0) / 300);
    ['xp', 'totalPulls', 'collection', 'obtainedAt', 'machineStats', 'selected', 'settings', 'tipDismissed', 'createdAt'].forEach((k) => {
      if (o[k] !== undefined) s[k] = o[k];
    });
    s.login = { ...s.login, ...o.login };
    Object.keys(o.achievements || {}).forEach((id) => {
      if (ACHIEVEMENTS.some((a) => a.id === id)) s.achievements[id] = o.achievements[id];
    });
    s.gaman = (o.savings || []).map((x) => ({ id: x.id, amount: x.amount, note: x.note, date: x.date, status: 'legacy', tickets: 0 }));
    return s;
  }

  function load() {
    const base = defaultState();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        return { ...base, ...s, settings: { ...base.settings, ...s.settings }, login: { ...base.login, ...s.login } };
      }
      const old = localStorage.getItem(KEY_V1);
      if (old) return migrateV1(JSON.parse(old));
    } catch (e) { /* 壊れたデータは無視 */ }
    return base;
  }

  let S = load();
  if (!MACHINES.some((m) => m.id === S.selected)) S.selected = MACHINES[0].id;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 容量不足など */ }
  }
  save();

  const mstat = (id) => (S.machineStats[id] ||= { pulls: 0, sinceNew: 0 });
  const machine = (id) => MACHINES.find((m) => m.id === id) || MACHINES[0];
  const owned = (it) => (S.collection[it.id] || 0) > 0;
  const adminName = () => (S.admin && S.admin.name) || 'だんなさん';

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
      S.tickets += LEVELUP_TICKETS;
      const unlocked = MACHINES.filter((m) => m.unlock === lv);
      afterModal(() => showLevelUp(lv, unlocked));
    }
  }

  /* ---------------- サウンド ---------------- */

  const Sound = {
    ctx: null,
    ensure() {
      if (!S.settings.sound) return null;
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
        PRIZE: [523, 659, 784, 1047, 784, 1047, 1319, 1568, 2093],
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

  // キャラのイラスト（js/art.js）
  const emo = (it, cls = '') => `<span class="emo ${cls}">${Art.render(it)}</span>`;
  const noLabel = (it) => `No.${String(it.no).padStart(it.machine === 'pachimon' ? 3 : 2, '0')}`;
  const typeBadges = (it) => it.types.map((t) => `<span class="tbadge" style="--t:${TYPES[t] || '#999'}">${t}</span>`).join('');

  /* ---------------- モーダル ---------------- */

  const modalQueue = [];
  let modalOpen = false;
  let overlayOpen = false;

  function openModal(html, onMount) {
    $('#modalBody').innerHTML = html;
    $('#modal').classList.remove('hidden');
    $('#modalBody').scrollTop = 0;
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
      S.tickets += a.reward;
      setTimeout(() => {
        toast(`<b>🏅 実績「${esc(a.name)}」達成！</b><br>🎫 ガチャ券 +${a.reward}`, 'gold');
        Sound.chime();
        renderHeader();
      }, 400);
    });
    save();
  }

  /* ---------------- 時間でたまるガチャ券 ---------------- */

  const TIMER_MS = TIMER_HOURS * 3600 * 1000;

  // 前回から TIMER_HOURS 時間たつごとに1枚。開いていない間も TIMER_MAX 枚まではたまる
  function accrueTimer(silent = false) {
    const now = Date.now();
    if (!S.timerAt) { S.timerAt = now; save(); return 0; }
    const n = Math.floor((now - S.timerAt) / TIMER_MS);
    if (n <= 0) return 0;
    const add = Math.min(n, TIMER_MAX);
    S.tickets += add;
    S.timerAt = n > TIMER_MAX ? now : S.timerAt + n * TIMER_MS;
    save();
    if (!silent) {
      toast(`⏰ 時間でガチャ券がたまったよ！ 🎫 +${add}`, 'gold');
      Sound.coin();
    }
    renderAll();
    return add;
  }

  function timerLeftText() {
    const left = Math.max(0, (S.timerAt || Date.now()) + TIMER_MS - Date.now());
    const h = Math.floor(left / 3600000), m = Math.ceil((left % 3600000) / 60000);
    if (m === 60) return `${h + 1}時間0分`;
    return h ? `${h}時間${m}分` : `${m}分`;
  }

  function showTicketInfo() {
    openModal(`
      <h3>🎫 ガチャ券のもらい方</h3>
      <ul class="howto">
        <li>⏰ <b>${TIMER_HOURS}時間ごとに1枚</b>（つぎの1枚まで あと${timerLeftText()}）<br><span class="muted small">開いていない間も${TIMER_MAX}枚まではたまります</span></li>
        <li>🌞 毎日のログインで1枚（7日目は${LOGIN_TICKETS[6]}枚）</li>
        <li>💪 本物のガチャをがまんして認定されると ${GAMAN_TICKETS}枚</li>
        <li>⭐ レベルアップ・🏅 実績でももらえる</li>
      </ul>
      <button class="btn primary wide" data-close>OK</button>`);
  }
  $('#ticketPill').addEventListener('click', showTicketInfo);

  /* ---------------- ログインボーナス ---------------- */

  function checkDay() {
    const t = today();
    if (S.login.last === t) return;
    const gap = S.login.last ? daysBetween(S.login.last, t) : null;
    S.login.streak = gap === 1 ? S.login.streak + 1 : 1;
    S.login.best = Math.max(S.login.best, S.login.streak);
    S.login.total += 1;
    S.login.last = t;
    const idx = (S.login.streak - 1) % 7;
    S.tickets += LOGIN_TICKETS[idx];
    save();
    checkAchievements();
    afterModal(() => showLoginBonus(idx));
  }

  function showLoginBonus(idx) {
    const stamps = LOGIN_TICKETS.map((n, i) => `
      <div class="stamp ${i < idx ? 'done' : ''} ${i === idx ? 'today' : ''}">
        <small>${i + 1}日目</small>
        <span>${i < idx ? '💮' : i === 6 ? '🎁' : '🎫'}</span>
        <small>${n}枚</small>
      </div>`).join('');
    openModal(`
      <h3 class="center">🌞 ログインボーナス</h3>
      <p class="center big-text">${S.login.streak}日連続ログイン！</p>
      <div class="stamps">${stamps}</div>
      <p class="center reward-line">🎫 ガチャ券 +${LOGIN_TICKETS[idx]}</p>
      <p class="center muted small">本物のガチャをがまんして認定されると、もっともらえるよ</p>
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
      <p class="center reward-line">🎫 ガチャ券 +${LEVELUP_TICKETS}</p>
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

  const HX = 88, HY = 290; // ハンドル中心

  // 箱型のガチャマシン（上: 商品ポップ / 中: 透明な窓 / 下: 銀のパネルとハンドル）
  function machineSVG(m) {
    const c = m.color;
    const dark = shade(c, -38);
    const rnd = seeded(m.id);
    let caps = '';
    for (let row = 0, y = 190; y >= 128; y -= 21, row++) {
      for (let x = 50 + (row % 2 ? 11 : 0); x <= 192; x += 23) {
        const jx = x + (rnd() - 0.5) * 6, jy = y + (rnd() - 0.5) * 5;
        const col = rnd() < 0.07 ? 'gold' : CAPSULE_COLORS[Math.floor(rnd() * CAPSULE_COLORS.length)];
        caps += `<g transform="translate(${jx.toFixed(1)} ${jy.toFixed(1)}) rotate(${Math.floor(rnd() * 360)})">${capsuleSVG(col, 12)}</g>`;
      }
    }
    const pop = (m.pop || []).map((key, i) => {
      const it = ITEMS[`${m.id}.${key}`];
      if (!it) return '';
      const x = 46 + i * 52, size = i === 1 ? 52 : 44, y = i === 1 ? 38 : 44;
      return Art.render(it).replace('<svg ', `<svg x="${x + (i === 1 ? -4 : 0)}" y="${y}" width="${size}" height="${size}" `);
    }).join('');
    return `
<svg id="machineSvg" viewBox="0 0 240 365" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ガチャマシン">
  <defs>
    <linearGradient id="mBody" x1="0" x2="1">
      <stop offset="0" stop-color="${shade(c, -14)}"/><stop offset=".3" stop-color="${shade(c, 14)}"/>
      <stop offset=".62" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -24)}"/>
    </linearGradient>
    <linearGradient id="mChrome" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fbfcfd"/><stop offset=".45" stop-color="#d3d8df"/>
      <stop offset=".55" stop-color="#eef1f4"/><stop offset="1" stop-color="#a7aeb8"/>
    </linearGradient>
    <linearGradient id="mPlate" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f4f6f8"/><stop offset=".5" stop-color="#dfe3e8"/><stop offset="1" stop-color="#c3c9d1"/>
    </linearGradient>
    <linearGradient id="mGrip" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#cfd5dc"/><stop offset="1" stop-color="#8f97a2"/>
    </linearGradient>
    <linearGradient id="mWin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f3f9ff"/><stop offset="1" stop-color="#d4e6f5"/>
    </linearGradient>
    <linearGradient id="mPop" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${shade(c, 70)}"/><stop offset="1" stop-color="#ffffff"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0" x2="1"><stop offset="0" stop-color="#ffe680"/><stop offset=".5" stop-color="#ffbf00"/><stop offset="1" stop-color="#ffdf6b"/></linearGradient>
    <linearGradient id="rainbowGrad" x1="0" x2="1">
      <stop offset="0" stop-color="#ff6b6b"/><stop offset=".25" stop-color="#ffd166"/><stop offset=".5" stop-color="#06d6a0"/><stop offset=".75" stop-color="#4cc9f0"/><stop offset="1" stop-color="#b388ff"/>
    </linearGradient>
    <clipPath id="mWinClip"><rect x="38" y="104" width="164" height="100" rx="7"/></clipPath>
    <filter id="mShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity=".25"/></filter>
  </defs>

  <ellipse cx="120" cy="357" rx="104" ry="6" fill="#000" opacity=".14"/>
  <rect x="20" y="8" width="200" height="346" rx="22" fill="url(#mBody)" stroke="${dark}" stroke-width="3"/>
  <rect x="27" y="14" width="10" height="330" rx="5" fill="#fff" opacity=".22"/>
  <rect x="24" y="12" width="192" height="36" rx="18" fill="#fff" opacity=".14"/>

  <g filter="url(#mShadow)">
    <rect x="32" y="20" width="176" height="72" rx="12" fill="url(#mPop)" stroke="${dark}" stroke-width="2"/>
  </g>
  <path d="M32 32 Q32 20 44 20 L196 20 Q208 20 208 32 L208 38 L32 38Z" fill="${shade(c, -10)}"/>
  <text x="120" y="33.5" text-anchor="middle" font-size="12" font-weight="800" fill="#fff" letter-spacing="1">${esc(m.name)}</text>
  <circle cx="40" cy="29" r="2" fill="#fff" opacity=".7"/><circle cx="200" cy="29" r="2" fill="#fff" opacity=".7"/>
  ${pop}

  <rect x="32" y="98" width="176" height="112" rx="11" fill="${dark}"/>
  <rect x="38" y="104" width="164" height="100" rx="7" fill="url(#mWin)"/>
  <g clip-path="url(#mWinClip)">
    <g id="globeCaps">${caps}</g>
    <rect x="38" y="104" width="164" height="14" fill="#000" opacity=".06"/>
    <path d="M60 104 L104 104 L58 204 L38 204 L38 150Z" fill="#fff" opacity=".28"/>
    <path d="M116 104 L130 104 L84 204 L70 204Z" fill="#fff" opacity=".18"/>
  </g>
  <rect x="38" y="104" width="164" height="100" rx="7" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/>

  <g transform="translate(192 98) rotate(-8)">
    <rect x="-17" y="-10" width="38" height="20" rx="10" fill="#ffd23f" stroke="${dark}" stroke-width="1.6"/>
    <text x="2" y="4.5" text-anchor="middle" font-size="11" font-weight="800" fill="#5a3a00">🎫×1</text>
  </g>
  <rect x="26" y="216" width="188" height="6" rx="3" fill="${dark}" opacity=".55"/>
  <rect x="32" y="228" width="176" height="118" rx="12" fill="url(#mPlate)" stroke="#8a929c" stroke-width="2"/>
  <rect x="36" y="232" width="168" height="5" rx="2.5" fill="#fff" opacity=".7"/>
  <circle cx="40" cy="240" r="2" fill="#9aa2ac"/><circle cx="200" cy="240" r="2" fill="#9aa2ac"/>
  <circle cx="40" cy="338" r="2" fill="#9aa2ac"/><circle cx="200" cy="338" r="2" fill="#9aa2ac"/>

  <rect x="148" y="240" width="48" height="44" rx="8" fill="#2d3238" stroke="#1d2126" stroke-width="1.5"/>
  <rect x="169" y="248" width="6" height="22" rx="3" fill="#0e1012"/>
  <rect x="170" y="249" width="2" height="20" rx="1" fill="#5d6570"/>
  <text x="172" y="279" text-anchor="middle" font-size="7" font-weight="800" fill="#c9ced6" letter-spacing=".5">TICKET</text>

  <circle cx="${HX}" cy="${HY}" r="38" fill="url(#mChrome)" stroke="#7d848e" stroke-width="2.5"/>
  <circle cx="${HX}" cy="${HY}" r="31" fill="#e9ecf0" stroke="#aab1ba" stroke-width="1.5"/>
  <g id="handleRot" transform="rotate(0 ${HX} ${HY})">
    <rect x="${HX - 36}" y="${HY - 9}" width="72" height="18" rx="9" fill="url(#mGrip)" stroke="#6f7782" stroke-width="2"/>
    <path d="M${HX - 26} ${HY - 5} L${HX - 26} ${HY + 5} M${HX - 20} ${HY - 5} L${HX - 20} ${HY + 5} M${HX + 20} ${HY - 5} L${HX + 20} ${HY + 5} M${HX + 26} ${HY - 5} L${HX + 26} ${HY + 5}" stroke="#9aa2ac" stroke-width="1.4" stroke-linecap="round"/>
    <circle cx="${HX}" cy="${HY}" r="9" fill="url(#mChrome)" stroke="#6f7782" stroke-width="2"/>
    <circle cx="${HX - 2}" cy="${HY - 3}" r="2.4" fill="#fff" opacity=".9"/>
  </g>
  <g id="turnArrow" class="turn-arrow">
    <path d="M${HX + 22} ${HY - 46} A50 50 0 0 1 ${HX + 50} ${HY - 6}" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>
    <path d="M${HX + 42} ${HY - 8} L${HX + 51} ${HY + 4} L${HX + 58} ${HY - 10}" fill="${c}"/>
  </g>
  <text x="${HX}" y="341" text-anchor="middle" font-size="8" font-weight="800" fill="#6b737e" letter-spacing="1">まわす ↻</text>
  <circle id="handleHit" cx="${HX}" cy="${HY}" r="52" fill="transparent"/>

  <rect x="144" y="296" width="58" height="44" rx="12" fill="#3a4048" stroke="#1d2126" stroke-width="2"/>
  <rect x="149" y="301" width="48" height="34" rx="9" fill="#14171a"/>
  <path d="M149 310 Q149 301 158 301 L188 301 Q197 301 197 310 L197 313 L149 313Z" fill="#fff" opacity=".12"/>
  <g transform="translate(173 324)"><g id="dropCap" class="drop-cap hidden"></g></g>
</svg>`;
  }

  /* ---------------- ガチャを回す ---------------- */

  const turn = { phase: 'idle', angle: 0, target: 0, dragging: false, lastA: 0, moved: 0, raf: 0 };

  function rollPrize() {
    let r = Math.random();
    for (const p of GACHA_PRIZES) {
      if (r < p.rate) return p;
      r -= p.rate;
    }
    return null;
  }

  function rollItem(m) {
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

  function capColorFor(p) {
    if (p.kind === 'prize') return p.prize === 'sushi' ? 'rainbow' : 'gold';
    const it = ITEMS[p.item];
    if (it.rarity === 'SE' && Math.random() < 0.6) return 'rainbow';
    if (it.rarity === 'SR' && Math.random() < 0.5) return 'gold';
    if (Math.random() < 0.04) return 'gold'; // フェイント
    return rand(CAPSULE_COLORS);
  }

  function startPull() {
    Sound.ensure();
    if (S.pending) {
      hint(S.pending.dropped ? 'さきにカプセルをあけてね！' : 'ハンドルを回してね！', true);
      return;
    }
    const m = machine(S.selected);
    if (!isUnlocked(m)) return;
    if (S.tickets < 1) {
      showNoTickets();
      return;
    }
    S.tickets -= 1;
    const prize = rollPrize();
    if (prize) {
      S.pending = { machine: m.id, kind: 'prize', prize: prize.id, dropped: false };
    } else {
      const { item, pity } = rollItem(m);
      S.pending = { machine: m.id, kind: 'item', item: item.id, pity, dropped: false };
    }
    S.pending.cap = capColorFor(S.pending);
    mstat(m.id).pulls += 1;
    S.totalPulls += 1;
    save();
    Sound.coin();
    vib(20);
    setPhase('ready');
    renderHeader();
    renderGacha();
    $('#machineWrap').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function showNoTickets() {
    openModal(`
      <div class="center">
        <div class="praise-emo">🎫</div>
        <h3>ガチャ券がなくなっちゃった</h3>
        <p>本物のガチャを <b>1回がまん</b>すると<br><b>${GAMAN_TICKETS}回</b> まわせるよ！</p>
        <p class="muted small">ほかにも、毎日のログインや実績でもらえます</p>
        <button class="btn primary wide" id="goGaman">がまんを申請する 💪</button>
        <button class="btn wide" data-close>とじる</button>
      </div>`, (root) => {
      $('#goGaman', root).addEventListener('click', () => { closeModal(); switchTab('gaman'); });
    });
  }

  function setPhase(p) {
    turn.phase = p;
    $('#machineWrap').dataset.phase = p;
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
    setTimeout(() => { Sound.drop(); vib([30, 40, 20]); setPhase('dropped'); renderGacha(); }, 250);
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
        hint('まずは下のボタンでガチャ券を入れてね 🎫', true);
        $('#btnPull').classList.remove('nudge'); void $('#btnPull').offsetWidth; $('#btnPull').classList.add('nudge');
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

  function openPending() {
    const p = S.pending;
    $('#dropCap').classList.add('hidden');
    if (p.kind === 'prize') {
      const prize = PRIZE_BY_ID[p.prize];
      showCapsule({ peek: prize.emoji, level: 'PRIZE', cap: p.cap }, () => {
        S.pending = null;
        const rec = { id: Link.uid(), prize: prize.id, won: new Date().toISOString(), usedAt: null };
        S.prizes.unshift(rec);
        save();
        addXp(40);
        checkAchievements();
        setPhase('idle');
        return { kind: 'prize', prize, rec };
      });
      return;
    }
    const it = ITEMS[p.item];
    if (!it) { S.pending = null; save(); setPhase('idle'); renderGacha(); return; }
    showCapsule({ peek: emo(it), level: it.rarity, cap: p.cap }, () => {
      S.pending = null;
      const res = grantItem(it);
      setPhase('idle');
      return { kind: 'item', it, ...res, pity: p.pity };
    });
  }

  function grantItem(it) {
    const isNew = !owned(it);
    const st = mstat(it.machine);
    S.collection[it.id] = (S.collection[it.id] || 0) + 1;
    if (isNew) {
      S.obtainedAt[it.id] = new Date().toISOString();
      st.sinceNew = 0;
    } else {
      st.sinceNew += 1;
    }
    save();
    addXp(10 + (isNew ? 15 : 0) + RARITY[it.rarity].xp);
    checkAchievements();
    if (isNew) checkCompletePrize(it.machine);
    return { isNew };
  }

  // ガチャモンを全種類あつめたら、特別なご褒美（豪華ディナー）を1回だけプレゼント
  function checkCompletePrize(machineId) {
    const prizeId = COMPLETE_PRIZES[machineId];
    const m = machine(machineId);
    if (!prizeId || ownedIn(S, m.items) !== m.items.length) return;
    if (S.prizes.some((p) => p.prize === prizeId)) return;
    const pr = PRIZE_BY_ID[prizeId];
    S.prizes.unshift({ id: Link.uid(), prize: prizeId, won: new Date().toISOString(), usedAt: null });
    save();
    afterModal(() => {
      Sound.fanfare('PRIZE');
      confetti(220);
      vib([60, 80, 60, 80, 120]);
      openModal(`
        <div class="center">
          <div class="praise-emo">🏆</div>
          <h3>${esc(m.name)} 全${m.items.length}種コンプリート！</h3>
          <div class="ticket-big"><div class="tb-emo">${pr.emoji}</div><div><b>${esc(pr.name)}</b><small>${esc(pr.desc)}</small></div></div>
          <p>ずっとがまんしてきたごほうび！<br>「ごほうび」タブに入りました</p>
          <button class="btn primary wide" id="goPrizeDinner">ごほうびを見る</button>
          <button class="btn wide" data-close>とじる</button>
        </div>`, (root) => {
        $('#goPrizeDinner', root).addEventListener('click', () => { closeModal(); switchTab('prize'); });
      });
    });
  }

  // level: N/R/SR/SE/PRIZE（演出の強さ）
  function showCapsule({ peek, level: lvl, cap: capColor }, onReveal) {
    overlayOpen = true;
    const cap = $('#bigCap');
    const big = lvl === 'SR' || lvl === 'SE' || lvl === 'PRIZE';
    const taps = lvl === 'N' ? (Math.random() < 0.25 ? 2 : 1) : lvl === 'R' ? (Math.random() < 0.5 ? 2 : 1) : 3;
    cap.className = 'big-cap';
    cap.style.setProperty('--cap', capColor === 'gold' ? 'linear-gradient(90deg,#ffe680,#ffbf00,#ffdf6b)'
      : capColor === 'rainbow' ? 'linear-gradient(90deg,#ff6b6b,#ffd166,#06d6a0,#4cc9f0,#b388ff)' : capColor);
    $('#peek').innerHTML = peek;
    $('#rays').className = 'rays';
    $('#result').classList.add('hidden');
    $('#openHint').classList.remove('hidden');
    $('#openHint').textContent = 'タップしてあけよう！';
    $('#openOverlay').classList.remove('hidden');
    requestAnimationFrame(() => cap.classList.add('enter'));
    let tapCount = 0;
    let done = false;

    const onTap = () => {
      if (done) return;
      tapCount++;
      cap.classList.remove('wiggle2', 'wiggle3');
      void cap.offsetWidth;
      if (tapCount < taps) {
        cap.classList.add(tapCount === 1 ? 'wiggle2' : 'wiggle3');
        Sound.tap();
        vib(25 * tapCount);
        if (tapCount === 2 && big) {
          cap.classList.add(lvl === 'SR' ? 'glow-gold' : 'glow-rainbow');
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
      vib(lvl === 'N' ? 30 : [40, 60, 40, 60, 80]);
      const res = onReveal();
      setTimeout(() => (res.kind === 'prize' ? showPrizeResult(res) : showItemResult(res)), 380);
    };
    cap.addEventListener('click', onTap);
  }

  function resultButtons() {
    return `<div class="res-buttons">
      <button class="btn primary" id="resAgain" ${S.tickets >= 1 ? '' : 'disabled'}>もう1回 🎫1</button>
      <button class="btn" id="resClose">とじる</button>
    </div>`;
  }
  function bindResult() {
    $('#resClose').addEventListener('click', closeOverlay);
    $('#resAgain')?.addEventListener('click', () => { closeOverlay(); startPull(); });
  }

  function showItemResult({ it, isNew, pity }) {
    const r = it.rarity;
    const m = machine(it.machine);
    $('#rays').className = `rays on r-${r}`;
    Sound.fanfare(r);
    if (isNew) confetti(r === 'SE' ? 140 : r === 'SR' ? 90 : r === 'R' ? 40 : 20);
    $('#result').innerHTML = `
      <div class="res-card r-${r}">
        <span class="badge r-${r}">${RARITY[r].label}</span>
        <div class="res-emo">${emo(it)}</div>
        ${isNew ? '<div class="new-badge">NEW!</div>' : '<div class="dup">もう持ってるキャラ</div>'}
        <p class="res-no">${esc(m.name)} ${noLabel(it)} ${typeBadges(it)}</p>
        <h3>${esc(it.name)}</h3>
        <p class="desc">${esc(it.desc)}</p>
        ${pity ? '<p class="pity-msg">🛟 天井ボーナスで NEW 確定！</p>' : ''}
        <p class="muted small">今回はご褒美ははずれ… ずかん ${ownedIn(S, m.items)}/${m.items.length}</p>
      </div>${resultButtons()}`;
    $('#result').classList.remove('hidden');
    bindResult();
    renderAll();
  }

  function showPrizeResult({ prize }) {
    $('#rays').className = `rays on r-${prize.id === 'sushi' ? 'SE' : 'SR'}`;
    Sound.fanfare('PRIZE');
    confetti(prize.id === 'sushi' ? 200 : 120);
    $('#result').innerHTML = `
      <div class="res-card prize-card">
        <div class="prize-flag">🎉 当たり！🎉</div>
        <div class="ticket-big">
          <div class="tb-emo">${prize.emoji}</div>
          <div><b>${esc(prize.name)}</b><small>${esc(prize.desc)}</small></div>
        </div>
        <p class="desc">本物のご褒美がもらえるよ！<br>「ごほうび」タブに入りました</p>
      </div>
      <div class="res-buttons">
        <button class="btn primary" id="resPrize">ごほうびを見る</button>
        <button class="btn" id="resClose">とじる</button>
      </div>`;
    $('#result').classList.remove('hidden');
    $('#resClose').addEventListener('click', closeOverlay);
    $('#resPrize').addEventListener('click', () => { closeOverlay(); switchTab('prize'); });
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
    $('#tickets').textContent = fmt(S.tickets);
    $('#timerNext').textContent = `⏰ 次の1枚まで ${timerLeftText()}`;
    $('#prizeDot').classList.toggle('hidden', !S.prizes.some((p) => !p.usedAt));
    $('#gamanDot').classList.toggle('hidden', !S.gaman.some((g) => g.status === 'pending'));
  }

  /* ---------------- 描画: ガチャ ---------------- */

  let renderedMachine = null;

  function renderGacha() {
    const m = machine(S.selected);
    $('#machinePicker').innerHTML = MACHINES.map((x) => {
      const lock = !isUnlocked(x);
      return `<button class="pick ${x.id === m.id ? 'active' : ''} ${lock ? 'locked' : ''}" data-id="${x.id}" style="--c:${x.color}">
        <span class="pick-icon">${lock ? '🔒' : emo(ITEMS[`${x.id}.${x.sign}`])}</span>
        <span class="pick-name">${lock ? `Lv.${x.unlock}で解放` : esc(x.name)}</span>
        <span class="pick-prog">${lock ? '' : `${ownedIn(S, x.items)}/${x.items.length}`}</span>
      </button>`;
    }).join('');

    $('#machineName').textContent = m.name;
    if (renderedMachine !== m.id) {
      $('#machineWrap').innerHTML = machineSVG(m);
      renderedMachine = m.id;
      bindMachine();
      if (S.pending) setPhase(S.pending.dropped ? 'dropped' : 'ready');
      else setPhase('idle');
    }

    const unused = S.prizes.filter((p) => !p.usedAt).length;
    $('#prizeStrip').innerHTML = `
      <div class="prize-strip-title">🎁 当たるかも！リアルご褒美</div>
      <div class="prize-chips">${GACHA_PRIZES.map((p) => `<span class="pchip">${p.emoji} ${esc(p.name.replace('チケット', ''))}</span>`).join('')}</div>
      ${unused ? `<button class="link" id="goPrize">🎟️ 使っていないご褒美が ${unused}枚 あるよ ›</button>` : ''}`;
    $('#goPrize')?.addEventListener('click', () => switchTab('prize'));

    const busy = !!S.pending;
    const btn = $('#btnPull');
    btn.innerHTML = busy ? (S.pending.dropped ? '👇 カプセルをあけよう' : '↻ ハンドルを回そう') : `🎫 1枚でまわす <small>（のこり ${S.tickets}枚）</small>`;
    btn.classList.toggle('empty', !busy && S.tickets < 1);

    const totalW = m.items.reduce((a, it) => a + RARITY[it.rarity].weight, 0);
    const missRate = 1 - GACHA_PRIZES.reduce((a, p) => a + p.rate, 0);
    $('#lineup').innerHTML = `<summary>中身と出やすさ</summary>
      <p class="lu-head">🎁 リアルご褒美（どのマシンでも同じ）</p>
      <div class="lineup-grid">${GACHA_PRIZES.map((p) => `<div class="lu">
          <span class="lu-emo">${p.emoji}</span><span class="lu-name">${esc(p.name)}</span>
          <span class="badge prize">当たり</span><span class="lu-p">${(p.rate * 100).toFixed(2).replace(/\.?0+$/, '')}%</span></div>`).join('')}</div>
      <p class="lu-head">🧸 はずれのときのキャラ（ずかんに登録）</p>
      <div class="lineup-grid">${m.items.map((it) => {
        const p = ((RARITY[it.rarity].weight / totalW) * missRate * 100).toFixed(1);
        const show = it.rarity !== 'SE' || owned(it);
        return `<div class="lu ${owned(it) ? '' : 'unowned'}">
          <span class="lu-emo">${show ? emo(it) : '❔'}</span>
          <span class="lu-name">${show ? esc(it.name) : '？？？'}</span>
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
  $('#btnPull').addEventListener('click', startPull);

  function renderInstallTip() {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    const box = $('#installTip');
    if (standalone || S.tipDismissed) { box.innerHTML = ''; return; }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    box.innerHTML = `<div class="tip">📲 ${ios ? '共有ボタン →「ホーム画面に追加」' : 'メニュー →「ホーム画面に追加」'}でアプリのように使えます
      <button class="tip-x" aria-label="とじる">×</button></div>`;
    $('.tip-x', box).addEventListener('click', () => { S.tipDismissed = true; save(); renderInstallTip(); });
  }

  /* ---------------- 描画: がまん ---------------- */

  // 旧バージョンの金額つき記録は金額も表示する
  const gamanTitle = (g) => (g.status === 'gift' ? '🎁 プレゼント' : `💪 がまん${g.amount ? ` <span class="muted small">${fmt(g.amount)}円</span>` : ''}`);

  function renderGaman() {
    const count = gamanCount(S);
    const monthCount = S.gaman.filter((g) => g.status === 'ok' && monthOf(g.decidedAt || g.date) === thisMonth()).length;
    const got = S.gaman.filter((g) => g.status === 'ok' || g.status === 'gift').reduce((a, g) => a + (g.tickets || 0), 0);
    const pending = S.gaman.filter((g) => g.status === 'pending');
    const hist = S.gaman.filter((g) => g.status !== 'pending').slice(0, 40);

    const form = S.admin ? `
      <div class="card gaman-card">
        <h3>本物のガチャを見かけたけど…</h3>
        <input id="gamanNote" placeholder="ひとこと（例: 駅前のねこガチャ）任意" maxlength="40">
        <button class="btn primary wide gaman-btn" id="gamanSend">💪 がまんした！</button>
        <p class="muted small center">${esc(adminName())}に認定されると 🎫 ガチャ券 ${GAMAN_TICKETS}枚</p>
      </div>` : `
      <div class="card setup">
        <h3>🤝 まずは${esc(adminName())}とつなげよう</h3>
        <ol class="howto-steps">
          <li>${esc(adminName())}がスマホで <b>管理ページ</b> をひらく<br><code>${esc(location.href.split('#')[0].split('?')[0].replace(/[^/]*$/, ''))}admin.html</code></li>
          <li>管理ページの「アプリとつなぐ」でLINEにリンクが届く</li>
          <li>そのリンクをタップ（またはコピーして下のボタンから貼りつけ）</li>
        </ol>
        <button class="btn wide" id="pasteCode">📋 コードを貼りつける</button>
      </div>`;

    $('#tab-gaman').innerHTML = `
      <div class="card hero pig">
        <small>がまんできた回数（認定ずみ）</small>
        <div class="hero-num">${count}<small>回</small></div>
        <div class="balance">
          <div><small>今月</small><b>${monthCount}回</b></div>
          <div><small>もらったガチャ券</small><b>🎫${got}枚</b></div>
        </div>
      </div>
      ${form}
      ${pending.length ? `<div class="card"><h3>⏳ 認定まち</h3><ul class="glist">${pending.map((g) => `
        <li><div><b>${gamanTitle(g)}</b> <span class="muted small">${fmtDate(g.date)}</span>${g.note ? `<br><span class="small">${esc(g.note)}</span>` : ''}</div>
          <div class="gbtns"><button class="btn mini" data-resend="${g.id}">もう一度送る</button><button class="btn mini" data-cancel="${g.id}">取り消し</button></div></li>`).join('')}</ul>
        <button class="btn wide" id="pasteCode2">📋 認定コードを貼りつける</button>
        <p class="muted small">認定のリンクをタップしても反映されないときは、リンクをコピーしてこのボタンから貼りつけてね。</p></div>` : ''}
      <div class="card"><h3>📝 りれき</h3>${hist.length ? `<ul class="glist">${hist.map((g) => `
        <li><div><b>${gamanTitle(g)}</b> <span class="muted small">${fmtDate(g.date)}</span>${g.note && g.status !== 'gift' ? `<br><span class="small">${esc(g.note)}</span>` : ''}
          ${g.msg ? `<br><span class="small msg">💬 ${esc(g.msg)}</span>` : ''}</div>
          <span class="status s-${g.status}">${{ ok: `認定 🎫+${g.tickets}`, ng: '見送り', legacy: '旧記録', gift: `🎫+${g.tickets}` }[g.status] || ''}</span></li>`).join('')}</ul>` : '<p class="muted">まだ記録がありません</p>'}</div>`;
  }

  $('#tab-gaman').addEventListener('click', async (e) => {
    if (e.target.id === 'gamanSend') {
      const g = { id: Link.uid(), note: $('#gamanNote').value.trim(), date: new Date().toISOString(), status: 'pending', tickets: 0 };
      S.gaman.unshift(g);
      save();
      Sound.coin();
      confetti(30);
      renderAll();
      showSendRequest(g, true);
      return;
    }
    const rs = e.target.closest('[data-resend]');
    if (rs) { showSendRequest(S.gaman.find((g) => g.id === rs.dataset.resend), false); return; }
    const cc = e.target.closest('[data-cancel]');
    if (cc && confirm('この申請を取り消しますか？')) {
      S.gaman = S.gaman.filter((g) => g.id !== cc.dataset.cancel);
      save();
      renderAll();
      return;
    }
    if (e.target.id === 'pasteCode' || e.target.id === 'pasteCode2') showPasteCode();
  });

  function requestMessage(g) {
    const url = Link.adminUrl('req', Link.pack({ id: g.id, n: g.note, d: g.date }));
    return `💪 本物のガチャをがまんしました！\n${g.note ? `📍 ${g.note}\n` : ''}認定してね👇\n${url}`;
  }

  function showSendRequest(g, fresh) {
    openModal(`
      <div class="center">
        ${fresh ? `<div class="praise-emo">🐷💕</div><h3>${esc(rand(PRAISES))}</h3>` : '<h3>📮 申請をもう一度送る</h3>'}
        <p>がまんしたことを<br><b>${esc(adminName())}に送って認定してもらおう</b></p>
      </div>
      ${Link.sendButtons(requestMessage(g), 'がまん認定のおねがい')}
      <p class="muted small center">認定されると 🎫 ガチャ券 がもらえます</p>
      <button class="btn wide" data-close>あとで送る</button>`);
  }

  /* ---------------- コードの受けとり（ペアリング・認定） ---------------- */

  function showPasteCode() {
    openModal(`
      <h3>📋 コードを貼りつける</h3>
      <p class="muted small">${esc(adminName())}から届いたリンク（またはコード）をコピーして、ここに貼りつけてね。</p>
      <textarea id="codeText" rows="4" placeholder="https://...#grant=..."></textarea>
      <button class="btn primary wide" id="codeGo">読みこむ</button>
      <button class="btn wide" data-close>とじる</button>`, (root) => {
      (async () => {
        try {
          const t = await navigator.clipboard.readText();
          if (Link.parsePasted(t)) $('#codeText', root).value = t;
        } catch (e) { /* 読めなければ手で貼ってもらう */ }
      })();
      $('#codeGo', root).addEventListener('click', async () => {
        const parsed = Link.parsePasted($('#codeText', root).value);
        if (!parsed) { toast('コードが見つかりませんでした'); return; }
        closeModal();
        await handleIncoming(parsed, false);
      });
    });
  }

  async function handleIncoming({ type, value }, fromLink) {
    if (type === 'pair') return handlePair(value, fromLink);
    if (type === 'grant') return handleGrant(value, fromLink);
    return null;
  }

  // ホーム画面のアプリとブラウザでデータが別になっている場合の案内
  function maybeOtherApp(fromLink, type, value) {
    if (!fromLink) return '';
    const url = Link.appUrl(type, value);
    return `<div class="note-box">
      <b>📱 ホーム画面のアプリで遊んでいる場合</b><br>
      このリンクはブラウザで開いたので、アプリのほうには届いていないかもしれません。下のボタンでコピーして、アプリの「コードを貼りつける」から読みこんでね。
      <button class="btn wide" data-copy="${encodeURIComponent(url)}">リンクをコピー</button>
    </div>`;
  }

  async function handlePair(value, fromLink) {
    let info;
    try { info = Link.unpack(value); } catch (e) { info = null; }
    if (!info || !info.k) { toast('つなぐためのコードが正しくありません'); return; }
    const fp = await Link.fingerprint(info.k);
    const same = S.admin && S.admin.pub === info.k;
    const apply = () => {
      S.admin = { pub: info.k, name: info.n || 'だんなさん', fp, pairedAt: new Date().toISOString() };
      save();
      renderAll();
      Sound.chime();
      confetti(50);
      openModal(`
        <div class="center"><div class="praise-emo">🤝</div>
        <h3>${esc(S.admin.name)}とつながりました！</h3>
        <p>あいことば: <b class="fp">${fp}</b></p>
        <p class="muted small">${esc(S.admin.name)}の管理ページにも同じあいことばが出ていればOK</p></div>
        ${maybeOtherApp(fromLink, 'pair', value)}
        <button class="btn primary wide" data-close>OK</button>`);
    };
    if (S.admin && !same) {
      openModal(`<h3>⚠️ つなぎ先を変えますか？</h3>
        <p>いまは <b>${esc(S.admin.name)}</b>（あいことば ${S.admin.fp}）とつながっています。<br>
        新しいつなぎ先: <b>${esc(info.n || '')}</b>（あいことば ${fp}）</p>
        <p class="muted small">変えると、まだ認定されていない申請は新しいつなぎ先に送り直す必要があります。</p>
        <button class="btn primary wide" id="pairYes">変える</button>
        <button class="btn wide" data-close>やめる</button>`, (root) => {
        $('#pairYes', root).addEventListener('click', () => { closeModal(); apply(); });
      });
      return;
    }
    apply();
  }

  async function handleGrant(value, fromLink) {
    if (!S.admin) {
      openModal(`<h3>まだつながっていません</h3><p>先に「がまん」タブから${esc(adminName())}とつなげてね。</p>
        ${maybeOtherApp(fromLink, 'grant', value)}<button class="btn wide" data-close>とじる</button>`);
      return;
    }
    const d = await Link.verifyPack(S.admin.pub, value);
    if (!d) {
      openModal(`<h3>❌ 認定コードが正しくありません</h3><p>${esc(adminName())}が作ったコードではないか、途中で文字が欠けているようです。</p>
        <button class="btn wide" data-close>とじる</button>`);
      return;
    }
    if (d.k === 'gift') {
      if (S.gifts[d.id]) { toast('このプレゼントはもう受けとっています'); return; }
      S.gifts[d.id] = new Date().toISOString();
      S.tickets += d.t;
      S.gaman.unshift({ id: d.id, note: `${adminName()}からのプレゼント`, date: new Date().toISOString(), status: 'gift', tickets: d.t, msg: d.m || '' });
      save();
      celebrateGrant(`🎁 ${esc(adminName())}からプレゼント！`, d.t, d.m);
      return;
    }
    const g = S.gaman.find((x) => x.id === d.id);
    if (!g) {
      openModal(`<h3>🤔 この申請が見つかりません</h3>
        <p class="muted">別のスマホやブラウザで申請したものかもしれません。</p>
        ${maybeOtherApp(fromLink, 'grant', value)}
        <button class="btn wide" data-close>とじる</button>`);
      return;
    }
    if (g.status !== 'pending') { toast('この申請はもう結果が出ています'); return; }
    g.decidedAt = new Date().toISOString();
    g.msg = d.m || '';
    if (d.k === 'ok') {
      g.status = 'ok';
      g.tickets = d.t;
      S.tickets += d.t;
      save();
      checkAchievements();
      celebrateGrant('🎉 がまん認定！', d.t, d.m);
    } else {
      g.status = 'ng';
      save();
      renderAll();
      openModal(`<div class="center"><div class="praise-emo">🙏</div><h3>今回は見送りになりました</h3>
        ${d.m ? `<p class="msg-big">💬 ${esc(d.m)}</p>` : ''}
        <button class="btn wide" data-close>とじる</button></div>`);
    }
  }

  function celebrateGrant(title, n, msg) {
    Sound.fanfare('SR');
    confetti(120);
    vib([40, 60, 40]);
    renderAll();
    openModal(`
      <div class="center">
        <div class="praise-emo">🎫✨</div>
        <h3>${title}</h3>
        <p class="reward-line">ガチャ券 +${n}枚</p>
        ${msg ? `<p class="msg-big">💬 ${esc(msg)}</p>` : ''}
        <button class="btn primary wide" id="goGacha">さっそく回す 🎰</button>
        <button class="btn wide" data-close>とじる</button>
      </div>`, (root) => {
      $('#goGacha', root).addEventListener('click', () => { closeModal(); switchTab('gacha'); });
    });
  }

  /* ---------------- 描画: ごほうび ---------------- */

  function renderPrize() {
    const monthWon = S.prizes.filter((p) => monthOf(p.won) === thisMonth()).length;
    const unused = S.prizes.filter((p) => !p.usedAt);
    const used = S.prizes.filter((p) => p.usedAt).slice(0, 30);
    const ticket = (p, canUse) => {
      const pr = PRIZE_BY_ID[p.prize] || { emoji: '🎁', name: 'ご褒美', desc: '', value: 0 };
      return `<div class="rticket ${canUse ? '' : 'used'}">
        <div class="rt-emo">${pr.emoji}</div>
        <div class="rt-body"><b>${esc(pr.name)}</b><small>${esc(pr.desc)}</small>
          <small class="muted">${canUse ? `当たった日 ${fmtDate(p.won)}` : `使った日 ${fmtDate(p.usedAt)}`}</small></div>
        ${canUse ? `<button class="btn primary mini" data-use="${p.id}">使う</button>` : '<span class="rt-stamp">使用済</span>'}
      </div>`;
    };
    $('#tab-prize').innerHTML = `
      <div class="card hero">
        <small>使えるご褒美チケット</small>
        <div class="hero-num">${unused.length}<small>枚</small></div>
        <p class="muted small">今月当たった数 ${monthWon}枚 ・ これまで ${S.prizes.length}枚</p>
      </div>
      <div class="card"><h3>🎟️ 使えるチケット</h3>
        ${unused.length ? unused.map((p) => ticket(p, true)).join('') : '<p class="muted">まだありません。ガチャで当てよう！</p>'}
      </div>
      <div class="card"><h3>🎁 当たりの種類</h3>
        <ul class="plist">${GACHA_PRIZES.map((p) => `<li><span class="pl-emo">${p.emoji}</span><div><b>${esc(p.name)}</b><small class="muted">${esc(p.desc)}</small></div><span class="pl-rate">${(p.rate * 100).toFixed(2).replace(/\.?0+$/, '')}%</span></li>`).join('')}</ul>
        <p class="muted small">1回まわすごとに、この確率で当たります。</p>
      </div>
      ${Object.entries(COMPLETE_PRIZES).map(([mid, pid]) => {
        const m = machine(mid), pr = PRIZE_BY_ID[pid], got = ownedIn(S, m.items), done = S.prizes.some((p) => p.prize === pid);
        return `<div class="card special-prize">
          <h3>🏆 コンプリート特典</h3>
          <div class="ticket-big"><div class="tb-emo">${pr.emoji}</div><div><b>${esc(pr.name)}</b><small>${esc(pr.desc)}</small></div></div>
          ${done ? '<p class="center"><b>🎉 獲得ずみ！</b></p>' : `<p class="muted small">${esc(m.name)}をぜんぶ集めるともらえます（いま ${got}/${m.items.length}）</p>
          <div class="bar"><i style="width:${(got / m.items.length) * 100}%"></i></div>`}
        </div>`;
      }).join('')}
      ${used.length ? `<div class="card"><h3>📜 使ったチケット</h3>${used.map((p) => ticket(p, false)).join('')}</div>` : ''}`;
  }

  $('#tab-prize').addEventListener('click', (e) => {
    const b = e.target.closest('[data-use]');
    if (!b) return;
    const p = S.prizes.find((x) => x.id === b.dataset.use);
    const pr = PRIZE_BY_ID[p.prize];
    openModal(`
      <div class="center"><div class="praise-emo">${pr.emoji}</div>
      <h3>${esc(pr.name)}を使いますか？</h3>
      <p class="muted small">使うと「使用済」になり、${esc(adminName())}に知らせることができます。</p></div>
      <button class="btn primary wide" id="useYes">使う！</button>
      <button class="btn wide" data-close>やめる</button>`, (root) => {
      $('#useYes', root).addEventListener('click', () => {
        p.usedAt = new Date().toISOString();
        save();
        renderAll();
        Sound.chime();
        confetti(60);
        const url = Link.adminUrl('use', Link.pack({ id: p.id, p: p.prize, w: p.won, u: p.usedAt }));
        const msg = `🎟️ ${pr.name}を使います！\n（${pr.desc}）\nよろしくおねがいします🙏\n${url}`;
        openModal(`
          <div class="center"><div class="praise-emo">🎉</div><h3>${esc(pr.name)}を使いました</h3>
          <p>${esc(adminName())}に知らせよう！</p></div>
          ${Link.sendButtons(msg, `${pr.name}を使います`)}
          <button class="btn wide" data-close>とじる</button>`);
      });
    });
  });

  /* ---------------- 描画: ずかん ---------------- */

  function renderZukan() {
    const all = allItems();
    const got = ownedIn(S, all);
    const li = levelInfo(S.xp);
    const next = MACHINES.find((m) => m.unlock > li.lv);
    const html = MACHINES.map((m) => {
      if (!isUnlocked(m)) {
        return `<div class="zk-sec locked"><h3>🔒 ？？？</h3><p class="muted">Lv.${m.unlock} で解放されます</p></div>`;
      }
      const g = ownedIn(S, m.items);
      return `<div class="zk-sec" style="--c:${m.color}">
        <h3>${m.icon} ${esc(m.name)} <small>${g}/${m.items.length}</small></h3>
        <p class="muted small zk-desc">${esc(m.desc)}${COMPLETE_PRIZES[m.id] ? `<br>🏆 コンプすると <b>${esc(PRIZE_BY_ID[COMPLETE_PRIZES[m.id]].name)}</b>！` : ''}</p>
        <div class="bar"><i style="width:${(g / m.items.length) * 100}%"></i></div>
        <div class="zk-grid">${m.items.map((it) => {
          const n = S.collection[it.id] || 0;
          const secretHidden = !n && it.rarity === 'SE';
          return `<button class="zk-item r-${it.rarity} ${n ? '' : 'unowned'}" data-id="${it.id}">
            ${secretHidden ? '<span class="emo">❔</span>' : emo(it)}
            <span class="zk-no">${it.no}</span>${n > 1 ? `<span class="cnt">×${n}</span>` : ''}
          </button>`;
        }).join('')}</div></div>`;
    }).join('');
    $('#tab-zukan').innerHTML = `
      <div class="card level-card">
        <div class="hero-row">
          <div><small>いまの称号</small><h3>${esc(titleFor(li.lv))}</h3>
          <p class="muted small">Lv.${li.lv} ・ つぎまで ${li.need - li.cur} XP ・ 🔥${S.login.streak}日連続</p></div>
          <div class="lv-big">Lv<b>${li.lv}</b></div>
        </div>
        <div class="bar"><i style="width:${(li.cur / li.need) * 100}%"></i></div>
        ${next ? `<p class="muted small">Lv.${next.unlock} で「${esc(next.name)}」が登場！</p>` : ''}
      </div>
      <div class="card hero">
        <div class="hero-row"><div><small>キャラずかん</small><div class="hero-num">${got}<small> / ${all.length}</small></div></div>
        <div class="ring" style="--p:${(got / all.length) * 100}"><span>${Math.floor((got / all.length) * 100)}%</span></div></div>
        <p class="muted small">はずれの時に出るキャラがここにたまります。コンプすると ${MACHINES.map((m) => `${esc(m.name)} 🎫${m.compReward}枚`).join('・')}！</p>
      </div>
      ${html}
      <div class="card">
        <h3>🏅 実績 <small class="muted">${ACHIEVEMENTS.filter((a) => S.achievements[a.id]).length}/${ACHIEVEMENTS.length}</small></h3>
        <div class="ach-grid">${ACHIEVEMENTS.map((a) => {
          const ok = S.achievements[a.id];
          return `<div class="ach ${ok ? 'got' : ''}"><span class="ach-icon">${ok ? a.icon : '🔒'}</span>
            <b>${esc(a.name)}</b><small>${esc(a.desc)}</small><small class="ach-rw">🎫${a.reward}</small></div>`;
        }).join('')}</div>
      </div>`;
  }

  $('#tab-zukan').addEventListener('click', (e) => {
    const b = e.target.closest('.zk-item');
    if (!b) return;
    const it = ITEMS[b.dataset.id];
    const n = S.collection[it.id] || 0;
    const hidden = !n && it.rarity === 'SE';
    openModal(`
      <div class="detail r-${it.rarity}">
        <span class="badge r-${it.rarity}">${RARITY[it.rarity].label}</span>
        <div class="res-emo ${n ? '' : 'sil'}">${hidden ? '<span class="emo">❔</span>' : emo(it)}</div>
        <p class="res-no">${esc(machine(it.machine).name)} ${noLabel(it)} ${hidden ? '' : typeBadges(it)}</p>
        <h3>${hidden ? '？？？' : esc(it.name)}</h3>
        ${n ? `<p class="desc">${esc(it.desc)}</p>
          <p class="muted">所持数 ${n}こ ・ はじめて出会った日 ${S.obtainedAt[it.id] ? fmtDate(S.obtainedAt[it.id]) : '-'}</p>`
          : '<p class="muted">まだ出会っていません</p>'}
        <button class="btn wide" data-close>とじる</button>
      </div>`);
  });

  /* ---------------- 設定 ---------------- */

  const encodeBackup = () => btoa(unescape(encodeURIComponent(JSON.stringify(S))));
  const decodeBackup = (str) => JSON.parse(decodeURIComponent(escape(atob(str.trim()))));

  function showSettings() {
    openModal(`
      <h3>⚙️ せってい</h3>
      <h4>🤝 管理者</h4>
      ${S.admin ? `<p>${esc(S.admin.name)} とつながっています<br><span class="muted small">あいことば <b class="fp">${S.admin.fp}</b></span></p>`
        : '<p class="muted">まだつながっていません</p>'}
      <button class="btn wide" id="setPaste">📋 コードを貼りつける</button>
      <label class="switch"><input type="checkbox" id="setSound" ${S.settings.sound ? 'checked' : ''}> 🔊 サウンド</label>
      <label class="switch"><input type="checkbox" id="setVib" ${S.settings.vib ? 'checked' : ''}> 📳 バイブレーション（Android）</label>
      <h4>📖 あそびかた</h4>
      <ul class="howto">
        <li>🎫 ガチャ券1枚で1回まわせる。${TIMER_HOURS}時間ごとに1枚たまるほか、毎日のログインでももらえる</li>
        <li>💪 本物のガチャをがまんしたら「がまん」タブから申請 → ${esc(adminName())}が認定すると 🎫${GAMAN_TICKETS}枚</li>
        <li>🎁 まわすと、たまに<b>本物のご褒美チケット</b>が当たる！「ごほうび」タブから使える</li>
        <li>🧸 はずれのときはキャラ（ガチャモン・家族）が出て、ずかんにたまる</li>
        <li>🛟 同じガチャで${PITY}回つづけてかぶると、次は必ずNEW</li>
      </ul>
      <h4>💾 バックアップ</h4>
      <p class="muted small">データはこのスマホの中だけにあります。機種変更のときは「コピー」した文字を保存して、新しいスマホで「読みこむ」。</p>
      <div class="row2"><button class="btn" id="bkCopy">コピー</button><button class="btn" id="bkLoad">読みこむ</button></div>
      <textarea id="bkText" rows="3" placeholder="ここにバックアップの文字をはりつけ"></textarea>
      <button class="btn wide danger" id="resetAll">データをぜんぶ消す</button>
      <button class="btn primary wide" data-close>とじる</button>`, (root) => {
      $('#setPaste', root).addEventListener('click', () => { closeModal(); showPasteCode(); });
      $('#setSound', root).addEventListener('change', (e) => { S.settings.sound = e.target.checked; save(); });
      $('#setVib', root).addEventListener('change', (e) => { S.settings.vib = e.target.checked; save(); });
      $('#bkCopy', root).addEventListener('click', async () => {
        const code = encodeBackup();
        $('#bkText', root).value = code;
        toast((await Link.copy(code)) ? '📋 コピーしました' : '文字を長押ししてコピーしてね');
      });
      $('#bkLoad', root).addEventListener('click', () => {
        try {
          const d = decodeBackup($('#bkText', root).value);
          if (typeof d.collection !== 'object') throw new Error('bad');
          if (!confirm('いまのデータを上書きして読みこみますか？')) return;
          if (d.v === 2) localStorage.setItem(KEY, JSON.stringify(d));
          else { localStorage.removeItem(KEY); localStorage.setItem(KEY_V1, JSON.stringify(d)); }
          location.reload();
        } catch (e) { toast('読みこめませんでした。文字をたしかめてね'); }
      });
      $('#resetAll', root).addEventListener('click', () => {
        if (!confirm('本当にすべてのデータを消しますか？')) return;
        if (!confirm('ずかんも、ご褒美チケットも、がまんの記録も消えます。よろしいですか？')) return;
        localStorage.removeItem(KEY);
        localStorage.removeItem(KEY_V1);
        location.reload();
      });
    });
  }
  $('#settingsBtn').addEventListener('click', showSettings);
  $('#lvBtn').addEventListener('click', () => switchTab('zukan'));

  /* ---------------- タブ ---------------- */

  let currentTab = 'gacha';
  function switchTab(t) {
    currentTab = t;
    $$('.tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.tab === t));
    $$('.tab').forEach((s) => s.classList.toggle('active', s.id === `tab-${t}`));
    renderAll();
    window.scrollTo({ top: 0 });
  }
  $$('.tabbar button').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));

  function renderAll() {
    renderHeader();
    if (currentTab === 'gacha') renderGacha();
    if (currentTab === 'gaman') renderGaman();
    if (currentTab === 'prize') renderPrize();
    if (currentTab === 'zukan') renderZukan();
  }

  // iPhone Safari は user-scalable=no を無視するので、ピンチ拡大はここで止める
  // （ダブルタップ拡大は CSS の touch-action: manipulation で止めている）
  document.addEventListener('gesturestart', (e) => e.preventDefault());

  /* ---------------- 起動 ---------------- */

  checkDay();
  accrueTimer();
  checkAchievements();
  renderAll();
  setInterval(() => { accrueTimer(); renderHeader(); }, 30000);

  const incoming = Link.readHash();
  if (incoming) {
    Link.clearHash();
    if (incoming.type === 'grant') switchTab('gaman');
    afterModal(() => handleIncoming(incoming, true));
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (S.login.last !== today()) {
      checkDay();
      renderAll();
    }
    accrueTimer();
    renderHeader();
  });

  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  window.__gacha = { get state() { return S; } }; // デバッグ用
})();
