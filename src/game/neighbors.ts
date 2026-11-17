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
