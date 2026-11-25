import { M, Scene2, cat, fbm, hash, knightSit, knightStand, knightWalk, wolf } from './engine2';
import { REGALIA_ART } from '../../src/art/arts';
import type { Key } from '../scenes/engine';

export const W = 160;
export const H = 100;

export interface Def2 {
  draw: (s: Scene2) => void;
}

const rockTex = (sd: number) => (x: number, y: number) => (fbm(x * 0.35, y * 0.2, sd, 3) - 0.5) * 0.3 + (hash(x, y, sd) - 0.5) * 0.06;

// ── камни с рунами и силуэт провидца (регалии загадок) ──
const RUNE_A: [number, number][] = [[0, -3], [-1, -2], [1, -2], [-2, -1], [2, -1], [-1, 0], [1, 0], [-2, 1], [2, 1]];
const RUNE_B: [number, number][] = [[0, -2], [0, -1], [0, 0], [0, 1], [0, 2], [-1, -1], [1, -1], [-2, -2], [2, -2]];
const RUNE_C: [number, number][] = [[0, -2], [0, -1], [0, 0], [0, 1], [0, 2], [1, -1], [2, 0], [1, 1]];
function runeStone(s: Scene2, cx: number, base: number, w: number, h: number, sd: number, rune: [number, number][]) {
  const t = Math.round((hash(sd, 1, 9) - 0.5) * 3);
  s.poly(
    [[cx - w / 2, base + 1], [cx - w / 2, base - h * 0.6], [cx - w / 2 + 2 + t, base - h + 1], [cx + t, base - h - 1], [cx + w / 2 - 2 + t, base - h + 2], [cx + w / 2, base - h * 0.5], [cx + w / 2 + 1, base + 1]],
    M.STONE, 0.32, { tex: rockTex(sd), flat: 0.15, tilt: [-0.35, -0.4] },
  );
  const rx = Math.round(cx + t / 2), ry = Math.round(base - h * 0.6);
  for (const [dx, dy] of rune) for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (!rune.some(([a, b]) => a === dx + ox && b === dy + oy)) s.put(rx + dx + ox, ry + dy + oy, M.ICE, 0.55);
  }
  for (const [dx, dy] of rune) s.put(rx + dx, ry + dy, M.STAR, 0.95);
}
/** Тёмный силуэт рогатого провидца с белыми щелями глаз. */
function seer(s: Scene2, cx: number, base: number) {
  s.poly([[cx - 8, base + 1], [cx - 5, base - 11], [cx + 5, base - 11], [cx + 8, base + 1]], M.VOID, 0);
  s.poly([[cx - 3, base - 11], [cx - 3, base - 17], [cx - 2, base - 19], [cx + 2, base - 19], [cx + 3, base - 17], [cx + 3, base - 11], [cx + 1, base - 9], [cx - 1, base - 9]], M.VOID, 0);
  const ant: [number, number][] = [[3, 18], [4, 19], [5, 20], [6, 21], [7, 22], [8, 23], [9, 24], [10, 25], [6, 22], [6, 23], [6, 24], [9, 23], [9, 22], [11, 24], [12, 24], [4, 20], [3, 21], [8, 25], [8, 26]];
  for (const [dx, dy] of ant) {
    s.put(cx - dx, base - dy, M.VOID, 0);
    s.put(cx + dx, base - dy, M.VOID, 0);
  }
  for (const dx of [-2, -1, 1, 2]) s.put(cx + dx, base - 15, M.STAR, 1);
}

/** Ночное небо: луна, звёзды, облака. */
function night(s: Scene2, mx: number, my: number, mr: number, o: { clouds?: [number, number, number]; kind?: 'night' | 'deep'; red?: boolean; shadow?: number; stars?: number } = {}) {
  s.sky(o.red ? 'blood' : o.kind ?? 'night', H * 0.7);
  s.bigMoon(mx, my, mr, { red: o.red, shadow: o.shadow });
  s.stars(o.stars ?? 130, H * 0.62);
  const [a, b, c] = o.clouds ?? [24, 50, 0.5];
  s.clouds(a, b, { cover: c, red: o.red, sx: 0.025, sy: 0.1 });
}

/** Земля с камнями: на ней хорошо видны блики костра. */
function rockyGround(s: Scene2, y: (x: number) => number, m: number = M.GROUND, peb = 60) {
  s.hill(y, m, { lift: 0.26, tex: 0.3 });
  const y0 = Math.min(...Array.from({ length: W }, (_, x) => y(x)));
  s.pebbles(0, W, y0 + 2, H, peb, m === M.SNOW ? M.SNOW : M.STONE);
}

const ICON_KEY: Key = {
  K: [M.METAL, 0.02], k: [M.METAL, 0.14], G: [M.METAL, 0.38], g: [M.METAL, 0.26], H: [M.METAL, 0.72], h: [M.METAL, 0.52],
  W: [M.SNOW, 0.9], Y: [M.GOLD, 0.62], y: [M.GOLD, 0.38], M: [M.GOLD, 0.82], O: [M.FIRE, 0.6], R: [M.RED, 0.55], r: [M.RED, 0.32],
  S: [M.FLESH, 0.8], s: [M.FLESH, 0.5], B: [M.BLUE, 0.6], b: [M.BLUE, 0.35], N: [M.BLUE, 0.12], n: [M.BLUE, 0.22],
  E: [M.GREEN, 0.6], e: [M.GREEN, 0.35], P: [M.BLUE, 0.7], p: [M.BLUE, 0.45], C: [M.RED, 0.42], c: [M.RED, 0.24],
  T: [M.WOOD, 0.55], t: [M.WOOD, 0.35], L: [M.ICE, 0.85], l: [M.ICE, 0.5], F: [M.PARCH, 0.85], f: [M.PARCH, 0.6],
};

/** Два слоя хребтов: дальний в дымке и ближний. */
function range(s: Scene2, base: number, amp: number, o: { seed?: number; snow?: boolean; near?: boolean } = {}) {
  s.peaks({ base: base - 4, amp: amp * 1.25, freq: 0.022, seed: (o.seed ?? 1) + 50, haze: 0.3, lift: 0.4, snowLine: o.snow === false ? 0 : undefined });
  if (o.near !== false) s.peaks({ base, amp: amp * 0.6, freq: 0.03, m: M.MTN, seed: o.seed, haze: 0.05, lift: 0.26, snowLine: o.snow === false ? 0 : base - amp * 0.45 });
}

function wolfHowl(s: Scene2, x: number, y: number, k: number) {
  const P: [number, number][] = [
    [-16, 0], [-12, -2], [-10, -6], [-10, -12], [-8, -17], [-5, -21], [-3, -25], [-1, -29], [0, -33], [1, -36],
    [2, -40], [3.5, -37.5], [5, -41.5], [6, -37.5], [9, -39], [13, -43], [14, -42], [12, -39.5], [10, -37], [7.5, -34],
    [7, -29], [6, -23], [6.5, -14], [6.5, -2], [9, 0], [3, 0], [3, -8], [1, -5], [1.5, 0], [-7, 0],
  ];
  const pts = P.map(([a, b]) => [x + a * k, y + b * k] as [number, number]);
  const mark = new Set<number>();
  const ys = pts.map((p) => p[1]);
  for (let yy = Math.floor(Math.min(...ys)); yy <= Math.max(...ys); yy++) {
    const hits: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[(i + 1) % pts.length];
      if (ay <= yy + 0.5 !== by <= yy + 0.5) hits.push(ax + ((yy + 0.5 - ay) / (by - ay)) * (bx - ax));
    }
    hits.sort((a, b) => a - b);
    for (let j = 0; j + 1 < hits.length; j += 2) for (let xx = Math.ceil(hits[j] - 0.5); xx < hits[j + 1] - 0.5; xx++) mark.add(yy * 1000 + xx);
  }
  for (const key of mark) {
    const yy = Math.floor(key / 1000);
    const xx = key - yy * 1000;
    const edge = [[1, 0], [-1, 0], [0, -1], [0, 1]].some(([dx, dy]) => !mark.has((yy + dy) * 1000 + xx + dx));
    const fur = hash(xx, yy, 5) > 0.7;
    s.put(xx, yy, M.METAL, edge ? 0.55 + hash(xx, yy, 2) * 0.2 : fur ? 0.1 : 0.05);
  }
  // шерсть по загривку
  for (let i = 0; i < 10; i++) s.put(x + (-6 + i * 0.6) * k, y + (-18 - i * 1.2) * k - 1, M.METAL, 0.5);
}

