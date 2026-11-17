import { titleOf } from './levels';
import type { GameState } from './types';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type Kind = 'deed' | 'curio'; // подвиг или курьёз

export interface Regalia {
  id: string;
  name: string;
  how: string;
  quote: string;
  rarity: Rarity;
  kind: Kind;
  check: (s: GameState) => boolean;
  progress?: (s: GameState) => [number, number];
  soon?: boolean;
}

export const RARITY: Record<Rarity, { name: string; color: string }> = {
  common: { name: 'обычная', color: '#E8DFC8' },
  rare: { name: 'редкая', color: '#6FA0FF' },
  epic: { name: 'эпическая', color: '#B58CFF' },
  legendary: { name: 'легендарная', color: '#E3B341' },
};

const hourOf = (ts: number) => new Date(ts).getHours();
const monthOf = (ts: number) => new Date(ts).getMonth();

export function dayKey(d: Date | number = new Date()): string {
  const x = typeof d === 'number' ? new Date(d) : d;
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${x.getFullYear()}-${m}-${day}`;
}

/** Сколько дней подряд (включая сегодня или вчера) был хоть какой-то подвиг. */
export function streak(s: GameState): number {
  const active = (k: string) => {
    const d = s.days[k];
    return !!d && (d.walkedM >= 500 || d.tasksDone > 0);
  };
  const cur = new Date();
  if (!active(dayKey(cur))) cur.setDate(cur.getDate() - 1);
  let n = 0;
  while (active(dayKey(cur))) {
    n++;
    cur.setDate(cur.getDate() - 1);
  }
  return n;
}

const couchDays = (s: GameState) =>
  Object.values(s.days).filter((d) => d.opened && d.walkedM === 0).length;

export const REGALIA: Regalia[] = [
  {
    id: 'first_land',
    name: 'Первый удел',
    how: 'Замкни маршрут и захвати свою первую землю',
    quote: 'Каждое королевство начиналось с клочка земли и упрямца, который на нём встал.',
    rarity: 'common',
    kind: 'deed',
    check: (s) => s.captures >= 1,
  },
  {
    id: 'founder',
    name: 'Основатель',
    how: 'Основать своё королевство',
    quote: 'Объявить себя королём легко. Уговорить двор — вот где начинается поход.',
    rarity: 'common',
    kind: 'deed',
    check: (s) => !!s.kingdom,
  },
  {
    id: 'couch',
    name: 'Диванный рыцарь',
    how: 'Три дня открывать приложение и ни разу не выйти в поход',
    quote: 'Враг не пройдёт. Впрочем, я тоже.',
    rarity: 'rare',
    kind: 'curio',
    check: (s) => couchDays(s) >= 3,
    progress: (s) => [Math.min(3, couchDays(s)), 3],
  },
  {
    id: 'streak7',
    name: 'Семь дней в седле',
    how: 'Неделю подряд выполнять задания или гулять от 500 м',
    quote: 'Неделя в седле. Конь устал, а ты — нет.',
    rarity: 'rare',
    kind: 'deed',
    check: (s) => streak(s) >= 7,
    progress: (s) => [Math.min(7, streak(s)), 7],
  },
  {
    id: 'night',
    name: 'Ночной дозор',
    how: 'Выйти в поход между полуночью и четырьмя утра',
    quote: 'Ночь темна и полна шагомеров.',
    rarity: 'rare',
    kind: 'curio',
    check: (s) => s.walks.some((w) => hourOf(w.startedAt) < 4),
  },
  {
    id: 'early',
    name: 'Ранняя пташка',
    how: 'Выйти в поход до семи утра',
    quote: 'Кто рано встаёт, тому корона даёт.',
    rarity: 'rare',
    kind: 'curio',
    check: (s) => s.walks.some((w) => hourOf(w.startedAt) >= 4 && hourOf(w.startedAt) < 7),
  },
  {
    id: 'circle',
    name: 'Хождение по кругу',
    how: 'Захватить совсем крошечный удел — меньше 2 500 м²',
    quote: 'Земля твоя. Размером с парковочное место.',
    rarity: 'rare',
    kind: 'curio',
    check: (s) => s.flags.tinyLoop,
  },
  {
    id: 'winter',
    name: 'Зимний рыцарь',
    how: 'Пройти 3 км за один поход с ноября по февраль',
    quote: 'Зима не близко. Зима уже здесь. А ты всё равно вышел.',
    rarity: 'rare',
    kind: 'deed',
    check: (s) => s.walks.some((w) => [10, 11, 0, 1].includes(monthOf(w.startedAt)) && w.distance >= 3000),
  },
  {
    id: 'chronicler',
    name: 'Летописец',
    how: 'Выполнить 10 заданий',
    quote: 'Не записал — значит, не было. Записал — значит, подвиг.',
    rarity: 'common',
    kind: 'deed',
    check: (s) => s.habitsDone >= 10,
    progress: (s) => [Math.min(10, s.habitsDone), 10],
  },
  {
    id: 'architect',
    name: 'Зодчий',
    how: 'Сменить облик своих башен',
    quote: 'Сначала башня, потом королевство. Или наоборот — никто не проверял.',
    rarity: 'common',
    kind: 'curio',
    check: (s) => s.flags.changedTower,
  },
  {
    id: 'herald',
    name: 'Геральдист',
    how: 'Изменить знамя королевства',
    quote: 'Знамя — лицо королевства. Не подведи лицо.',
    rarity: 'common',
    kind: 'deed',
    check: (s) => s.flags.changedBanner,
  },
  {
    id: 'border',
    name: 'Пограничник',
    how: 'Отвоевать землю у соседнего королевства',
    quote: 'Хорошие заборы делают хороших соседей. Хорошие ноги — новые заборы.',
    rarity: 'epic',
    kind: 'deed',
    check: (s) => s.flags.tookFromNeighbor,
  },
  {
    id: 'great_march',
    name: 'Великий поход',
    how: 'Пройти 10 км за один поход',
    quote: 'Одни несут кольцо к вулкану. Ты просто хотел до ларька. Неважно — путь засчитан.',
    rarity: 'epic',
    kind: 'deed',
    check: (s) => s.walks.some((w) => w.distance >= 10000),
    progress: (s) => [Math.round(Math.max(0, ...s.walks.map((w) => w.distance)) / 100) / 10, 10],
  },
  {
    id: 'wanderer',
    name: 'Странник',
    how: 'Пройти 42 км за всё время',
    quote: 'Сорок два. Ответ на главный вопрос жизни, вселенной и ходьбы.',
    rarity: 'epic',
    kind: 'deed',
    check: (s) => s.totalDistance >= 42195,
    progress: (s) => [Math.floor(s.totalDistance / 1000), 42],
  },
  {
    id: 'lord',
    name: 'Лорд района',
    how: 'Захватить 20 уделов',
    quote: 'Каждый двор теперь знает твоё знамя. И твою дорогу до магазина.',
    rarity: 'epic',
    kind: 'deed',
    check: (s) => s.captures >= 20,
    progress: (s) => [Math.min(20, s.captures), 20],
  },
  {
    id: 'glory',
    name: 'Слава в веках',
    how: 'Дослужиться до титула «Баннерет»',
    quote: 'О тебе уже шепчутся в тавернах. Пока только хорошее.',
    rarity: 'epic',
    kind: 'deed',
    check: (s) => titleOf(s.glory).level >= 5,
    progress: (s) => [Math.min(1400, s.glory), 1400],
  },
  {
    id: 'patron',
    name: 'Меценат',
    how: 'Поддержать проект донатом',
    quote: 'Казна пополнилась, а летописцы запомнили твоё имя навсегда.',
    rarity: 'legendary',
    kind: 'deed',
    check: (s) => s.flags.patron,
    soon: true,
  },
];

export const regaliaCount = (s: GameState) => Object.keys(s.unlocked).length;
