import { merge, offset, rect } from './geo';
import type { Land, LatLng, Neighbor } from './types';

// Пока нет сервера, рядом с игроком появляются демо-соседи.
// Их можно выключить в настройках; на сервере их заменят настоящие игроки.

interface Blueprint {
  id: string;
  name: string;
  form: string;
  ruler: string;
  color: string;
  second: string;
  pattern: string;
  symbol: string;
  shape: string;
  tower: string;
  dx: number;
  dy: number;
  blocks: [number, number, number, number][];
}

const BLUEPRINTS: Blueprint[] = [
  {
    id: 'owl',
    name: 'Совиная Гора',
    form: 'principality',
    ruler: 'sova_walks',
    color: 'azure',
    second: 'silver',
    pattern: 'fess',
    symbol: 'star',
    shape: 'shield',
    tower: 'watch',
    dx: 420,
    dy: 380,
    blocks: [
      [0, 0, 220, 160],
      [80, 140, 180, 150],
      [-90, 40, 110, 90],
    ],
  },
  {
    id: 'rust',
    name: 'Ржавые Ворота',
    form: 'freecity',
    ruler: 'rust_gate',
    color: 'emerald',
    second: 'gold',
    pattern: 'pale',
    symbol: 'key',
    shape: 'banner',
    tower: 'mill',
    dx: 120,
    dy: -620,
    blocks: [
      [0, 0, 260, 140],
      [60, -120, 150, 130],
    ],
  },
  {
    id: 'frost',
    name: 'Ледяной Брод',
    form: 'kingdom',
    ruler: 'frost_ford',
    color: 'purple',
    second: 'ice',
    pattern: 'chevron',
    symbol: 'snow',
    shape: 'shield',
    tower: 'castle',
    dx: -720,
    dy: 60,
    blocks: [
      [0, 0, 200, 240],
      [-130, 80, 140, 120],
      [40, 230, 120, 100],
    ],
  },
];

export function makeNeighbors(center: LatLng): Neighbor[] {
  return BLUEPRINTS.map((b) => {
    const origin = offset(center, b.dx, b.dy);
    let land: Land | null = null;
    for (const [x, y, w, h] of b.blocks) land = merge(land, rect(origin, x, y, w, h));
    return {
      id: b.id,
      name: b.name,
      form: b.form,
      ruler: b.ruler,
      tower: b.tower,
      banner: { shape: b.shape, pattern: b.pattern, symbol: b.symbol, color: b.color, second: b.second },
      land,
      demo: true,
    };
  });
}

// Профили правителей демо-соседей. На сервере это придёт от настоящих игроков.
export interface NeighborProfile {
  avatar: { set: string; id: string };
  title?: string; // как величать правителя, если отличается от формы правления (Королева, Княгиня)
  glory: number;
  regalia: string[];
  kmMonth: number;
  streak: number;
  cls?: 'knight' | 'wizard' | 'merchant';
  about: string;
  books: string[];
  films: string[];
  games: string[];
  showcase: string[];
  foundedDaysAgo: number;
}

const PROFILES: Record<string, NeighborProfile> = {
  owl: {
    avatar: { set: 'moon', id: 'elf' },
    title: 'Княгиня',
    glory: 3480,
    regalia: ['first_land', 'founder', 'streak7', 'night', 'early', 'circle', 'winter', 'herald', 'border', 'wanderer', 'full_moon', 'riddle1', 'riddle3', 'hundred'],
    kmMonth: 46.8,
    streak: 9,
    cls: 'wizard',
    about: 'Хожу ночами вокруг Совиной горы. Совы не против, я проверяла.',
    books: ['Хроники Амбера', 'Земноморье'],
    films: ['Ведьмак'],
    games: ['Hollow Knight', 'Disco Elysium'],
    showcase: ['night', 'full_moon', 'riddle3', 'streak7'],
    foundedDaysAgo: 41,
  },
  rust: {
    avatar: { set: 'ash', id: 'dwarf' },
    glory: 1120,
    regalia: ['first_land', 'founder', 'couch', 'circle', 'architect', 'herald', 'triple', 'outpost'],
    kmMonth: 21.3,
    streak: 3,
    cls: 'merchant',
    about: 'Чиню ворота, торгую слухами. Пошлина за проход — один анекдот.',
    books: ['Плоский мир'],
    films: ['Карты, деньги, два ствола'],
    games: ['Stardew Valley'],
    showcase: ['triple', 'architect', 'outpost', 'couch'],
    foundedDaysAgo: 18,
  },
  frost: {
    avatar: { set: 'winter', id: 'queen' },
    title: 'Королева',
    glory: 7350,
    regalia: [
      'first_land', 'founder', 'streak7', 'night', 'early', 'circle', 'winter', 'chronicler', 'architect', 'herald', 'border', 'great_march',
      'wanderer', 'lord', 'glory', 'exile', 'return_king', 'solstice', 'hectares', 'suzerain', 'hundred', 'mordor', 'far_land', 'riddle1',
    ],
    kmMonth: 88.4,
    streak: 27,
    cls: 'knight',
    about: 'Каждое утро обхожу границу, пока город спит. Лёд держит, если идти уверенно.',
    books: ['Песнь льда и пламени', 'Хоббит'],
    films: ['Властелин колец'],
    games: ['Dark Souls', 'Skyrim'],
    showcase: ['great_march', 'mordor', 'suzerain', 'winter'],
    foundedDaysAgo: 96,
  },
};

const FALLBACK: NeighborProfile = {
  avatar: { set: 'glass', id: 'rogue' },
  glory: 300,
  regalia: ['first_land', 'founder'],
  kmMonth: 6.2,
  streak: 1,
  about: 'Правитель пока ничего о себе не рассказал.',
  books: [],
  films: [],
  games: [],
  showcase: ['first_land'],
  foundedDaysAgo: 5,
};

export function profileOf(n: Neighbor): NeighborProfile {
  return PROFILES[n.id] ?? FALLBACK;
}
