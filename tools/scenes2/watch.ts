// «Ночной дозор» от первого лица: рыцарь на стене с мечом смотрит вниз по склону.
// Под стеной лежат скелеты, а вдали по дороге идут огоньки факелов.
import { PNG } from 'pngjs';
import { writeFileSync } from 'node:fs';
import { M, Scene2, fbm, hash } from './engine2';
import { flakes, winterize } from './winter';

const W = 160;
const H = 100;
const plate = (x: number, y: number) => (hash(x, y, 77) - 0.5) * 0.08 + (fbm(x * 0.3, y * 0.3, 5, 2) - 0.5) * 0.1;

const roadX = (y: number) => 10 + (y - 55) * 2.8 + Math.sin((y - 55) * 0.45) * 5;
const roadHW = (y: number) => 1.2 + (y - 52) * 0.34;

/** Скелет, лежащий на земле: a — поворот, vy — сплющивание по вертикали (взгляд вдоль склона). */
function skeleton(s: Scene2, x: number, y: number, k: number, a: number, seed: number, vy = 0.5) {
  const ca = Math.cos(a), sa = Math.sin(a);
  s.ell(x + 12 * k * ca, y + 12 * k * sa * vy + 1, 15 * k, 5 * k * Math.max(vy, 0.5), M.GROUND, 0.14, { flat: 1 }); // тень на земле
  const P = (u: number, v: number): [number, number] => [x + (u * ca - v * sa) * k, y + (u * sa + v * ca) * k * vy];
  const bone = (u0: number, v0: number, u1: number, v1: number, r: number, val = 0.78) => {
    const [ax, ay] = P(u0, v0), [bx, by] = P(u1, v1);
    s.cap(ax, ay, bx, by, Math.max(0.55, r * k), Math.max(0.5, r * k * 0.9), M.BIRCH, val, { flat: 0.2 });
  };
  const h = (n: number) => hash(seed, n, 91);
  // рёбра
  for (let i = 0; i < 4; i++) {
    const u = 4 + i * 1.7, r = 3.4 - i * 0.45;
    bone(u, 0, u + 0.8, r, 0.5, 0.66);
    bone(u, 0, u + 0.8, -r, 0.5, 0.66);
  }
  bone(2.6, 0, 13, 0, 0.6, 0.55); // позвоночник
  // таз
  const [px, py] = P(14, 0);
  s.ell(px, py, 1.9 * k, 2.8 * k * Math.max(vy, 0.6), M.BIRCH, 0.7, { flat: 0.2 });
  // ноги
  const l1 = (h(1) - 0.5) * 3, l2 = (h(2) - 0.5) * 4;
  bone(14, 1.4, 20, 2.5 + l1, 0.7);
  bone(20, 2.5 + l1, 26, 1.5 + l1 * 1.4, 0.6);
  bone(14, -1.4, 19.5, -3 + l2, 0.7);
  bone(19.5, -3 + l2, 25, -4.5 + l2 * 1.2, 0.6);
  // руки: одна вдоль тела, другая раскинута
  bone(3.5, 3, 6.5, 6 + h(3) * 2, 0.5);
  bone(6.5, 6 + h(3) * 2, 10.5, 7 + h(4) * 3, 0.45);
  bone(3.5, -3, 0.5, -6.5 - h(5) * 2, 0.5);
  bone(0.5, -6.5 - h(5) * 2, -3.5, -8 - h(6) * 2, 0.45);
  // череп
  const [hx, hy] = P(-0.3, 0);
  s.ell(hx, hy, 2.3 * k, 2.1 * k, M.BIRCH, 0.92, { flat: 0.1 });
  if (k > 0.7) {
    const [e1x, e1y] = P(0.4, -0.9), [e2x, e2y] = P(0.4, 0.9);
    s.put(e1x, e1y, M.VOID, 0);
    s.put(e2x, e2y, M.VOID, 0);
  }
}

function brokenSpear(s: Scene2, x: number, y: number, len: number, lean: number) {
  s.cap(x, y, x + lean * len, y - len, 0.55, 0.5, M.WOOD, 0.4, { flat: 0.3 });
  s.cap(x + lean * len, y - len, x + lean * (len + 3), y - len - 3.4, 0.9, 0.2, M.METAL, 0.75);
}

