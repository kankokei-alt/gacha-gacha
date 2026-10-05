/* ガチャモン — ミニゲーム用の2D物理エンジン
 *
 * 丸い物体（ボール）と、太さのある線（壁・アーム）だけを扱う。
 *  - ボールは 質量・慣性モーメント・速度・角速度・反発係数・摩擦係数 をもつ
 *  - 重力で加速し、ぶつかると衝撃（インパルス）で速度が変わる（逐次インパルス法）
 *  - 線は 動かない壁（static）か、プログラムで動かすもの（kinematic: UFOキャッチャーのアームなど）
 * 単位: 長さ px、時間 秒
 */
'use strict';

const Phys = (() => {
  const cross = (ax, ay, bx, by) => ax * by - ay * bx;

  class World {
    constructor({ gravity = 1400, sub = 4, iters = 8, linDamp = 0.05, angDamp = 0.6 } = {}) {
      Object.assign(this, { gravity, sub, iters, linDamp, angDamp });
      this.balls = [];
      this.segs = [];
      this.onContact = null; // (a, b, 衝突の強さ) ボールどうしが触れたとき
    }

    // density: 密度（質量 = 密度 × 面積）。e: 反発係数（0〜1）。mu: 摩擦係数
    ball(x, y, r, { density = 1, e = 0.2, mu = 0.4, vx = 0, vy = 0, ...props } = {}) {
      const m = density * Math.PI * r * r / 1000;
      const b = { x, y, r, vx, vy, a: 0, w: 0, m, invM: 1 / m, I: 0.5 * m * r * r, e, mu, age: 0, ...props };
      b.invI = 1 / b.I;
      this.balls.push(b);
      return b;
    }
    remove(b) { b.dead = true; this.balls = this.balls.filter((x) => x !== b); }

    // 太さ r の線分。kinematic なら move() で動かせる
    seg(ax, ay, bx, by, { r = 4, e = 0.2, mu = 0.5, kinematic = false, ...props } = {}) {
      const s = { ax, ay, bx, by, r, e, mu, kinematic, vax: 0, vay: 0, vbx: 0, vby: 0, ...props };
      s.pax = ax; s.pay = ay; s.pbx = bx; s.pby = by;
      this.segs.push(s);
      return s;
    }
    // 次の1コマ（1/60秒）で線分をここまで動かす。速度は移動量から求める
    move(s, ax, ay, bx, by) {
      s.tax = ax; s.tay = ay; s.tbx = bx; s.tby = by;
      s.moving = true;
    }

    step(frame = 1 / 60) {
      const dt = frame / this.sub;
      // 動く線分の速度
      for (const s of this.segs) {
        s.touch = false; s.pen = 0;
        if (!s.moving) { s.vax = s.vay = s.vbx = s.vby = 0; s.pax = s.ax; s.pay = s.ay; s.pbx = s.bx; s.pby = s.by; continue; }
        s.pax = s.ax; s.pay = s.ay; s.pbx = s.bx; s.pby = s.by;
        s.vax = (s.tax - s.ax) / frame; s.vay = (s.tay - s.ay) / frame;
        s.vbx = (s.tbx - s.bx) / frame; s.vby = (s.tby - s.by) / frame;
      }
      for (let k = 1; k <= this.sub; k++) {
        const f = k / this.sub;
        for (const s of this.segs) {
          if (!s.moving) continue;
          s.ax = s.pax + (s.tax - s.pax) * f; s.ay = s.pay + (s.tay - s.pay) * f;
          s.bx = s.pbx + (s.tbx - s.pbx) * f; s.by = s.pby + (s.tby - s.pby) * f;
        }
        this.substep(dt);
      }
      for (const s of this.segs) s.moving = false;
      for (const b of this.balls) b.age++;
    }

    substep(dt) {
      const g = this.gravity;
      const ld = Math.max(0, 1 - this.linDamp * dt), ad = Math.max(0, 1 - this.angDamp * dt);
      // 1) 重力と空気抵抗で速度を更新
      for (const b of this.balls) {
        if (b.fixed) continue;
        b.vy += g * dt;
        b.vx *= ld; b.vy *= ld; b.w *= ad;
      }
      // 2) 接触を見つける
      const cs = this.contacts();
      // 3) 衝撃をくり返し解く（ぶつかる方向 = 反発、接線方向 = 摩擦）
      for (let it = 0; it < this.iters; it++) for (const c of cs) this.solve(c);
      // 4) 速度で位置と角度を進める
      for (const b of this.balls) {
        if (b.fixed) continue;
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > 2500) { b.vx *= 2500 / sp; b.vy *= 2500 / sp; }
        b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.w * dt;
      }
      // 5) めりこみを少しずつ押しもどす（積み上げを安定させる）
      for (const c of cs) {
        const pen = c.pen - 0.4;
        if (pen <= 0) continue;
        const ia = c.A ? c.A.invM : 0, ib = c.B.invM, k = (pen * 0.5) / (ia + ib);
        if (c.A) { c.A.x -= c.nx * k * ia; c.A.y -= c.ny * k * ia; }
        c.B.x += c.nx * k * ib; c.B.y += c.ny * k * ib;
      }
    }

    contacts() {
      const cs = [], bs = this.balls, n = bs.length;
      for (let i = 0; i < n; i++) {
        const a = bs[i];
        for (let j = i + 1; j < n; j++) {
          const b = bs[j];
          const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r;
          if (dx > rr || dx < -rr || dy > rr || dy < -rr) continue;
          const d2 = dx * dx + dy * dy;
          if (d2 >= rr * rr || d2 < 1e-9) continue;
          const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
          const c = this.make(a, b, nx, ny, rr - d, nx * a.r, ny * a.r, -nx * b.r, -ny * b.r, 0, 0);
          cs.push(c);
          if (this.onContact) this.onContact(a, b, c);
        }
        for (const s of this.segs) {
          // 線分上でいちばん近い点
          const ex = s.bx - s.ax, ey = s.by - s.ay, len2 = ex * ex + ey * ey;
          let t = len2 ? ((a.x - s.ax) * ex + (a.y - s.ay) * ey) / len2 : 0;
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          const qx = s.ax + ex * t, qy = s.ay + ey * t;
          const dx = a.x - qx, dy = a.y - qy, rr = a.r + s.r, d2 = dx * dx + dy * dy;
          if (d2 >= rr * rr || d2 < 1e-9) continue;
          const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
          const svx = s.vax + (s.vbx - s.vax) * t, svy = s.vay + (s.vby - s.vay) * t;
          const c = this.make(null, a, nx, ny, rr - d, 0, 0, -nx * a.r, -ny * a.r, svx, svy, s);
          s.touch = true;
          if (rr - d > s.pen) s.pen = rr - d;
          cs.push(c);
        }
      }
      return cs;
    }

    // A = null のときは線分（質量無限大、速度 svx, svy）
    make(A, B, nx, ny, pen, rax, ray, rbx, rby, svx, svy, seg) {
      const e = Math.max(A ? A.e : seg.e, B.e);
      const mu = Math.sqrt((A ? A.mu : seg.mu) * B.mu);
      const ia = A ? A.invM : 0, iia = A ? A.invI : 0;
      const tx = -ny, ty = nx;
      const rta = cross(rax, ray, tx, ty), rtb = cross(rbx, rby, tx, ty);
      const c = { A, B, nx, ny, pen, rax, ray, rbx, rby, svx, svy, seg, e, mu, jn: 0, jt: 0,
        mn: 1 / (ia + B.invM), mt: 1 / (ia + B.invM + rta * rta * iia + rtb * rtb * B.invI) };
      // ぶつかった瞬間の速さに反発係数をかけた分だけ、はね返す
      const vn = this.relVel(c)[0] * nx + this.relVel(c)[1] * ny;
      c.bias = vn < -40 ? -e * vn : 0;
      c.impact = -vn;
      return c;
    }

    relVel(c) {
      const { A, B } = c;
      const vax = A ? A.vx - A.w * c.ray : c.svx, vay = A ? A.vy + A.w * c.rax : c.svy;
      const vbx = B.vx - B.w * c.rby, vby = B.vy + B.w * c.rbx;
      return [vbx - vax, vby - vay];
    }

    apply(c, px, py) {
      const { A, B } = c;
      if (A && !A.fixed) { A.vx -= px * A.invM; A.vy -= py * A.invM; A.w -= cross(c.rax, c.ray, px, py) * A.invI; }
      if (!B.fixed) { B.vx += px * B.invM; B.vy += py * B.invM; B.w += cross(c.rbx, c.rby, px, py) * B.invI; }
    }

    solve(c) {
      // ぶつかる方向
      let [rx, ry] = this.relVel(c);
      const vn = rx * c.nx + ry * c.ny;
      let dj = (c.bias - vn) * c.mn;
      const jn = Math.max(0, c.jn + dj);
      dj = jn - c.jn; c.jn = jn;
      this.apply(c, c.nx * dj, c.ny * dj);
      // 摩擦（押しつける力 × 摩擦係数 まで）
      [rx, ry] = this.relVel(c);
      const tx = -c.ny, ty = c.nx;
      const vt = rx * tx + ry * ty;
      let djt = -vt * c.mt;
      const max = c.mu * c.jn;
      const jt = Math.max(-max, Math.min(max, c.jt + djt));
      djt = jt - c.jt; c.jt = jt;
      this.apply(c, tx * djt, ty * djt);
    }
  }

  return { World };
})();
