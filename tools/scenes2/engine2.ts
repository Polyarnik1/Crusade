// Вторая версия движка: объёмные формы с нормалями. Свет луны (холодный, направленный)
// и костров (тёплый, точечный) считается по нормали — отсюда оранжевые и синие
// контурные блики на латах, камнях и снегу, как на живописном пиксель-арте.
import { M, MATS, Scene, bayer, clamp, fbm, hash } from '../scenes/engine';

export { M, bayer, clamp, fbm, hash };

type Tex = (x: number, y: number) => number;
interface ShapeOpt {
  tex?: Tex;
  flat?: number; // 0..1 — насколько форма плоская (1 — без объёма)
  tilt?: [number, number]; // наклон нормали всей формы
}

export class Scene2 extends Scene {
  nx: Float32Array;
  ny: Float32Array;
  hn: Uint8Array;
  ml: [number, number, number] = [0.55, -0.6, 0.58]; // направление на луну
  moonK = 0.95; // сила лунного света на объёмах
  amb = 0.3;

  constructor(w: number, h: number, seed: number) {
    super(w, h, seed);
    this.nx = new Float32Array(w * h);
    this.ny = new Float32Array(w * h);
    this.hn = new Uint8Array(w * h);
  }

  put(x: number, y: number, m: number, v: number) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    if (this.clip && (x < this.clip[0] || y < this.clip[1] || x > this.clip[2] || y > this.clip[3])) return;
    const i = y * this.w + x;
    this.mat[i] = m;
    this.val[i] = v;
    this.hn[i] = 0;
  }
  putN(x: number, y: number, m: number, v: number, nx: number, ny: number) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    if (this.clip && (x < this.clip[0] || y < this.clip[1] || x > this.clip[2] || y > this.clip[3])) return;
    const i = y * this.w + x;
    this.mat[i] = m;
    this.val[i] = v;
    const l = Math.hypot(nx, ny);
    if (l > 0.98) {
      nx = (nx / l) * 0.98;
      ny = (ny / l) * 0.98;
    }
    this.nx[i] = nx;
    this.ny[i] = ny;
    this.hn[i] = 1;
  }

  moonAt(x: number, y: number) {
    const dx = x - this.w / 2;
    this.dir = dx >= 0 ? 1 : -1;
    const k = clamp(Math.abs(dx) / (this.w / 2), 0.25, 1);
    const up = clamp(1 - y / this.h, 0.3, 1);
    const l = Math.hypot(k, up, 0.6);
    this.ml = [(this.dir * k) / l, -up / l, 0.6 / l];
  }

  ridge(o: Parameters<Scene['ridge']>[0]): Float32Array {
    const hs = super.ridge(o);
    const sd = this.seed + (o.seed ?? 5);
    for (let x = 0; x < this.w; x++) {
      const sl = (hs[Math.min(this.w - 1, x + 2)] - hs[Math.max(0, x - 2)]) / 4;
      for (let y = Math.ceil(hs[x]); y < this.h; y++) {
        const i = y * this.w + x;
        if (this.mat[i] !== (o.m ?? M.MTN) && this.mat[i] !== M.SNOW) continue;
        const d = y - hs[x];
        const cr = (fbm(x * 0.12 + y * 0.05, y * 0.12, sd + 3, 3) - 0.5) * 1.4;
        this.nx[i] = Math.max(-0.9, Math.min(0.9, sl * 1.1 + cr * 0.5));
        this.ny[i] = -0.45 + Math.min(0.4, d * 0.02);
        this.hn[i] = 1;
        this.val[i] = Math.max(0.15, this.val[i]) * 0.85 + 0.12;
      }
    }
    return hs;
  }

  /** Горный хребет из отдельных вершин; снег только выше снеговой линии. */
  peaks(o: { base: number; amp: number; freq: number; m?: number; seed?: number; snowLine?: number; haze?: number; lift?: number }): Float32Array {
    const m = o.m ?? M.MTN_FAR;
    const sd = this.seed + (o.seed ?? 5);
    const n = Math.max(3, Math.round(this.w * o.freq * 1.6));
    const pk: { x: number; h: number; wl: number; wr: number }[] = [];
    for (let i = 0; i < n; i++) {
      const x = ((i + 0.2 + hash(i, 1, sd) * 0.6) / n) * (this.w + 40) - 20;
      const h = o.amp * (0.3 + 0.7 * Math.pow(hash(i, 2, sd), 0.8));
      pk.push({ x, h, wl: h * (0.9 + hash(i, 3, sd) * 1.3), wr: h * (0.9 + hash(i, 4, sd) * 1.3) });
    }
    const hs = new Float32Array(this.w);
    const face = new Float32Array(this.w); // −1/1: склон влево/вправо
    for (let x = 0; x < this.w; x++) {
      let best = 0;
      let f = 0;
      for (const p of pk) {
        const dx = x - p.x;
        const v = p.h * (1 - Math.abs(dx) / (dx < 0 ? p.wl : p.wr));
        if (v > best) {
          best = v;
          f = dx < 0 ? -1 : 1;
        }
      }
      best += (fbm(x * 0.12, 0, sd, 3) - 0.5) * o.amp * 0.18;
      hs[x] = o.base - Math.max(0, best);
      face[x] = f;
    }
    const line = o.snowLine ?? o.base - o.amp * 0.5;
    for (let x = 0; x < this.w; x++) {
      for (let y = Math.ceil(hs[x]); y < this.h; y++) {
        const d = y - hs[x];
        // грань: к какой вершине относится точка (ближайшая ось внутри её треугольника)
        let fc = face[x];
        let bestK = 1e9;
        for (const p of pk) {
          const dx = x - p.x;
          const top = o.base - p.h * (1 - Math.abs(dx) / (dx < 0 ? p.wl : p.wr));
          if (y < top) continue;
          const kk = Math.abs(dx) / (dx < 0 ? p.wl : p.wr) - (o.base - y) / Math.max(1, p.h) * 0.3;
          if (kk < bestK) {
            bestK = kk;
            fc = dx < 0 ? -1 : 1;
          }
        }
        face[x] = face[x];
        const tex = (fbm(x * 0.1 - y * 0.12 * fc, y * 0.16, sd + 3, 3) - 0.5) * 0.4;
        let v = (o.lift ?? 0.32) + tex + (o.haze ?? 0.15) * Math.min(1, d / 30);
        let mm = m;
        const snowDepth = (line - hs[x]) * (0.8 + 0.5 * fbm(x * 0.2, y * 0.2, sd + 9, 2));
        if (line > hs[x] && d < snowDepth && (d < snowDepth - 2 || bayer(x, y) < (snowDepth - d) / 2) && tex > -0.12) {
          mm = M.SNOW;
          v = 0.5 + tex * 0.6;
        }
        const i = y * this.w + x;
        this.put(x, y, mm, v);
        this.nx[i] = fc * 0.72 + tex * 0.4;
        this.ny[i] = -0.35 + Math.min(0.35, d * 0.015);
        this.hn[i] = 1;
      }
    }
    return hs;
  }

  // ── объёмные формы ──────────────────────────────────
  ell(cx: number, cy: number, rx: number, ry: number, m: number, v: number, o: ShapeOpt = {}) {
    const fl = o.flat ?? 0;
    for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++)
      for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        const d = dx * dx + dy * dy;
        if (d > 1) continue;
        this.putN(x, y, m, v + (o.tex ? o.tex(x, y) : 0), dx * (1 - fl) + (o.tilt?.[0] ?? 0), dy * (1 - fl) + (o.tilt?.[1] ?? 0));
      }
  }

  /** Сужающаяся «капсула» от (x0,y0,r0) до (x1,y1,r1). */
  cap(x0: number, y0: number, x1: number, y1: number, r0: number, r1: number, m: number, v: number, o: ShapeOpt = {}) {
    const fl = o.flat ?? 0;
    const minx = Math.floor(Math.min(x0 - r0, x1 - r1) - 1);
    const maxx = Math.ceil(Math.max(x0 + r0, x1 + r1) + 1);
    const miny = Math.floor(Math.min(y0 - r0, y1 - r1) - 1);
    const maxy = Math.ceil(Math.max(y0 + r0, y1 + r1) + 1);
    const vx = x1 - x0;
    const vy = y1 - y0;
    const L2 = vx * vx + vy * vy || 1;
    for (let y = miny; y <= maxy; y++)
      for (let x = minx; x <= maxx; x++) {
        const px = x + 0.5 - x0;
        const py = y + 0.5 - y0;
        const t = clamp((px * vx + py * vy) / L2);
        const r = r0 + (r1 - r0) * t;
        const qx = px - vx * t;
        const qy = py - vy * t;
        const d = Math.hypot(qx, qy);
        if (d > r) continue;
        this.putN(x, y, m, v + (o.tex ? o.tex(x, y) : 0), (qx / r) * (1 - fl) + (o.tilt?.[0] ?? 0), (qy / r) * (1 - fl) + (o.tilt?.[1] ?? 0));
      }
  }

  /** Многоугольник; нормаль — от центра к краю (мягкий объём) или плоская. */
  poly(pts: [number, number][], m: number, v: number, o: ShapeOpt = {}) {
    const fl = o.flat ?? 0.6;
    const ys = pts.map((p) => p[1]);
    const xs = pts.map((p) => p[0]);
    const cx = xs.reduce((a, b) => a + b) / xs.length;
    const cy = ys.reduce((a, b) => a + b) / ys.length;
    const rx = (Math.max(...xs) - Math.min(...xs)) / 2 || 1;
    const ry = (Math.max(...ys) - Math.min(...ys)) / 2 || 1;
    for (let y = Math.floor(Math.min(...ys)); y <= Math.max(...ys); y++) {
      const yc = y + 0.5;
      const hits: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i];
        const [bx, by] = pts[(i + 1) % pts.length];
        if (ay <= yc !== by <= yc) hits.push(ax + ((yc - ay) / (by - ay)) * (bx - ax));
      }
      hits.sort((a, b) => a - b);
      for (let k = 0; k + 1 < hits.length; k += 2)
        for (let x = Math.ceil(hits[k] - 0.5); x < hits[k + 1] - 0.5; x++) {
          const nx = ((x - cx) / rx) * (1 - fl) * 0.9 + (o.tilt?.[0] ?? 0);
          const ny = ((y - cy) / ry) * (1 - fl) * 0.9 + (o.tilt?.[1] ?? 0);
          this.putN(x, y, m, v + (o.tex ? o.tex(x, y) : 0), nx, ny);
        }
    }
  }

  /** Россыпь камней с объёмом — на них красиво ложатся блики от огня. */
  pebbles(x0: number, x1: number, y0: number, y1: number, n: number, m: number = M.STONE, size = [0.8, 2.4]) {
    for (let i = 0; i < n; i++) {
      const x = this.rr(x0, x1);
      const y = this.rr(y0, y1);
      const r = this.rr(size[0], size[1]) * (0.6 + ((y - y0) / Math.max(1, y1 - y0)) * 0.7);
      this.ell(x, y, r * 1.4, r, m, this.rr(0.25, 0.45), { tilt: [0, -0.2] });
    }
  }

  /** Крупная луна с кратерами. */
  bigMoon(cx: number, cy: number, r: number, o: { red?: boolean; halo?: number; shadow?: number } = {}) {
    this.moonDisk(cx, cy, r, { red: o.red, halo: o.halo ?? 0.38, shadow: o.shadow });
    this.moonAt(cx, cy);
    const mm = o.red ? M.MOON_RED : M.MOON;
    for (let i = 0; i < Math.round(r * 0.9); i++) {
      const a = this.rr(0, Math.PI * 2);
      const d = Math.sqrt(this.rnd()) * r * 0.82;
      const ccx = cx + Math.cos(a) * d;
      const ccy = cy + Math.sin(a) * d;
      const cr = this.rr(0.8, r * 0.16);
      for (let y = Math.floor(ccy - cr - 1); y <= ccy + cr + 1; y++)
        for (let x = Math.floor(ccx - cr - 1); x <= ccx + cr + 1; x++) {
          if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) > r - 0.6) continue;
          if (this.m(x, y) !== mm) continue;
          const dd = Math.hypot(x + 0.5 - ccx, y + 0.5 - ccy) / cr;
          if (dd > 1.25) continue;
          const side = (x - ccx) * -this.dir + (y - ccy);
          if (dd < 0.85) this.add(x, y, -0.16);
          else if (side > 0) this.add(x, y, 0.1);
        }
    }
  }

  /** Языки пламени: несколько капель разной высоты + искры и угли. */
  bigFire(x: number, base: number, size: number, o: { light?: number; logs?: boolean } = {}) {
    if (o.logs !== false) {
      this.cap(x - size * 1.4, base + 1, x + size * 1.2, base - 1.5, 1.4, 1.2, M.WOOD, 0.3, { tex: (a, b) => (hash(a, b, 4) - 0.5) * 0.15 });
      this.cap(x - size * 1.2, base - 1.5, x + size * 1.4, base + 1, 1.4, 1.2, M.WOOD, 0.28, { tex: (a, b) => (hash(a, b, 5) - 0.5) * 0.15 });
      for (let i = -3; i <= 3; i++) this.ell(x + i * size * 0.55, base + 1.5 + Math.abs(i) * 0.2, 1.6, 1.1, M.STONE, 0.3);
    }
    const s = this.seed + 191;
    const tongues = 5;
    for (let k = 0; k < tongues; k++) {
      const off = (k - (tongues - 1) / 2) * size * 0.42;
      const hgt = size * (1.6 + 1.6 * hash(k, 3, s)) * (1 - Math.abs(off) / (size * 1.6));
      const wid = size * 0.55;
      for (let y = Math.floor(base - hgt); y <= base; y++) {
        const t = clamp((base - y) / hgt);
        const sway = Math.sin(t * 3 + k) * t * size * 0.35;
        const w = wid * Math.pow(1 - t, 0.6) * (0.9 + 0.3 * fbm(k, y * 0.3, s, 2));
        for (let dx = -Math.ceil(w); dx <= w; dx++) {
          const d = Math.abs(dx) / Math.max(0.6, w);
          if (d > 1) continue;
          const xx = Math.round(x + off + sway + dx);
          const v = (1 - d) * 0.55 + (1 - t) * 0.5 + (fbm(xx * 0.5, y * 0.4, s + 1, 2) - 0.5) * 0.25;
          const prev = this.m(xx, y) === M.FIRE ? this.v(xx, y) : 0;
          if (v > 0.15) this.put(xx, y, M.FIRE, Math.max(prev, v));
        }
      }
    }
    for (let i = 0; i < size * 6; i++) this.put(x + this.rr(-size * 1.3, size * 1.3), base + this.rr(-0.5, 1.5), M.FIRE, this.rr(0.3, 0.7));
    this.lights.push({ x, y: base - size, r: size * (o.light ?? 12), s: 1.15 });
  }

  render(): Uint8Array {
    const out = new Uint8Array(this.w * this.h * 4);
    const [lx, ly, lz] = this.ml;
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const i = y * this.w + x;
        let def = MATS[this.mat[i]];
        let v = this.val[i];
        if (!def.emissive) {
          let wl = 0;
          const has = this.hn[i] === 1;
          const nx = this.nx[i];
          const ny = this.ny[i];
          const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
          for (const L of this.lights) {
            const dxl = L.x - x;
            const dyl = L.y - y;
            const dist = Math.hypot(dxl, dyl * 1.1);
            const f = dist / L.r;
            if (f >= 1) continue;
            let k = L.s * (1 - f) * (1 - f);
            if (has) {
              const ll = Math.hypot(dxl, dyl, 5);
              const nd = (nx * dxl + ny * dyl + nz * 5) / ll;
              k *= clamp(nd * 1.4 + 0.05, 0, 1.6);
            }
            wl += k;
          }
          if (has) {
            const md = Math.max(0, nx * lx + ny * ly + nz * lz);
            const rim = nz < 0.55 && nx * lx + ny * ly > 0.1 ? 0.3 : 0;
            v = v * (this.amb + this.moonK * md) + rim * this.moonK;
          }
          if (wl > 0 && def.warm !== undefined && wl * 1.6 > bayer(x + 2, y + 1)) {
            def = MATS[def.warm];
            v = v * 0.45 + Math.min(1.1, wl) * 0.62;
          } else v += wl * 0.2;
          const vx = (x / this.w - 0.5) * 2;
          const vy = (y / this.h - 0.45) * 2;
          v -= this.vignette * Math.max(0, Math.hypot(vx * 0.9, vy) - 0.55);
        }
        const n = def.ramp.length;
        const idx = clamp(Math.floor(v * (n - 1) + bayer(x, y)), 0, n - 1);
        const c = def.ramp[idx];
        out[i * 4] = c[0];
        out[i * 4 + 1] = c[1];
        out[i * 4 + 2] = c[2];
        out[i * 4 + 3] = 255;
      }
    return out;
  }
}