function shield(s: Scene2, x: number, y: number, r: number) {
  s.ell(x, y, r, r * 0.55, M.WOOD, 0.42, { tex: plate, flat: 0.4 });
  s.ell(x, y, r * 0.38, r * 0.22, M.METAL, 0.6);
  s.ell(x, y, r * 0.95, r * 0.5, M.METAL, 0.18, { flat: 1 });
  s.ell(x, y, r * 0.82, r * 0.44, M.WOOD, 0.4, { tex: plate, flat: 0.4 });
  s.ell(x, y, r * 0.3, r * 0.18, M.METAL, 0.62);
}

function drawWorld(s: Scene2) {
  s.moonAt(36, 18);
  s.sky('deep', 52);
  s.bigMoon(36, 17, 9, { shadow: 0.5 });
  s.stars(170, 40);
  s.clouds(22, 46, { cover: 0.32, sx: 0.025, sy: 0.1 });
  // горы: дальняя гряда, ближний хребет и предгорья с заснеженными соснами
  s.peaks({ base: 62, amp: 48, freq: 0.016, seed: 53, haze: 0.3, lift: 0.5, snowLine: 36 });
  s.peaks({ base: 65, amp: 34, freq: 0.024, m: M.MTN, seed: 11, haze: 0.05, lift: 0.4, snowLine: 48 });
  s.peaks({ base: 67, amp: 15, freq: 0.045, m: M.MTN, seed: 29, haze: 0.0, lift: 0.34, snowLine: 58 });
  // огни на горной тропе: зигзаг вверх по ближнему хребту
  s.pines(67, { x0: 0, x1: 160, hMin: 6, hMax: 14, gap: [2, 5], lift: 0.12, snow: true });
  // склон вниз к стене
  s.hill((x) => 67 + Math.sin(x * 0.05) * 1.1 + Math.sin(x * 0.17) * 0.4, M.GROUND, { lift: 0.85, tex: 0.3 });
  for (let y = 67; y < 86; y++)
    for (let x = 0; x < W; x++) {
      const t = (y - 67) / 19;
      const n = fbm(x * 0.07, y * 0.3, 21, 3);
      s.putN(x, y, M.GROUND, 0.55 + t * 0.38 + (n - 0.5) * 0.3 + (hash(x, y, 3) - 0.5) * 0.06, 0, -0.55 + (n - 0.5) * 0.5);
    }
  s.rect(0, 64, 160, 68, M.FOG, (x, y) => 0.1 + (y - 64) * 0.04 + (hash(x, y, 2) - 0.5) * 0.04); // дымка над склоном
  // дорога из дали к воротам
  for (let y = 67; y < 86; y++) {
    const cx = roadX(y), hw = roadHW(y);
    for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) {
      const edge = Math.abs(x - cx) > hw - 0.9;
      s.putN(x, y, M.GROUND, edge ? 0.45 : 1.3 + (hash(x, y, 4) - 0.5) * 0.1, 0, -0.35);
    }
  }
  s.pebbles(0, W, 70, 84, 22, M.STONE, [0.6, 1.4]);

  // скелеты и обломки у подножия стены
  brokenSpear(s, 12, 78, 11, 0.1);
  brokenSpear(s, 150, 76, 10, -0.12);
  brokenSpear(s, 112, 80, 7, 0.2);
  shield(s, 56, 83, 6.5);
  skeleton(s, 34, 80, 1.4, 0.3, 1);
  skeleton(s, 88, 81, 1.55, 3.1, 2);
  skeleton(s, 128, 76, 1.1, -0.25, 3);
  skeleton(s, 64, 72, 0.62, 0.6, 5);
  s.ell(18, 82, 3.6, 2.2, M.METAL, 0.5, { tex: plate }); // шлем
  s.rect(16, 81, 21, 81, M.METAL, 0.05);
  // стрелы в земле
  for (const [ax, ay] of [[44, 78], [72, 76], [110, 82], [20, 74]] as [number, number][]) {
    s.cap(ax, ay, ax + 1.4, ay - 5, 0.4, 0.35, M.WOOD, 0.4);
    s.put(ax + 1, ay - 6, M.METAL, 0.7);
    s.put(ax + 2, ay - 5, M.CLOTH, 0.45);
  }

  // огни факелов: колонна идёт по дороге от горизонта к воротам
  for (let i = 0; i < 26; i++) {
    const t = i / 25;
    const y = 67.3 + Math.pow(t, 1.5) * 8;
    const x = roadX(y) + (hash(i, 1, 8) - 0.5) * roadHW(y) * 1.3;
    s.put(x, y, M.FIRE, 0.95);
    if (t > 0.45) s.put(x, y - 1, M.FIRE, 0.62);
    if (t > 0.25) s.put(x, y + 1, M.PINE, 0.1);
    if (t > 0.6) s.put(x, y + 2, M.PINE, 0.1);
    s.light(x, y, 3 + t * 2, 0.07);
  }
  // отряд на горной тропе справа: зигзаг вверх по склону
  for (let i = 0; i < 9; i++) {
    const x = 108 + i * 4.2 + Math.sin(i * 1.6) * 3, y = 66 - i * 2.4 + (i % 2) * 0.7;
    s.put(x, y, M.FIRE, 0.85);
    s.light(x, y, 2, 0.12);
  }

  // парапет: низкая стенка, пара зубцов по краям, плиты прохода
  s.block(0, 85, 160, 91, M.STONE, { lift: 0.44, brick: true });
  s.block(0, 76, 24, 91, M.STONE, { lift: 0.4, brick: true });
  s.block(140, 76, 160, 91, M.STONE, { lift: 0.4, brick: true });
  s.block(0, 91, 160, 100, M.STONE, { lift: 0.24 });
  s.rect(24, 76, 24, 91, M.STONE, 0.12);
  s.rect(140, 76, 140, 91, M.STONE, 0.5);
  s.rect(0, 85, 160, 85, M.STONE, 0.62);
  s.rect(0, 91, 160, 91, M.STONE, 0.12);
  s.rect(0, 76, 24, 76, M.STONE, 0.7);
  s.rect(140, 76, 160, 76, M.STONE, 0.66);
  for (let x = 0; x < W; x++) if (hash(x, 95, 3) < 0.9) s.put(x, 95, M.STONE, 0.12);
  for (let y = 92; y < 100; y++) for (const xx of [20, 55, 90, 130]) s.put(xx + ((y * 7) % 11), y, M.STONE, 0.1);
}

