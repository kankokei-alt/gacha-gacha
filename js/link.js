/* ガチャモン — 管理者（だんなさん）とのやりとり
 *
 * サーバーを使わずに「認定」を実現するため、電子署名を使います。
 * - 管理者のスマホで鍵のペアを作り、秘密鍵は管理者のスマホから出しません
 * - 公開鍵だけをアプリに渡しておき、認定リンクの署名をアプリ側で確かめます
 * そのため、認定リンクは管理者のスマホでしか作れません。
 */
'use strict';

const Link = (() => {
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const ALG = { name: 'ECDSA', namedCurve: 'P-256' };
  const SIG = { name: 'ECDSA', hash: 'SHA-256' };

  const b64u = (buf) => {
    const bytes = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  const unb64u = (str) => {
    let s = str.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  };
  const pack = (obj) => b64u(enc.encode(JSON.stringify(obj)));
  const unpack = (str) => JSON.parse(dec.decode(unb64u(str)));
  const uid = () => b64u(crypto.getRandomValues(new Uint8Array(9)));

  async function generateKeys() {
    const k = await crypto.subtle.generateKey(ALG, true, ['sign', 'verify']);
    return {
      priv: await crypto.subtle.exportKey('jwk', k.privateKey),
      pub: b64u(await crypto.subtle.exportKey('raw', k.publicKey)),
    };
  }

  // 署名つきのデータを "データ.署名" の形にする
  async function signPack(privJwk, obj) {
    const body = pack(obj);
    const key = await crypto.subtle.importKey('jwk', privJwk, ALG, false, ['sign']);
    const sig = b64u(await crypto.subtle.sign(SIG, key, enc.encode(body)));
    return `${body}.${sig}`;
  }

  // 署名が正しければ中身を、だめなら null を返す
  async function verifyPack(pub, token) {
    try {
      const [body, sig] = token.split('.');
      const key = await crypto.subtle.importKey('raw', unb64u(pub), ALG, false, ['verify']);
      const ok = await crypto.subtle.verify(SIG, key, unb64u(sig), enc.encode(body));
      return ok ? unpack(body) : null;
    } catch (e) {
      return null;
    }
  }

  // 公開鍵の「指紋」。2台のスマホで同じ文字が出ていれば正しくつながっている
  async function fingerprint(pub) {
    const h = await crypto.subtle.digest('SHA-256', unb64u(pub));
    const s = b64u(h).replace(/[-_]/g, '').toUpperCase();
    return `${s.slice(0, 4)}-${s.slice(4, 8)}`;
  }

  const base = () => location.href.split('#')[0].split('?')[0].replace(/[^/]*$/, '');
  // openExternalBrowser=1 … LINEの中のブラウザではなく、いつものブラウザで開かせる
  const appUrl = (type, value) => `${base()}?openExternalBrowser=1#${type}=${value}`;
  const adminUrl = (type, value) => `${base()}admin.html?openExternalBrowser=1#${type}=${value}`;
  const lineUrl = (text) => `https://line.me/R/share?text=${encodeURIComponent(text)}`;
  const mailUrl = (subject, body) => `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  function readHash() {
    const m = location.hash.match(/^#(\w+)=([A-Za-z0-9_\-.]+)$/);
    return m ? { type: m[1], value: m[2] } : null;
  }
  function clearHash() {
    history.replaceState(null, '', location.pathname);
  }
  // 貼りつけられた文字（リンクでもコードでも）から中身を取り出す
  function parsePasted(text) {
    const m = String(text).trim().match(/#(\w+)=([A-Za-z0-9_\-.]+)/);
    return m ? { type: m[1], value: m[2] } : null;
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e2) { /* noop */ }
      ta.remove();
      return ok;
    }
  }

  // 送信ボタン一式（LINE・メール・コピー）
  function sendButtons(text, subject) {
    return `<div class="send-row">
      <a class="btn line wide" href="${lineUrl(text)}" target="_blank" rel="noopener">LINEで送る</a>
      <div class="row2">
        <a class="btn" href="${mailUrl(subject, text)}">メールで送る</a>
        <button class="btn" data-copy="${encodeURIComponent(text)}">コピー</button>
      </div>
    </div>`;
  }

  return { pack, unpack, uid, generateKeys, signPack, verifyPack, fingerprint, appUrl, adminUrl, readHash, clearHash, parsePasted, copy, sendButtons };
})();

// data-copy ボタンはどの画面でも同じ動き
document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-copy]');
  if (!b) return;
  const ok = await Link.copy(decodeURIComponent(b.dataset.copy));
  const old = b.textContent;
  b.textContent = ok ? 'コピーしました' : 'コピーできませんでした';
  setTimeout(() => { b.textContent = old; }, 1500);
});