// ── фигуры ─────────────────────────────────────────────
const plate = (s: Scene2) => (x: number, y: number) => (hash(x, y, 77) - 0.5) * 0.08 + (fbm(x * 0.3, y * 0.3, s.seed, 2) - 0.5) * 0.1;
const folds = (x: number, y: number) => Math.sin(x * 0.9 + y * 0.15) * 0.07 + (hash(x, y, 9) - 0.5) * 0.05;

export interface KOpt {
  f?: 1 | -1; // куда смотрит
  plume?: boolean;
  cape?: number; // материал плаща
}

/** Голова в топфхельме. */
function helm(s: Scene2, x: number, y: number, k: number, f: number, plume = true) {
  if (plume) {
    s.cap(x - f * 1 * k, y - 5 * k, x - f * 6 * k, y - 3 * k, 1.6 * k, 0.8 * k, M.RED, 0.42, { tex: folds });
    s.cap(x - f * 6 * k, y - 3 * k, x - f * 8 * k, y + 1 * k, 0.9 * k, 0.4 * k, M.RED, 0.36, { tex: folds });
  }
  s.ell(x, y, 4.2 * k, 5 * k, M.METAL, 0.5, { tex: plate(s) });
  s.rect(x - 2 * k + f * 1 * k, y - 0.4 * k, x + f * 4.2 * k, y + 0.3 * k, M.METAL, 0.02); // смотровая щель
  for (let i = 0; i < 3; i++) s.put(x + f * (1.2 + i) * k, y + 2.2 * k, M.METAL, 0.05);
  s.cap(x, y - 5 * k, x, y + 4.5 * k, 0.6 * k, 0.6 * k, M.METAL, 0.62, { tilt: [0.2 * f, 0] });
}

