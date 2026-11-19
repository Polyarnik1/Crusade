// Зимний проход поверх готовой сцены: шапки снега на всём, что смотрит в небо,
// пятна снега на земле, ледок на воде, снег за окнами в интерьерах.
// Снега умеренно: он лежит хлопьями и полосками, а не сплошным одеялом.
import { M, Scene2, fbm, hash } from './engine2';

const BG = new Set<number>([M.VOID, M.SKY, M.SKY_WARM, M.SKY_RED, M.SKY_DAWN, M.STAR, M.MOON, M.MOON_RED, M.SUN, M.CLOUD, M.CLOUD_WARM, M.CLOUD_RED, M.AURORA, M.FOG, M.MTN_FAR]);
const SKYISH = new Set<number>([M.SKY, M.SKY_WARM, M.SKY_RED, M.SKY_DAWN, M.STAR, M.MOON, M.MOON_RED, M.CLOUD, M.CLOUD_WARM, M.CLOUD_RED]);
const NO_CAP = new Set<number>([...BG, M.SNOW, M.WINDOW, M.FIRE, M.LAVA, M.WATER, M.ICE, M.FLESH, M.SUN]);
// земля, на которой снег ложится пятнами
const FLOOR = new Set<number>([M.GROUND]);
// на что снег ложится толще (2 пикселя)
const THICK = new Set<number>([M.GROUND, M.GREEN, M.STONE, M.ROOF, M.WOOD, M.MTN, M.PINE]);

export interface WinterOpt {
  amount?: number; // 0..1, сколько земли укрыто (по умолчанию ~0.5)
  caps?: number; // вероятность шапки на фигурах
  ice?: boolean;
}

export function isInterior(s: Scene2) {
  let sky = 0;
  for (let x = 0; x < s.w; x += 4) if (SKYISH.has(s.mat[x])) sky++;
  return sky < s.w / 16;
}

export function winterize(s: Scene2, o: WinterOpt = {}) {
  const { w, h } = s;
  const mat = s.mat.slice();
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? M.VOID : mat[y * w + x]);
  const set = (x: number, y: number, v: number, up = true) => {
    const i = y * w + x;
    s.mat[i] = M.SNOW;
    s.val[i] = v;
    if (up) {
      s.nx[i] = (hash(x, y, 3) - 0.5) * 0.3;
      s.ny[i] = -0.72;
      s.hn[i] = 1;
    }
  };
  const interior = isInterior(s);
  const amount = o.amount ?? 0.5;

  if (interior) {
    // за окнами: сугроб на подоконнике и снег на раме
    for (let x = 0; x < w; x++)
      for (let y = 1; y < h; y++) {
        const m = at(x, y);
        if (!SKYISH.has(m)) continue;
        const below = at(x, y + 1);
        if (!SKYISH.has(below)) {
          const d = 1 + (fbm(x * 0.4, 1, 11, 2) > 0.5 ? 1 : 0);
          for (let k = 0; k < d; k++) if (SKYISH.has(at(x, y - k))) set(x, y - k, 0.55 + hash(x, k, 5) * 0.25);
        }
        // иней в углах стекла
        if (hash(x, y, 21) < 0.06) set(x, y, 0.45, false);
      }
    return;
  }

  // 1. пятна снега на земле
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const m = at(x, y);
      if (!FLOOR.has(m) && !(m === M.GREEN && y > h * 0.62)) continue;
      const n = fbm(x * 0.06, y * 0.3, 404, 3) + (hash(x, y, 8) - 0.5) * 0.12;
      if (n > 1 - amount) {
        const i = y * w + x;
        s.mat[i] = M.SNOW;
        s.val[i] = 0.28 + (n - (1 - amount)) * 0.9 + (1 - y / h) * 0.05;
      }
    }

  // 1б. ближние скалы и холмы: редкие снежные языки на склонах
  for (let y = Math.floor(h * 0.55); y < h; y++)
    for (let x = 0; x < w; x++) {
      if (at(x, y) !== M.MTN) continue;
      const n = fbm(x * 0.08, y * 0.4, 606, 3);
      if (n > 1 - amount * 0.7) set(x, y, 0.3 + (n - 1 + amount * 0.7) * 1.2, false);
    }

  // 2. шапки на всём, что смотрит в небо
  for (let x = 0; x < w; x++)
    for (let y = 1; y < h; y++) {
      const m = at(x, y);
      if (NO_CAP.has(m)) continue;
      const above = at(x, y - 1);
      const onFloor = (above === M.GROUND || above === M.GREEN) && m !== M.GROUND && m !== M.GREEN && m !== M.MTN && m !== M.PINE && y > h * 0.55; // стога, бочки, камни на земле
      if (!BG.has(above) && !(above === M.MTN && m !== M.MTN) && !onFloor) continue;
      // тонкие ветки и бахрома горизонта — без снега, иначе всё в белых точках
      const below = at(x, y + 1);
      if (NO_CAP.has(below) || BG.has(below)) continue;
      const far = (m === M.GROUND || m === M.PINE || m === M.MTN) && y < h * 0.72;
      if (far && hash(x, y, 31) < 0.55) continue;
      const figure = !THICK.has(m);
      const p = figure ? o.caps ?? 0.6 : 0.88;
      if (fbm(x * 0.5, y * 0.3, 77, 2) + (hash(x, y, 2) - 0.5) * 0.3 < 1 - p) continue;
      const d = figure || far || m === M.MTN ? 1 : 1 + (hash(x, y, 13) < 0.55 ? 1 : 0);
      for (let k = 0; k < d; k++) {
        const mk = at(x, y + k);
        if (NO_CAP.has(mk)) break;
        if (far) set(x, y + k, 0.3 + hash(x, y, 4) * 0.1, false);
        else set(x, y + k, 0.6 - k * 0.12 + hash(x, y + k, 4) * 0.1);
      }
    }

  // 3. ледок у берегов и льдины
  if (o.ice !== false)
    for (let y = 1; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (at(x, y) !== M.WATER) continue;
        const edge = at(x, y - 1) !== M.WATER && hash(x, y, 6) < 0.8;
        const n = fbm(x * 0.06, y * 0.35, 919, 3);
        if (edge || n > 0.66) {
          const i = y * w + x;
          s.mat[i] = n > 0.72 || edge ? M.SNOW : M.ICE;
          s.val[i] = s.mat[i] === M.SNOW ? 0.4 + hash(x, y, 1) * 0.15 : 0.55;
        }
      }
}

