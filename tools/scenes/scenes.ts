import { REGALIA_ART } from '../../src/art/arts';
import { KNIGHT_KEY, KNIGHT_SIT, KNIGHT_STAND, KNIGHT_V, KNIGHT_WALK, M, SWORD_GROUND, Scene, type Key } from './engine';

export type Fx = 'snow' | 'blizzard' | 'embers' | 'fireflies' | 'ash' | 'dust' | 'stars' | 'rain' | 'none';

export interface SceneDef {
  w: number;
  h: number;
  fx: Fx;
  emit?: [number, number]; // источник искр (пиксели сцены)
  subject?: boolean; // предмет регалии уже нарисован в сцене — медальон не нужен
  draw: (s: Scene) => void;
}

export const W = 112;
export const H = 72;

// карта палитры иконок → материалы сцены (для диванного рыцаря)
const ICON_KEY: Key = {
  K: [M.METAL, 0.02], k: [M.METAL, 0.14], G: [M.METAL, 0.38], g: [M.METAL, 0.26], H: [M.METAL, 0.72], h: [M.METAL, 0.52],
  W: [M.SNOW, 0.9], Y: [M.GOLD, 0.62], y: [M.GOLD, 0.38], M: [M.GOLD, 0.82], O: [M.FIRE, 0.6], R: [M.RED, 0.55], r: [M.RED, 0.32],
  S: [M.FLESH, 0.8], s: [M.FLESH, 0.5], B: [M.BLUE, 0.6], b: [M.BLUE, 0.35], N: [M.BLUE, 0.12], n: [M.BLUE, 0.22],
  E: [M.GREEN, 0.6], e: [M.GREEN, 0.35], P: [M.BLUE, 0.7], p: [M.BLUE, 0.45], C: [M.RED, 0.42], c: [M.RED, 0.24],
  T: [M.WOOD, 0.55], t: [M.WOOD, 0.35], L: [M.ICE, 0.85], l: [M.ICE, 0.5], F: [M.PARCH, 0.85], f: [M.PARCH, 0.6],
};

const nightBase = (s: Scene, o: { moon?: [number, number, number]; shadow?: number; stars?: number; clouds?: [number, number, number] | false; kind?: 'night' | 'dusk' | 'deep' } = {}) => {
  s.sky(o.kind ?? 'night');
  const [mx, my, mr] = o.moon ?? [88, 16, 9];
  s.moonDisk(mx, my, mr, { shadow: o.shadow });
  s.stars(o.stars ?? 70);
  if (o.clouds !== false) {
    const [a, b, c] = o.clouds ?? [18, 34, 0.45];
    s.clouds(a, b, { cover: c });
  }
};

const knight = (s: Scene, x: number, y: number, rows: string[], flip = false) => s.sprite(x, y, rows, KNIGHT_KEY, flip);
const grave = (s: Scene, x: number, base: number, tall = 6) => {
  s.rect(x, base - tall, x, base, M.STONE, 0.4);
  s.rect(x - 2, base - tall + 2, x + 2, base - tall + 2, M.STONE, 0.42);
  s.put(x + s.dir, base - tall + 1, M.STONE, 0.6);
};
const menhir = (s: Scene, x: number, base: number, h: number, w = 2) => {
  for (let y = base - h; y <= base; y++)
    for (let dx = -w; dx <= w; dx++) {
      if (y === base - h && Math.abs(dx) === w) continue;
      s.put(x + dx, y, M.STONE, 0.32 + (dx * s.dir >= w - 0.5 ? 0.32 : dx * s.dir > 0 ? 0.1 : 0) + (((x * 7 + y * 13 + dx) % 5) / 5 - 0.5) * 0.08);
    }
};