export function knightSit(s: Scene2, x: number, y: number, k: number, o: KOpt = {}) {
  const f = o.f ?? 1;
  const cape = o.cape ?? M.CLOTH;
  // камень-сиденье
  s.ell(x - 4 * f * k, y - 5 * k, 10 * k, 6.5 * k, M.STONE, 0.34, { tex: (a, b) => (fbm(a * 0.4, b * 0.4, 3, 3) - 0.5) * 0.25 });
  // плащ
  s.poly([[x - f * 2 * k, y - 34 * k], [x + f * 3 * k, y - 32 * k], [x - f * 3 * k, y - 8 * k], [x - f * 15 * k, y - 1 * k], [x - f * 12 * k, y - 18 * k]], cape, 0.3, { tex: folds, flat: 0.4 });
  // дальняя нога
  s.cap(x - f * 1 * k, y - 15 * k, x + f * 8 * k, y - 15 * k, 3.4 * k, 2.8 * k, M.METAL, 0.32, { tex: plate(s) });
  s.cap(x + f * 8 * k, y - 15 * k, x + f * 9 * k, y - 1 * k, 2.6 * k, 2.2 * k, M.METAL, 0.32, { tex: plate(s) });
  s.ell(x + f * 10.5 * k, y - 0.6 * k, 3 * k, 1.4 * k, M.METAL, 0.28);
  // торс
  s.ell(x + f * 0.5 * k, y - 25 * k, 6.2 * k, 9.5 * k, M.METAL, 0.5, { tex: plate(s) });
  s.rect(x - 5 * k, y - 18 * k, x + 6 * k, y - 17 * k, M.WOOD, 0.25);
  s.cap(x + f * 1 * k, y - 32 * k, x + f * 2 * k, y - 20 * k, 0.6 * k, 0.6 * k, M.METAL, 0.65);
  // ближняя нога
  s.cap(x, y - 14 * k, x + f * 10 * k, y - 16 * k, 3.6 * k, 3 * k, M.METAL, 0.45, { tex: plate(s) });
  s.ell(x + f * 10 * k, y - 16 * k, 2.6 * k, 2.4 * k, M.METAL, 0.55);
  s.cap(x + f * 10 * k, y - 15 * k, x + f * 11.5 * k, y - 1.5 * k, 2.7 * k, 2.3 * k, M.METAL, 0.45, { tex: plate(s) });
  s.ell(x + f * 13 * k, y - 0.8 * k, 3.2 * k, 1.5 * k, M.METAL, 0.4);
  // наплечник и рука, кисть на колене
  s.ell(x + f * 2.5 * k, y - 32 * k, 4.8 * k, 3.6 * k, M.METAL, 0.55, { tex: plate(s) });
  s.cap(x + f * 3.5 * k, y - 31 * k, x + f * 7 * k, y - 23 * k, 2.3 * k, 2.1 * k, M.METAL, 0.48, { tex: plate(s) });
  s.cap(x + f * 7 * k, y - 23 * k, x + f * 11 * k, y - 18.5 * k, 2.1 * k, 2 * k, M.METAL, 0.48, { tex: plate(s) });
  s.ell(x + f * 11.5 * k, y - 18 * k, 2 * k, 1.8 * k, M.METAL, 0.4);
  // голова, чуть опущена
  s.ell(x + f * 1.5 * k, y - 35.5 * k, 2.6 * k, 1.6 * k, M.METAL, 0.3);
  helm(s, x + f * 2.5 * k, y - 40.5 * k, k, f, o.plume !== false);
}

