// Логика Бенедикта: лимиты на день, память о сказанном, выбор ответов.
import { dayKey, streak } from './achievements';
import { formatKm } from './geo';
import { WEEKLY_GOAL, weekKey, weeklyCaptures } from './store';
import type { BeneState, GameState } from './types';
import * as T from './benedictLines';

export const BENE_ASKS = 5; // вопросов в день
export const BENE_SULK_MS = 2 * 3600 * 1000; // дуется после «почему Бенедикт»
const RUMOURS_PER_DAY = 2;
const DAY = 86400000;

export type Topic = 'week' | 'rumour' | 'riddle' | 'fortune' | 'who';

export function newBene(sulk: boolean): BeneState {
  return { metAt: Date.now(), sulkUntil: sulk ? Date.now() + BENE_SULK_MS : undefined, used: {}, solved: [], tried: [], lore: 0, talks: 0 };
}

/** Копия состояния с обнулёнными дневными счётчиками, если наступил новый день. */
export function freshDay(b: BeneState): BeneState {
  const c = structuredClone(b);
  const d = dayKey();
  if (c.day !== d) {
    c.day = d;
    c.asks = 0;
    c.rumours = 0;
  }
  return c;
}

export const asksLeft = (b: BeneState) => Math.max(0, BENE_ASKS - (b.day === dayKey() ? (b.asks ?? 0) : 0));
export const sulking = (b: BeneState | undefined) => !!b?.sulkUntil && b.sulkUntil > Date.now();

/** Случайная ещё не сказанная реплика из списка; когда сказано всё — круг начинается заново. */
export function take(b: BeneState, cat: string, list: readonly string[]): string {
  const used = (b.used[cat] ??= []);
  let free = list.map((_, i) => i).filter((i) => !used.includes(i));
  if (!free.length) {
    used.length = 0;
    free = list.map((_, i) => i);
  }
  const i = free[Math.floor(Math.random() * free.length)];
  used.push(i);
  return list[i];
}

const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));

export interface Answer {
  lines: string[];
  tsun?: boolean;
  riddle?: number; // номер загадки: после реплик показать варианты
  cost: boolean; // тратит ли вопрос
}

export function answer(topic: Topic, s: GameState, b: BeneState): Answer {
  const today = dayKey();
  switch (topic) {
    case 'week': {
      const st = streak(s);
      const wc = weeklyCaptures(s);
      const done = s.weeklyClaimed.includes(weekKey());
      const m = s.days[today]?.walkedM ?? 0;
      const v = { streak: `${st} ${plural(st, 'день', 'дня', 'дней')}`, wc, goal: WEEKLY_GOAL, left: Math.max(0, WEEKLY_GOAL - wc), km: formatKm(m) };
      const sl = st === 0 ? ['s0', T.STREAK0] : st < 3 ? ['s1', T.STREAK_LOW] : st < 7 ? ['s2', T.STREAK_MID] : ['s3', T.STREAK_HIGH];
      const wl = done ? ['w2', T.WEEK_DONE] : wc === 0 ? ['w0', T.WEEK0] : ['w1', T.WEEK_PART];
      const tl = m < 50 ? ['t0', T.TODAY0] : ['t1', T.TODAY];
      return {
        cost: true,
        lines: [sl, wl, tl].map(([c, l]) => fill(take(b, c as string, l as string[]), v)),
      };
    }
    case 'rumour': {
      if ((b.rumours ?? 0) >= RUMOURS_PER_DAY) return { cost: false, lines: [take(b, 'rd', T.RUMOUR_DONE)] };
      b.rumours = (b.rumours ?? 0) + 1;
      const pool = s.neighbors.length ? s.neighbors.map((n) => ({ n: n.name, r: n.ruler })) : T.FALLBACK_NEIGHBORS;
      const nb = pool[Math.floor(Math.random() * pool.length)];
      return { cost: true, lines: [fill(take(b, 'ru', T.RUMOURS), nb)] };
    }
    case 'fortune': {
      if (b.fortuneDay === today) return { cost: false, lines: [take(b, 'fd', T.FORTUNE_DONE)] };
      b.fortuneDay = today;
      return { cost: true, lines: [take(b, 'fi', T.FORTUNE_INTRO), take(b, 'fo', T.FORTUNES)] };
    }
    case 'riddle': {
      if (b.riddleDay === today) return { cost: false, lines: [take(b, 'qd', T.RIDDLE_DONE)] };
      const open = T.RIDDLES.map((_, i) => i).filter((i) => !b.solved.includes(i));
      if (!open.length) return { cost: false, lines: [T.RIDDLE_ALL] };
      // сначала новые загадки, потом те, где ошибся (самые давние первыми)
      const fresh = open.filter((i) => !b.tried.includes(i));
      const i = fresh.length ? fresh[Math.floor(Math.random() * fresh.length)] : b.tried.find((t) => open.includes(t))!;
      b.riddleDay = today;
      return { cost: true, riddle: i, lines: [take(b, 'qi', T.RIDDLE_INTRO), T.RIDDLES[i].q] };
    }
    case 'who': {
      if (b.loreDay === today) return { cost: false, lines: [take(b, 'ld', T.LORE_DONE)] };
      b.loreDay = today;
      if (b.lore >= T.LORE.length) return { cost: true, lines: [take(b, 'la', T.LORE_DONE_ALL)] };
      const known = Math.floor((Date.now() - b.metAt) / DAY);
      if (known < T.LORE_DAY(b.lore)) return { cost: true, lines: [take(b, 'lw', T.LORE_WAIT)] };
      const ch = T.LORE[b.lore++];
      return { cost: true, lines: ch.lines, tsun: ch.tsun };
    }
  }
}

/** Ответ на загадку. Возвращает реплики реакции. */
export function solve(b: BeneState, i: number, pick: string): string[] {
  const ok = pick === T.RIDDLES[i].a;
  if (ok) {
    b.solved.push(i);
    b.tried = b.tried.filter((t) => t !== i);
    const ms = T.RIDDLE_MILESTONE[b.solved.length];
    return ms ? [take(b, 'qr', T.RIDDLE_RIGHT), ms] : [take(b, 'qr', T.RIDDLE_RIGHT)];
  }
  b.tried = [...b.tried.filter((t) => t !== i), i];
  return [take(b, 'qw', T.RIDDLE_WRONG)];
}

export function plural(n: number, one: string, few: string, many: string) {
  const a = n % 100;
  const b = n % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b > 1 && b < 5) return few;
  return many;
}

export function sulkLeft(b: BeneState): string {
  const min = Math.max(1, Math.ceil(((b.sulkUntil ?? 0) - Date.now()) / 60000));
  if (min < 60) return `≈ ${min} мин`;
  return min % 60 ? `≈ ${Math.floor(min / 60)} ч ${min % 60} мин` : `≈ ${min / 60} ч`;
}
