export interface Title {
  level: number;
  name: string;
  from: number; // слава, с которой начинается титул
}

export const TITLES: Title[] = [
  { level: 1, name: 'Бродяга', from: 0 },
  { level: 2, name: 'Оруженосец', from: 150 },
  { level: 3, name: 'Латник', from: 400 },
  { level: 4, name: 'Рыцарь', from: 800 },
  { level: 5, name: 'Баннерет', from: 1400 },
  { level: 6, name: 'Барон', from: 2200 },
  { level: 7, name: 'Виконт', from: 3300 },
  { level: 8, name: 'Граф', from: 4700 },
  { level: 9, name: 'Маркграф', from: 6500 },
  { level: 10, name: 'Герцог', from: 8800 },
  { level: 11, name: 'Великий князь', from: 11600 },
  { level: 12, name: 'Король', from: 15000 },
  { level: 13, name: 'Император', from: 20000 },
];

export function titleOf(glory: number) {
  let cur = TITLES[0];
  for (const t of TITLES) if (glory >= t.from) cur = t;
  const next = TITLES.find((t) => t.level === cur.level + 1) ?? null;
  const progress = next ? (glory - cur.from) / (next.from - cur.from) : 1;
  return { ...cur, next, progress: Math.max(0, Math.min(1, progress)) };
}

/** Слава за захваченный удел: растёт с площадью, но без перекоса в сторону гигантских петель. */
export function gloryForArea(m2: number): number {
  return Math.min(400, 40 + Math.round(Math.sqrt(m2) * 1.2));
}

export function gloryForDistance(m: number): number {
  return Math.floor(m / 100) * 5;
}
