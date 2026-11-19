// Движок пиксельных сцен. Рисуем не цветами, а «материалами» с яркостью 0..1;
// в конце каждый материал раскладывается по своей палитре-рампе с упорядоченным
// дизерингом (Байер 4×4). Тёплые источники (костры, окна) перекрашивают
// освещённые материалы в тёплые рампы — отсюда оранжевые блики на холодной ночи.

export type RGB = [number, number, number];

const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

interface MatDef {
  ramp: RGB[];
  warm?: number; // материал под тёплым светом
  emissive?: boolean; // светится сам, свет на него не влияет
}

const MATS: MatDef[] = [];
function mat(ramp: string[], o: { warm?: number; emissive?: boolean } = {}): number {
  MATS.push({ ramp: ramp.map(hex), ...o });
  return MATS.length - 1;
}

// ── палитра ───────────────────────────────────────────────
export const M = (() => {
  const ROCK_W = mat(['#120a10', '#26141a', '#44221e', '#6e3624', '#a2522c', '#d8823a']);
  const GROUND_W = mat(['#120a0e', '#241216', '#3e2018', '#66361e', '#985224', '#cc7c34']);
  const METAL_W = mat(['#140a0c', '#301812', '#5a2c1a', '#924a24', '#cc7a36', '#f4b45a', '#ffe0a0']);
  const WOOD_W = mat(['#160a08', '#30160c', '#542812', '#84421a', '#b86426', '#e0903a']);
  const STONE_W = mat(['#120a10', '#261418', '#42221e', '#6a3826', '#9c5630', '#d0803c']);
  const SNOW_W = mat(['#3a2a3a', '#6a4a4a', '#a4705a', '#d8a070', '#f4cc90', '#fff0c8']);
  const CLOTH_W = mat(['#1a080a', '#3a1010', '#62201a', '#943422', '#c8502a']);
  const PARCH_W = mat(['#3a2414', '#6a4420', '#a87034', '#e0a450', '#ffd890']);
  return {
    VOID: mat(['#04040a']),
    SKY: mat(['#070a18', '#0b1128', '#111a3a', '#18264c', '#213462', '#2c4478', '#3a578e', '#4e6ca4', '#6a86ba']),
    SKY_WARM: mat(['#0a0c20', '#121630', '#1e1c40', '#2e2248', '#46284e', '#64304e', '#88394a', '#ae4a44', '#d06a40', '#ea9446', '#f8c060']),
    SKY_RED: mat(['#080408', '#140810', '#220c16', '#34101c', '#4a1620', '#621c22', '#7e2624', '#9c3626']),
    SKY_DAWN: mat(['#141a3c', '#22244c', '#3a2c58', '#5a3660', '#844462', '#b05a60', '#d47c62', '#eca468', '#f8cc80', '#fff0b8']),
    STAR: mat(['#3a578e', '#7f98c8', '#c8d6f2', '#ffffff']),
    MOON: mat(['#1c2450', '#2c3870', '#44528c', '#6c74a0', '#a6a28e', '#d4c89a', '#efe2b4', '#fff6d6']),
    MOON_RED: mat(['#2a0c12', '#4a1418', '#74201e', '#a03424', '#c8562e', '#e8844a', '#f8b878']),
    SUN: mat(['#d46a2c', '#ec9236', '#f8bc4c', '#ffe08a', '#fff6d0'], { emissive: true }),
    CLOUD: mat(['#0c1230', '#131c40', '#1c2950', '#273864', '#344a7a', '#46608f', '#6280ad', '#8aa2c8']),
    CLOUD_WARM: mat(['#100e26', '#1c1834', '#2c2040', '#42284a', '#5e304e', '#82404e', '#a8524c', '#cc6e4c', '#ec9a58']),
    CLOUD_RED: mat(['#120810', '#200c14', '#30101a', '#44161e', '#5c1e22', '#7a2a26']),
    AURORA: mat(['#0e2a3a', '#124a4a', '#16705a', '#2a9a6a', '#5cc888', '#a0f0b4'], { emissive: true }),
    MTN_FAR: mat(['#10173a', '#151f46', '#1c2852', '#243460', '#2e4170', '#3a5082', '#4c6496']),
    MTN: mat(['#0a0e24', '#0f142e', '#151b3a', '#1d2448', '#262f58', '#323d6a', '#42507e'], { warm: ROCK_W }),
    FOG: mat(['#1a2448', '#22305a', '#2c3c6a', '#38497a', '#48598a', '#5c6e9e']),
    GROUND: mat(['#06070f', '#0b0d18', '#111422', '#181c2e', '#20263c', '#2a324c', '#36405e'], { warm: GROUND_W }),
    SNOW: mat(['#1e2a4c', '#2c3c64', '#40547e', '#5c729a', '#7e94b8', '#a6b8d4', '#cad8ea', '#eef4fc'], { warm: SNOW_W }),
    PINE: mat(['#03060c', '#060c14', '#0b141c', '#122026', '#1a2c32', '#24403e'], { warm: GROUND_W }),
    STONE: mat(['#07080f', '#0d0f1c', '#141828', '#1c2236', '#262e46', '#323c58', '#424e6c'], { warm: STONE_W }),
    ROOF: mat(['#06060e', '#0c0c18', '#141424', '#1e1c32', '#2a2642', '#383254']),
    WINDOW: mat(['#5a200c', '#a44618', '#e08030', '#fcbc54', '#fff0a8'], { emissive: true }),
    FIRE: mat(['#2e0c06', '#5e1a0a', '#9c300c', '#d65412', '#f08a22', '#fcbc44', '#ffe48c', '#fffae0'], { emissive: true }),
    WOOD: mat(['#07060a', '#0e0b10', '#181218', '#241a1e', '#342428', '#463032'], { warm: WOOD_W }),
    METAL: mat(['#05060c', '#0c0e18', '#181c2c', '#2a3046', '#444c66', '#6a7490', '#a2acc4', '#dfe5f0'], { warm: METAL_W }),
    CLOTH: mat(['#0a0408', '#16080e', '#260c14', '#3a121a', '#521a20', '#6e2428'], { warm: CLOTH_W }),
    RED: mat(['#1a0608', '#34090c', '#5a1012', '#86181a', '#b02822', '#d84430'], { warm: CLOTH_W }),
    BLUE: mat(['#060a1a', '#0c142e', '#142248', '#1e3466', '#2c4c8c', '#4268b0']),
    GREEN: mat(['#040c0a', '#081812', '#0e281c', '#163c28', '#205236', '#2e6a46']),
    GOLD: mat(['#2a1808', '#4e300c', '#7e5414', '#b0801e', '#e0b03a', '#f8d870', '#fff4bc'], { emissive: false }),
    PARCH: mat(['#1a1610', '#2e2618', '#463a26', '#625238', '#806c4c', '#a08a62'], { warm: PARCH_W }),
    WATER: mat(['#04081a', '#08102a', '#0e1a3a', '#16264c', '#203662', '#2e4a7a', '#446494', '#6a88b4', '#a2bcdc']),
    LAVA: mat(['#3a0c06', '#6e1808', '#ac2c0a', '#e05210', '#f88a20', '#ffc850'], { emissive: true }),
    ICE: mat(['#0e1c34', '#18304e', '#244868', '#346486', '#4c84a6', '#74aac6']),
    BIRCH: mat(['#20242e', '#3a3e4a', '#5c6070', '#8a8e9c', '#bcc0cc', '#e4e8f0'], { warm: SNOW_W }),
    FLESH: mat(['#1a0e10', '#3a2020', '#5e3a30', '#8a5a44']),
  };
})();

