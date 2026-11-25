// Всё, чем игрок может украсить королевство. `need` — сколько регалий нужно, чтобы открыть.

export type ClassId = 'knight' | 'wizard' | 'merchant';

export interface Unlockable {
  id: string;
  name: string;
  need: number;
  cls?: ClassId; // скрытое украшение: открывается только выбранным путём, регалии не нужны
}

/** Что открыто игроку: сколько регалий и какой путь выбран. */
export interface Access {
  reg: number;
  cls?: ClassId;
}

export interface ClassDef {
  id: ClassId;
  name: string;
  blurb: string;
  opens: string;
  tower: string;
  symbol: string;
  color: string;
}

export const CLASSES: ClassDef[] = [
  {
    id: 'knight',
    name: 'Рыцарь',
    blurb: 'Честь, сталь и знамя впереди.',
    opens: 'командорство, бастион, цвета стали и крови, шлем и крест на знамя',
    tower: 'bastion',
    symbol: 'helm',
    color: 'steel',
  },
  {
    id: 'wizard',
    name: 'Чародей',
    blurb: 'Тайны, звёзды и странная погода.',
    opens: 'чародейский круг, башню чародея, цвета индиго и лунного света, колпак и полумесяц на знамя',
    tower: 'sorcery',
    symbol: 'hat',
    color: 'indigo',
  },
  {
    id: 'merchant',
    name: 'Торговец',
    blurb: 'Выгода, дороги и звон монет.',
    opens: 'торговую республику, купеческий дом, цвета бордо и меди, монету и весы на знамя',
    tower: 'tradehouse',
    symbol: 'coin',
    color: 'wine',
  },
];

export interface ColorDef extends Unlockable {
  hex: string;
}

export const UNLOCK_STEPS = [3, 6, 10] as const;

export const COLORS: ColorDef[] = [
  { id: 'gold', name: 'Золото', hex: '#E3B341', need: 0 },
  { id: 'azure', name: 'Лазурь', hex: '#5B8DEF', need: 0 },
  { id: 'emerald', name: 'Изумруд', hex: '#4FB36A', need: 0 },
  { id: 'purple', name: 'Пурпур', hex: '#A77BF0', need: 0 },
  { id: 'scarlet', name: 'Багрянец', hex: '#E0603F', need: 3 },
  { id: 'ice', name: 'Лёд', hex: '#7FD3E6', need: 3 },
  { id: 'silver', name: 'Серебро', hex: '#C9CCD6', need: 3 },
  { id: 'amber', name: 'Янтарь', hex: '#F08A3C', need: 3 },
  { id: 'rose', name: 'Роза', hex: '#E77AA8', need: 6 },
  { id: 'wormwood', name: 'Полынь', hex: '#A3C26A', need: 6 },
  { id: 'sea', name: 'Морская волна', hex: '#3FBFA8', need: 10 },
  { id: 'royal', name: 'Королевская синь', hex: '#6A7BFF', need: 10 },
  { id: 'steel', name: 'Закалённая сталь', hex: '#7C8BA6', need: 0, cls: 'knight' },
  { id: 'blood', name: 'Кровь', hex: '#A8232B', need: 0, cls: 'knight' },
  { id: 'indigo', name: 'Индиго', hex: '#4B4CC8', need: 0, cls: 'wizard' },
  { id: 'moonlight', name: 'Лунный свет', hex: '#D7E2FF', need: 0, cls: 'wizard' },
  { id: 'wine', name: 'Бордо', hex: '#8E2646', need: 0, cls: 'merchant' },
  { id: 'copper', name: 'Медь', hex: '#B8733A', need: 0, cls: 'merchant' },
];

export interface FormDef extends Unlockable {
  ruler: string;
}

export const FORMS: FormDef[] = [
  { id: 'principality', name: 'Княжество', ruler: 'Князь', need: 0 },
  { id: 'kingdom', name: 'Королевство', ruler: 'Король', need: 0 },
  { id: 'duchy', name: 'Герцогство', ruler: 'Герцог', need: 0 },
  { id: 'freecity', name: 'Вольный город', ruler: 'Бургомистр', need: 0 },
  { id: 'order', name: 'Орден', ruler: 'Магистр', need: 3 },
  { id: 'march', name: 'Марка', ruler: 'Маркграф', need: 6 },
  { id: 'empire', name: 'Империя', ruler: 'Император', need: 10 },
  { id: 'commandery', name: 'Командорство', ruler: 'Командор', need: 0, cls: 'knight' },
  { id: 'circle', name: 'Чародейский круг', ruler: 'Архимаг', need: 0, cls: 'wizard' },
  { id: 'republic', name: 'Торговая республика', ruler: 'Дож', need: 0, cls: 'merchant' },
];

