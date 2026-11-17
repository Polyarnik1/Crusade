// Всё, чем игрок может украсить королевство. `need` — сколько регалий нужно, чтобы открыть.

export interface Unlockable {
  id: string;
  name: string;
  need: number;
}

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
];

export const TOWERS: Unlockable[] = [
  { id: 'watch', name: 'Дозорная башня', need: 0 },
  { id: 'tent', name: 'Походный шатёр', need: 0 },
  { id: 'mill', name: 'Мельница', need: 3 },
  { id: 'castle', name: 'Замок', need: 6 },
  { id: 'lighthouse', name: 'Маяк', need: 8 },
  { id: 'citadel', name: 'Цитадель', need: 12 },
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

export function isOpen(item: Unlockable, regalia: number): boolean {
  return regalia >= item.need;
}

export function nextUnlock(regalia: number): number | null {
  const all = [...COLORS, ...FORMS, ...TOWERS, ...SHAPES, ...PATTERNS, ...SYMBOLS]
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
