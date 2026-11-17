import area from '@turf/area';
import centroid from '@turf/centroid';
import difference from '@turf/difference';
import intersect from '@turf/intersect';
import union from '@turf/union';
import unkinkPolygon from '@turf/unkink-polygon';
import { featureCollection, polygon } from '@turf/helpers';
import type { Feature, Polygon } from 'geojson';
import type { Land, LatLng } from './types';

export const MIN_LOOP_AREA = 300; // м² — меньше уже не удел, а клумба
export const CLOSE_DIST = 25; // м — насколько близко надо вернуться к своему следу
export const MIN_LOOP_LEN = 120; // м — минимальная длина петли

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;

export function dist(a: LatLng, b: LatLng): number {
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Сдвинуть точку на dx метров на восток и dy метров на север. */
export function offset(p: LatLng, dx: number, dy: number): LatLng {
  const lat = p[0] + dy / 111320;
  const lng = p[1] + dx / (111320 * Math.cos(rad(p[0])));
  return [lat, lng];
}

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

export function ringToPolygon(ring: LatLng[]): Feature<Polygon> {
  const coords = ring.map(([lat, lng]) => [round6(lng), round6(lat)]);
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) coords.push([...first]);
  return polygon([coords]);
}

/** Разбить петлю на простые многоугольники (если маршрут сам себя пересекал). */
export function loopPieces(ring: LatLng[]): Feature<Polygon>[] {
  if (ring.length < 4) return [];
  try {
    const fc = unkinkPolygon(ringToPolygon(ring));
    return fc.features.filter((f) => area(f) >= MIN_LOOP_AREA);
  } catch {
    return [];
  }
}

export function landArea(land: Land | null): number {
  return land ? area(land) : 0;
}

export function merge(a: Land | null, b: Land): Land {
  if (!a) return b;
  try {
    return (union(featureCollection([a, b])) as Land) ?? a;
  } catch {
    return a;
  }
}

export function subtract(a: Land | null, b: Land): Land | null {
  if (!a) return null;
  try {
    return difference(featureCollection([a, b])) as Land | null;
  } catch {
    return a;
  }
}

export function overlapArea(a: Land | null, b: Land): number {
  if (!a) return 0;
  try {
    const i = intersect(featureCollection([a, b]));
    return i ? area(i) : 0;
  } catch {
    return 0;
  }
}

/** Точки для башен: центр каждого отдельного куска земли (самые крупные — первыми). */
export function towerSpots(land: Land | null, max = 24): LatLng[] {
  if (!land) return [];
  const g = land.geometry;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  return polys
    .map((coords) => {
      const f = polygon(coords);
      const c = centroid(f).geometry.coordinates;
      return { a: area(f), p: [c[1], c[0]] as LatLng };
    })
    .filter((x) => x.a >= MIN_LOOP_AREA)
    .sort((x, y) => y.a - x.a)
    .slice(0, max)
    .map((x) => x.p);
}

export function landCenter(land: Land | null): LatLng | null {
  if (!land) return null;
  const c = centroid(land).geometry.coordinates;
  return [c[1], c[0]];
}

/** Прямоугольник в метрах вокруг точки: удобно для демо-соседей. */
export function rect(center: LatLng, dx: number, dy: number, w: number, h: number): Feature<Polygon> {
  const a = offset(center, dx, dy);
  const b = offset(center, dx + w, dy);
  const c = offset(center, dx + w, dy + h);
  const d = offset(center, dx, dy + h);
  return ringToPolygon([a, b, c, d]);
}

export function formatArea(m2: number): string {
  if (m2 >= 100000) return (m2 / 1e6).toFixed(2).replace('.', ',') + ' км²';
  if (m2 >= 10000) return (m2 / 1e4).toFixed(1).replace('.', ',') + ' га';
  return Math.round(m2).toLocaleString('ru-RU') + ' м²';
}

export function formatKm(m: number): string {
  return (m / 1000).toFixed(m < 10000 ? 2 : 1).replace('.', ',');
}
