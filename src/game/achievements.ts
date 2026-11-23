import { towerSpots } from './geo';
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

const DAY = 86400000;

/** Фаза луны 0..1 (0 — новолуние, 0.5 — полнолуние). Точности до суток хватает. */
export function moonPhase(ts: number): number {
  const ref = Date.UTC(2000, 0, 6, 18, 14); // известное новолуние
  const syn = 29.530588853 * DAY;
  return ((((ts - ref) % syn) + syn) % syn) / syn;
}
const isNight = (ts: number) => hourOf(ts) >= 21 || hourOf(ts) < 5;
const fullMoonNight = (ts: number) => isNight(ts) && Math.abs(moonPhase(ts) - 0.5) < 0.035;
const dateIs = (ts: number, m: number, days: number[]) => {
  const d = new Date(ts);
  return d.getMonth() === m && days.includes(d.getDate());
};
/** Самый долгий перерыв между походами, в днях. */
const longestBreak = (s: GameState) => {
  const w = [...s.walks].sort((a, b) => a.startedAt - b.startedAt);
  let best = 0;
  for (let i = 1; i < w.length; i++) best = Math.max(best, (w[i].startedAt - w[i - 1].endedAt) / DAY);
  return best;
};
/** Самый дальний поход от места самого первого (км). */
const farthest = (s: GameState) => {
  const w = s.walks.filter((x) => x.startPos);
  if (w.length < 2) return 0;
  const first = w.reduce((a, b) => (a.startedAt < b.startedAt ? a : b)).startPos!;
  let best = 0;
  for (const x of w) {
    const [la1, lo1] = first;
    const [la2, lo2] = x.startPos!;
    const k = Math.PI / 180;
    const dx = (lo2 - lo1) * k * Math.cos(((la1 + la2) / 2) * k);
    const dy = (la2 - la1) * k;
    best = Math.max(best, Math.hypot(dx, dy) * 6371);
  }
  return best;
};

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
    how: 'Изменить знамя королевства после основания (первое оформление не считается)',
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
    id: 'robin',
    name: 'Храбрый сэр Робин',
    how: 'Выйти в поход и вернуться меньше чем через минуту',
    quote: 'Когда опасность подступила вплотную, храбрый сэр Робин храбро развернулся.',
    rarity: 'common',
    kind: 'curio',
    check: (s) => s.walks.some((w) => !w.sim && w.endedAt - w.startedAt < 60000 && w.distance < 30),
  },
  {
    id: 'exile',
    name: 'Вы пали',
    how: 'Лишиться всех земель и стать правителем в изгнании',
    quote: 'Большими красными буквами: ВЫ ПАЛИ. Мелкими, внизу: встань и иди.',
    rarity: 'rare',
    kind: 'curio',
    check: (s) => !!s.flags.everExiled,
  },
  {
    id: 'return_king',
    name: 'Возвращение короля',
    how: 'Вернуть себе землю после изгнания',
    quote: 'Без короны, без свиты, без плаща. Но с картой и в удобной обуви.',
    rarity: 'epic',
    kind: 'deed',
    check: (s) => !!s.flags.returned,
  },
  {
    id: 'arrow_knee',
    name: 'Стрела в колене',
    how: 'Вернуться в поход после перерыва в две недели и больше',
    quote: 'Раньше и я был искателем приключений. Потом диван. А теперь — снова.',
    rarity: 'rare',
    kind: 'curio',
    check: (s) => longestBreak(s) >= 14,
  },
  {
    id: 'full_moon',
    name: 'Полнолуние',
    how: 'Выйти в поход ночью в полнолуние',
    quote: 'Держись дороги и обходи пустоши. Говорили же. Но кто их слушает.',
    rarity: 'epic',
    kind: 'curio',
    check: (s) => s.walks.some((w) => fullMoonNight(w.startedAt)),
  },
  {
    id: 'friday13',
    name: 'Пятница, тринадцатое',
    how: 'Выйти в поход в пятницу, 13-го',
    quote: 'Чёрный кот перебежал тебе дорогу. Ты перебежал её обратно и забрал квартал.',
    rarity: 'epic',
    kind: 'curio',
    check: (s) => s.walks.some((w) => new Date(w.startedAt).getDate() === 13 && new Date(w.startedAt).getDay() === 5),
  },
  {
    id: 'solstice',
    name: 'Хвала солнцу',
    how: 'Выйти в поход в день солнцестояния — 21 июня или 21 декабря',
    quote: 'Встань, вскинь руки к небу буквой V. Солнце не ответит, но день засчитан.',
    rarity: 'epic',
    kind: 'curio',
    check: (s) => s.walks.some((w) => dateIs(w.startedAt, 5, [20, 21, 22]) || dateIs(w.startedAt, 11, [20, 21, 22])),
  },
  {
    id: 'triple',
    name: 'Пришёл, увидел, захватил',
    how: 'Захватить три удела за один поход',
    quote: 'Цезарь управился за три слова. Тебе хватило трёх петель.',
    rarity: 'rare',
    kind: 'deed',
    check: (s) => s.walks.some((w) => w.loops >= 3),
    progress: (s) => [Math.min(3, Math.max(0, ...s.walks.map((w) => w.loops))), 3],
  },
  {
    id: 'hectares',
    name: 'Помещик',
    how: 'Владеть землёй площадью 10 гектаров',
    quote: 'Десять гектаров. Ещё немного — и придётся нанимать управляющего.',
    rarity: 'rare',
    kind: 'deed',
    check: (s) => s.totalArea >= 100000,
    progress: (s) => [Math.floor(Math.min(100000, s.totalArea) / 10000), 10],
  },
  {
    id: 'suzerain',
    name: 'Сюзерен',
    how: 'Захватить 50 уделов',
    quote: 'Вассал моего вассала — не мой вассал. А вот эти пятьдесят дворов — точно мои.',
    rarity: 'legendary',
    kind: 'deed',
    check: (s) => s.captures >= 50,
    progress: (s) => [Math.min(50, s.captures), 50],
  },
  {
    id: 'hundred',
    name: 'Сто вёрст не крюк',
    how: 'Пройти 100 км за всё время',
    quote: 'Для бешеной собаки семь вёрст не крюк. Для рыцаря и сотня — разминка.',
    rarity: 'epic',
    kind: 'deed',
    check: (s) => s.totalDistance >= 100000,
    progress: (s) => [Math.floor(Math.min(100000, s.totalDistance) / 1000), 100],
  },
  {
    id: 'mordor',
    name: 'Пешком до Мордора',
    how: 'Пройти 500 км за всё время',
    quote: 'Нельзя просто так взять и дойти до Мордора. Ты не просто так. Ты пятьсот километров так.',
    rarity: 'legendary',
    kind: 'deed',
    check: (s) => s.totalDistance >= 500000,
    progress: (s) => [Math.floor(Math.min(500000, s.totalDistance) / 1000), 500],
  },
  {
    id: 'far_land',
    name: 'За тридевять земель',
    how: 'Выйти в поход в 50 км от места своего первого похода',
    quote: 'В тридевятом царстве, в тридесятом государстве — и там теперь знают твоё знамя.',
    rarity: 'epic',
    kind: 'deed',
    check: (s) => farthest(s) >= 50,
  },
  {
    id: 'outpost',
    name: 'Дальний форпост',
    how: 'Владеть землёй из нескольких отдельных частей — захватить удел вдали от своих земель или пережить раскол',
    quote: 'Между твоими землями лежит чужая. Это не раскол — это стратегический замысел.',
    rarity: 'rare',
    kind: 'deed',
    check: (s) => towerSpots(s.land).length >= 2,
  },
  {
    id: 'fire_keeper',
    name: 'Хранитель огня',
    how: 'Месяц подряд выполнять задания или гулять от 500 м',
    quote: 'Пламя угасает у всех. У тебя — нет. Тридцать дней ты подкидывал в него шаги.',
    rarity: 'legendary',
    kind: 'deed',
    check: (s) => streak(s) >= 30,
    progress: (s) => [Math.min(30, streak(s)), 30],
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

export const regaliaCount = (s: GameState) => REGALIA.filter((r) => s.unlocked[r.id]).length;