export function knightStand(s: Scene2, x: number, y: number, k: number, o: KOpt & { sword?: boolean; arms?: 'down' | 'v' | 'pommel' } = {}) {
  const f = o.f ?? 1;
  const cape = o.cape ?? M.CLOTH;
  const arms = o.arms ?? (o.sword ? 'pommel' : 'down');
  s.poly([[x - 5 * k, y - 38 * k], [x + 5 * k, y - 38 * k], [x + 8 * k, y - 1 * k], [x - 9 * k, y]], cape, 0.28, { tex: folds, flat: 0.4 });
  s.cap(x - 2.5 * k, y - 18 * k, x - 3 * k, y - 1 * k, 2.8 * k, 2.3 * k, M.METAL, 0.42, { tex: plate(s) });
  s.cap(x + 2.5 * k, y - 18 * k, x + 3 * k, y - 1 * k, 2.8 * k, 2.3 * k, M.METAL, 0.42, { tex: plate(s) });
  s.ell(x - 3.5 * k, y - 0.6 * k, 2.8 * k, 1.3 * k, M.METAL, 0.32);
  s.ell(x + 3.5 * k, y - 0.6 * k, 2.8 * k, 1.3 * k, M.METAL, 0.32);
  s.ell(x - 3 * k, y - 10 * k, 2.2 * k, 2 * k, M.METAL, 0.55);
  s.ell(x + 3 * k, y - 10 * k, 2.2 * k, 2 * k, M.METAL, 0.55);
  s.ell(x, y - 27 * k, 6.4 * k, 9.5 * k, M.METAL, 0.5, { tex: plate(s) });
  s.poly([[x - 4 * k, y - 34 * k], [x + 4 * k, y - 34 * k], [x + 5.5 * k, y - 21 * k], [x + 6 * k, y - 11 * k], [x - 6 * k, y - 11 * k], [x - 5.5 * k, y - 21 * k]], o.cape === M.BLUE ? M.BLUE : M.RED, 0.36, { tex: folds, flat: 0.3 });
  s.rect(x - 1 * k, y - 32 * k, x + 1 * k, y - 22 * k, M.GOLD, 0.45);
  s.rect(x - 4 * k, y - 28 * k, x + 4 * k, y - 27 * k, M.GOLD, 0.45);
  s.rect(x - 6 * k, y - 21 * k, x + 6 * k, y - 20 * k, M.WOOD, 0.22);
  s.cap(x, y - 34 * k, x, y - 22 * k, 0.6 * k, 0.6 * k, M.METAL, 0.65);
  s.ell(x - 5.5 * k, y - 33.5 * k, 4.2 * k, 3.4 * k, M.METAL, 0.55, { tex: plate(s) });
  s.ell(x + 5.5 * k, y - 33.5 * k, 4.2 * k, 3.4 * k, M.METAL, 0.55, { tex: plate(s) });
  if (arms === 'v') {
    s.cap(x - 6 * k, y - 33 * k, x - 11 * k, y - 42 * k, 2.2 * k, 2 * k, M.METAL, 0.48, { tex: plate(s) });
    s.cap(x - 11 * k, y - 42 * k, x - 14 * k, y - 51 * k, 2 * k, 1.9 * k, M.METAL, 0.48, { tex: plate(s) });
    s.cap(x + 6 * k, y - 33 * k, x + 11 * k, y - 42 * k, 2.2 * k, 2 * k, M.METAL, 0.48, { tex: plate(s) });
    s.cap(x + 11 * k, y - 42 * k, x + 14 * k, y - 51 * k, 2 * k, 1.9 * k, M.METAL, 0.48, { tex: plate(s) });
  } else if (arms === 'pommel') {
    // меч воткнут перед собой, руки на навершии
    s.cap(x, y - 22 * k, x, y + 0.5 * k, 1.1 * k, 0.5 * k, M.METAL, 0.72, { flat: 0.3 });
    s.rect(x - 4 * k, y - 23 * k, x + 4 * k, y - 22 * k, M.GOLD, 0.5);
    s.cap(x, y - 27 * k, x, y - 23 * k, 0.8 * k, 0.8 * k, M.WOOD, 0.4);
    s.cap(x - 6 * k, y - 32 * k, x - 4 * k, y - 25 * k, 2.2 * k, 2 * k, M.METAL, 0.48, { tex: plate(s) });
    s.cap(x + 6 * k, y - 32 * k, x + 4 * k, y - 25 * k, 2.2 * k, 2 * k, M.METAL, 0.48, { tex: plate(s) });
    s.ell(x, y - 26 * k, 3 * k, 2 * k, M.METAL, 0.45);
    s.ell(x, y - 28.5 * k, 1.2 * k, 1.2 * k, M.GOLD, 0.6);
  } else {
    s.cap(x - 6.5 * k, y - 32 * k, x - 7.5 * k, y - 21 * k, 2.2 * k, 2 * k, M.METAL, 0.48, { tex: plate(s) });
    s.cap(x + 6.5 * k, y - 32 * k, x + 7.5 * k, y - 21 * k, 2.2 * k, 2 * k, M.METAL, 0.48, { tex: plate(s) });
    s.ell(x - 7.5 * k, y - 20 * k, 1.9 * k, 1.8 * k, M.METAL, 0.4);
    s.ell(x + 7.5 * k, y - 20 * k, 1.9 * k, 1.8 * k, M.METAL, 0.4);
  }
  s.ell(x, y - 37 * k, 2.6 * k, 1.6 * k, M.METAL, 0.3);
  helm(s, x + f * 0.5 * k, y - 42 * k, k, f, o.plume !== false);
}

