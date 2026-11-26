import type { Feature, MultiPolygon, Polygon } from 'geojson';
import type { BannerDef } from './cosmetics';

export type LatLng = [number, number]; // [широта, долгота]
export type Land = Feature<Polygon | MultiPolygon>;

export interface Kingdom {
  name: string;
  form: string;
  banner: BannerDef;
  tower: string;
  foundedAt: number;
}

export interface Neighbor {
  id: string;
  name: string;
  form: string;
  ruler: string;
  banner: BannerDef;
  tower: string;
  land: Land | null;
  demo: true;
}

export interface Habit {
  id: string;
  title: string;
  glory: number;
  doneDates: string[];
}

export interface WalkRecord {
  id: string;
  startedAt: number;
  endedAt: number;
  distance: number; // м
  captured: number; // м²
  loops: number;
  sim: boolean;
  startPos?: LatLng;
}

export interface ActiveWalk {
  startedAt: number;
  pausedAt: number | null;
  pausedTotal: number;
  distance: number;
  captured: number;
  loops: number;
  track: LatLng[];
  segment: LatLng[];
  segmentLen: number[]; // накопленная длина сегмента для каждой точки
  lastTs: number;
  sim: boolean;
  gps: 'ok' | 'weak' | 'lost';
  hiddenAt?: number | null; // когда страница ушла в фон (экран погас)
  gaps?: number; // сколько раз маршрут прерывался
  pace?: [number, number][]; // [время мс, накопленные метры] за последние ~40 с — для оценки скорости
  mode?: 'foot' | 'bike' | 'fast'; // пешком / верхом / слишком быстро
  steps?: [number, number][]; // [шаг м, точность] последних фиксов — ловим «идеальный» поддельный GPS
  susUntil?: number; // до какого времени точки не засчитываются (подозрительный GPS)
}

export interface DayActivity {
  opened: boolean;
  walkedM: number;
  tasksDone: number;
  goalRewarded: boolean;
}

export interface ChronicleEntry {
  id: string;
  ts: number;
  kind: 'capture' | 'regalia' | 'title' | 'walk' | 'kingdom' | 'border' | 'quest' | 'class' | 'bene';
  text: string;
  key?: string; // какая формулировка и из какого набора — чтобы не повторяться подряд
  v?: number;
}

export interface Toast {
  id: string;
  title: string;
  text?: string;
  sound?: import('../audio/sfx').SfxName;
}

export interface Settings {
  redBorders: boolean;
  demoNeighbors: boolean;
  hideHome: boolean;
  home: LatLng | null;
  homeRadius: number;
  dailyGoalKm: number;
  simulate: boolean;
  mapSource: 'auto' | 'osm' | 'osmfr' | 'carto';
  sound: boolean;
  volume: number; // 0..1
}

export interface Flags {
  tinyLoop: boolean;
  tookFromNeighbor: boolean;
  changedTower: boolean;
  bikeTold?: boolean;
  teaTold?: boolean; // Бенедикт уже заикнулся про чай
  changedBanner: boolean;
  patron: boolean;
  exiled?: boolean; // правитель в изгнании: своих земель нет
  everExiled?: boolean;
  returned?: boolean;
  metBenedict?: boolean; // знакомство с Бенедиктом уже было
  clsNow?: boolean; // для разработки: предложить путь, не дожидаясь пяти дней
  clsDefer?: string; // день, когда игрок попросил спросить про путь позже
}

export interface Hero {
  name: string;
  about: string;
  books: string[];
  films: string[];
  games: string[];
}

/** Бенедикт: знакомство, лимиты и память о сказанном. */
export interface BeneState {
  metAt: number;
  sulkUntil?: number; // дуется после «почему Бенедикт»
  day?: string;
  asks?: number;
  rumours?: number;
  riddleDay?: string;
  fortuneDay?: string;
  loreDay?: string;
  used: Record<string, number[]>;
  solved: number[];
  tried: number[];
  lore: number;
  talks: number;
}

export interface GameState {
  version: 1;
  hero: Hero;
  kingdom: Kingdom | null;
  land: Land | null;
  captures: number;
  totalArea: number;
  totalDistance: number;
  glory: number;
  habitsDone: number;
  habits: Habit[];
  walks: WalkRecord[];
  walk: ActiveWalk | null;
  days: Record<string, DayActivity>;
  unlocked: Record<string, number>;
  seen: Record<string, true>;
  weeklyClaimed: string[];
  chronicle: ChronicleEntry[];
  neighbors: Neighbor[];
  lastPos: LatLng | null;
  settings: Settings;
  flags: Flags;
  bene?: BeneState;
  cls?: import('./cosmetics').ClassId; // выбранный путь
  avatar?: { set: string; id: string }; // выбранная аватарка героя
  // очередь интерфейса
  ui: {
    showFounding: boolean;
    unlockQueue: string[];
    toasts: Toast[];
  };
}