// ── шум ───────────────────────────────────────────────────
export function hash(x: number, y: number, s: number): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
export function vnoise(x: number, y: number, s: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s);
  const b = hash(xi + 1, yi, s);
  const c = hash(xi, yi + 1, s);
  const d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x: number, y: number, s: number, oct = 4): number {
  let sum = 0;
  let amp = 0.5;
  let f = 1;
  let norm = 0;
  for (let i = 0; i < oct; i++) {
    sum += amp * vnoise(x * f, y * f, s + i * 17);
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return sum / norm;
}
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export const bayer = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)];
export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const smooth = (a: number, b: number, t: number) => {
  const x = clamp((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};

export type Cell = [number, number]; // [материал, яркость]
export type Key = Record<string, Cell>;

export class Scene {
  w: number;
  h: number;
  seed: number;
  mat: Uint8Array;
  val: Float32Array;
  lights: { x: number; y: number; r: number; s: number }[] = [];
  dir = 1; // откуда светит луна: 1 — справа, -1 — слева
  moon: { x: number; y: number; r: number } | null = null;
  vignette = 0.22;
  clip: [number, number, number, number] | null = null;
  private st: number;

  constructor(w: number, h: number, seed: number) {
    this.w = w;
    this.h = h;
    this.seed = seed;
    this.st = seed * 7919 + 1;
    this.mat = new Uint8Array(w * h);
    this.val = new Float32Array(w * h);
  }

  rnd(): number {
    this.st = (this.st + 0x6d2b79f5) | 0;
    let t = this.st;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  rr(a: number, b: number) {
    return a + (b - a) * this.rnd();
  }

  put(x: number, y: number, m: number, v: number) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    if (this.clip && (x < this.clip[0] || y < this.clip[1] || x > this.clip[2] || y > this.clip[3])) return;
    const i = y * this.w + x;
    this.mat[i] = m;
    this.val[i] = v;
  }
  m(x: number, y: number) {
    return this.mat[y * this.w + x];
  }
  v(x: number, y: number) {
    return this.val[y * this.w + x];
  }
  add(x: number, y: number, dv: number) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.val[y * this.w + x] += dv;
  }
  rect(x0: number, y0: number, x1: number, y1: number, m: number, v: number | ((x: number, y: number) => number)) {
    for (let y = Math.round(y0); y <= Math.round(y1); y++)
      for (let x = Math.round(x0); x <= Math.round(x1); x++) this.put(x, y, m, typeof v === 'number' ? v : v(x, y));
  }
  line(x0: number, y0: number, x1: number, y1: number, m: number, v: number) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) this.put(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, m, v);
  }
  light(x: number, y: number, r: number, s = 1) {
    this.lights.push({ x, y, r, s });
  }
  sprite(x: number, y: number, rows: string[], key: Key, flip = false) {
    rows.forEach((row, dy) => {
      for (let dx = 0; dx < row.length; dx++) {
        const ch = row[flip ? row.length - 1 - dx : dx];
        const k = key[ch];
        if (k) this.put(x + dx, y + dy, k[0], k[1]);
      }
    });
  }

  // ── небо ────────────────────────────────────────────────
  sky(kind: 'night' | 'dusk' | 'dawn' | 'blood' | 'deep' = 'night', horizon = this.h * 0.72) {
    for (let y = 0; y < this.h; y++) {
      const t = clamp(y / horizon);
      for (let x = 0; x < this.w; x++) {
        const b = bayer(x, y);
        if (kind === 'blood') {
          this.put(x, y, M.SKY_RED, 0.05 + 0.75 * Math.pow(t, 1.3));
          continue;
        }
        if (kind === 'dawn') {
          this.put(x, y, M.SKY_DAWN, 0.04 + 0.92 * Math.pow(t, 1.15));
          continue;
        }
        if (kind === 'dusk') {
          this.put(x, y, M.SKY_WARM, 0.03 + 0.95 * Math.pow(t, 1.9) + (b - 0.5) * 0.02);
          continue;
        }
        const base = kind === 'deep' ? 0.04 + 0.4 * Math.pow(t, 1.6) : 0.06 + 0.55 * Math.pow(t, 1.4);
        this.put(x, y, M.SKY, base);
      }
    }
  }

  stars(n: number, maxY = this.h * 0.6) {
    for (let i = 0; i < n; i++) {
      const x = Math.floor(this.rnd() * this.w);
      const y = Math.floor(this.rnd() * maxY);
      const mm = this.m(x, y);
      if (mm !== M.SKY && mm !== M.SKY_RED && mm !== M.SKY_DAWN) continue;
      if (this.moon && Math.hypot(x - this.moon.x, y - this.moon.y) < this.moon.r * 1.6) continue;
      const v = this.rnd();
      this.put(x, y, M.STAR, 0.25 + v * 0.75);
      if (v > 0.93) {
        this.put(x - 1, y, M.STAR, 0.3);
        this.put(x + 1, y, M.STAR, 0.3);
        this.put(x, y - 1, M.STAR, 0.3);
        this.put(x, y + 1, M.STAR, 0.3);
      }
    }
  }

  halo(cx: number, cy: number, r: number, k = 0.35, mats: number[] = [M.SKY, M.SKY_WARM, M.SKY_RED, M.SKY_DAWN, M.CLOUD, M.CLOUD_WARM, M.CLOUD_RED]) {
    for (let y = Math.max(0, Math.floor(cy - r)); y < Math.min(this.h, cy + r); y++)
      for (let x = Math.max(0, Math.floor(cx - r)); x < Math.min(this.w, cx + r); x++) {
        if (!mats.includes(this.m(x, y))) continue;
        const d = Math.hypot(x - cx, y - cy) / r;
        if (d < 1) this.add(x, y, k * (1 - d) * (1 - d));
      }
  }

  moonDisk(cx: number, cy: number, r: number, o: { shadow?: number; red?: boolean; halo?: number } = {}) {
    this.moon = { x: cx, y: cy, r };
    this.dir = cx > this.w / 2 ? 1 : -1;
    this.halo(cx, cy, r * 3.4, o.halo ?? 0.32);
    const mm = o.red ? M.MOON_RED : M.MOON;
    const s = this.seed + 101;
    for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++)
      for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        const d = Math.hypot(dx, dy);
        if (d > r) continue;
        if (o.shadow !== undefined && Math.hypot(dx + o.shadow * r, dy) < r * 0.98) continue;
        const nx = dx / r;
        const ny = dy / r;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        let v = 0.5 + 0.42 * Math.pow(nz, 0.6);
        const maria = fbm(nx * 1.7 + 3, ny * 1.7 + 7, s, 4);
        if (maria > 0.52) v -= 0.55 * smooth(0.52, 0.62, maria);
        v += (fbm(nx * 6, ny * 6, s + 9, 2) - 0.5) * 0.18;
        if (d > r - 1.1) v += 0.08;
        this.put(x, y, mm, v);
      }
  }

  sunDisk(cx: number, cy: number, r: number) {
    this.halo(cx, cy, r * 5, 0.4);
    for (let y = Math.floor(cy - r); y <= cy + r; y++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d <= r) this.put(x, y, M.SUN, 1 - (d / r) * 0.6);
      }
    this.dir = cx > this.w / 2 ? 1 : -1;
  }

  clouds(y0: number, y1: number, o: { cover?: number; sx?: number; sy?: number; warm?: boolean; red?: boolean; seed?: number } = {}) {
    const cover = o.cover ?? 0.5;
    const s = this.seed + (o.seed ?? 33);
    const sx = o.sx ?? 0.035;
    const sy = o.sy ?? 0.14;
    const mid = (y0 + y1) / 2;
    const half = (y1 - y0) / 2;
    for (let y = Math.floor(y0); y <= y1; y++)
      for (let x = 0; x < this.w; x++) {
        const band = 1 - Math.pow(Math.abs(y - mid) / half, 2);
        const n = fbm(x * sx, y * sy, s, 5) * band + (1 - cover) * -0.25;
        const th = 0.32;
        if (n < th) continue;
        if (n < th + 0.04 && bayer(x, y) > (n - th) / 0.04) continue;
        const lit = fbm((x - this.dir * 2) * sx, (y + 1.5) * sy, s, 5) * band;
        let v = 0.18 + (n - th) * 1.3 + (n - lit) * 3.2;
        if (this.moon) v += 0.45 * Math.max(0, 1 - Math.hypot(x - this.moon.x, y - this.moon.y) / (this.moon.r * 4.5));
        const mm = o.red ? M.CLOUD_RED : o.warm ? M.CLOUD_WARM : M.CLOUD;
        if (o.warm) v = v * 0.75 + (y / this.h) * 0.35;
        this.put(x, y, mm, v);
      }
  }

  aurora(y: number, amp: number, o: { seed?: number } = {}) {
    const s = this.seed + (o.seed ?? 71);
    for (let x = 0; x < this.w; x++) {
      const cy = y + Math.sin(x * 0.06 + s) * amp + (fbm(x * 0.04, 0, s, 3) - 0.5) * amp * 2;
      const ray = 0.45 + 0.55 * fbm(x * 0.35, 3, s + 5, 2);
      const len = 14 * ray;
      for (let yy = Math.floor(cy - len); yy <= cy + 3; yy++) {
        if (yy < 0 || yy >= this.h || this.m(x, yy) !== M.SKY) continue;
        const t = clamp((cy + 3 - yy) / (len + 3));
        const k = Math.pow(1 - t, 1.2) * ray;
        if (k < 0.15 + bayer(x, yy) * 0.25) continue;
        this.put(x, yy, M.AURORA, k);
      }
    }
  }

  // ── рельеф ──────────────────────────────────────────────
  ridge(o: { base: number; amp: number; freq: number; m?: number; seed?: number; ridged?: boolean; haze?: number; snow?: number; x0?: number; x1?: number; lift?: number }): Float32Array {
    const s = this.seed + (o.seed ?? 5);
    const mm = o.m ?? M.MTN;
    const hs = new Float32Array(this.w);
    for (let x = 0; x < this.w; x++) {
      let n = fbm(x * o.freq, 0.5, s, 3);
      if (o.ridged) n = 0.8 * (1 - Math.abs(2 * n - 1)) + 0.2 * fbm(x * o.freq * 5, 2.5, s + 1, 2);
      let h = o.base - o.amp * n;
      if (o.x0 !== undefined && o.x1 !== undefined) {
        const c = (o.x0 + o.x1) / 2;
        const hw = (o.x1 - o.x0) / 2;
        h = o.base - (o.base - h) * Math.max(0, 1 - Math.pow((x - c) / hw, 2));
      }
      hs[x] = h;
    }
    const sl = (x: number) => (hs[Math.min(this.w - 1, x + 2)] - hs[Math.max(0, x - 2)]) * 0.5 * this.dir;
    for (let x = 0; x < this.w; x++) {
      const slope = (sl(x - 1) + sl(x) + sl(x + 1)) / 3;
      for (let y = Math.ceil(hs[x]); y < this.h; y++) {
        const d = y - hs[x];
        let v = (o.lift ?? 0.3) + clamp(slope * 0.35, -0.2, 0.45) * Math.max(0, 1 - d / 26);
        v += (fbm(x * 0.07 + y * 0.06 * this.dir, y * 0.1, s + 3, 3) - 0.5) * 0.3;
        v -= 0.12 * Math.min(1, d / 18);
        v += (o.haze ?? 0) * Math.min(1, d / 24);
        let m2 = mm;
        const sd = o.snow ? o.snow * (0.35 + 1.1 * fbm(x * 0.06, 0, s + 8, 3)) * (0.7 + 0.5 * clamp(slope * 1.5 + 0.5, 0, 1)) : 0;
        if (o.snow && (d < sd - 1 || (d < sd + 1 && bayer(x, y) > (d - sd + 1) / 2))) {
          m2 = M.SNOW;
          v = 0.35 + clamp(slope * 0.5, -0.2, 0.45) + 0.1;
        }
        this.put(x, y, m2, v);
      }
    }
    return hs;
  }

  hill(f: (x: number) => number, m: number = M.GROUND, o: { lift?: number; rim?: number; tex?: number; seed?: number } = {}): Float32Array {
    const s = this.seed + (o.seed ?? 11);
    const hs = new Float32Array(this.w);
    for (let x = 0; x < this.w; x++) hs[x] = f(x);
    for (let x = 0; x < this.w; x++) {
      const slope = (hs[Math.min(this.w - 1, x + 1)] - hs[Math.max(0, x - 1)]) * this.dir;
      for (let y = Math.ceil(hs[x]); y < this.h; y++) {
        const d = y - hs[x];
        let v = (o.lift ?? 0.28) + clamp(slope * 0.4, -0.15, 0.3) * Math.max(0, 1 - d / 10);
        v += (fbm(x * 0.3, y * 0.18, s, 3) - 0.5) * (o.tex ?? 0.22);
        v -= 0.1 * Math.min(1, d / 20);
        if (d < 1.2) v += o.rim ?? 0.18;
        this.put(x, y, m, v);
      }
    }
    return hs;
  }

  fog(yc: number, th: number, dens: number, o: { seed?: number } = {}) {
    const s = this.seed + (o.seed ?? 51);
    for (let y = Math.max(0, Math.floor(yc - th * 2)); y < Math.min(this.h, yc + th * 2); y++)
      for (let x = 0; x < this.w; x++) {
        const p = dens * Math.exp(-Math.pow((y - yc) / th, 2)) * (0.5 + 0.8 * fbm(x * 0.05, y * 0.2, s, 3));
        const mm = this.m(x, y);
        if (mm === M.FIRE || mm === M.WINDOW || mm === M.SUN) continue;
        this.add(x, y, p * 0.35);
        if (p > bayer(x, y) * 1.4 + 0.1) this.put(x, y, M.FOG, 0.25 + p * 0.5);
      }
  }

  pines(base: Float32Array | number, o: { x0?: number; x1?: number; gap?: [number, number]; hMin: number; hMax: number; snow?: boolean; m?: number; sink?: number; lift?: number }) {
    const x1 = o.x1 ?? this.w + 3;
    let x = (o.x0 ?? -3) + this.rr(0, 2);
    while (x < x1) {
      const bx = Math.round(x);
      const by = (typeof base === 'number' ? base : base[clamp(bx, 0, this.w - 1)]) + (o.sink ?? 1);
      const H = Math.round(this.rr(o.hMin, o.hMax));
      this.pine(bx, by, H, o.snow, o.m, o.lift);
      x += this.rr(o.gap?.[0] ?? H * 0.35, o.gap?.[1] ?? H * 0.7);
    }
  }

  pine(bx: number, by: number, H: number, snow = false, m: number = M.PINE, lift = 0) {
    const tiers = Math.max(2, Math.round(H / 5));
    const tierH = H / tiers;
    for (let r = 0; r < H; r++) {
      const ti = Math.floor(r / tierH);
      const inT = (r - ti * tierH) / tierH;
      const hw = Math.max(0, Math.round((0.18 + ti * 0.12 + inT * 0.32) * H * 0.42));
      const y = by - H + r;
      for (let dx = -hw; dx <= hw; dx++) {
        const edge = dx * this.dir;
        let v = 0.22 + lift + (edge > hw - 1.5 ? 0.3 : edge > 0 ? 0.08 : -0.04);
        v += (hash(bx + dx, y, 3) - 0.5) * 0.12;
        let mm = m;
        if (snow && inT < 0.34 && hash(bx + dx, y, 7) > 0.25) {
          mm = M.SNOW;
          v = 0.4 + (edge > 0 ? 0.3 : 0);
        }
        this.put(bx + dx, y, mm, v);
      }
    }
    this.put(bx, by, M.WOOD, 0.2);
    this.put(bx, by + 1, M.WOOD, 0.15);
  }

  deadTree(x: number, y: number, len: number, ang = -Math.PI / 2, depth = 5, m: number = M.PINE) {
    const x2 = x + Math.cos(ang) * len;
    const y2 = y + Math.sin(ang) * len;
    this.line(x, y, x2, y2, m, 0.15);
    if (depth > 4) this.line(x + 1, y, x2 + 1, y2, m, 0.12);
    if (depth <= 0) return;
    const n = this.rnd() > 0.5 ? 2 : 3;
    for (let i = 0; i < n; i++) this.deadTree(x2, y2, len * this.rr(0.55, 0.78), ang + this.rr(-0.75, 0.75), depth - 1, m);
  }

  // ── постройки ───────────────────────────────────────────
  block(x0: number, y0: number, x1: number, y1: number, m: number = M.STONE, o: { brick?: boolean; lift?: number; jag?: number } = {}) {
    const lift = o.lift ?? 0;
    for (let y = Math.round(y0); y <= y1; y++)
      for (let x = Math.round(x0); x <= x1; x++) {
        if (o.jag && y < y0 + Math.floor(fbm(x * 0.5, y0, this.seed + 5, 2) * o.jag * 2 + hash(x, 0, 9) * 2)) continue;
        const edge = this.dir > 0 ? x1 - x : x - x0;
        let v = 0.22 + lift + (edge < 1 ? 0.28 : edge < 2 ? 0.12 : 0);
        if (o.brick !== false && (y % 3 === 0 || (x + (Math.floor(y / 3) % 2) * 2) % 4 === 0)) v -= 0.07;
        v += (hash(x, y, 13) - 0.5) * 0.06;
        this.put(x, y, m, v);
      }
  }
  crenel(x0: number, x1: number, y: number, m: number = M.STONE, lift = 0) {
    for (let x = Math.round(x0); x <= x1; x++) if ((x - Math.round(x0)) % 3 !== 2) {
      this.put(x, y, m, 0.26 + lift);
      this.put(x, y - 1, m, 0.3 + lift);
    }
  }
  cone(cx: number, y: number, hw: number, hgt: number, m: number = M.ROOF, lift = 0) {
    for (let r = 0; r <= hgt; r++) {
      const w = Math.round((r / hgt) * hw);
      for (let dx = -w; dx <= w; dx++) this.put(cx + dx, y - hgt + r, m, 0.22 + lift + (dx * this.dir > w - 1.5 ? 0.3 : dx * this.dir > 0 ? 0.08 : 0));
    }
  }
  windows(x0: number, y0: number, x1: number, y1: number, chance: number, glow = true) {
    for (let y = Math.round(y0); y <= y1; y += 4)
      for (let x = Math.round(x0); x <= x1; x += 3)
        if (this.rnd() < chance) {
          this.put(x, y, M.WINDOW, 0.7 + this.rnd() * 0.3);
          this.put(x, y + 1, M.WINDOW, 0.5);
          if (glow) this.light(x, y, 5, 0.35);
        }
  }
  flag(x: number, y: number, h: number, m: number = M.RED, len = 5, wave = 0) {
    this.line(x, y, x, y - h, M.WOOD, 0.35);
    for (let i = 0; i < len; i++) {
      const dy = Math.round(Math.sin(i * 0.9 + wave) * 0.7);
      for (let j = 0; j < 3; j++) this.put(x + 1 + i, y - h + j + dy, m, 0.3 + (j === 0 ? 0.25 : 0) - i * 0.02);
    }
  }
  tower(cx: number, base: number, hw: number, hgt: number, o: { roof?: 'cone' | 'flat' | 'none'; m?: number; lift?: number; win?: number; flag?: number; jag?: number } = {}) {
    const lift = o.lift ?? 0;
    this.block(cx - hw, base - hgt, cx + hw, base, o.m ?? M.STONE, { lift, jag: o.jag });
    if (o.roof === 'cone') this.cone(cx, base - hgt - 1, hw + 1, Math.round(hw * 2.2), M.ROOF, lift);
    else if (o.roof !== 'none') this.crenel(cx - hw, cx + hw, base - hgt - 1, o.m ?? M.STONE, lift);
    if (o.win) this.windows(cx - hw + 1, base - hgt + 2, cx + hw - 1, base - 3, o.win);
    if (o.flag !== undefined) this.flag(cx, base - hgt - (o.roof === 'cone' ? Math.round(hw * 2.2) + 1 : 2), 4, o.flag);
  }
  castle(cx: number, base: number, sc = 1, o: { lift?: number; win?: number; flag?: number; ruined?: boolean } = {}) {
    const k = (n: number) => Math.round(n * sc);
    const lift = o.lift ?? 0;
    const r = o.ruined;
    this.block(cx - k(14), base - k(9), cx + k(14), base, M.STONE, { lift, jag: r ? 4 : 0 });
    if (!r) this.crenel(cx - k(14), cx + k(14), base - k(9) - 1, M.STONE, lift);
    this.tower(cx, base, k(5), r ? k(15) : k(20), { roof: r ? 'none' : 'cone', lift, win: r ? 0 : o.win ?? 0.35, flag: r ? undefined : o.flag, jag: r ? 5 : 0 });
    this.tower(cx - k(14), base, k(3), k(14), { roof: r ? 'none' : 'cone', lift, win: r ? 0 : (o.win ?? 0.35) * 0.6, jag: r ? 6 : 0 });
    this.tower(cx + k(14), base, k(3), r ? k(8) : k(15), { roof: r ? 'none' : 'flat', lift, win: r ? 0 : (o.win ?? 0.35) * 0.6, jag: r ? 3 : 0 });
    this.rect(cx - k(2), base - k(4), cx + k(2), base, M.VOID, 0);
    this.rect(cx - k(1), base - k(5), cx + k(1), base - k(5), M.VOID, 0);
    if (r) {
      // пустые глазницы окон, подсвеченные пожаром изнутри
      for (let i = 0; i < 9; i++) {
        const x = Math.round(cx + this.rr(-k(13), k(13)));
        const y = Math.round(base - this.rr(k(4), k(12)));
        if (this.m(x, y) !== M.STONE) continue;
        this.put(x, y, M.FIRE, 0.35);
        this.put(x, y + 1, M.FIRE, 0.25);
      }
    }
  }
  house(x: number, base: number, w: number, hgt: number, o: { snow?: boolean; lift?: number } = {}) {
    this.block(x, base - hgt, x + w, base, M.WOOD, { brick: false, lift: (o.lift ?? 0) + 0.08 });
    const cx = x + w / 2;
    const rh = Math.round(w * 0.6);
    for (let r = 0; r <= rh; r++) {
      const ww = Math.round((r / rh) * (w / 2 + 1));
      for (let dx = -ww; dx <= ww; dx++) {
        const top = r < 2 || dx * this.dir > ww - 1;
        this.put(cx + dx, base - hgt - rh + r, o.snow && (r < 2 || this.rnd() < 0.25) ? M.SNOW : M.ROOF, o.snow ? (top ? 0.75 : 0.5) : 0.25 + (top ? 0.15 : 0));
      }
    }
    this.put(Math.round(cx), base - Math.round(hgt / 2), M.WINDOW, 0.9);
    this.put(Math.round(cx), base - Math.round(hgt / 2) + 1, M.WINDOW, 0.6);
    this.light(cx, base - hgt / 2, 6, 0.45);
  }

  // ── огонь и вода ────────────────────────────────────────
  bonfire(x: number, base: number, size: number, o: { logs?: boolean; light?: number } = {}) {
    const s = this.seed + 91;
    if (o.logs !== false) {
      this.line(x - size, base, x + size, base - 2, M.WOOD, 0.3);
      this.line(x - size, base - 2, x + size, base, M.WOOD, 0.25);
      for (let i = -size - 1; i <= size + 1; i++) if (hash(i, 1, s) > 0.3) this.put(x + i, base + 1, M.STONE, 0.25);
    }
    const H = size * 2.6;
    for (let y = Math.floor(base - H); y <= base; y++)
      for (let dx = -size - 1; dx <= size + 1; dx++) {
        const t = clamp((base - y) / H);
        const w = (size + 0.5) * Math.pow(1 - t, 0.7) * (0.85 + 0.3 * fbm(dx * 0.4, y * 0.35, s, 2));
        const d = Math.abs(dx + (fbm(y * 0.25, 0, s + 4, 2) - 0.5) * 2 * t) / Math.max(0.5, w);
        if (d > 1) continue;
        const v = (1 - d) * 0.75 + (1 - t) * 0.35 + (fbm(dx * 0.6, y * 0.5, s + 2, 2) - 0.5) * 0.3;
        if (v < 0.12) continue;
        this.put(x + dx, y, M.FIRE, v);
      }
    this.light(x, base - size, size * (o.light ?? 10), 1);
  }

  candle(x: number, base: number, h = 3) {
    this.rect(x, base - h, x, base, M.PARCH, 0.75);
    this.put(x, base - h - 1, M.FIRE, 0.9);
    this.put(x, base - h - 2, M.FIRE, 0.6);
    this.light(x, base - h - 1, 24, 0.85);
  }

  torch(x: number, y: number) {
    this.line(x, y, x, y + 4, M.WOOD, 0.3);
    this.put(x, y - 1, M.FIRE, 0.95);
    this.put(x, y - 2, M.FIRE, 0.7);
    this.put(x - 1, y - 1, M.FIRE, 0.5);
    this.put(x + 1, y - 1, M.FIRE, 0.45);
    this.light(x, y - 1, 14, 0.75);
  }

  reflect(y0: number, o: { m?: number; fade?: number; seed?: number } = {}) {
    const s = this.seed + (o.seed ?? 61);
    for (let y = Math.ceil(y0); y < this.h; y++) {
      const sy = Math.round(2 * y0 - y);
      if (sy < 0) continue;
      for (let x = 0; x < this.w; x++) {
        const off = Math.round(Math.sin(y * 1.3 + hash(0, y, s) * 6) * Math.min(2, (y - y0) * 0.15));
        const sx = clamp(x + off, 0, this.w - 1);
        const mm = this.m(sx, sy);
        let v = this.v(sx, sy) * 0.72 - (y - y0) * (o.fade ?? 0.006);
        if (hash(x >> 2, y, s) > 0.86) v += 0.12;
        const bright = mm === M.MOON || mm === M.MOON_RED || mm === M.FIRE || mm === M.WINDOW || mm === M.SUN || mm === M.AURORA || mm === M.LAVA;
        this.put(x, y, bright ? mm : o.m ?? M.WATER, bright ? v * 0.85 : v);
      }
    }
  }

  // ── интерьер ────────────────────────────────────────────
  room(floorY: number, o: { wall?: number; lift?: number } = {}) {
    const lift = o.lift ?? 0;
    for (let y = 0; y < floorY; y++)
      for (let x = 0; x < this.w; x++) {
        const row = Math.floor(y / 4);
        const brick = y % 4 === 0 || (x + (row % 2) * 4) % 8 === 0;
        let v = 0.36 + lift + (brick ? -0.1 : 0) + (hash(Math.floor((x + (row % 2) * 4) / 8), row, 21) - 0.5) * 0.1;
        v += (fbm(x * 0.08, y * 0.08, this.seed + 3, 3) - 0.5) * 0.12;
        this.put(x, y, o.wall ?? M.STONE, v);
      }
    for (let y = floorY; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const plank = (y - floorY) % 3 === 0 || (x + ((y - floorY) / 3) * 11) % 17 === 0;
        this.put(x, y, M.WOOD, 0.38 + lift + (plank ? -0.12 : 0) + (hash(x, y, 4) - 0.5) * 0.06);
      }
    this.vignette = 0.3;
  }

  windowView(x0: number, y0: number, x1: number, y1: number, paint: () => void) {
    this.clip = [x0, y0, x1, y1];
    paint();
    this.clip = null;
    // рама с крестовиной
    this.rect(x0 - 1, y0 - 1, x1 + 1, y0 - 1, M.WOOD, 0.35);
    this.rect(x0 - 1, y1 + 1, x1 + 1, y1 + 2, M.WOOD, 0.4);
    this.rect(x0 - 1, y0, x0 - 1, y1, M.WOOD, 0.3);
    this.rect(x1 + 1, y0, x1 + 1, y1, M.WOOD, 0.3);
    const cx = Math.round((x0 + x1) / 2);
    const cy = Math.round((y0 + y1) / 2);
    this.rect(cx, y0, cx, y1, M.WOOD, 0.3);
    this.rect(x0, cy, x1, cy, M.WOOD, 0.3);
  }

  // ── вывод ───────────────────────────────────────────────
  render(): Uint8Array {
    const out = new Uint8Array(this.w * this.h * 4);
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const i = y * this.w + x;
        let def = MATS[this.mat[i]];
        let v = this.val[i];
        if (!def.emissive) {
          let wl = 0;
          for (const L of this.lights) {
            const d = Math.hypot(x - L.x, (y - L.y) * 1.1) / L.r;
            if (d < 1) wl += L.s * (1 - d) * (1 - d);
          }
          if (wl > 0 && def.warm !== undefined && wl * 1.5 > bayer(x + 2, y + 1)) {
            def = MATS[def.warm];
            v = v * 0.55 + Math.min(1, wl) * 0.6;
          } else v += wl * 0.22;
          const vx = (x / this.w - 0.5) * 2;
          const vy = (y / this.h - 0.45) * 2;
          v -= this.vignette * Math.max(0, Math.hypot(vx * 0.9, vy) - 0.55);
        }
        if (!Number.isFinite(v)) throw new Error(`NaN at ${x},${y} mat ${this.mat[i]}`);
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

// ── спрайты ───────────────────────────────────────────────
// a/A/H — латы (тень/свет/блик), k — щели и тень, c/C — плащ, s — клинок, w — дерево
export const KNIGHT_KEY: Key = {
  k: [M.METAL, 0.02],
  a: [M.METAL, 0.22],
  A: [M.METAL, 0.42],
  H: [M.METAL, 0.7],
  c: [M.CLOTH, 0.25],
  C: [M.CLOTH, 0.5],
  s: [M.METAL, 0.85],
  w: [M.WOOD, 0.35],
  g: [M.GOLD, 0.6],
  r: [M.RED, 0.45],
};

export const KNIGHT_SIT = [
  '.....rr......',
  '....kaak.....',
  '...kAHAak....',
  '...kAAAak....',
  '...kkkkkk....',
  '...kAAAak....',
  '..ccaAAAk....',
  '.cccAHAAak...',
  '.ccaAAAAAAak.',
  '.ccaAAAAaAAk.',
  '.ccaaAAAak...',
  '.cccaaaaak...',
  '.ccAAAAAAAak.',
  '..cAAAAAAAAk.',
  '...kaa..kAAk.',
  '...kaa..kaak.',
  '..kkkk..kkkk.',
];

export const KNIGHT_STAND = [
  '.....rr.....',
  '....kaak....',
  '...kAHAAk...',
  '...kAAAAk...',
  '...kkkkkk...',
  '...kAAAAk...',
  '..ckaAAAkc..',
  '.ccAAHAAAkc.',
  '.ckAAAAAAakc',
  'cckaAAAAakkc',
  'cc.akkkkak.c',
  'cc.aAAAAa..c',
  'cc.aAA.Aa..c',
  'c..aAA.Aa...',
  'c..aAa.aA...',
  '...aAa.aA...',
  '..kkkk.kkk..',
];

export const KNIGHT_WALK = [
  '.....rr.....',
  '....kaak....',
  '...kAHAAk...',
  '...kAAAAk...',
  '...kkkkkk...',
  '...kAAAAk...',
  '..ckaAAAk...',
  '.ccAAHAAAk..',
  'cckAAAAAAak.',
  'cc.aAAAAAk..',
  'cc.akkkkk...',
  'cc.aAAAAa...',
  'c..aAA.Aa...',
  'c.aAA...Aa..',
  '..aA....aAa.',
  '.kkk.....kk.',
];

export const KNIGHT_V = [
  '.k...rr...k.',
  '.Ak.kaak.kA.',
  '..AkAHAAkA..',
  '...kAAAAk...',
  '...kkkkkk...',
  '...kAAAAk...',
  '...kaAAak...',
  '..cAAHAAac..',
  '..cAAAAAAc..',
  '..caAAAAac..',
  '...akkkka...',
  '...aAA.Aa...',
  '...aAA.Aa...',
  '...aA..aA...',
  '..kkk..kkk..',
];

export const SWORD_GROUND = ['.g.', 'ggg', '.s.', '.s.', '.s.', '.s.', '.s.'];