export const SCENES: Record<string, SceneDef> = {
  // ───── костёр под луной: ближе всего к референсу
  fire_keeper: {
    w: W, h: H, fx: 'embers', emit: [62, 58], subject: true,
    draw: (s) => {
      nightBase(s, { moon: [86, 15, 11], clouds: [22, 40, 0.55] });
      s.ridge({ base: 54, amp: 14, freq: 0.045, m: M.MTN_FAR, ridged: true, haze: 0.25, snow: 3, seed: 3 });
      s.fog(52, 4, 0.6);
      s.hill((x) => 61 + Math.sin(x * 0.05) * 2 - (x < 30 ? (30 - x) * 0.9 : 0), M.GROUND, { lift: 0.24 });
      // скала слева, как на референсе
      s.ridge({ base: 72, amp: 52, freq: 0.08, m: M.MTN, x0: -30, x1: 34, seed: 9, lift: 0.18 });
      s.bonfire(62, 63, 3, { light: 11 });
      knight(s, 40, 48, KNIGHT_SIT);
      s.sprite(61, 50, SWORD_GROUND, KNIGHT_KEY);
    },
  },
  first_land: {
    w: W, h: H, fx: 'snow',
    draw: (s) => {
      nightBase(s, { moon: [90, 14, 8] });
      s.ridge({ base: 48, amp: 16, freq: 0.04, m: M.MTN_FAR, ridged: true, haze: 0.2, snow: 4 });
      s.fog(47, 4, 0.5);
      s.hill((x) => 66 - 14 * Math.exp(-Math.pow((x - 52) / 22, 2)), M.SNOW, { lift: 0.32, rim: 0.25 });
      s.pines(60, { x0: 85, x1: 116, hMin: 9, hMax: 15, snow: true });
      s.pines(62, { x0: -4, x1: 22, hMin: 8, hMax: 13, snow: true });
      s.flag(54, 52, 13, M.RED, 7, 1);
      knight(s, 40, 36, KNIGHT_STAND);
    },
  },
  founder: {
    w: W, h: H, fx: 'dust',
    draw: (s) => {
      s.sky('dusk', 54);
      s.sunDisk(24, 54, 6);
      s.clouds(14, 34, { cover: 0.5, warm: true });
      s.ridge({ base: 56, amp: 12, freq: 0.05, m: M.MTN_FAR, haze: 0.3, seed: 2 });
      s.hill((x) => 52 - 10 * Math.exp(-Math.pow((x - 72) / 26, 2)), M.GROUND, { lift: 0.22 });
      s.castle(72, 43, 1, { win: 0.5, flag: M.RED });
      s.pines(60, { x0: -4, x1: 40, hMin: 7, hMax: 12 });
    },
  },
  couch: {
    w: W, h: H, fx: 'dust', subject: true,
    draw: (s) => {
      s.room(56);
      s.windowView(14, 12, 33, 33, () => {
        s.sky('night', 34);
        s.moonDisk(28, 18, 4);
        s.stars(20, 30);
        s.pines(34, { x0: 12, x1: 36, hMin: 5, hMax: 9, snow: true });
      });
      s.dir = -1;
      // экран телевизора в углу — холодный свет
      s.rect(88, 30, 104, 42, M.METAL, 0.1);
      s.rect(89, 31, 103, 41, M.ICE, 0.7);
      s.rect(94, 43, 98, 47, M.METAL, 0.2);
      s.halo(96, 36, 26, 0.18, [M.STONE, M.WOOD]);
      const g = REGALIA_ART.couch;
      s.sprite(36, 64 - g.length, g, ICON_KEY);
      s.candle(10, 56, 4);
    },
  },
  streak7: {
    w: W, h: H, fx: 'dust',
    draw: (s) => {
      s.sky('dawn', 48);
      s.sunDisk(80, 48, 7);
      s.clouds(12, 30, { cover: 0.4, warm: true });
      s.ridge({ base: 50, amp: 10, freq: 0.05, m: M.MTN_FAR, haze: 0.4 });
      s.fog(50, 3, 0.7);
      s.hill((x) => 54 + Math.sin(x * 0.07) * 2, M.GROUND, { lift: 0.24 });
      // дорога к солнцу
      for (let y = 54; y < H; y++) {
        const t = (y - 54) / (H - 54);
        const cx = 80 - t * 30 + Math.sin(t * 4) * 6;
        const hw = 1 + t * 12;
        s.rect(cx - hw, y, cx + hw, y, M.GROUND, (x) => 0.45 + (Math.abs(x - cx) < hw * 0.3 ? 0.08 : 0));
      }
      knight(s, 44, 52, KNIGHT_WALK);
      s.pines(56, { x0: -4, x1: 26, hMin: 8, hMax: 14 });
    },
  },
  night: {
    w: W, h: H, fx: 'stars', subject: false,
    draw: (s) => {
      nightBase(s, { moon: [24, 14, 7], shadow: 0.55, kind: 'deep', stars: 110, clouds: [26, 40, 0.35] });
      s.hill((x) => 58 + Math.sin(x * 0.04) * 2, M.GROUND, { lift: 0.2 });
      // стена со сторожевой башней
      s.block(0, 44, 112, 60, M.STONE, { lift: -0.02 });
      s.crenel(0, 112, 43);
      s.tower(78, 60, 7, 34, { roof: 'cone', win: 0.25 });
      s.torch(66, 38);
      s.torch(92, 38);
      knight(s, 50, 27, KNIGHT_STAND);
    },
  },
  early: {
    w: W, h: H, fx: 'dust',
    draw: (s) => {
      s.sky('dawn', 50);
      s.sunDisk(56, 50, 10);
      s.clouds(8, 26, { cover: 0.45, warm: true });
      s.ridge({ base: 52, amp: 8, freq: 0.04, m: M.MTN_FAR, haze: 0.45 });
      s.fog(51, 4, 0.9);
      s.hill((x) => 58 + Math.sin(x * 0.09 + 1) * 3, M.GROUND, { lift: 0.18 });
      s.pines(58, { hMin: 6, hMax: 16, gap: [6, 14] });
      s.fog(66, 3, 0.6, { seed: 7 });
    },
  },
  circle: {
    w: W, h: H, fx: 'fireflies',
    draw: (s) => {
      nightBase(s, { moon: [56, 14, 8], clouds: [20, 34, 0.4] });
      s.ridge({ base: 50, amp: 10, freq: 0.05, m: M.MTN_FAR, haze: 0.25 });
      s.hill((x) => 54 + Math.sin(x * 0.05) * 1.5, M.GROUND, { lift: 0.22 });
      s.fog(54, 3, 0.7);
      const pts = [[22, 60, 12], [38, 56, 14], [56, 55, 15], [74, 56, 14], [90, 60, 12], [28, 70, 10], [84, 70, 10]];
      for (const [x, b, h] of pts) menhir(s, x, b, h);
      s.rect(52, 40, 60, 41, M.STONE, 0.45);
    },
  },
  winter: {
    w: W, h: H, fx: 'blizzard',
    draw: (s) => {
      s.sky('night');
      s.clouds(0, 40, { cover: 0.9, sy: 0.08 });
      s.halo(70, 18, 40, 0.25);
      s.ridge({ base: 46, amp: 10, freq: 0.05, m: M.MTN_FAR, haze: 0.4, snow: 8 });
      s.fog(44, 6, 0.8);
      const hs = s.hill((x) => 58 + Math.sin(x * 0.06) * 3, M.SNOW, { lift: 0.36 });
      s.pines(50, { hMin: 8, hMax: 13, snow: true, gap: [4, 9], lift: 0.05 });
      s.pines(hs, { hMin: 14, hMax: 24, snow: true, gap: [9, 18] });
      knight(s, 54, 44, KNIGHT_WALK);
      s.torch(64, 49);
    },
  },
  chronicler: {
    w: W, h: H, fx: 'dust',
    draw: (s) => {
      s.room(52);
      s.windowView(78, 10, 96, 30, () => {
        s.sky('night', 30);
        s.moonDisk(90, 15, 3);
        s.stars(14, 28);
      });
      // стол, книга, свеча
      s.rect(20, 50, 74, 52, M.WOOD, 0.4);
      s.rect(24, 53, 26, 66, M.WOOD, 0.3);
      s.rect(68, 53, 70, 66, M.WOOD, 0.3);
      s.rect(34, 46, 47, 49, M.PARCH, (x) => (x === 40 || x === 41 ? 0.5 : 0.75));
      s.rect(33, 49, 48, 49, M.PARCH, 0.45);
      for (let y = 47; y <= 48; y++) for (let x = 35; x <= 46; x += 2) if (x !== 41) s.put(x, y, M.PARCH, 0.4);
      s.line(52, 49, 57, 42, M.PARCH, 0.85);
      s.rect(60, 46, 64, 49, M.METAL, 0.3);
      s.candle(28, 49, 4);
      s.candle(66, 45, 3);
      // полки
      s.rect(4, 22, 18, 23, M.WOOD, 0.35);
      for (let x = 5; x < 18; x += 2) s.rect(x, 16, x + 1, 21, x % 4 === 1 ? M.RED : M.BLUE, 0.35);
    },
  },
  architect: {
    w: W, h: H, fx: 'dust',
    draw: (s) => {
      s.sky('dusk', 56);
      s.clouds(10, 30, { cover: 0.5, warm: true });
      s.ridge({ base: 56, amp: 10, freq: 0.06, m: M.MTN_FAR, haze: 0.3 });
      s.hill((x) => 60, M.GROUND, { lift: 0.22 });
      s.tower(56, 60, 9, 26, { roof: 'none' });
      s.rect(46, 34, 66, 36, M.VOID, 0);
      // леса
      for (const x of [44, 68]) s.line(x, 60, x, 22, M.WOOD, 0.45);
      for (const y of [48, 36, 24]) s.line(43, y, 69, y, M.WOOD, 0.5);
      s.line(70, 22, 84, 22, M.WOOD, 0.45);
      s.line(82, 22, 82, 34, M.METAL, 0.4);
      s.rect(80, 34, 84, 37, M.STONE, 0.45);
      for (let i = 0; i < 6; i++) s.block(20 + i * 4, 56 - (i % 2) * 3, 23 + i * 4, 59, M.STONE, { lift: 0.04 });
    },
  },
  herald: {
    w: W, h: H, fx: 'dust',
    draw: (s) => {
      s.sky('dusk', 52);
      s.sunDisk(90, 52, 6);
      s.clouds(10, 34, { cover: 0.5, warm: true });
      s.ridge({ base: 54, amp: 8, freq: 0.06, m: M.MTN_FAR, haze: 0.35 });
      s.hill((x) => 58 + Math.sin(x * 0.08) * 1.5, M.GROUND, { lift: 0.22 });
      const cols = [M.RED, M.BLUE, M.GREEN, M.GOLD, M.RED];
      [18, 36, 54, 72].forEach((x, i) => {
        s.line(x, 60, x, 22 + (i % 2) * 4, M.WOOD, 0.4);
        for (let yy = 0; yy < 18; yy++)
          for (let xx = 1; xx <= 8; xx++) {
            const dy = Math.round(Math.sin(xx * 0.5 + i) * 1.2);
            if (yy > 14 && xx > 3 && xx < 6) continue;
            s.put(x + xx, 23 + (i % 2) * 4 + yy + dy, cols[i], 0.3 + (xx === 1 ? 0.2 : 0) + (yy < 2 ? 0.1 : 0));
          }
      });
    },
  },
  border: {
    w: W, h: H, fx: 'snow',
    draw: (s) => {
      nightBase(s, { moon: [56, 13, 7] });
      s.ridge({ base: 46, amp: 12, freq: 0.05, m: M.MTN_FAR, haze: 0.25, snow: 3 });
      s.hill((x) => 52, M.GROUND, { lift: 0.2 });
      s.reflect(52, { fade: 0.008 });
      s.hill((x) => 60 + (x < 56 ? 0 : 1), M.SNOW, { lift: 0.3 });
      // частоколы по обе стороны
      for (let x = 2; x < 44; x += 3) s.rect(x, 52, x + 1, 60, M.WOOD, 0.35 + (x % 6 === 2 ? 0.08 : 0));
      for (let x = 70; x < 112; x += 3) s.rect(x, 52, x + 1, 60, M.WOOD, 0.35 + (x % 6 === 1 ? 0.08 : 0));
      s.flag(40, 52, 16, M.RED, 7, 0.5);
      s.flag(74, 52, 16, M.BLUE, 7, 2);
    },
  },
  great_march: {
    w: W, h: H, fx: 'snow',
    draw: (s) => {
      nightBase(s, { moon: [84, 12, 8] });
      s.ridge({ base: 44, amp: 18, freq: 0.035, m: M.MTN_FAR, ridged: true, haze: 0.3, snow: 5 });
      s.fog(42, 4, 0.6);
      s.ridge({ base: 54, amp: 8, freq: 0.06, m: M.MTN, haze: 0.1, seed: 13, lift: 0.22 });
      s.hill((x) => 60, M.SNOW, { lift: 0.28 });
      for (let y = 46; y < H; y++) {
        const t = (y - 46) / (H - 46);
        const cx = 70 - t * 22 + Math.sin(t * 6) * 8;
        const hw = 0.5 + t * 9;
        for (let x = Math.round(cx - hw); x <= cx + hw; x++) if (s.m(x, y) === M.SNOW || s.m(x, y) === M.MTN) s.put(x, y, M.SNOW, 0.62);
      }
      knight(s, 40, 50, KNIGHT_WALK);
    },
  },
  wanderer: {
    w: W, h: H, fx: 'dust',
    draw: (s) => {
      s.sky('dusk', 52);
      s.sunDisk(30, 52, 8);
      s.clouds(8, 30, { cover: 0.5, warm: true });
      s.ridge({ base: 54, amp: 9, freq: 0.04, m: M.MTN_FAR, haze: 0.4 });
      s.hill((x) => 58 + Math.sin(x * 0.05) * 3, M.GROUND, { lift: 0.24 });
      // разрушенная арка
      s.block(62, 30, 67, 60, M.STONE, { lift: 0.02 });
      s.block(84, 38, 89, 60, M.STONE, { lift: 0.02 });
      for (let a = 0; a <= 14; a++) {
        const t = (a / 14) * Math.PI;
        const x = 75.5 - Math.cos(t) * 11;
        const y = 34 - Math.sin(t) * 9;
        if (a < 10) s.rect(x - 1, y, x + 1, y + 3, M.STONE, 0.28);
      }
      knight(s, 40, 44, KNIGHT_WALK);
    },
  },
  lord: {
    w: W, h: H, fx: 'snow',
    draw: (s) => {
      nightBase(s, { moon: [18, 13, 7] });
      s.ridge({ base: 44, amp: 14, freq: 0.04, m: M.MTN_FAR, haze: 0.25, snow: 4 });
      s.hill((x) => 46 - 6 * Math.exp(-Math.pow((x - 60) / 20, 2)), M.GROUND, { lift: 0.2 });
      s.castle(60, 40, 0.9, { win: 0.6, flag: M.GOLD });
      s.hill((x) => 58 + Math.sin(x * 0.1) * 1.5, M.SNOW, { lift: 0.24 });
      [6, 20, 34, 80, 94].forEach((x, i) => s.house(x, 62 + (i % 2), 8, 5, { snow: true }));
    },
  },
  glory: {
    w: W, h: H, fx: 'stars',
    draw: (s) => {
      s.sky('deep');
      s.stars(140);
      s.aurora(18, 5);
      s.aurora(28, 3, { seed: 9 });
      s.dir = 1;
      s.ridge({ base: 46, amp: 18, freq: 0.04, m: M.MTN_FAR, ridged: true, haze: 0.2, snow: 6 });
      s.reflect(50, { fade: 0.005 });
      s.hill((x) => 64 + Math.sin(x * 0.07) * 2, M.SNOW, { lift: 0.22 });
      knight(s, 52, 49, KNIGHT_STAND);
    },
  },
  patron: {
    w: W, h: H, fx: 'dust',
    draw: (s) => {
      s.room(54);
      // сундук
      s.rect(40, 42, 72, 56, M.WOOD, 0.4);
      s.rect(40, 42, 72, 43, M.GOLD, 0.45);
      s.rect(40, 50, 72, 50, M.GOLD, 0.4);
      s.rect(54, 47, 58, 52, M.GOLD, 0.65);
      for (let i = 0; i < 70; i++) {
        const x = 42 + Math.floor(s.rnd() * 29);
        const y = 37 + Math.floor(s.rnd() * 6) + Math.abs(x - 56) * 0.25;
        if (y < 42) s.put(x, y, M.GOLD, 0.5 + s.rnd() * 0.5);
      }
      for (let i = 0; i < 12; i++) s.put(30 + s.rnd() * 52, 57 + s.rnd() * 8, M.GOLD, 0.7);
      s.candle(24, 54, 6);
      s.candle(88, 54, 5);
      s.candle(94, 54, 3);
      s.light(56, 40, 30, 0.5);
      // гобелены
      s.rect(8, 6, 20, 34, M.RED, (x, y) => 0.32 + (y % 6 === 0 ? 0.1 : 0));
      s.rect(92, 6, 104, 34, M.RED, (x, y) => 0.32 + (y % 6 === 0 ? 0.1 : 0));
      s.rect(12, 14, 16, 20, M.GOLD, 0.55);
      s.rect(96, 14, 100, 20, M.GOLD, 0.55);
    },
  },
  robin: {
    w: W, h: H, fx: 'dust',
    draw: (s) => {
      s.sky('dawn', 52);
      s.clouds(10, 30, { cover: 0.45, warm: true });
      s.ridge({ base: 52, amp: 8, freq: 0.05, m: M.MTN_FAR, haze: 0.4 });
      s.hill((x) => 58 - 4 * Math.exp(-Math.pow((x - 74) / 16, 2)), M.GROUND, { lift: 0.24 });
      // брошенный белый флаг и шлем
      s.line(74, 55, 78, 34, M.WOOD, 0.4);
      for (let yy = 0; yy < 6; yy++) for (let xx = 0; xx < 8; xx++) s.put(79 + xx, 34 + yy + Math.round(Math.sin(xx * 0.8) * 0.6), M.SNOW, 0.8 - xx * 0.03);
      s.rect(84, 52, 88, 55, M.METAL, 0.45);
      // убегающий рыцарь вдали + пыль
      knight(s, 18, 42, KNIGHT_WALK, true);
      for (let i = 0; i < 16; i++) s.put(30 + s.rnd() * 16, 54 + s.rnd() * 4, M.FOG, 0.5 + s.rnd() * 0.3);
    },
  },
  exile: {
    w: W, h: H, fx: 'ash',
    draw: (s) => {
      s.sky('blood', 54);
      s.moonDisk(80, 16, 9, { red: true, halo: 0.25 });
      s.clouds(20, 40, { cover: 0.6, red: true });
      s.ridge({ base: 52, amp: 10, freq: 0.05, m: M.MTN_FAR, haze: 0.05 });
      s.hill((x) => 54, M.GROUND, { lift: 0.14 });
      s.castle(56, 52, 1, { ruined: true, win: 0 });
      s.bonfire(36, 54, 2, { logs: false, light: 6 });
      s.bonfire(74, 53, 2, { logs: false, light: 6 });
      s.hill((x) => 62 + Math.sin(x * 0.12) * 1.5, M.GROUND, { lift: 0.12 });
      s.sprite(52, 56, ['.g.....', 'ggg....', '.s.....', '..s....', '...s...', '....s..'], KNIGHT_KEY);
    },
  },
  return_king: {
    w: W, h: H, fx: 'dust',
    draw: (s) => {
      s.sky('dawn', 50);
      s.sunDisk(58, 46, 9);
      s.clouds(6, 28, { cover: 0.5, warm: true });
      s.ridge({ base: 50, amp: 8, freq: 0.05, m: M.MTN_FAR, haze: 0.4 });
      s.hill((x) => 52 - 4 * Math.exp(-Math.pow((x - 58) / 24, 2)), M.GROUND, { lift: 0.2 });
      s.castle(58, 48, 0.85, { win: 0.3, flag: M.GOLD });
      s.hill((x) => 64 + Math.sin(x * 0.07) * 2, M.GROUND, { lift: 0.22 });
      knight(s, 22, 49, KNIGHT_STAND);
      s.flag(36, 66, 18, M.GOLD, 7, 1);
    },
  },
  arrow_knee: {
    w: W, h: H, fx: 'embers', emit: [86, 50],
    draw: (s) => {
      s.room(56);
      // очаг
      s.block(70, 26, 102, 58, M.STONE, { lift: 0.06 });
      s.rect(76, 38, 96, 56, M.VOID, 0);
      s.rect(68, 24, 104, 26, M.STONE, 0.4);
      s.bonfire(86, 55, 4, { light: 9 });
      // стол и кружка
      s.rect(14, 46, 52, 48, M.WOOD, 0.45);
      s.rect(18, 49, 20, 64, M.WOOD, 0.3);
      s.rect(46, 49, 48, 64, M.WOOD, 0.3);
      s.rect(24, 40, 28, 45, M.WOOD, 0.55);
      s.put(29, 42, M.WOOD, 0.5);
      s.rect(24, 39, 28, 39, M.SNOW, 0.7);
      // щит и стрела на стене
      s.rect(36, 14, 48, 26, M.BLUE, 0.35);
      s.rect(41, 14, 43, 26, M.GOLD, 0.5);
      s.line(30, 30, 56, 18, M.WOOD, 0.5);
      s.rect(55, 17, 57, 19, M.RED, 0.5);
    },
  },
  full_moon: {
    w: W, h: H, fx: 'fireflies',
    draw: (s) => {
      s.sky('deep');
      s.moonDisk(58, 30, 20, { halo: 0.4 });
      s.stars(60);
      s.clouds(42, 54, { cover: 0.4 });
      s.hill((x) => 64 + Math.sin(x * 0.05) * 2, M.GROUND, { lift: 0.14 });
      s.ridge({ base: 72, amp: 26, freq: 0.07, m: M.MTN, x0: 58, x1: 130, seed: 4, lift: 0.12 });
      s.deadTree(16, 66, 12, -Math.PI / 2 + 0.1, 5);
      // волк на скале
      s.sprite(84, 40, ['..k.k......', '..kkkk.....', '.kkkkkk....', 'kkkk.kk....', '....kkkkk..', '....kkkkkkk', '...kkkkkkkk', '...kkkkkkkk', '...kk..kk.k', '...k....k..'], { k: [M.METAL, 0.04] });
    },
  },
  friday13: {
    w: W, h: H, fx: 'fireflies',
    draw: (s) => {
      nightBase(s, { moon: [22, 14, 7], shadow: -0.6, kind: 'deep', clouds: [16, 32, 0.5] });
      s.hill((x) => 56 + Math.sin(x * 0.06) * 2, M.GROUND, { lift: 0.18 });
      s.fog(58, 4, 0.8);
      [16, 30, 46, 64, 80, 98].forEach((x, i) => grave(s, x, 60 + (i % 2) * 3, 6 + (i % 3)));
      s.deadTree(92, 58, 14, -Math.PI / 2 - 0.15, 5);
      // чёрный кот
      s.sprite(52, 56, ['k...k....', 'kk.kk....', 'kYkYk....', 'kkkkk..k.', '.kkkkk..k', '.kkkkkkkk', '.kk..kk..'], { k: [M.METAL, 0.03], Y: [M.GOLD, 0.85] });
      s.fog(68, 3, 0.6, { seed: 4 });
    },
  },
  solstice: {
    w: W, h: H, fx: 'dust',
    draw: (s) => {
      s.sky('dawn', 54);
      s.sunDisk(56, 42, 14);
      s.clouds(6, 22, { cover: 0.4, warm: true });
      s.ridge({ base: 56, amp: 8, freq: 0.05, m: M.MTN_FAR, haze: 0.3 });
      s.hill((x) => 60 - 3 * Math.exp(-Math.pow((x - 56) / 14, 2)), M.GROUND, { lift: 0.16 });
      knight(s, 50, 43, KNIGHT_V);
    },
  },
  new_year: {
    w: W, h: H, fx: 'snow',
    draw: (s) => {
      nightBase(s, { moon: [92, 12, 6], stars: 90, clouds: false });
      s.ridge({ base: 46, amp: 10, freq: 0.05, m: M.MTN_FAR, haze: 0.25, snow: 6 });
      s.hill((x) => 58 + Math.sin(x * 0.05) * 1.5, M.SNOW, { lift: 0.32 });
      [8, 22, 74, 88].forEach((x, i) => s.house(x, 58 + (i % 2), 10, 7, { snow: true }));
      // ёлка с огнями
      s.pine(54, 62, 26, true);
      [[50, 46], [57, 50], [49, 55], [59, 57], [53, 42], [55, 53]].forEach(([x, y], i) => {
        s.put(x, y, i % 2 ? M.WINDOW : M.FIRE, 0.95);
        s.light(x, y, 6, 0.3);
      });
      s.put(54, 35, M.GOLD, 1);
      s.put(53, 36, M.GOLD, 0.8);
      s.put(55, 36, M.GOLD, 0.8);
    },
  },
  triple: {
    w: W, h: H, fx: 'snow',
    draw: (s) => {
      nightBase(s, { moon: [56, 12, 7] });
      s.ridge({ base: 44, amp: 12, freq: 0.05, m: M.MTN_FAR, haze: 0.25, snow: 4 });
      const hs = s.hill((x) => 60 - 8 * Math.exp(-Math.pow((x - 20) / 12, 2)) - 12 * Math.exp(-Math.pow((x - 56) / 12, 2)) - 6 * Math.exp(-Math.pow((x - 92) / 12, 2)), M.SNOW, { lift: 0.3 });
      [20, 56, 92].forEach((x, i) => s.flag(x, Math.round(hs[x]) + 1, 13, M.RED, 7, i));
    },
  },
  hectares: {
    w: W, h: H, fx: 'fireflies',
    draw: (s) => {
      nightBase(s, { moon: [90, 12, 7], clouds: [14, 28, 0.35] });
      s.ridge({ base: 40, amp: 8, freq: 0.05, m: M.MTN_FAR, haze: 0.3 });
      for (let y = 40; y < H; y++) {
        const band = Math.floor(Math.pow(y - 39, 0.7));
        for (let x = 0; x < W; x++) {
          const furrow = Math.floor((x - 56) / Math.max(1, (y - 36) * 0.4)) % 2 === 0;
          s.put(x, y, band % 2 ? M.GREEN : M.GROUND, 0.22 + (furrow ? 0.06 : 0) + (y - 40) * 0.004);
        }
      }
      for (let x = 0; x < W; x += 6) s.rect(x, 44, x, 48, M.WOOD, 0.4);
      s.rect(0, 45, W, 45, M.WOOD, 0.38);
      s.rect(0, 47, W, 47, M.WOOD, 0.36);
      s.house(18, 44, 9, 6);
    },
  },
  suzerain: {
    w: W, h: H, fx: 'embers', emit: [22, 44],
    draw: (s) => {
      s.room(52);
      s.rect(0, 52, W, H, M.WOOD, 0.3);
      for (let y = 52; y < H; y++) for (let x = 46; x <= 66; x++) s.put(x, y, M.RED, 0.3 + (x === 46 || x === 66 ? 0.1 : 0));
      // трон
      s.rect(46, 14, 66, 50, M.GOLD, 0.35);
      s.rect(49, 17, 63, 42, M.RED, 0.38);
      s.rect(44, 40, 68, 46, M.GOLD, 0.5);
      for (const x of [46, 53, 59, 66]) s.rect(x, 11, x, 13, M.GOLD, 0.6);
      // знамёна по бокам
      s.rect(28, 4, 36, 38, M.BLUE, (x, y) => 0.3 + (x === 28 ? 0.15 : 0) + (y % 8 === 0 ? 0.06 : 0));
      s.rect(76, 4, 84, 38, M.BLUE, (x, y) => 0.3 + (x === 76 ? 0.15 : 0) + (y % 8 === 0 ? 0.06 : 0));
      // жаровни
      for (const x of [22, 90]) {
        s.rect(x - 1, 44, x + 1, 52, M.METAL, 0.35);
        s.rect(x - 3, 43, x + 3, 44, M.METAL, 0.45);
        s.bonfire(x, 42, 2, { logs: false, light: 12 });
      }
    },
  },
  hundred: {
    w: W, h: H, fx: 'blizzard',
    draw: (s) => {
      s.sky('night');
      s.clouds(0, 36, { cover: 0.85, sy: 0.08 });
      s.halo(30, 14, 40, 0.2);
      s.ridge({ base: 46, amp: 6, freq: 0.05, m: M.MTN_FAR, haze: 0.2, snow: 4 });
      s.fog(47, 3, 0.45);
      s.hill((x) => 54, M.SNOW, { lift: 0.36 });
      for (let y = 54; y < H; y++) {
        const t = (y - 54) / (H - 54);
        const cx = 56 + t * 10;
        const hw = 2 + t * 18;
        for (let x = Math.round(cx - hw); x <= cx + hw; x++) s.put(x, y, M.SNOW, 0.5 + (Math.abs(x - cx - hw * 0.4) < 1 ? -0.12 : 0));
      }
      // полосатый верстовой столб
      for (let y = 28; y <= 60; y++) for (let x = 80; x <= 83; x++) s.put(x, y, Math.floor((y - 28) / 4) % 2 ? M.METAL : M.SNOW, Math.floor((y - 28) / 4) % 2 ? 0.08 + (x === 83 ? 0.1 : 0) : 0.75 + (x === 83 ? 0.15 : 0));
      s.rect(79, 26, 84, 27, M.RED, 0.45);
      // берёзы
      for (const [x, h] of [[14, 30], [22, 26], [100, 32]] as const) {
        s.rect(x, 54 - h, x + 1, 56, M.BIRCH, 0.7);
        for (let y = 54 - h; y < 56; y += 3) s.put(x + (y % 2), y, M.METAL, 0.05);
      }
    },
  },
  mordor: {
    w: W, h: H, fx: 'embers', emit: [56, 22],
    draw: (s) => {
      s.sky('blood', 44);
      s.clouds(4, 24, { cover: 0.75, red: true });
      s.dir = 1;
      s.hill((x) => 22 + Math.abs(x - 56) * 1.05 + (Math.sin(x * 0.7) + Math.sin(x * 0.23)) * 0.8, M.MTN, { lift: 0.32, tex: 0.3, rim: 0.1 });
      // жерло и лава
      s.rect(52, 20, 60, 22, M.LAVA, 0.8);
      s.light(56, 22, 40, 0.9);
      let x = 54;
      for (let y = 23; y < 66; y++) {
        x += Math.round(Math.sin(y * 0.4) * 0.8) - 0.3;
        s.put(x, y, M.LAVA, 0.6 + Math.sin(y) * 0.2);
        s.put(x + 1, y, M.LAVA, 0.4);
      }
      let x2 = 58;
      for (let y = 24; y < 58; y++) {
        x2 += 0.45;
        s.put(x2, y, M.LAVA, 0.5);
      }
      s.clouds(6, 18, { cover: 0.5, red: true, seed: 9 });
      s.hill((xx) => 66 + Math.sin(xx * 0.1) * 2, M.GROUND, { lift: 0.12 });
      knight(s, 18, 50, KNIGHT_WALK);
    },
  },
  far_land: {
    w: W, h: H, fx: 'stars',
    draw: (s) => {
      nightBase(s, { moon: [30, 14, 7], clouds: [18, 30, 0.35] });
      s.ridge({ base: 44, amp: 6, freq: 0.07, m: M.MTN_FAR, haze: 0.3, x0: 60, x1: 100 });
      s.hill(() => 46, M.WATER, { lift: 0.3, tex: 0, rim: 0 });
      s.reflect(46, { fade: 0.006 });
      // маяк на утёсе
      s.ridge({ base: 72, amp: 34, freq: 0.09, m: M.MTN, x0: 70, x1: 140, seed: 7, lift: 0.14 });
      for (let y = 22; y <= 42; y++) {
        const hw = 2 + (y - 22) * 0.12;
        for (let dx = -Math.round(hw); dx <= hw; dx++) s.put(92 + dx, y, Math.floor(y / 4) % 2 ? M.RED : M.SNOW, 0.4 + (dx * s.dir > hw - 1 ? 0.2 : 0));
      }
      s.rect(90, 18, 94, 21, M.WINDOW, 0.95);
      s.cone(92, 17, 3, 3, M.ROOF);
      s.light(92, 19, 22, 0.8);
      // луч
      for (let x = 0; x < 90; x++) {
        const t = (90 - x) / 90;
        const hw = t * 7;
        for (let dy = -Math.round(hw); dy <= hw; dy++) {
          const y = Math.round(19 + t * 4 + dy);
          if (y < 0 || y >= 46) continue;
          if ((1 - t) * 0.9 > 0.2 + (s.v(x, y) > 0 ? 0 : 0) && (x + y) % 2 === 0) s.add(x, y, 0.12 * (1 - t));
        }
      }
    },
  },
};