export function knightWalk(s: Scene2, x: number, y: number, k: number, o: KOpt = {}) {
  const f = o.f ?? 1;
  const cape = o.cape ?? M.CLOTH;
  s.poly([[x - f * 3 * k, y - 38 * k], [x + f * 4 * k, y - 37 * k], [x - f * 4 * k, y - 4 * k], [x - f * 16 * k, y - 2 * k], [x - f * 12 * k, y - 20 * k]], cape, 0.28, { tex: folds, flat: 0.4 });
  // задняя нога
  s.cap(x - f * 1 * k, y - 18 * k, x - f * 5 * k, y - 9 * k, 2.8 * k, 2.4 * k, M.METAL, 0.32, { tex: plate(s) });
  s.cap(x - f * 5 * k, y - 9 * k, x - f * 8 * k, y - 1 * k, 2.4 * k, 2.1 * k, M.METAL, 0.32, { tex: plate(s) });
  s.ell(x - f * 8.5 * k, y - 0.6 * k, 2.6 * k, 1.3 * k, M.METAL, 0.28);
  s.ell(x + f * 1 * k, y - 27 * k, 6 * k, 9.5 * k, M.METAL, 0.5, { tex: plate(s) });
  s.rect(x - 5 * k, y - 20 * k, x + 6 * k, y - 19 * k, M.WOOD, 0.25);
  // передняя нога
  s.cap(x + f * 1 * k, y - 18 * k, x + f * 5 * k, y - 10 * k, 3 * k, 2.6 * k, M.METAL, 0.45, { tex: plate(s) });
  s.ell(x + f * 5 * k, y - 10 * k, 2.2 * k, 2 * k, M.METAL, 0.55);
  s.cap(x + f * 5 * k, y - 10 * k, x + f * 5.5 * k, y - 1 * k, 2.5 * k, 2.2 * k, M.METAL, 0.45, { tex: plate(s) });
  s.ell(x + f * 7 * k, y - 0.6 * k, 2.8 * k, 1.3 * k, M.METAL, 0.4);
  s.ell(x + f * 2 * k, y - 34 * k, 4.6 * k, 3.5 * k, M.METAL, 0.55, { tex: plate(s) });
  s.cap(x + f * 3 * k, y - 33 * k, x + f * 6 * k, y - 25 * k, 2.2 * k, 2 * k, M.METAL, 0.48, { tex: plate(s) });
  s.cap(x + f * 6 * k, y - 25 * k, x + f * 10 * k, y - 22 * k, 2 * k, 1.9 * k, M.METAL, 0.48, { tex: plate(s) });
  // факел или посох в руке
  s.cap(x + f * 10.5 * k, y - 30 * k, x + f * 10 * k, y - 4 * k, 0.6 * k, 0.6 * k, M.WOOD, 0.4);
  s.ell(x + f * 2 * k, y - 37.5 * k, 2.6 * k, 1.6 * k, M.METAL, 0.3);
  helm(s, x + f * 2.5 * k, y - 42.5 * k, k, f, o.plume !== false);
}

