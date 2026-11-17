import { memo } from 'react';

export type Palette = Record<string, string>;

/** Общая палитра пиксель-арта: тёмное фэнтези, зимняя ночь. */
export const PAL: Palette = {
  K: '#14121c', // контур
  k: '#2b2838', // тёмно-серый
  G: '#6b6a7e', // серый
  g: '#4a4858', // серый тёмный
  H: '#d4d7e0', // сталь светлая
  h: '#8a8fa3', // сталь
  W: '#f4efe0', // белый
  Y: '#e3b341', // золото
  y: '#a37a22', // золото тёмное
  M: '#f5d273', // светло-жёлтый
  O: '#f08a3c', // оранжевый
  R: '#e85d4f', // красный
  r: '#9e3329', // тёмно-красный
  S: '#eab58c', // кожа
  s: '#b97f5c', // кожа в тени
  B: '#5b8def', // синий
  b: '#36559a', // синий тёмный
  N: '#1d2747', // ночь
  n: '#2c3a66', // ночь светлее
  E: '#4fb36a', // зелёный
  e: '#2e7a45', // зелёный тёмный
  P: '#a77bf0', // пурпур
  p: '#6c4bb0', // пурпур тёмный
  C: '#9a4d3c', // диван / ткань
  c: '#6a2f24', // диван в тени
  T: '#c58b5a', // дерево светлое
  t: '#7a4f30', // дерево
  L: '#9fe0ee', // лёд
  l: '#3f8fb0', // лёд тёмный
  F: '#e8dfc8', // пергамент
  f: '#b8ab88', // пергамент в тени
};

interface Props {
  grid: string[];
  palette?: Palette;
  size?: number; // ширина в px
  gray?: boolean;
  title?: string;
  className?: string;
}

function toGray(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const v = Math.round((0.3 * r + 0.59 * g + 0.11 * b) * 0.55 + 18);
  const h = v.toString(16).padStart(2, '0');
  return `#${h}${h}${h}`;
}

/** Рисует сетку символов как SVG: соседние пиксели одного цвета склеиваются в полосы. */
export const Pixel = memo(function Pixel({ grid, palette = PAL, size, gray, title, className }: Props) {
  const h = grid.length;
  const w = Math.max(...grid.map((r) => r.length));
  const rects: JSX.Element[] = [];
  for (let y = 0; y < h; y++) {
    const row = grid[y];
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === '.' || ch === ' ' || !palette[ch]) {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < row.length && row[x + run] === ch) run++;
      const fill = gray ? toGray(palette[ch]) : palette[ch];
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={run} height={1} fill={fill} />);
      x += run;
    }
  }
  const px = size ?? w * 4;
  return (
    <svg
      className={className}
      width={px}
      height={(px * h) / w}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{ imageRendering: 'pixelated', display: 'block' }}
    >
      {rects}
    </svg>
  );
});
