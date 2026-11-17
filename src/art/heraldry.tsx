import { memo } from 'react';
import { colorHex, shade, type BannerDef } from '../game/cosmetics';
import { PAL, Pixel } from './Pixel';
import { TOWER_ART } from './arts';

const W = 24;
const H = 28;

const SYMBOL_ART: Record<string, string[]> = {
  crown: ['X...X...X', 'XX..X..XX', 'XXX.X.XXX', 'XXXXXXXXX', 'XXXXXXXXX', '.........', 'XXXXXXXXX'],
  sword: ['....X....', '....X....', '....X....', '....X....', '....X....', '....X....', '.XXXXXXX.', '....X....', '...XXX...'],
  tower: ['X.X.X.X', 'XXXXXXX', '.XXXXX.', '.XX.XX.', '.XXXXX.', '.XXXXX.', '.XX.XX.', '.XX.XX.'],
  star: ['....X....', '...XXX...', 'XXXXXXXXX', '.XXXXXXX.', '..XXXXX..', '.XXX.XXX.', '.X.....X.'],
  snow: ['....X....', '.X..X..X.', '..X.X.X..', '...XXX...', 'XXXXXXXXX', '...XXX...', '..X.X.X..', '.X..X..X.', '....X....'],
  key: ['.XXX.....', 'X...X....', 'X...XXXXX', 'X...X..X.', '.XXX...XX'],
  wolf: ['X.....X', 'XX...XX', 'XXXXXXX', 'X.XXX.X', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'],
  dragon: ['..XX.....', '.XX.X....', 'XXXXX...X', '...XX..XX', '..XXXXXX.', '.XXXXXX..', 'XX.X.X...', 'X..X.X...'],
};

function inside(shape: string, x: number, y: number): boolean {
  const cx = (W - 1) / 2;
  const d = Math.abs(x - cx);
  if (shape === 'banner') {
    if (x < 2 || x > W - 3) return false;
    if (y >= 21 && d < (y - 20) * 1.4) return false;
    return true;
  }
  if (shape === 'pennant') {
    return d <= 10 * (1 - y / H) + 0.6;
  }
  // щит
  if (x < 1 || x > W - 2) return false;
  if (y < 16) return true;
  return d <= 11 - (y - 16) * 0.95;
}

function fieldColor(pattern: string, x: number, y: number): 1 | 2 {
  const cx = (W - 1) / 2;
  switch (pattern) {
    case 'fess':
      return y >= 10 && y <= 16 ? 2 : 1;
    case 'pale':
      return x >= 9 && x <= 14 ? 2 : 1;
    case 'chevron': {
      const v = y + Math.abs(x - cx) * 0.9;
      return v >= 17 && v <= 21.5 ? 2 : 1;
    }
    case 'quarterly':
      return x < 12 !== y < 13 ? 2 : 1;
    case 'checky':
      return ((x >> 2) + (y >> 2)) % 2 ? 2 : 1;
    default:
      return 1;
  }
}

/** Пиксельное знамя: форма + узор + символ, всё на одной сетке, чтобы стиль был единым. */
export const Banner = memo(function Banner({ banner, size = 48 }: { banner: BannerDef; size?: number }) {
  const c1 = colorHex(banner.color);
  const c2 = colorHex(banner.second);
  const pal = { ...PAL, '1': c1, '2': c2, '3': shade(c1, 0.75), '4': shade(c2, 0.75) };
  const grid: string[][] = Array.from({ length: H }, (_, y) =>
    Array.from({ length: W }, (_, x) => {
      if (!inside(banner.shape, x, y)) return '.';
      const f = fieldColor(banner.pattern, x, y);
      const right = x > (W - 1) / 2 + 3;
      return right ? (f === 1 ? '3' : '4') : String(f);
    }),
  );
  // символ по центру
  const sym = SYMBOL_ART[banner.symbol] ?? SYMBOL_ART.crown;
  const sw = Math.max(...sym.map((r) => r.length));
  const sx = Math.floor((W - sw) / 2);
  const sy = banner.shape === 'pennant' ? 4 : 7;
  const symPx: [number, number][] = [];
  sym.forEach((row, dy) => [...row].forEach((ch, dx) => ch === 'X' && symPx.push([sx + dx, sy + dy])));
  const isSym = new Set(symPx.map(([x, y]) => `${x},${y}`));
  for (const [x, y] of symPx) {
    for (const [ox, oy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + ox;
      const ny = y + oy;
      if (grid[ny]?.[nx] && grid[ny][nx] !== '.' && !isSym.has(`${nx},${ny}`)) grid[ny][nx] = 'K';
    }
  }
  for (const [x, y] of symPx) if (grid[y]?.[x] && grid[y][x] !== '.') grid[y][x] = 'W';
  // внешний контур
  const out = grid.map((r) => [...r]);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (grid[y][x] === '.') continue;
      const edge =
        x === 0 || y === 0 || x === W - 1 || y === H - 1 ||
        grid[y][x - 1] === '.' || grid[y][x + 1] === '.' || grid[y - 1]?.[x] === '.' || grid[y + 1]?.[x] === '.';
      if (edge) out[y][x] = 'K';
    }
  return <Pixel grid={out.map((r) => r.join(''))} palette={pal} size={size} />;
});

export function towerPalette(color: string): Record<string, string> {
  const hex = colorHex(color);
  return { ...PAL, A: hex, a: shade(hex, 0.68) };
}

export const Tower = memo(function Tower({ tower, color, size = 32 }: { tower: string; color: string; size?: number }) {
  return <Pixel grid={TOWER_ART[tower] ?? TOWER_ART.watch} palette={towerPalette(color)} size={size} />;
});

/** SVG-строка башни для маркера Leaflet. */
export function towerSvg(tower: string, color: string, px = 30): string {
  const grid = TOWER_ART[tower] ?? TOWER_ART.watch;
  const pal = towerPalette(color);
  const w = grid[0].length;
  const h = grid.length;
  let rects = '';
  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === '.' || !pal[ch]) {
        x++;
        continue;
      }
      let run = 1;
      while (row[x + run] === ch) run++;
      rects += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${pal[ch]}"/>`;
      x += run;
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${(px * h) / w}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${rects}</svg>`;
}