// ───── шапки экранов
export const HEADERS: Record<string, SceneDef> = {
  quests: {
    w: 160, h: 56, fx: 'dust',
    draw: (s) => {
      s.sky('dusk', 42);
      s.sunDisk(120, 42, 6);
      s.clouds(6, 26, { cover: 0.5, warm: true });
      s.ridge({ base: 42, amp: 10, freq: 0.04, m: M.MTN_FAR, haze: 0.35 });
      s.hill((x) => 46 + Math.sin(x * 0.05) * 2, M.GROUND, { lift: 0.22 });
      for (let y = 46; y < 56; y++) {
        const t = (y - 46) / 10;
        const cx = 118 - t * 40;
        const hw = 1 + t * 10;
        for (let x = Math.round(cx - hw); x <= cx + hw; x++) s.put(x, y, M.GROUND, 0.46);
      }
      // указатель
      s.rect(40, 26, 41, 50, M.WOOD, 0.4);
      s.rect(30, 28, 48, 31, M.WOOD, 0.5);
      s.rect(36, 34, 52, 37, M.WOOD, 0.45);
      s.pines(48, { x0: 0, x1: 26, hMin: 9, hMax: 16 });
      s.pines(50, { x0: 140, x1: 164, hMin: 9, hMax: 14 });
    },
  },
  chronicle: {
    w: 160, h: 56, fx: 'dust',
    draw: (s) => {
      s.room(40);
      s.windowView(118, 6, 136, 26, () => {
        s.sky('night', 26);
        s.moonDisk(130, 11, 3);
        s.stars(12, 24);
      });
      s.rect(20, 38, 100, 40, M.WOOD, 0.42);
      s.rect(40, 33, 60, 37, M.PARCH, (x) => (x === 50 ? 0.5 : 0.78));
      s.rect(62, 35, 76, 37, M.PARCH, 0.6);
      s.line(80, 37, 86, 30, M.PARCH, 0.85);
      s.candle(30, 37, 5);
      s.candle(92, 37, 3);
      for (let x = 4; x < 16; x += 2) s.rect(x, 10, x + 1, 17, x % 4 ? M.RED : M.BLUE, 0.35);
      s.rect(2, 18, 18, 19, M.WOOD, 0.35);
    },
  },
  hero: {
    w: 160, h: 56, fx: 'snow',
    draw: (s) => {
      nightBase(s, { moon: [130, 12, 7], clouds: [10, 26, 0.45] });
      s.ridge({ base: 38, amp: 12, freq: 0.035, m: M.MTN_FAR, ridged: true, haze: 0.25, snow: 4 });
      s.fog(37, 3, 0.6);
      s.hill((x) => 42 - 7 * Math.exp(-Math.pow((x - 80) / 26, 2)), M.GROUND, { lift: 0.2 });
      s.castle(80, 36, 0.8, { win: 0.5, flag: M.RED });
      s.hill((x) => 50 + Math.sin(x * 0.06) * 1.5, M.SNOW, { lift: 0.26 });
      s.pines(50, { x0: -4, x1: 40, hMin: 8, hMax: 14, snow: true });
      s.pines(50, { x0: 122, x1: 164, hMin: 8, hMax: 14, snow: true });
    },
  },
  regalia: {
    w: 160, h: 56, fx: 'embers', emit: [80, 46],
    draw: (s) => {
      s.room(48);
      // арка-ниша с реликвиями
      for (let y = 6; y < 48; y++) for (let x = 60; x <= 100; x++) {
        const dx = (x - 80) / 20;
        const top = 18 - Math.sqrt(Math.max(0, 1 - dx * dx)) * 12;
        if (y > top) s.put(x, y, M.STONE, 0.08 + (y - top) * 0.003);
      }
      s.rect(66, 40, 94, 44, M.STONE, 0.42);
      s.rect(76, 33, 84, 39, M.GOLD, (x) => 0.45 + (x === 80 ? 0.3 : 0));
      for (const x of [76, 78, 80, 82, 84]) s.put(x, 32, M.GOLD, 0.7);
      s.rect(68, 36, 72, 39, M.METAL, 0.45);
      s.rect(88, 35, 91, 39, M.RED, 0.45);
      s.bonfire(80, 47, 1, { logs: false, light: 26 });
      s.candle(64, 39, 4);
      s.candle(96, 39, 4);
      for (const x of [20, 140]) {
        s.rect(x - 6, 4, x + 6, 36, M.RED, (xx, y) => 0.3 + (y % 8 === 0 ? 0.08 : 0) + (xx === x - 6 ? 0.1 : 0));
        s.rect(x - 2, 14, x + 2, 20, M.GOLD, 0.55);
      }
    },
  },
};

export const SUBJECT_IDS = Object.entries(SCENES)
  .filter(([, d]) => d.subject)
  .map(([k]) => k);
