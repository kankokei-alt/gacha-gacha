/* ぽけっとガチャ — 管理ページ（だんなさん用） */
(() => {
  'use strict';

  const KEY = 'pocket-gacha-admin-v1';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => Number(n).toLocaleString('ja-JP');
  const fmtDate = (iso) => { const d = new Date(iso); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const monthOf = (iso) => { const d = new Date(iso); return `${d.getFullYear()}-${d.getMonth() + 1}`; };
  const thisMonth = () => monthOf(new Date().toISOString());

  // log: { kind: ok|ng|gift|use, id, amount?, tickets?, note?, msg?, prize?, at, token? }
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; }
  }
  let A = load();
  const save = () => localStorage.setItem(KEY, JSON.stringify(A));

  function toast(html) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = html;
    $('#toasts').appendChild(el);
    setTimeout(() => el.classList.add('out'), 2600);
    setTimeout(() => el.remove(), 3100);
  }
  function openModal(html, onMount) {
    $('#modalBody').innerHTML = html;
    $('#modal').classList.remove('hidden');
    $('#modalBody').querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeModal));
    if (onMount) onMount($('#modalBody'));
  }
  function closeModal() { $('#modal').classList.add('hidden'); render(); }
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });

  const wife = () => (A && A.wife) || 'ハル';

  /* ---------------- 初期設定 ---------------- */

  function renderSetup() {
    $('#main').innerHTML = `
      <div class="card">
        <h3>👋 はじめに</h3>
        <p>このページは<b>管理する人（だんなさん）のスマホ</b>で開いてください。ここで「認定のカギ」を作ります。カギはこのスマホの中だけに保存されます。</p>
        <div class="warn">📱 iPhoneの場合は <b>Safari</b> で開いて使ってください（ホーム画面に追加すると、LINEのリンクから開いたときにカギが見つからなくなります）。</div>
        <label class="small">あなたの呼び名（アプリに表示されます）</label>
        <input id="myName" value="だんなさん" maxlength="12">
        <label class="small">奥さんの呼び名</label>
        <input id="wifeName" value="ハル" maxlength="12">
        <button class="btn primary wide big" id="create">🔑 カギを作って管理をはじめる</button>
      </div>
      <div class="card">
        <h3>♻️ 前に作ったカギを戻す</h3>
        <p class="muted small">機種変更などで、前のスマホで「カギのバックアップ」をコピーした場合はここに貼りつけてください。</p>
        <textarea id="restoreText" rows="3"></textarea>
        <button class="btn wide" id="restore">戻す</button>
      </div>`;
    $('#create').addEventListener('click', async () => {
      const keys = await Link.generateKeys();
      A = { ...keys, fp: await Link.fingerprint(keys.pub), name: $('#myName').value.trim() || 'だんなさん', wife: $('#wifeName').value.trim() || 'ハル', log: [], createdAt: new Date().toISOString() };
      save();
      render();
      showPair();
    });
    $('#restore').addEventListener('click', () => {
      try {
        const d = JSON.parse(decodeURIComponent(escape(atob($('#restoreText').value.trim()))));
        if (!d.priv || !d.pub) throw new Error('bad');
        A = d;
        save();
        toast('カギを戻しました');
        render();
      } catch (e) { toast('読みこめませんでした'); }
    });
  }

  /* ---------------- ホーム ---------------- */

  function render() {
    if (!A) { renderSetup(); return; }
    const m = thisMonth();
    const month = A.log.filter((l) => monthOf(l.at) === m);
    const ok = month.filter((l) => l.kind === 'ok');
    const uses = month.filter((l) => l.kind === 'use');
    const okYen = ok.reduce((a, l) => a + l.amount, 0);
    const useYen = uses.reduce((a, l) => a + (PRIZE_BY_ID[l.prize]?.value || 0), 0);
    const given = month.filter((l) => l.kind === 'ok' || l.kind === 'gift').reduce((a, l) => a + l.tickets, 0);
    const ev = PRIZES.reduce((a, p) => a + p.rate * p.value, 0);

    $('#main').innerHTML = `
      <div class="card">
        <h3>📊 今月のまとめ</h3>
        <div class="stats">
          <div><small>認定したがまん</small><b>${ok.length}回 / ${fmt(okYen)}円</b></div>
          <div><small>使われたご褒美</small><b>${uses.length}枚 / ${fmt(useYen)}円</b></div>
          <div><small>わたしたガチャ券</small><b>🎫${given}枚</b></div>
          <div><small>家計のトク</small><b>${okYen - useYen >= 0 ? '+' : ''}${fmt(okYen - useYen)}円</b></div>
        </div>
        <p class="muted small">ガチャ1回あたりのご褒美の平均は約${Math.round(ev)}円。月の上限は ${fmt(MONTHLY_CAP)}円 です（${wife()}のアプリ側で制限）。</p>
      </div>
      <div class="card">
        <h3>🤝 ${esc(wife())}のアプリとつなぐ</h3>
        <p>あいことば: <b class="fp">${A.fp}</b></p>
        <p class="muted small">${esc(wife())}のアプリの設定に同じあいことばが出ていれば、正しくつながっています。</p>
        <button class="btn primary wide" id="pairBtn">つなぐリンクを送る</button>
      </div>
      <div class="card">
        <h3>🎁 ガチャ券をプレゼント</h3>
        <p class="muted small">がんばったご褒美やイベントに。</p>
        <div class="stepper"><button class="btn" data-step="-1">−</button><b id="giftN">3</b><button class="btn" data-step="1">＋</button></div>
        <input id="giftMsg" placeholder="ひとこと（例: いつもありがとう）" maxlength="40">
        <button class="btn primary wide" id="giftBtn">プレゼントを作る</button>
      </div>
      <div class="card">
        <h3>📝 りれき</h3>
        ${A.log.length ? `<ul class="log">${A.log.slice(0, 60).map((l) => `<li><span>${fmtDate(l.at)} ${logLabel(l)}</span>
          ${l.token ? `<button class="btn mini" data-resend="${l.id}">再送</button>` : ''}</li>`).join('')}</ul>` : '<p class="muted">まだありません</p>'}
      </div>
      <div class="card">
        <h3>💾 カギのバックアップ</h3>
        <p class="muted small">機種変更のときに必要です。コピーした文字は人に見せないでください。</p>
        <button class="btn wide" id="bk">コピー</button>
      </div>`;

    $('#pairBtn').addEventListener('click', showPair);
    let giftN = 3;
    document.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => {
      giftN = Math.max(1, Math.min(30, giftN + Number(b.dataset.step)));
      $('#giftN').textContent = giftN;
    }));
    $('#giftBtn').addEventListener('click', async () => {
      const id = Link.uid();
      const msg = $('#giftMsg').value.trim();
      const token = await Link.signPack(A.priv, { k: 'gift', id, t: giftN, m: msg });
      A.log.unshift({ kind: 'gift', id, tickets: giftN, msg, at: new Date().toISOString(), token });
      save();
      showSendGrant(token, `🎁 ガチャ券を${giftN}枚プレゼント！${msg ? `\n💬 ${msg}` : ''}`);
    });
    $('#bk').addEventListener('click', async () => {
      const ok = await Link.copy(btoa(unescape(encodeURIComponent(JSON.stringify(A)))));
      toast(ok ? 'コピーしました' : 'コピーできませんでした');
    });
    $('#main').querySelectorAll('[data-resend]').forEach((b) => b.addEventListener('click', () => {
      const l = A.log.find((x) => x.id === b.dataset.resend && x.token);
      showSendGrant(l.token, resultText(l));
    }));
  }

  function logLabel(l) {
    if (l.kind === 'ok') return `✅ がまん認定 ${fmt(l.amount)}円 → 🎫${l.tickets}`;
    if (l.kind === 'ng') return `🙅 見送り ${fmt(l.amount)}円`;
    if (l.kind === 'gift') return `🎁 プレゼント 🎫${l.tickets}`;
    if (l.kind === 'use') { const p = PRIZE_BY_ID[l.prize]; return `🎟️ ${p ? `${p.emoji} ${p.name}` : 'ご褒美'} 使用`; }
    return '';
  }
  function resultText(l) {
    if (l.kind === 'ok') return `🎉 ${fmt(l.amount)}円のがまんを認定！ガチャ券${l.tickets}枚どうぞ${l.msg ? `\n💬 ${l.msg}` : ''}`;
    if (l.kind === 'ng') return `🙏 今回は見送りです${l.msg ? `\n💬 ${l.msg}` : ''}`;
    return `🎁 ガチャ券を${l.tickets}枚プレゼント！${l.msg ? `\n💬 ${l.msg}` : ''}`;
  }

  function showPair() {
    const url = Link.appUrl('pair', Link.pack({ k: A.pub, n: A.name }));
    openModal(`
      <h3>🤝 ${esc(wife())}に送ってね</h3>
      <p>このリンクを${esc(wife())}がタップすると、アプリとつながります。</p>
      ${Link.sendButtons(`🎰 ぽけっとガチャの管理者になりました！\nこのリンクをタップしてつないでね👇\n${url}`, 'ぽけっとガチャ つなぐリンク')}
      <p class="muted small">あいことば: <b class="fp">${A.fp}</b></p>
      <button class="btn wide" data-close>とじる</button>`);
  }

  function showSendGrant(token, text) {
    const url = Link.appUrl('grant', token);
    openModal(`
      <h3>📮 ${esc(wife())}に送ってね</h3>
      <p class="msg-big">${esc(text).replace(/\n/g, '<br>')}</p>
      ${Link.sendButtons(`${text}\n👇タップして受けとってね\n${url}`, 'ぽけっとガチャ')}
      <button class="btn wide" data-close>とじる</button>`);
  }

  /* ---------------- 申請・使用のリンクを開いたとき ---------------- */

  function handleRequest(value) {
    let r;
    try { r = Link.unpack(value); } catch (e) { r = null; }
    if (!r || !r.id) { toast('申請のリンクが正しくありません'); return; }
    const prev = A.log.find((l) => l.id === r.id && (l.kind === 'ok' || l.kind === 'ng'));
    if (prev) {
      openModal(`<h3>この申請はもう返事ずみです</h3>
        <p>${logLabel(prev)}（${fmtDate(prev.at)}）</p>
        <button class="btn primary wide" id="again">同じ返事をもう一度送る</button>
        <button class="btn wide" data-close>とじる</button>`, (root) => {
        root.querySelector('#again').addEventListener('click', () => showSendGrant(prev.token, resultText(prev)));
      });
      return;
    }
    let n = Math.floor(r.a / 100) * TICKETS_PER_100YEN;
    openModal(`
      <div class="req-card">
        <h3>💪 ${esc(wife())}からがまん申請</h3>
        <div class="req-amt">${fmt(r.a)}円</div>
        <p>${r.n ? `📍 ${esc(r.n)}<br>` : ''}<span class="muted small">${fmtDate(r.d)}</span></p>
        <p class="small">わたすガチャ券</p>
        <div class="stepper"><button class="btn" data-s="-1">−</button><b id="reqN">🎫${n}</b><button class="btn" data-s="1">＋</button></div>
        <input id="reqMsg" placeholder="ひとこと（例: えらい！）" maxlength="40">
        <button class="btn primary wide big" id="okBtn">✅ 認定する</button>
        <button class="btn wide danger-fill" id="ngBtn">🙅 今回は見送り</button>
        <button class="btn wide" data-close>あとで</button>
      </div>`, (root) => {
      root.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => {
        n = Math.max(0, Math.min(50, n + Number(b.dataset.s)));
        root.querySelector('#reqN').textContent = `🎫${n}`;
      }));
      const decide = async (k) => {
        const msg = root.querySelector('#reqMsg').value.trim();
        const token = await Link.signPack(A.priv, { k, id: r.id, t: k === 'ok' ? n : 0, m: msg });
        const l = { kind: k, id: r.id, amount: r.a, tickets: k === 'ok' ? n : 0, note: r.n, msg, at: new Date().toISOString(), token };
        A.log.unshift(l);
        save();
        showSendGrant(token, resultText(l));
      };
      root.querySelector('#okBtn').addEventListener('click', () => decide('ok'));
      root.querySelector('#ngBtn').addEventListener('click', () => decide('ng'));
    });
  }

  function handleUse(value) {
    let u;
    try { u = Link.unpack(value); } catch (e) { u = null; }
    if (!u || !u.id) { toast('リンクが正しくありません'); return; }
    const p = PRIZE_BY_ID[u.p];
    if (!A.log.some((l) => l.kind === 'use' && l.id === u.id)) {
      A.log.unshift({ kind: 'use', id: u.id, prize: u.p, won: u.w, at: u.u || new Date().toISOString() });
      save();
    }
    openModal(`
      <div class="req-card">
        <h3>🎟️ ご褒美チケットが使われました</h3>
        <div class="req-amt">${p ? p.emoji : '🎁'}</div>
        <p><b>${esc(p ? p.name : 'ご褒美')}</b><br>${esc(p ? p.desc : '')}</p>
        <p class="muted small">当たった日 ${u.w ? fmtDate(u.w) : '-'} ・ 使った日 ${u.u ? fmtDate(u.u) : '-'}</p>
        <p>${esc(wife())}にご褒美をあげてね 🎁</p>
        <button class="btn primary wide" data-close>OK</button>
      </div>`);
  }

  /* ---------------- 起動 ---------------- */

  render();
  const incoming = Link.readHash();
  if (incoming && !A) {
    toast('先にカギを作ってください（このスマホではまだ管理をはじめていません）');
  } else if (incoming) {
    Link.clearHash();
    if (incoming.type === 'req') {
      handleRequest(incoming.value);
    } else if (incoming.type === 'use') {
      handleUse(incoming.value);
    }
  }
})();