export function wolf(s: Scene2, x: number, y: number, k: number, f: 1 | -1 = 1) {
  const c = M.METAL;
  s.cap(x - f * 9 * k, y - 4 * k, x - f * 15 * k, y - 9 * k, 2 * k, 1 * k, c, 0.18);
  s.ell(x - f * 3 * k, y - 8 * k, 7.5 * k, 4.5 * k, c, 0.2);
  s.cap(x - f * 7 * k, y - 6 * k, x - f * 8 * k, y, 1.6 * k, 1.2 * k, c, 0.16);
  s.cap(x + f * 2 * k, y - 7 * k, x + f * 3 * k, y, 1.6 * k, 1.2 * k, c, 0.18);
  s.cap(x + f * 3 * k, y - 9 * k, x + f * 6 * k, y - 18 * k, 3 * k, 2.4 * k, c, 0.22);
  s.ell(x + f * 7 * k, y - 20 * k, 3 * k, 2.6 * k, c, 0.22);
  s.cap(x + f * 8 * k, y - 21 * k, x + f * 12 * k, y - 25 * k, 1.6 * k, 0.9 * k, c, 0.22); // морда вверх — воет
  s.cap(x + f * 6 * k, y - 22 * k, x + f * 5 * k, y - 26 * k, 1 * k, 0.4 * k, c, 0.2);
}