const Q = 1 / 7;
/** Капсула с чёткими ступенями света (без дизера): сверху светло, снизу тень. */
function solid(s: Scene2, x0: number, y0: number, x1: number, y1: number, r0: number, r1: number, m: number, base: number, o: { band?: number; lit?: number } = {}) {
  const vx = x1 - x0, vy = y1 - y0, L2 = vx * vx + vy * vy || 1, L = Math.sqrt(L2);
  const nx = vy / L, ny = -vx / L; // нормаль «вверх» по экрану
  const up = ny < 0 ? 1 : -1;
  const R = Math.max(r0, r1);
  for (let y = Math.floor(Math.min(y0, y1) - R - 1); y <= Math.ceil(Math.max(y0, y1) + R + 1); y++)
    for (let x = Math.floor(Math.min(x0, x1) - R - 1); x <= Math.ceil(Math.max(x0, x1) + R + 1); x++) {
      const px = x + 0.5 - x0, py = y + 0.5 - y0;
      const t = Math.max(0, Math.min(1, (px * vx + py * vy) / L2));
      const r = r0 + (r1 - r0) * t;
      const qx = px - vx * t, qy = py - vy * t;
      const d = Math.hypot(qx, qy);
      if (d > r) continue;
      const q = ((qx * nx + qy * ny) / r) * up; // −1 верх … +1 низ
      const lit = o.lit ?? 0;
      let k = q < -0.62 ? 2 : q < -0.2 ? 1 : q < 0.38 ? 0 : q < 0.76 ? -1 : -2;
      if (d > r - 0.9 && q > 0.3) k = -3;
      s.put(x, y, m, Math.max(0, Math.min(1, base + (k + lit) * Q)));
    }
}