const folds2 = (x: number, y: number) => Math.sin(x * 0.9 + y * 0.1) * 0.08;

export const SCENES2: Record<string, Def2> = {
  fire_keeper: {
    draw: (s) => {
      night(s, 122, 24, 17, { clouds: [44, 60, 0.5] });
      range(s, 70, 30);
      s.fog(64, 5, 0.6);
      s.hill((x) => 72 + Math.sin(x * 0.04) * 2, M.WATER, { lift: 0.3, tex: 0, rim: 0 });
      s.reflect(72, { fade: 0.004 });
      rockyGround(s, (x) => 78 + Math.sin(x * 0.05) * 2 + (x > 120 ? (x - 120) * 0.25 : 0) - (x < 50 ? (50 - x) * 0.3 : 0), M.GROUND, 70);
      // утёс слева
      s.poly([[0, 100], [0, 26], [7, 18], [15, 24], [24, 40], [33, 54], [44, 72], [52, 100]], M.MTN, 0.2, { tex: rockTex(4), flat: 0.1, tilt: [0.5, -0.1] });
      s.deadTree(12, 60, 16, -Math.PI / 2 + 0.25, 5);
      s.bigFire(100, 90, 6, { light: 7.5 });
      // меч в костре
      s.cap(100, 64, 100, 86, 1, 0.6, M.METAL, 0.75, { flat: 0.4 });
      s.rect(97, 66, 103, 67, M.GOLD, 0.5);
      s.cap(100, 60, 100, 65, 0.8, 0.8, M.WOOD, 0.4);
      knightSit(s, 64, 95, 1.05);
    },
  },
  first_land: {
    draw: (s) => {
      night(s, 132, 18, 11, { clouds: [30, 46, 0.45] });
      range(s, 70, 34, { seed: 3 });
      s.fog(66, 5, 0.6);
      s.pines(78, { x0: -4, x1: 34, hMin: 14, hMax: 22, snow: true });
      s.pines(80, { x0: 128, x1: 166, hMin: 14, hMax: 24, snow: true });
      rockyGround(s, (x) => 86 + Math.sin(x * 0.05) * 2, M.SNOW, 26);
      // знамя за плечом
      s.cap(110, 20, 110, 100, 1.1, 1.1, M.WOOD, 0.45);
      s.ell(110, 19, 1.8, 1.8, M.GOLD, 0.65);
      s.poly([[111, 22], [136, 24], [131, 32], [137, 40], [111, 38]], M.RED, 0.42, { tex: (x, y) => Math.sin(x * 0.5 + y * 0.1) * 0.1, flat: 0.45 });
      s.ell(123, 31, 3, 3, M.GOLD, 0.6);
      // рыцарь крупным планом: в кадре по колено
      knightStand(s, 74, 122, 1.75, { sword: true });
    },
  },
  full_moon: {
    draw: (s) => {
      s.sky('deep', 70);
      s.stars(110, 60);
      s.bigMoon(104, 40, 30, { halo: 0.5 });
      s.clouds(46, 58, { cover: 0.35, sx: 0.03, sy: 0.18 });
      // лес в тумане, два слоя
      s.pines(80, { x0: -4, x1: 168, hMin: 14, hMax: 22, gap: [4, 8], m: M.MTN_FAR, lift: 0.18 });
      s.fog(80, 6, 0.9);
      s.pines(92, { x0: -4, x1: 90, hMin: 22, hMax: 34, gap: [7, 13], lift: -0.05 });
      s.fog(96, 4, 0.5, { seed: 3 });
      // скала на фоне луны и воющий волк — силуэт с серебряным контуром
      s.poly([[70, 100], [80, 82], [92, 72], [106, 66], [124, 64], [140, 70], [154, 82], [160, 86], [160, 100]], M.MTN, 0.12, { tex: rockTex(8), flat: 0.6 });
      wolfHowl(s, 112, 65, 1);
    },
  },
  couch: {
    draw: (s) => {
      s.room(78);
      s.windowView(16, 14, 44, 46, () => {
        s.sky('night', 46);
        s.moonDisk(36, 23, 6);
        s.stars(30, 40);
        s.pines(47, { x0: 14, x1: 48, hMin: 7, hMax: 12, snow: true });
      });
      // телевизор
      s.rect(118, 40, 146, 60, M.METAL, 0.1);
      s.rect(120, 42, 144, 58, M.ICE, 0.75);
      s.rect(128, 61, 136, 66, M.METAL, 0.22);
      s.rect(116, 66, 150, 78, M.WOOD, 0.4);
      s.halo(132, 50, 40, 0.2, [M.STONE, M.WOOD]);
      const g = REGALIA_ART.couch;
      s.sprite(46, 92 - g.length * 2, g.flatMap((r) => [r.split('').map((c) => c + c).join(''), r.split('').map((c) => c + c).join('')]), ICON_KEY);
      s.candle(10, 78, 5);
      s.pebbles(0, 160, 84, 100, 0);
    },
  },
};


const grave = (s: Scene2, x: number, base: number, h = 9) => {
  s.cap(x, base - h, x, base, 1.4, 1.6, M.STONE, 0.4, { tex: rockTex(2) });
  s.cap(x - 3.5, base - h + 3, x + 3.5, base - h + 3, 1.2, 1.2, M.STONE, 0.42, { tex: rockTex(3) });
};
const menhir = (s: Scene2, x: number, base: number, h: number, w = 3) =>
  s.poly([[x - w, base], [x - w * 0.8, base - h * 0.7], [x - w * 0.3, base - h], [x + w * 0.6, base - h * 0.95], [x + w, base - h * 0.5], [x + w * 1.1, base]], M.STONE, 0.55, { tex: rockTex(x), flat: 0.2 });
const banner = (s: Scene2, x: number, base: number, h: number, m: number, w = 12, wave = 0) => {
  s.cap(x, base - h, x, base, 0.8, 0.8, M.WOOD, 0.45);
  s.ell(x, base - h - 1, 1.2, 1.2, M.GOLD, 0.6);
  const bh = Math.round(w * 1.6);
  const pts: [number, number][] = [];
  for (let i = 0; i <= w; i += 2) pts.push([x + 1 + i + Math.sin(wave) * 0.5, base - h + 1]);
  pts.push([x + 1 + w + Math.sin(wave + 1) * 1.5, base - h + bh]);
  pts.push([x + 1 + w / 2 + Math.sin(wave + 2) * 1.5, base - h + bh - 4]);
  pts.push([x + 1 + Math.sin(wave + 3) * 1.5, base - h + bh]);
  s.cap(x - 1, base - h + 1, x + w + 3, base - h + 1, 0.6, 0.6, M.WOOD, 0.45);
  s.poly(pts, m, 0.4, { tex: (xx, yy) => Math.sin(xx * 0.7 + wave + yy * 0.05) * 0.12, flat: 0.4 });
  s.ell(x + 1 + w / 2, base - h + bh * 0.42, w * 0.18, w * 0.2, M.GOLD, 0.55);
};
const road = (s: Scene2, y0: number, x0: number, x1: number, m: number, v: number, wob = 10) => {
  for (let y = Math.ceil(y0); y < H; y++) {
    const t = (y - y0) / (H - y0);
    const cx = x0 + (x1 - x0) * t + Math.sin(t * 5) * wob * t;
    const hw = 0.6 + t * 16;
    for (let x = Math.round(cx - hw); x <= cx + hw; x++) s.putN(x, y, m, v + (hash(x, y, 3) - 0.5) * 0.08, 0, -0.5);
  }
};
const dusk = (s: Scene2, sunX: number, sunY: number, sunR: number, kind: 'dusk' | 'dawn' = 'dusk') => {
  s.sky(kind, sunY + 2);
  s.sunDisk(sunX, sunY, sunR);
  s.ml = [s.dir * 0.75, -0.25, 0.6];
  s.clouds(12, 44, { cover: 0.5, warm: true, sx: 0.025, sy: 0.1 });
};