/** Морозные узоры по углам интерьера (запекаются в картинку). */
export function frost(rgba: Uint8Array, w: number, h: number) {
  // морозные узоры по углам: тонкие ледяные прожилки, гуще к краю кадра
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const cx = Math.min(x, w - 1 - x) / w, cy = Math.min(y, h - 1 - y) / h;
      const d = Math.hypot(cx * 1.5, cy);
      const near = Math.max(0, 0.15 - d) / 0.15;
      if (near <= 0) continue;
      const f = fbm(x * 0.16, y * 0.16, 515, 4);
      const vein = Math.abs(f - 0.5) < 0.012 + near * 0.04;
      const k = vein ? 0.35 + near * 0.5 : near > 0.7 && hash(x, y, 9) < near * 0.4 ? 0.3 : 0;
      if (!k) continue;
      const j = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) rgba[j + c] = Math.round(rgba[j + c] * (1 - k) + [176, 204, 240][c] * k);
    }
}

/** Падающие хлопья для превью (в приложении они анимированы частицами). */
export function flakes(rgba: Uint8Array, w: number, h: number, seed: number, n = 70, interior = false) {
  if (interior) return frost(rgba, w, h);
  for (let i = 0; i < n; i++) {
    const x = Math.floor(hash(i, 1, seed) * w);
    const y = Math.floor(hash(i, 2, seed) * h * 0.95);
    const big = hash(i, 3, seed) < 0.25;
    const a = 0.55 + hash(i, 4, seed) * 0.4;
    const put = (xx: number, yy: number, k: number) => {
      if (xx < 0 || yy < 0 || xx >= w || yy >= h) return;
      const j = (yy * w + xx) * 4;
      for (let c = 0; c < 3; c++) rgba[j + c] = Math.round(rgba[j + c] * (1 - k) + [232, 240, 252][c] * k);
    };
    put(x, y, a);
    if (big) {
      put(x + 1, y, a * 0.6);
      put(x, y + 1, a * 0.6);
      put(x + 1, y + 1, a * 0.4);
    }
  }
}