export const TOWERS: Unlockable[] = [
  { id: 'watch', name: 'Дозорная башня', need: 0 },
  { id: 'tent', name: 'Походный шатёр', need: 0 },
  { id: 'mill', name: 'Мельница', need: 3 },
  { id: 'castle', name: 'Замок', need: 6 },
  { id: 'lighthouse', name: 'Маяк', need: 8 },
  { id: 'citadel', name: 'Цитадель', need: 12 },
  { id: 'bastion', name: 'Бастион', need: 0, cls: 'knight' },
  { id: 'sorcery', name: 'Башня чародея', need: 0, cls: 'wizard' },
  { id: 'tradehouse', name: 'Купеческий дом', need: 0, cls: 'merchant' },
];

export const SHAPES: Unlockable[] = [
  { id: 'shield', name: 'Щит', need: 0 },
  { id: 'banner', name: 'Знамя', need: 0 },
  { id: 'pennant', name: 'Вымпел', need: 3 },
];

export const PATTERNS: Unlockable[] = [
  { id: 'plain', name: 'Чистое', need: 0 },
  { id: 'fess', name: 'Пояс', need: 0 },
  { id: 'pale', name: 'Столб', need: 0 },
  { id: 'chevron', name: 'Шеврон', need: 3 },
  { id: 'quarterly', name: 'Четверти', need: 6 },
  { id: 'checky', name: 'Шахматы', need: 10 },
];

export const SYMBOLS: Unlockable[] = [
  { id: 'crown', name: 'Корона', need: 0 },
  { id: 'sword', name: 'Меч', need: 0 },
  { id: 'tower', name: 'Башня', need: 0 },
  { id: 'star', name: 'Звезда', need: 0 },
  { id: 'snow', name: 'Снежинка', need: 3 },
  { id: 'key', name: 'Ключ', need: 3 },
  { id: 'wolf', name: 'Волк', need: 6 },
  { id: 'dragon', name: 'Дракон', need: 10 },
  { id: 'helm', name: 'Шлем', need: 0, cls: 'knight' },
  { id: 'cross', name: 'Крест', need: 0, cls: 'knight' },
  { id: 'hat', name: 'Колпак', need: 0, cls: 'wizard' },
  { id: 'moon', name: 'Полумесяц', need: 0, cls: 'wizard' },
  { id: 'coin', name: 'Монета', need: 0, cls: 'merchant' },
  { id: 'scales', name: 'Весы', need: 0, cls: 'merchant' },
];

export interface BannerDef {
  shape: string;
  pattern: string;
  symbol: string;
  color: string; // id цвета поля
  second: string; // id второго цвета
}

export const DEFAULT_BANNER: BannerDef = {
  shape: 'shield',
  pattern: 'plain',
  symbol: 'crown',
  color: 'gold',
  second: 'azure',
};

export function colorHex(id: string): string {
  return COLORS.find((c) => c.id === id)?.hex ?? id;
}

function tint(hex: string, k: number): string {
  const n = parseInt(hex.replace('#', '').padEnd(6, '0').slice(0, 6), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k)));
  return '#' + ch.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}

/** Цвет королевства для кнопок и плашек: фон, светлая и тёмная грани рамки, цвет надписи. */
export const WHITE_TONE = { background: '#f4f1ea', borderTopColor: '#ffffff', borderLeftColor: '#ffffff', borderRightColor: '#b3ad9c', borderBottomColor: '#b3ad9c', color: '#0b0a10' };

export function kingdomTone(colorId: string | undefined): { background: string; borderTopColor: string; borderLeftColor: string; borderRightColor: string; borderBottomColor: string; color: string } {
  const hex = colorHex(colorId ?? 'gold');
  const n = parseInt(hex.replace('#', '').padEnd(6, '0').slice(0, 6), 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  const light = tint(hex, 0.32), dark = tint(hex, -0.45);
  return { background: hex, borderTopColor: light, borderLeftColor: light, borderRightColor: dark, borderBottomColor: dark, color: lum > 0.55 ? '#0b0a10' : '#fff7e6' };
}

export function isOpen(item: Unlockable, a: Access): boolean {
  return item.cls ? a.cls === item.cls : a.reg >= item.need;
}

/** Скрытые украшения чужих путей не показываем вовсе. */
export function visible<T extends Unlockable>(items: T[], a: Access): T[] {
  return items.filter((i) => !i.cls || a.cls === i.cls);
}

export function nextUnlock(regalia: number): number | null {
  const all = [...COLORS, ...FORMS, ...TOWERS, ...SHAPES, ...PATTERNS, ...SYMBOLS]
    .filter((i) => !i.cls)
    .map((i) => i.need)
    .filter((n) => n > regalia)
    .sort((a, b) => a - b);
  return all[0] ?? null;
}

/** Затемнить hex-цвет (для теней пиксель-арта). */
export function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}