Object.assign(SCENES2, {
  founder: {
    draw: (s: Scene2) => {
      dusk(s, 30, 74, 9);
      range(s, 76, 18, { seed: 2, snow: false });
      // скальное плато, на котором стоит замок
      s.hill((x) => {
        const d = Math.abs(x - 104);
        return d < 26 ? 60 + (hash(x, 1, 3) - 0.5) * 1.2 : 60 + Math.pow(d - 26, 1.25) * 0.55;
      }, M.MTN, { lift: 0.24, tex: 0.35 });
      s.poly([[78, 60], [130, 60], [136, 76], [72, 76]], M.MTN, 0.24, { tex: rockTex(6), flat: 0.3, tilt: [0.2, -0.2] });
      s.castle(104, 60, 1.35, { win: 0.5, flag: M.RED });
      // дорога к воротам
      for (let y = 61; y < 92; y++) {
        const t = (y - 61) / 31;
        const cx = 104 - t * 46 + Math.sin(t * 4) * 6;
        for (let x = Math.round(cx - 1 - t * 4); x <= cx + 1 + t * 4; x++) s.putN(x, y, M.GROUND, 0.46, 0, -0.5);
      }
      s.pines(82, { x0: -4, x1: 40, hMin: 10, hMax: 18 });
      rockyGround(s, (x) => 90 + Math.sin(x * 0.07) * 1.5, M.GROUND, 30);
      knightStand(s, 44, 97, 0.85, { sword: true, f: 1 });
    },
  },

  streak7: {
    draw: (s: Scene2) => {
      dusk(s, 116, 66, 10, 'dawn');
      range(s, 68, 14, { seed: 4, snow: false });
      s.fog(68, 4, 0.7);
      s.hill((x) => 74 + Math.sin(x * 0.06) * 2, M.GROUND, { lift: 0.22 });
      road(s, 74, 116, 70, M.GROUND, 0.5);
      s.pines(78, { x0: -4, x1: 40, hMin: 12, hMax: 22 });
      knightWalk(s, 76, 97, 0.85);
    },
  },
  night: {
    draw: (s: Scene2) => {
      night(s, 30, 20, 11, { kind: 'deep', shadow: 0.55, clouds: [34, 50, 0.35], stars: 180 });
      s.hill((x) => 84, M.GROUND, { lift: 0.2 });
      s.block(0, 62, 160, 86, M.STONE, { lift: 0.04 });
      s.crenel(0, 160, 61);
      s.tower(112, 86, 10, 50, { roof: 'cone', win: 0.25 });
      s.torch(92, 52);
      s.torch(136, 52);
      knightStand(s, 66, 61, 0.75, { sword: true });
    },
  },
  early: {
    draw: (s: Scene2) => {
      dusk(s, 80, 70, 14, 'dawn');
      range(s, 72, 12, { seed: 5, snow: false });
      s.fog(71, 5, 0.9);
      s.hill((x) => 82 + Math.sin(x * 0.08 + 1) * 3, M.GROUND, { lift: 0.18 });
      s.pines(84, { hMin: 10, hMax: 26, gap: [8, 18] });
      s.fog(92, 4, 0.6, { seed: 7 });
      knightWalk(s, 40, 99, 0.7);
    },
  },
  circle: {
    draw: (s: Scene2) => {
      night(s, 80, 20, 12, { clouds: [30, 46, 0.4] });
      range(s, 70, 14, { seed: 6 });
      s.hill((x) => 76 + Math.sin(x * 0.05) * 1.5, M.GROUND, { lift: 0.22 });
      s.fog(76, 4, 0.7);
      for (const [x, b, h] of [[30, 84, 18], [54, 79, 21], [80, 77, 23], [106, 79, 21], [130, 84, 18]]) menhir(s, x, b, h, 4);
      s.poly([[72, 54], [88, 54], [89, 57], [71, 57]], M.STONE, 0.45, { tex: rockTex(1) });
      rockyGround(s, (x) => 92, M.GROUND, 20);
      for (const [x, b, h] of [[18, 100, 24], [142, 100, 24]]) menhir(s, x, b, h, 5);
      s.bigFire(80, 92, 2.5, { light: 9 });
    },
  },
  winter: {
    draw: (s: Scene2) => {
      s.sky('night');
      s.clouds(0, 56, { cover: 0.9, sy: 0.07 });
      s.halo(100, 24, 56, 0.25);
      s.moonAt(100, 20);
      range(s, 66, 16, { seed: 7 });
      s.fog(62, 8, 0.8);
      const hs = s.hill((x) => 84 + Math.sin(x * 0.06) * 3, M.SNOW, { lift: 0.36 });
      s.pines(70, { hMin: 10, hMax: 16, snow: true, gap: [5, 10] });
      s.pines(hs, { hMin: 20, hMax: 34, snow: true, gap: [14, 26] });
      s.pebbles(0, 160, 88, 100, 25, M.SNOW);
      knightWalk(s, 80, 97, 0.85);
      s.torch(89, 68);
    },
  },
  chronicler: {
    draw: (s: Scene2) => {
      s.room(72, { lift: 0.1 });
      s.windowView(110, 14, 134, 42, () => {
        s.sky('night', 42);
        s.moonDisk(126, 21, 4);
        s.stars(18, 40);
      });
      s.rect(26, 70, 104, 73, M.WOOD, 0.45);
      s.rect(32, 74, 35, 94, M.WOOD, 0.3);
      s.rect(96, 74, 99, 94, M.WOOD, 0.3);
      s.poly([[46, 69], [64, 64], [66, 69]], M.PARCH, 0.8, { flat: 0.6 });
      s.poly([[66, 69], [68, 64], [86, 69]], M.PARCH, 0.72, { flat: 0.6 });
      for (let y = 66; y <= 68; y++) for (let x = 50; x <= 82; x += 2) if (x < 64 || x > 69) s.put(x, y, M.PARCH, 0.42);
      s.cap(88, 69, 96, 58, 0.5, 0.3, M.PARCH, 0.9);
      s.ell(92, 68, 2.5, 1.5, M.METAL, 0.3);
      s.candle(38, 69, 6);
      s.candle(100, 64, 4);
      s.rect(4, 30, 26, 32, M.WOOD, 0.35);
      for (let x = 6; x < 25; x += 3) s.rect(x, 21, x + 2, 29, x % 2 ? M.RED : M.BLUE, 0.35);
      s.cap(4, 40, 26, 40, 0.8, 0.8, M.WOOD, 0.35);
    },
  },
  architect: {
    draw: (s: Scene2) => {
      dusk(s, 128, 76, 8);
      range(s, 78, 14, { seed: 8, snow: false });
      s.hill(() => 84, M.GROUND, { lift: 0.22 });
      s.tower(78, 84, 13, 38, { roof: 'none' });
      for (const x of [62, 94]) s.cap(x, 84, x, 30, 0.7, 0.7, M.WOOD, 0.45);
      for (const y of [70, 54, 36]) s.cap(61, y, 95, y, 0.7, 0.7, M.WOOD, 0.5);
      s.cap(96, 30, 118, 30, 0.7, 0.7, M.WOOD, 0.45);
      s.line(116, 31, 116, 48, M.METAL, 0.4);
      s.block(112, 48, 120, 53, M.STONE, { lift: 0.05 });
      rockyGround(s, () => 92, M.GROUND, 20);
      for (let i = 0; i < 5; i++) s.block(16 + i * 7, 82 - (i % 2) * 5, 22 + i * 7, 88, M.STONE, { lift: 0.04 });
      knightStand(s, 40, 99, 0.7, { arms: 'down' });
    },
  },
  herald: {
    draw: (s: Scene2) => {
      dusk(s, 130, 74, 9);
      range(s, 76, 12, { seed: 9, snow: false });
      rockyGround(s, (x) => 84 + Math.sin(x * 0.08) * 1.5, M.GROUND, 25);
      [[18, M.RED], [54, M.BLUE], [90, M.GREEN], [126, M.RED]].forEach(([x, m], i) => banner(s, x, 88 + (i % 2) * 2, 62 + (i % 2) * 6, m, 16, i));
    },
  },
  border: {
    draw: (s: Scene2) => {
      night(s, 80, 18, 10);
      range(s, 64, 18, { seed: 10 });
      s.hill(() => 72, M.WATER, { lift: 0.3, tex: 0, rim: 0 });
      s.reflect(72, { fade: 0.006 });
      rockyGround(s, (x) => 82 + (x > 62 && x < 98 ? 30 : 0), M.SNOW, 20);
      for (let x = 2; x < 62; x += 4) s.cap(x + 1, 66, x + 1, 84, 1.4, 1.4, M.WOOD, 0.38, { tilt: [0, 0] });
      for (let x = 100; x < 160; x += 4) s.cap(x + 1, 66, x + 1, 84, 1.4, 1.4, M.WOOD, 0.38);
      banner(s, 58, 82, 36, M.RED, 12, 0.5);
      banner(s, 102, 82, 36, M.BLUE, 12, 2);
    },
  },
  great_march: {
    draw: (s: Scene2) => {
      night(s, 122, 18, 12, { clouds: [30, 44, 0.4] });
      range(s, 62, 30, { seed: 11 });
      s.fog(60, 5, 0.6);
      s.hill((x) => 80, M.SNOW, { lift: 0.28 });
      road(s, 64, 104, 66, M.SNOW, 0.42, 14);
      s.pebbles(0, 160, 84, 100, 20, M.SNOW);
      knightWalk(s, 58, 96, 0.85);
    },
  },
  wanderer: {
    draw: (s: Scene2) => {
      dusk(s, 42, 74, 11);
      range(s, 76, 14, { seed: 12, snow: false });
      rockyGround(s, (x) => 82 + Math.sin(x * 0.05) * 3, M.GROUND, 30);
      s.block(90, 40, 98, 86, M.STONE, { lift: 0.02 });
      s.block(122, 52, 130, 86, M.STONE, { lift: 0.02, jag: 4 });
      for (let a = 0; a <= 14; a++) {
        const t = (a / 14) * Math.PI;
        if (a < 9) s.block(110 - Math.cos(t) * 16 - 1, 46 - Math.sin(t) * 12, 110 - Math.cos(t) * 16 + 2, 50 - Math.sin(t) * 12, M.STONE);
      }
      knightWalk(s, 56, 97, 0.85);
    },
  },
  lord: {
    draw: (s: Scene2) => {
      night(s, 26, 18, 10);
      range(s, 60, 20, { seed: 13 });
      s.hill((x) => 64 - 8 * Math.exp(-Math.pow((x - 84) / 28, 2)), M.GROUND, { lift: 0.2 });
      s.castle(84, 58, 1.25, { win: 0.6, flag: M.GOLD });
      s.hill((x) => 82 + Math.sin(x * 0.1) * 1.5, M.SNOW, { lift: 0.24 });
      [8, 26, 44, 112, 130, 146].forEach((x, i) => s.house(x, 88 + (i % 2), 11, 8, { snow: true }));
      s.pebbles(0, 160, 92, 100, 16, M.SNOW);
    },
  },
  glory: {
    draw: (s: Scene2) => {
      s.sky('deep');
      s.stars(200);
      s.aurora(26, 7);
      s.aurora(40, 4, { seed: 9 });
      s.moonAt(140, 10);
      range(s, 64, 26, { seed: 14 });
      s.reflect(68, { fade: 0.004 });
      rockyGround(s, (x) => 88 + Math.sin(x * 0.07) * 2, M.SNOW, 25);
      knightStand(s, 80, 96, 0.8, { sword: true });
    },
  },
  patron: {
    draw: (s: Scene2) => {
      s.room(76, { lift: 0.1 });
      s.poly([[56, 44], [104, 44], [108, 64], [52, 64]], M.WOOD, 0.3, { flat: 0.4, tilt: [0, -0.3] });
      s.rect(56, 44, 104, 45, M.GOLD, 0.45);
      s.poly([[54, 64], [106, 64], [104, 86], [56, 86]], M.WOOD, 0.4, { flat: 0.3 });
      for (let i = 0; i < 90; i++) {
        const cx = 58 + s.rnd() * 44;
        const cy = 64 - s.rnd() * (6 - Math.abs(cx - 80) * 0.15) ;
        s.ell(cx, cy, 1.6, 1.1, M.GOLD, 0.45 + s.rnd() * 0.3);
      }
      s.rect(54, 64, 106, 66, M.GOLD, 0.5);
      s.rect(54, 75, 106, 76, M.GOLD, 0.45);
      s.ell(80, 72, 3, 4, M.GOLD, 0.65);
      for (let i = 0; i < 30; i++) s.ell(40 + s.rnd() * 80, 88 + s.rnd() * 10, 1.6, 1, M.GOLD, 0.6);
      s.candle(30, 76, 8);
      s.candle(130, 76, 6);
      s.candle(138, 76, 4);
      s.lights.push({ x: 80, y: 58, r: 46, s: 0.6 });
      for (const x of [14, 146]) {
        s.poly([[x - 9, 6], [x + 9, 6], [x + 9, 48], [x, 54], [x - 9, 48]], M.RED, 0.34, { tex: folds2 });
        s.ell(x, 24, 3.5, 4, M.GOLD, 0.55);
      }
    },
  },
  robin: {
    draw: (s: Scene2) => {
      dusk(s, 60, 72, 8, 'dawn');
      range(s, 72, 12, { seed: 15, snow: false });
      rockyGround(s, (x) => 84 - 6 * Math.exp(-Math.pow((x - 110) / 22, 2)), M.GROUND, 30);
      s.cap(106, 80, 114, 42, 0.8, 0.8, M.WOOD, 0.45);
      s.poly([[114, 42], [132, 44], [130, 50], [133, 56], [113, 54]], M.SNOW, 0.75, { flat: 0.5, tex: (x) => Math.sin(x * 0.6) * 0.06 });
      s.ell(122, 82, 4, 3, M.METAL, 0.45);
      knightWalk(s, 36, 92, 0.65, { f: -1 });
      for (let i = 0; i < 24; i++) s.ell(46 + s.rnd() * 22, 88 + s.rnd() * 5, 1.5, 1, M.FOG, 0.55);
    },
  },
  exile: {
    draw: (s: Scene2) => {
      night(s, 118, 22, 14, { red: true, clouds: [30, 54, 0.6] });
      range(s, 70, 14, { seed: 16, snow: false });
      s.hill(() => 74, M.GROUND, { lift: 0.14 });
      s.castle(80, 72, 1.4, { ruined: true, win: 0 });
      s.bigFire(52, 76, 3, { logs: false, light: 8 });
      s.bigFire(106, 75, 3, { logs: false, light: 8 });
      rockyGround(s, (x) => 86 + Math.sin(x * 0.12) * 1.5, M.GROUND, 40);
      // обронённая корона и сломанный меч
      s.cap(62, 94, 80, 88, 0.8, 0.6, M.METAL, 0.7);
      s.rect(60, 92, 64, 96, M.GOLD, 0.45);
      s.ell(92, 93, 5, 2, M.GOLD, 0.5);
      for (const x of [88, 92, 96]) s.put(x, 90, M.GOLD, 0.7);
    },
  },
  return_king: {
    draw: (s: Scene2) => {
      dusk(s, 84, 64, 13, 'dawn');
      range(s, 70, 12, { seed: 17, snow: false });
      s.hill((x) => 72 - 6 * Math.exp(-Math.pow((x - 84) / 30, 2)), M.GROUND, { lift: 0.2 });
      s.castle(84, 66, 1.1, { win: 0.3, flag: M.GOLD });
      rockyGround(s, (x) => 86 + Math.sin(x * 0.07) * 2, M.GROUND, 25);
      knightStand(s, 36, 98, 0.85, { arms: 'down' });
      banner(s, 52, 98, 50, M.GOLD, 14, 1);
    },
  },
  arrow_knee: {
    draw: (s: Scene2) => {
      s.room(80, { lift: 0.14 });
      // балки потолка и столбы
      s.rect(0, 0, 160, 5, M.WOOD, 0.3);
      for (const x of [6, 154]) s.block(x - 3, 0, x + 3, 80, M.WOOD, { brick: false, lift: 0.05 });
      s.rect(0, 5, 160, 6, M.WOOD, 0.2);
      // окно со снегом
      s.windowView(22, 16, 40, 38, () => {
        s.sky('night', 38);
        s.moonDisk(34, 22, 3);
        s.stars(12, 34);
      });
      // очаг справа
      s.block(104, 30, 152, 84, M.STONE, { lift: 0.08 });
      s.rect(100, 26, 156, 30, M.WOOD, 0.45);
      s.rect(112, 54, 144, 82, M.VOID, 0);
      s.bigFire(128, 81, 5, { light: 13 });
      s.cap(118, 52, 138, 52, 0.6, 0.6, M.METAL, 0.4);
      s.ell(128, 56, 4, 3.5, M.METAL, 0.3); // котелок
      // на каминной полке
      s.cap(108, 24, 108, 20, 1.2, 1.2, M.WOOD, 0.5);
      s.candle(150, 26, 4);
      // щит и меч на стене
      s.ell(70, 22, 8, 10, M.BLUE, 0.4, { tex: (x, y) => (hash(x, y, 3) - 0.5) * 0.06 });
      s.cap(70, 13, 70, 32, 1.2, 1.2, M.GOLD, 0.5);
      s.cap(61, 22, 79, 22, 1.2, 1.2, M.GOLD, 0.5);
      // фонарь на цепи
      s.line(52, 6, 52, 14, M.METAL, 0.3);
      s.rect(50, 15, 54, 20, M.METAL, 0.25);
      s.put(52, 17, M.FIRE, 0.9);
      s.light(52, 17, 22, 0.55);
      // бочки
      for (const [bx, by] of [[18, 86], [30, 88]] as const) {
        s.ell(bx, by - 8, 6, 9, M.WOOD, 0.4, { tex: (x) => (x % 4 === 0 ? -0.08 : 0) });
        s.rect(bx - 6, by - 13, bx + 6, by - 12, M.METAL, 0.35);
        s.rect(bx - 6, by - 4, bx + 6, by - 3, M.METAL, 0.35);
      }
      // стол с кружкой и хлебом
      s.rect(40, 72, 72, 75, M.WOOD, 0.5);
      s.rect(44, 76, 46, 96, M.WOOD, 0.32);
      s.rect(66, 76, 68, 96, M.WOOD, 0.32);
      s.cap(50, 66, 50, 71, 2.6, 2.6, M.WOOD, 0.55, { flat: 0.3 });
      s.rect(48, 65, 52, 66, M.SNOW, 0.8);
      s.ell(61, 70, 4, 2.2, M.PARCH, 0.5);
      // рыцарь у огня, стрела торчит из колена
      knightSit(s, 86, 98, 0.95, { f: 1 });
      s.cap(96, 82, 82, 66, 0.7, 0.7, M.PARCH, 0.8);
      s.poly([[96, 82], [99, 83], [97, 85]], M.METAL, 0.6, { flat: 0.6 });
      s.poly([[81, 63], [85, 66], [83, 69], [80, 67]], M.RED, 0.55, { flat: 0.6 });
      s.poly([[79, 66], [82, 69], [80, 71]], M.RED, 0.45, { flat: 0.6 });
    },
  },
  friday13: {
    draw: (s: Scene2) => {
      night(s, 30, 20, 10, { kind: 'deep', shadow: -0.6, clouds: [26, 44, 0.5] });
      s.hill((x) => 78 + Math.sin(x * 0.06) * 2, M.GROUND, { lift: 0.18 });
      s.fog(80, 5, 0.8);
      [22, 44, 66, 104, 126, 148].forEach((x, i) => grave(s, x, 86 + (i % 2) * 3, 10 + (i % 3) * 2));
      s.deadTree(134, 84, 20, -Math.PI / 2 - 0.15, 6);
      rockyGround(s, () => 92, M.GROUND, 20);
      cat(s, 82, 94, 1.3);
      s.fog(96, 3, 0.5, { seed: 4 });
    },
  },
  solstice: {
    draw: (s: Scene2) => {
      dusk(s, 80, 60, 20, 'dawn');
      range(s, 78, 12, { seed: 18, snow: false });
      s.hill((x) => 84 - 4 * Math.exp(-Math.pow((x - 80) / 18, 2)), M.GROUND, { lift: 0.16 });
      knightStand(s, 80, 82, 0.72, { arms: 'v' });
      rockyGround(s, () => 92, M.GROUND, 14);
    },
  },
  triple: {
    draw: (s: Scene2) => {
      night(s, 80, 16, 10);
      range(s, 60, 20, { seed: 19 });
      const hs = s.hill((x) => 88 - 12 * Math.exp(-Math.pow((x - 28) / 16, 2)) - 18 * Math.exp(-Math.pow((x - 80) / 16, 2)) - 10 * Math.exp(-Math.pow((x - 132) / 16, 2)), M.SNOW, { lift: 0.3 });
      [28, 80, 132].forEach((x, i) => banner(s, x, Math.round(hs[x]) + 2, 30, M.RED, 12, i));
      s.pebbles(0, 160, 88, 100, 16, M.SNOW);
    },
  },
  hectares: {
    draw: (s: Scene2) => {
      night(s, 128, 16, 10, { clouds: [20, 36, 0.35] });
      range(s, 56, 12, { seed: 20 });
      for (let y = 56; y < H; y++) {
        const band = Math.floor(Math.pow(y - 55, 0.75) / 1.6);
        for (let x = 0; x < W; x++) {
          const u = (x - 80) / Math.max(1, y - 50);
          const furrow = Math.floor(u * 6) % 2 === 0;
          s.putN(x, y, band % 2 ? M.GREEN : M.GROUND, 0.26 + (furrow ? 0.07 : 0), 0, -0.6);
        }
      }
      for (let x = 0; x < W; x += 8) s.cap(x, 60, x, 66, 0.6, 0.6, M.WOOD, 0.4);
      s.cap(0, 61, W, 61, 0.5, 0.5, M.WOOD, 0.4);
      s.cap(0, 64, W, 64, 0.5, 0.5, M.WOOD, 0.38);
      s.house(22, 60, 12, 8);
      for (const [x, y] of [[40, 82], [118, 76], [70, 94]]) s.ell(x, y, 6, 4.5, M.GOLD, 0.35, { tex: (a, b) => Math.sin(a * 2 + b) * 0.08 });
    },
  },
  suzerain: {
    draw: (s: Scene2) => {
      s.room(74, { lift: 0.1 });
      for (let y = 74; y < H; y++) for (let x = 64; x <= 96; x++) s.put(x, y, M.RED, 0.3 + (x === 64 || x === 96 ? 0.12 : 0));
      s.poly([[64, 12], [96, 12], [96, 70], [64, 70]], M.GOLD, 0.35, { flat: 0.4 });
      s.poly([[68, 16], [92, 16], [92, 58], [68, 58]], M.RED, 0.38, { tex: folds2 });
      s.poly([[60, 56], [100, 56], [100, 64], [60, 64]], M.GOLD, 0.5, { flat: 0.3 });
      for (const x of [64, 74, 86, 96]) s.ell(x, 10, 1.8, 2.4, M.GOLD, 0.6);
      for (const x of [36, 124]) s.poly([[x - 7, 4], [x + 7, 4], [x + 7, 52], [x, 46], [x - 7, 52]], M.BLUE, 0.32, { tex: folds2 });
      for (const x of [26, 134]) {
        s.cap(x, 62, x, 74, 1.4, 1.4, M.METAL, 0.4);
        s.ell(x, 61, 5, 2, M.METAL, 0.45);
        s.bigFire(x, 59, 2.5, { logs: false, light: 12 });
      }
    },
  },
  hundred: {
    draw: (s: Scene2) => {
      s.sky('night');
      s.clouds(0, 50, { cover: 0.85, sy: 0.07 });
      s.halo(40, 18, 56, 0.2);
      s.moonAt(40, 18);
      range(s, 64, 10, { seed: 21 });
      s.fog(66, 4, 0.45);
      s.hill(() => 76, M.SNOW, { lift: 0.36 });
      road(s, 76, 80, 96, M.SNOW, 0.52, 6);
      for (let y = 36; y <= 84; y++) for (let x = 114; x <= 119; x++) {
        const dark = Math.floor((y - 36) / 6) % 2 === 1;
        s.putN(x, y, dark ? M.METAL : M.SNOW, dark ? 0.15 : 0.8, (x - 116.5) / 3, 0);
      }
      s.poly([[112, 34], [121, 34], [120, 36], [113, 36]], M.RED, 0.45);
      for (const [x, h] of [[18, 44], [30, 38], [146, 46]]) {
        s.cap(x, 78 - h, x, 80, 1.2, 1.6, M.BIRCH, 0.75);
        for (let y = 78 - h; y < 80; y += 3) s.put(x + (y % 2) - 1, y, M.METAL, 0.05);
      }
      s.pebbles(0, 160, 82, 100, 20, M.SNOW);
      knightWalk(s, 72, 98, 0.75);
    },
  },
  mordor: {
    draw: (s: Scene2) => {
      s.sky('blood', 60);
      s.clouds(4, 34, { cover: 0.75, red: true, sx: 0.025 });
      s.moonAt(80, 10);
      s.poly([[6, 100], [70, 30], [90, 30], [156, 100]], M.MTN, 0.3, { tex: rockTex(5), flat: 0.15 });
      s.rect(72, 28, 88, 31, M.LAVA, 0.8);
      s.lights.push({ x: 80, y: 30, r: 60, s: 0.9 });
      let x = 76;
      for (let y = 32; y < 92; y++) {
        x += Math.sin(y * 0.4) * 0.9 - 0.35;
        s.put(x, y, M.LAVA, 0.6 + Math.sin(y) * 0.2);
        s.put(x + 1, y, M.LAVA, 0.4);
      }
      let x2 = 84;
      for (let y = 33; y < 82; y++) {
        x2 += 0.55;
        s.put(x2, y, M.LAVA, 0.5);
      }
      s.clouds(8, 26, { cover: 0.5, red: true, seed: 9 });
      rockyGround(s, (xx) => 92 + Math.sin(xx * 0.1) * 2, M.GROUND, 30);
      knightWalk(s, 26, 98, 0.75);
    },
  },
  outpost: {
    draw: (s: Scene2) => {
      night(s, 90, 16, 8, { clouds: [26, 44, 0.4] });
      range(s, 60, 16, { seed: 23, snow: false });
      s.fog(58, 4, 0.5);
      // дальний холм с основным замком
      s.hill((x) => 62 - 7 * Math.exp(-Math.pow((x - 52) / 20, 2)), M.GROUND, { lift: 0.18 });
      s.castle(52, 56, 0.75, { win: 0.5, flag: M.RED });
      // река разделяет земли
      s.hill(() => 68, M.WATER, { lift: 0.3, tex: 0, rim: 0 });
      s.reflect(68, { fade: 0.006 });
      // отдельный холм за рекой: на нём острог
      s.poly([[86, 72], [96, 60], [108, 54], [126, 52], [144, 56], [160, 62], [160, 76], [86, 76]], M.GROUND, 0.26, { tex: rockTex(9), flat: 0.25, tilt: [-0.3, -0.4] });
      const ox = 126, ob = 54;
      // вышка внутри частокола
      s.block(ox - 4, ob - 24, ox + 4, ob, M.WOOD, { brick: false, lift: 0.06 });
      for (let y = ob - 22; y < ob; y += 4) s.cap(ox - 4, y, ox + 4, y, 0.4, 0.4, M.WOOD, 0.22);
      s.cone(ox, ob - 25, 6, 6, M.ROOF);
      s.rect(ox - 1, ob - 19, ox + 1, ob - 16, M.WINDOW, 0.95);
      s.lights.push({ x: ox, y: ob - 17, r: 22, s: 0.7 });
      banner(s, ox, ob - 31, 12, M.RED, 7, 1.2);
      // частокол с заострёнными кольями
      for (let x = ox - 17; x <= ox + 17; x += 3) {
        const h = 10 + Math.round(hash(x, 3, 7) * 2);
        for (let y = ob - h + 2; y <= ob + 2; y++) {
          s.put(x - 1, y, M.WOOD, 0.24);
          s.put(x, y, M.WOOD, 0.4 + (hash(x, y, 4) - 0.5) * 0.06);
          s.put(x + 1, y, M.WOOD, 0.3);
        }
        s.put(x - 1, ob - h + 1, M.WOOD, 0.3);
        s.put(x, ob - h + 1, M.WOOD, 0.5);
        s.put(x + 1, ob - h + 1, M.WOOD, 0.36);
        s.put(x, ob - h, M.WOOD, 0.6);
        s.put(x, ob - h - 1, M.WOOD, 0.55);
      }
      s.cap(ox - 18, ob - 5, ox + 18, ob - 5, 0.4, 0.4, M.WOOD, 0.2);
      s.rect(ox - 2, ob - 6, ox + 2, ob + 2, M.VOID, 0);
      s.lights.push({ x: ox, y: ob - 2, r: 10, s: 0.4 });
      // факелы у ворот
      for (const x of [ox - 5, ox + 5]) {
        s.cap(x, ob - 9, x, ob - 4, 0.4, 0.4, M.WOOD, 0.4);
        s.bigFire(x, ob - 9, 1.2, { logs: false, light: 8 });
      }
      s.pines(74, { x0: 140, x1: 168, hMin: 10, hMax: 16 });
      // берег на переднем плане
      rockyGround(s, (x) => 84 + Math.sin(x * 0.06) * 2 - (x < 40 ? (40 - x) * 0.12 : 0), M.GROUND, 30);
      s.pines(86, { x0: -6, x1: 14, hMin: 18, hMax: 26 });
      // редкая трава: лето ещё не ушло
      for (let i = 0; i < 70; i++) {
        const x = Math.floor(hash(i, 1, 31) * W);
        const y = 80 + Math.floor(hash(i, 2, 31) * 20);
        if (s.m(x, y) !== M.GROUND) continue;
        const v = 0.28 + hash(i, 3, 31) * 0.14;
        s.put(x, y, M.GREEN, v);
        s.put(x, y - 1, M.GREEN, v + 0.06);
        if (hash(i, 4, 31) > 0.5) s.put(x + 1, y - 2, M.GREEN, v + 0.1);
      }
      knightStand(s, 30, 100, 0.85, { sword: true });
    },
  },
  riddle1: {
    draw: (s: Scene2) => {
      night(s, 128, 18, 8, { clouds: [22, 42, 0.35] });
      range(s, 58, 14, { seed: 41, snow: false });
      s.fog(56, 4, 0.5);
      rockyGround(s, (x) => 80 + Math.sin(x * 0.05) * 2, M.GROUND, 40);
      s.pines(80, { x0: 130, x1: 168, hMin: 14, hMax: 22 });
      runeStone(s, 102, 82, 15, 38, 5, RUNE_A);
      s.pines(84, { x0: -6, x1: 16, hMin: 18, hMax: 26 });
      knightStand(s, 58, 98, 0.85, { sword: true });
    },
  },
  riddle3: {
    draw: (s: Scene2) => {
      night(s, 80, 15, 11, { kind: 'deep', clouds: [20, 40, 0.3], stars: 170 });
      range(s, 60, 12, { seed: 43 });
      s.fog(58, 5, 0.5);
      rockyGround(s, (x) => 79 + Math.abs(x - 80) * 0.04, M.GROUND, 50);
      runeStone(s, 50, 81, 12, 27, 7, RUNE_B);
      runeStone(s, 112, 81, 12, 27, 8, RUNE_C);
      runeStone(s, 81, 78, 14, 36, 9, RUNE_A);
      knightStand(s, 26, 99, 0.85, { arms: 'v' });
    },
  },
  riddle7: {
    draw: (s: Scene2) => {
      night(s, 96, 40, 20, { shadow: 0, clouds: [44, 58, 0.3], stars: 150 });
      range(s, 64, 10, { seed: 47 });
      s.fog(62, 4, 0.55);
      s.hill((x) => 70 + Math.pow((x - 96) / 24, 2) * 5, M.GROUND, { lift: 0.15 });
      seer(s, 96, 70);
      rockyGround(s, (x) => 88 + Math.sin(x * 0.07) * 1.5, M.GROUND, 30);
      s.pines(90, { x0: -6, x1: 20, hMin: 18, hMax: 26 });
      knightStand(s, 42, 100, 0.85, { sword: true });
    },
  },
  far_land: {
    draw: (s: Scene2) => {
      night(s, 40, 20, 11, { clouds: [26, 40, 0.35] });
      range(s, 62, 10, { seed: 22, snow: false });
      s.hill(() => 64, M.WATER, { lift: 0.3, tex: 0, rim: 0 });
      s.reflect(64, { fade: 0.005 });
      s.poly([[96, 100], [104, 72], [120, 62], [140, 60], [160, 66], [160, 100]], M.MTN, 0.28, { tex: rockTex(7), flat: 0.2, tilt: [-0.3, -0.3] });
      for (let y = 26; y <= 60; y++) {
        const hw = 3 + (y - 26) * 0.12;
        for (let dx = -Math.round(hw); dx <= hw; dx++) s.putN(132 + dx, y, Math.floor(y / 5) % 2 ? M.RED : M.SNOW, 0.45, dx / (hw + 0.5), 0);
      }
      s.rect(129, 20, 135, 25, M.WINDOW, 0.95);
      s.cone(132, 19, 4, 4, M.ROOF);
      s.lights.push({ x: 132, y: 22, r: 30, s: 0.8 });
      // корабль
      s.poly([[40, 70], [64, 70], [60, 75], [44, 75]], M.WOOD, 0.3);
      s.cap(52, 52, 52, 70, 0.5, 0.5, M.WOOD, 0.35);
      s.poly([[53, 53], [62, 60], [53, 67]], M.PARCH, 0.55, { flat: 0.4 });
    },
  },
});