export function cat(s: Scene2, x: number, y: number, k: number) {
  const c = M.METAL;
  s.ell(x, y - 5 * k, 4 * k, 5.5 * k, c, 0.14);
  s.ell(x + 0.5 * k, y - 12 * k, 3.2 * k, 2.8 * k, c, 0.16);
  s.poly([[x - 2.5 * k, y - 13 * k], [x - 2 * k, y - 17 * k], [x - 0.5 * k, y - 14 * k]], c, 0.15);
  s.poly([[x + 1.5 * k, y - 14 * k], [x + 3 * k, y - 17 * k], [x + 3.4 * k, y - 13 * k]], c, 0.15);
  s.put(x - 0.8 * k, y - 12 * k, M.GOLD, 0.95);
  s.put(x + 1.8 * k, y - 12 * k, M.GOLD, 0.95);
  s.lights.push({ x: x + 0.5 * k, y: y - 12 * k, r: 5, s: 0.25 });
  for (let i = 0; i < 9 * k; i++) {
    const t = i / (9 * k);
    s.put(x + 3 * k + t * 5 * k, y - 1 * k - Math.sin(t * 3) * 5 * k, c, 0.15);
    s.put(x + 3 * k + t * 5 * k, y - 0 * k - Math.sin(t * 3) * 5 * k, c, 0.12);
  }
}
