import L from 'leaflet';
import { fakeTiles } from './fakeTiles';

// Источники подложки. Для России важно: carto/stadia/mapbox могут не открываться,
// поэтому по умолчанию — «авто»: пробуем источники по очереди и берём первый живой.
export type MapSource = 'auto' | 'osm' | 'osmfr' | 'carto';

export const SOURCE_LABEL: Record<MapSource, string> = {
  auto: 'Авто',
  osm: 'OSM',
  osmfr: 'OSM FR',
  carto: 'Carto',
};

type Def = { url: string; subdomains?: string; light: boolean; attr: string; max: number };

const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export const DEFS: Record<Exclude<MapSource, 'auto'>, Def> = {
  osm: { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', light: true, attr: OSM_ATTR, max: 19 },
  osmfr: { url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', subdomains: 'abc', light: true, attr: OSM_ATTR, max: 20 },
  carto: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', subdomains: 'abcd', light: false, attr: `${OSM_ATTR} &copy; CARTO`, max: 19 },
};

// порядок попыток в режиме «авто»
const CHAIN: Exclude<MapSource, 'auto'>[] = ['osm', 'osmfr', 'carto'];

export type TileHandle = { remove: () => void };

/** Ставит подложку на карту. onLight сообщает, нужна ли тёмная тонировка (светлые тайлы). */
export function attachTiles(map: L.Map, source: MapSource, onLight: (light: boolean) => void): TileHandle {
  let layer: L.Layer | null = null;
  let stopped = false;
  let loaded = 0;
  let errors = 0;
  let idx = 0;

  const mount = (name: Exclude<MapSource, 'auto'> | 'fake', fallback: boolean) => {
    if (layer) map.removeLayer(layer);
    loaded = 0;
    errors = 0;
    if (name === 'fake') {
      onLight(false);
      layer = fakeTiles().addTo(map);
      return;
    }
    const d = DEFS[name];
    onLight(d.light);
    const tl = L.tileLayer(d.url, { maxZoom: d.max, subdomains: d.subdomains ?? 'abc', attribution: d.attr, crossOrigin: true });
    tl.on('tileload', () => {
      loaded++;
    });
    tl.on('tileerror', () => {
      errors++;
      // 6 ошибок и ни одной загруженной плитки — источник недоступен
      if (!stopped && fallback && loaded === 0 && errors >= 6) {
        idx++;
        mount(idx < CHAIN.length ? CHAIN[idx] : 'fake', true);
      }
    });
    layer = tl.addTo(map);
  };

  if (import.meta.env.MODE === 'artifact') mount('fake', false);
  else if (source === 'auto') mount(CHAIN[0], true);
  else mount(source, false);

  return {
    remove: () => {
      stopped = true;
      if (layer) map.removeLayer(layer);
    },
  };
}