function drawKnight(s: Scene2) {
  const D: [number, number] = [-0.995, -0.085];
  const P: [number, number] = [153, 92];
  const at = (t: number, o = 0): [number, number] => [P[0] + D[0] * t - D[1] * o, P[1] + D[1] * t + D[0] * o];

  // левое предплечье и перчатка снизу поддерживают клинок
  const [lx, ly] = at(72, 4);
  solid(s, -14, 117, lx - 10, ly + 8, 10, 7.5, M.METAL, 0.64);
  solid(s, 4, 111, 14, 107, 3, 3, M.GOLD, 0.57); // кайма наручи
  solid(s, lx - 10, ly + 8, lx + 2, ly + 3, 7.5, 6.8, M.METAL, 0.64, { lit: 0.4 });

  // меч: полосы света по сечению, чёткие грани
  const w0 = 4.8, w1 = 1.2, t0 = 32, t1 = 124;
  for (let t = t0; t <= t1; t += 0.5) {
    const w = w0 + (w1 - w0) * ((t - t0) / (t1 - t0)) ** 0.9 - (t > 116 ? (t - 116) * 0.5 : 0);
    if (w < 0.4) continue;
    for (let o = -w; o <= w; o += 0.5) {
      const [x, y] = at(t, o);
      const q = o / w;
      let v = q < -0.78 ? 1 : q < -0.4 ? 6 * Q : q < -0.12 ? 5 * Q : q < 0.12 ? 3 * Q : q < 0.5 ? 4 * Q : q < 0.82 ? 2 * Q : 1 * Q;
      if (t < t0 + 2) v = 2 * Q;
      s.put(x, y, M.METAL, Math.min(1, v));
    }
  }
  for (const t of [44, 52, 58, 67, 73, 85, 93]) {
    const [rx, ry] = at(t, 0);
    s.put(rx, ry, M.GOLD, 0.7);
  }
  const [tx, ty] = at(125);
  s.put(tx, ty, M.METAL, 1);
  // гарда с навершиями
  const [g0x, g0y] = at(29);
  solid(s, g0x + 2.2, g0y - 13, g0x - 2.2, g0y + 13, 2.2, 2.2, M.METAL, 0.78);
  solid(s, g0x + 2.5, g0y - 14, g0x + 2.3, g0y - 12.6, 2.6, 2.6, M.GOLD, 0.71);
  solid(s, g0x - 2.3, g0y + 14, g0x - 2.5, g0y + 12.6, 2.6, 2.6, M.GOLD, 0.57);
  // рукоять в оплётке и яблоко
  const [r0x, r0y] = at(4), [r1x, r1y] = at(28);
  solid(s, r0x, r0y, r1x, r1y, 2.3, 2.3, M.WOOD, 0.43);
  for (let t = 6; t < 28; t += 3) {
    const [wx, wy] = at(t, 0);
    s.put(wx, wy - 2, M.WOOD, 0.14);
    s.put(wx, wy + 2, M.WOOD, 0.14);
  }
  solid(s, at(0)[0] + 1, at(0)[1], at(0)[0] + 1.2, at(0)[1], 3.6, 3.6, M.GOLD, 0.71);

  // правая рука: предплечье, кулак на рукояти и пальцы поверх
  solid(s, 182, 123, 150, 99, 13, 9, M.METAL, 0.64);
  solid(s, 164, 107, 158, 103, 3, 3, M.GOLD, 0.57);
  const [hx, hy] = at(14, 1);
  solid(s, hx + 5, hy + 1, hx - 3, hy + 1, 7.6, 7.4, M.METAL, 0.64, { lit: 0.5 });
  for (let i = 0; i < 4; i++) {
    const [fx, fy] = at(9 + i * 0.2, -5.4 + i * 3.6);
    solid(s, fx + 1.5, fy, fx - 3, fy + 0.3, 2.1, 2.1, M.METAL, 0.71 - i * Q * 0.3, { lit: 0.2 });
  }
  solid(s, at(24, 5.5)[0], at(24, 5.5)[1], at(18, 6.8)[0], at(18, 6.8)[1], 2.2, 2.6, M.METAL, 0.64);
}

/** Золотые детали меча, которые мерцают в приложении: навершие гарды и яблоко. */
export const WATCH_SPARKLES: [number, number][] = [[127, 76], [154, 92]];

export function nightWatch(s: Scene2, winter: boolean) {
  drawWorld(s);
  if (winter) winterize(s, { amount: 0.22 });
  drawKnight(s);
}

// ── превью ──
if (process.argv[1]?.endsWith('watch.ts')) {
  const out = process.argv[2] ?? '/tmp/w/watch.png';
  const scale = 6;
  const img = new PNG({ width: W * scale + 8, height: H * scale + 8 });
  img.data.fill(18);
  [true].forEach((winter, n) => {
    const s = new Scene2(W, H, 2111);
    nightWatch(s, winter);
    const d = s.render();
    if (winter) flakes(d, W, H, 77, 60);
    for (let y = 0; y < H * scale; y++)
      for (let x = 0; x < W * scale; x++) {
        const si = (Math.floor(y / scale) * W + Math.floor(x / scale)) * 4;
        const di = ((4 + y) * img.width + n * (W * scale + 8) + 4 + x) * 4;
        img.data[di] = d[si]; img.data[di + 1] = d[si + 1]; img.data[di + 2] = d[si + 2]; img.data[di + 3] = 255;
      }
  });
  writeFileSync(out, PNG.sync.write(img));
  console.log('ok');
}