// ── сцены выбора пути (рыцарь, чародей, торговец) ──
Object.assign(SCENES2, {
  path_knight: {
    draw: (s: Scene2) => {
      dusk(s, 120, 62, 11, 'dawn');
      range(s, 66, 16, { seed: 61, snow: false });
      s.fog(64, 4, 0.6);
      s.hill((x) => 66 - 9 * Math.exp(-Math.pow((x - 122) / 22, 2)), M.GROUND, { lift: 0.2 });
      s.castle(122, 58, 0.95, { win: 0.45, flag: M.RED });
      s.hill((x) => 78 + Math.sin(x * 0.05) * 2, M.GROUND, { lift: 0.22 });
      road(s, 70, 122, 82, M.GROUND, 0.5, 6);
      s.pines(80, { x0: -6, x1: 34, hMin: 14, hMax: 24 });
      rockyGround(s, (x) => 92 + Math.sin(x * 0.08) * 1.2, M.GROUND, 26);
      banner(s, 52, 96, 34, M.RED, 11, 0.6);
      banner(s, 110, 96, 34, M.RED, 11, 2.1);
      knightStand(s, 80, 99, 0.95, { sword: true });
    },
  },
  path_wizard: {
    draw: (s: Scene2) => {
      s.sky('deep', H * 0.7);
      s.stars(180, H * 0.62);
      s.bigMoon(34, 22, 9, { shadow: 0.55 });
      s.clouds(32, 52, { cover: 0.3, sx: 0.025, sy: 0.1 });
      range(s, 66, 12, { seed: 63 });
      s.fog(64, 4, 0.5);
      // скала и башня чародея
      s.poly([[86, 100], [92, 74], [102, 66], [120, 64], [134, 70], [142, 100]], M.MTN, 0.26, { tex: rockTex(12), flat: 0.2, tilt: [-0.3, -0.35] });
      const tx = 114, tb = 66;
      s.block(tx - 6, tb - 14, tx + 6, tb, M.STONE, { lift: 0.04 });
      s.block(tx - 5, tb - 40, tx + 5, tb - 14, M.STONE, { lift: 0.06 });
      s.cap(tx - 7, tb - 14, tx + 7, tb - 14, 0.6, 0.6, M.STONE, 0.42);
      s.cap(tx - 6, tb - 40, tx + 6, tb - 40, 0.7, 0.7, M.STONE, 0.45);
      s.cone(tx, tb - 41, 7, 18, M.BLUE, 0.06);
      for (let i = 0; i < 4; i++) s.put(tx + 2 - i, tb - 50 + i * 2, M.GOLD, 0.7);
      s.put(tx, tb - 60, M.STAR, 1);
      s.put(tx, tb - 61, M.STAR, 0.8);
      // светящееся окно наверху и окна ниже
      s.rect(tx - 2, tb - 35, tx + 1, tb - 30, M.WINDOW, 0.95);
      s.rect(tx - 1, tb - 36, tx, tb - 36, M.WINDOW, 0.8);
      s.lights.push({ x: tx, y: tb - 33, r: 26, s: 0.9 });
      s.rect(tx - 1, tb - 24, tx, tb - 22, M.WINDOW, 0.75);
      s.lights.push({ x: tx, y: tb - 23, r: 8, s: 0.35 });
      s.rect(tx - 2, tb - 6, tx + 1, tb, M.VOID, 0);
      // кольцо парящих рун вокруг шпиля
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        const x = Math.round(tx + Math.cos(a) * 15);
        const y = Math.round(tb - 33 + Math.sin(a) * 5);
        if (Math.sin(a) > 0.2 && Math.abs(x - tx) < 6) continue;
        s.put(x, y, M.STAR, 0.95);
        s.put(x + 1, y, M.ICE, 0.7);
        if (i % 3 === 0) s.put(x, y - 1, M.STAR, 0.8);
      }
      rockyGround(s, (x) => 88 + Math.sin(x * 0.06) * 1.5, M.GROUND, 30);
      s.pines(90, { x0: -6, x1: 22, hMin: 16, hMax: 26 });
      knightStand(s, 50, 100, 0.85, { cape: M.BLUE });
    },
  },
  path_merchant: {
    draw: (s: Scene2) => {
      dusk(s, 30, 60, 11);
      range(s, 64, 12, { seed: 65, snow: false });
      s.hill((x) => 66 + Math.sin(x * 0.04) * 1.5, M.GROUND, { lift: 0.2 });
      // дальний торговый город
      for (const [x, w, h] of [[100, 7, 7], [108, 6, 9], [115, 8, 6], [124, 6, 8], [131, 7, 10], [139, 6, 7], [146, 8, 8]] as [number, number, number][]) s.house(x, 66, w, h);
      s.tower(136, 66, 2, 16, { roof: 'cone', win: 0.4, flag: M.RED });
      road(s, 66, 120, 60, M.GROUND, 0.5, 8);
      rockyGround(s, (x) => 86 + Math.sin(x * 0.07) * 1.2, M.GROUND, 20);
      // повозка с полосатым тентом
      const cx = 104, cb = 94, k = 1.35;
      const R = (n: number) => Math.round(n * k);
      s.block(cx - R(16), cb - R(11), cx + R(12), cb - R(5), M.WOOD, { brick: false, lift: 0.14 });
      for (let x = cx - R(16); x <= cx + R(12); x += 5) s.cap(x, cb - R(11), x, cb - R(5), 0.4, 0.4, M.WOOD, 0.24);
      const th = R(14), tw = R(15);
      for (let y = 0; y <= th; y++) {
        const hw = tw * Math.sqrt(1 - Math.pow(y / th, 2));
        for (let x = Math.round(cx - 2 - hw); x <= cx - 2 + hw; x++) {
          const stripe = Math.floor((x - cx + 60) / 5) % 2 === 0;
          s.putN(x, cb - R(11) - y, stripe ? M.PARCH : M.RED, stripe ? 0.66 : 0.5, (x - cx + 2) / (tw + 1), -y / th);
        }
      }
      for (const wx of [cx - R(10), cx + R(6)]) {
        for (let a = 0; a < 60; a++) {
          const t = (a / 60) * Math.PI * 2;
          s.put(Math.round(wx + Math.cos(t) * R(4.5)), Math.round(cb - R(2) + Math.sin(t) * R(4.5)), M.METAL, 0.5 + Math.max(0, -Math.sin(t)) * 0.25);
        }
        s.line(wx - R(4), cb - R(2), wx + R(4), cb - R(2), M.WOOD, 0.5);
        s.line(wx, cb - R(6), wx, cb + R(2), M.WOOD, 0.5);
        s.ell(wx, cb - R(2), 1.2, 1.2, M.METAL, 0.65);
      }
      s.cap(cx + R(12), cb - R(6), cx + R(24), cb - R(3), 0.7, 0.6, M.WOOD, 0.4);
      // фонарь на повозке
      s.cap(cx + R(12), cb - R(11), cx + R(12), cb - R(22), 0.5, 0.5, M.WOOD, 0.4);
      s.rect(cx + R(12) + 1, cb - R(22), cx + R(12) + 3, cb - R(19), M.WINDOW, 0.98);
      s.lights.push({ x: cx + R(12) + 2, y: cb - R(20), r: 30, s: 1 });
      // ящики и мешок с монетами
      s.block(cx - 46, cb - 8, cx - 37, cb + 1, M.WOOD, { brick: false, lift: 0.16 });
      s.block(cx - 44, cb - 14, cx - 37, cb - 8, M.WOOD, { brick: false, lift: 0.2 });
      s.ell(cx - 30, cb - 3, 4.5, 4, M.PARCH, 0.55);
      s.ell(cx - 30, cb - 7, 1.5, 1, M.PARCH, 0.45);
      for (const [x, y] of [[-34, 1], [-33, 0], [-31, 1], [-28, 1], [-29, 0], [-27, 2], [-35, 2], [-30, -1], [-32, 2], [-26, 1]] as [number, number][]) s.put(cx + x, cb + y, M.GOLD, 0.78 + hash(x, y, 3) * 0.2);
      // уличный фонарь
      s.cap(40, cb - 26, 40, cb + 2, 0.6, 0.7, M.WOOD, 0.4);
      s.cap(40, cb - 26, 44, cb - 26, 0.5, 0.5, M.WOOD, 0.4);
      s.rect(43, cb - 25, 45, cb - 21, M.WINDOW, 0.98);
      s.lights.push({ x: 44, y: cb - 23, r: 30, s: 1 });
      knightStand(s, 24, 100, 0.85, {});
    },
  },
});

