import type { Land, LatLng } from './types';

// Пикселизация земель: захват считается по точному контуру (turf), а рисуется
// ступенчатый «пиксельный» силуэт на сетке из клеток CELL м. Сетка привязана к
// глобальным координатам, поэтому граница не «плывёт» при росте территории.
const CELL = 8;
const M_LAT = 110574;
const M_LNG = 111320;

export interface PixelShape {
  rects: LatLng[][]; // заливка: прямоугольники клеток (склеены по вертикали)
  lines: LatLng[][]; // контур: отрезки по границе клеток
}

type Run = [number, number]; // [i0, i1) — клетки в строке

const cache = new WeakMap<object, PixelShape>();

function ringsOf(land: Land): number[][][] {
  const g = land.geometry;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  return polys.flat();
}

/** Отрезки из A, не покрытые интервалами B (оба списка отсортированы). */
function minus(a: Run[], b: Run[]): Run[] {
  const out: Run[] = [];
  for (const [s, e] of a) {
    let cur = s;
    for (const [bs, be] of b) {
      if (be <= cur) continue;
      if (bs >= e) break;
      if (bs > cur) out.push([cur, bs]);
      cur = Math.max(cur, be);
      if (cur >= e) break;
    }
    if (cur < e) out.push([cur, e]);
  }
  return out;
}

export function pixelize(land: Land): PixelShape {
  const hit = cache.get(land);
  if (hit) return hit;

  const rings = ringsOf(land);
  let lat0 = 0;
  let n = 0;
  for (const r of rings) for (const p of r) (lat0 += p[1]), n++;
  lat0 = Math.round(lat0 / Math.max(1, n));

  let cell = CELL;
  let rows = new Map<number, Run[]>();
  let dLat = 0;
  let dLng = 0;
  for (let attempt = 0; attempt < 4; attempt++) {
    dLat = cell / M_LAT;
    dLng = cell / (M_LNG * Math.cos((lat0 * Math.PI) / 180));
    const edges: [number, number, number, number][] = [];
    let vmin = Infinity;
    let vmax = -Infinity;
    for (const r of rings) {
      for (let k = 0; k < r.length - 1; k++) {
        const u1 = r[k][0] / dLng;
        const v1 = r[k][1] / dLat;
        const u2 = r[k + 1][0] / dLng;
        const v2 = r[k + 1][1] / dLat;
        edges.push([u1, v1, u2, v2]);
        vmin = Math.min(vmin, v1, v2);
        vmax = Math.max(vmax, v1, v2);
      }
    }
    if (vmax - vmin > 1500 && attempt < 3) {
      cell *= 2;
      continue;
    }
    rows = new Map();
    for (let j = Math.floor(vmin); j <= Math.ceil(vmax); j++) {
      const vc = j + 0.5;
      const xs: number[] = [];
      for (const [u1, v1, u2, v2] of edges) {
        if (v1 <= vc !== v2 <= vc) xs.push(u1 + ((vc - v1) / (v2 - v1)) * (u2 - u1));
      }
      xs.sort((a, b) => a - b);
      const runs: Run[] = [];
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const i0 = Math.ceil(xs[k] - 0.5);
        const i1 = Math.ceil(xs[k + 1] - 0.5);
        if (i1 > i0) {
          const last = runs[runs.length - 1];
          if (last && last[1] >= i0) last[1] = Math.max(last[1], i1);
          else runs.push([i0, i1]);
        }
      }
      if (runs.length) rows.set(j, runs);
    }
    break;
  }

  const ll = (i: number, j: number): LatLng => [j * dLat, i * dLng];
  const rects: LatLng[][] = [];
  const lines: LatLng[][] = [];
  const js = [...rows.keys()].sort((a, b) => a - b);

  // заливка: склеиваем одинаковые полосы соседних строк в один прямоугольник
  let active = new Map<string, number>(); // "i0,i1" -> стартовая строка
  let prevJ: number | null = null;
  const flush = (key: string, from: number, to: number) => {
    const [i0, i1] = key.split(',').map(Number);
    rects.push([ll(i0, from), ll(i1, from), ll(i1, to + 1), ll(i0, to + 1)]);
  };
  for (const j of js) {
    const next = new Map<string, number>();
    for (const [i0, i1] of rows.get(j)!) {
      const key = `${i0},${i1}`;
      next.set(key, prevJ === j - 1 && active.has(key) ? active.get(key)! : j);
    }
    if (prevJ !== null)
      for (const [key, from] of active) if (!(prevJ === j - 1 && next.get(key) === from)) flush(key, from, prevJ);
    active = next;
    prevJ = j;
  }
  if (prevJ !== null) for (const [key, from] of active) flush(key, from, prevJ);

  // контур
  for (const j of js) {
    const runs = rows.get(j)!;
    for (const [i0, i1] of runs) {
      lines.push([ll(i0, j), ll(i0, j + 1)]);
      lines.push([ll(i1, j), ll(i1, j + 1)]);
    }
    for (const [s, e] of minus(runs, rows.get(j - 1) ?? [])) lines.push([ll(s, j), ll(e, j)]);
    for (const [s, e] of minus(runs, rows.get(j + 1) ?? [])) lines.push([ll(s, j + 1), ll(e, j + 1)]);
  }

  const shape = { rects, lines };
  cache.set(land, shape);
  return shape;
}