// эффекты частиц, источники искр и «мигалка» в щели шлема
export const FX2: Record<string, { fx: string; emit?: [number, number]; subject?: boolean; glow?: [number, number, number, number]; sparkle?: [number, number][] }> = {
  fire_keeper: { fx: 'embers', emit: [100, 84], subject: true },
  first_land: { fx: 'snow', subject: true, glow: [73, 48, 9, 2] },
  founder: { fx: 'dust' },
  couch: { fx: 'dust', subject: true },
  streak7: { fx: 'dust' },
  night: { fx: 'snow', sparkle: [[127, 76], [154, 92]] },
  early: { fx: 'dust' },
  circle: { fx: 'fireflies' },
  winter: { fx: 'blizzard' },
  chronicler: { fx: 'dust' },
  architect: { fx: 'dust' },
  herald: { fx: 'dust' },
  border: { fx: 'snow' },
  great_march: { fx: 'snow' },
  wanderer: { fx: 'dust' },
  lord: { fx: 'snow' },
  glory: { fx: 'stars' },
  patron: { fx: 'dust' },
  robin: { fx: 'dust' },
  exile: { fx: 'ash' },
  return_king: { fx: 'dust' },
  arrow_knee: { fx: 'embers', emit: [128, 76], subject: true },
  full_moon: { fx: 'fireflies' },
  friday13: { fx: 'fireflies' },
  solstice: { fx: 'dust' },
  triple: { fx: 'snow' },
  hectares: { fx: 'fireflies' },
  suzerain: { fx: 'embers', emit: [26, 54] },
  hundred: { fx: 'blizzard' },
  mordor: { fx: 'embers', emit: [80, 28] },
  far_land: { fx: 'stars' },
  outpost: { fx: 'fireflies' },
  riddle1: { fx: 'fireflies', sparkle: [[102, 56]] },
  riddle3: { fx: 'stars', sparkle: [[81, 52]] },
  riddle7: { fx: 'stars', glow: [94, 55, 5, 1] },
  path_knight: { fx: 'dust', sparkle: [[80, 72]] },
  path_wizard: { fx: 'stars', glow: [113, 33, 6, 1], sparkle: [[114, 6], [99, 33], [129, 33]] },
  path_merchant: { fx: 'fireflies', sparkle: [[71, 95], [76, 94], [125, 66]] },
};
