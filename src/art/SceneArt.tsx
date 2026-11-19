import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { HEADER_IMG, HEADER_META, SCENE_IMG, SCENE_META, type Fx, type SceneMeta } from './scenes.gen';

// Частицы рисуются в «пикселях сцены» и привязываются к её сетке,
// поэтому снег и искры выглядят частью пиксель-арта, а не наложенным эффектом.

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  c: number; // индекс цвета
  ph: number;
}

const COLORS: Record<Fx, string[]> = {
  snow: ['#eef4fc', '#cad8ea', '#a6b8d4'],
  blizzard: ['#eef4fc', '#cad8ea', '#a6b8d4'],
  embers: ['#fffae0', '#ffe48c', '#fcbc44', '#f08a22', '#d65412', '#9c300c'],
  fireflies: ['#f0ffb0', '#c8f08a', '#8ad070'],
  ash: ['#8a8590', '#6a6470', '#4a4652', '#f08a22'],
  dust: ['#f0e4bc', '#d8c89a', '#a8946a'],
  stars: ['#ffffff', '#c8d6f2', '#7f98c8'],
  rain: ['#6a88b4', '#446494'],
  none: ['#000'],
};
const COUNT: Record<Fx, number> = { snow: 46, blizzard: 110, embers: 26, fireflies: 11, ash: 40, dust: 22, stars: 14, rain: 60, none: 0 };

function spawn(fx: Fx, m: SceneMeta, fresh: boolean): P {
  const r = Math.random;
  const base: P = { x: r() * m.w, y: r() * m.h, vx: 0, vy: 0, life: 0, max: 1e9, size: 1, c: 0, ph: r() * 6.28 };
  switch (fx) {
    case 'snow':
      return { ...base, y: fresh ? r() * m.h : -2, vy: 3 + r() * 6, vx: -1 + r() * 2, size: r() < 0.18 ? 2 : 1, c: Math.floor(r() * 3) };
    case 'blizzard':
      return { ...base, x: fresh ? r() * m.w : -4 + r() * m.w * 0.6, y: fresh ? r() * m.h : -2, vy: 10 + r() * 10, vx: 14 + r() * 10, size: r() < 0.12 ? 2 : 1, c: Math.floor(r() * 3) };
    case 'embers': {
      const [ex, ey] = m.emit ?? [m.w / 2, m.h - 4];
      return { ...base, x: ex + (r() - 0.5) * 6, y: ey - r() * 3, vy: -(6 + r() * 10), vx: (r() - 0.5) * 4, max: 1.6 + r() * 2.6, life: fresh ? r() * 2 : 0, c: 0 };
    }
    case 'fireflies':
      return { ...base, y: m.h * 0.45 + r() * m.h * 0.5, vx: (r() - 0.5) * 3, vy: (r() - 0.5) * 2, c: Math.floor(r() * 3) };
    case 'ash':
      return { ...base, y: fresh ? r() * m.h : -2, vy: 2 + r() * 4, vx: 1 + r() * 3, c: r() < 0.18 ? 3 : Math.floor(r() * 3) };
    case 'dust':
      return { ...base, vx: (r() - 0.5) * 1.6, vy: -0.4 - r() * 1.2, c: Math.floor(r() * 3) };
    case 'stars':
      return { ...base, y: r() * m.h * 0.55, c: Math.floor(r() * 3), ph: r() * 6.28 };
    default:
      return base;
  }
}

function step(p: P, fx: Fx, m: SceneMeta, dt: number, t: number): boolean {
  p.life += dt;
  switch (fx) {
    case 'snow':
      p.x += (p.vx + Math.sin(t * 1.3 + p.ph) * 2) * dt;
      p.y += p.vy * dt;
      return p.y < m.h + 2;
    case 'blizzard':
      p.x += (p.vx + Math.sin(t * 2 + p.ph) * 4) * dt;
      p.y += p.vy * dt;
      return p.y < m.h + 2 && p.x < m.w + 4;
    case 'embers':
      p.vx += Math.sin(t * 3 + p.ph) * 6 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy *= 0.995;
      return p.life < p.max;
    case 'fireflies':
      p.vx += (Math.random() - 0.5) * 6 * dt;
      p.vy += (Math.random() - 0.5) * 6 * dt;
      p.vx = Math.max(-3, Math.min(3, p.vx));
      p.vy = Math.max(-2, Math.min(2, p.vy));
      p.x = (p.x + p.vx * dt + m.w) % m.w;
      p.y = Math.max(m.h * 0.35, Math.min(m.h - 1, p.y + p.vy * dt));
      return true;
    case 'ash':
      p.x += (p.vx + Math.sin(t + p.ph) * 1.5) * dt;
      p.y += p.vy * dt;
      return p.y < m.h + 2;
    case 'dust':
      p.x += (p.vx + Math.sin(t * 0.7 + p.ph) * 0.8) * dt;
      p.y += p.vy * dt;
      return p.y > -2 && p.x > -2 && p.x < m.w + 2;
    default:
      return true;
  }
}

function alpha(p: P, fx: Fx, t: number): number {
  switch (fx) {
    case 'embers':
      return Math.max(0, 1 - p.life / p.max);
    case 'fireflies':
      return Math.max(0, Math.sin(t * 1.6 + p.ph)) ** 2;
    case 'stars':
      return Math.max(0, Math.sin(t * 1.1 + p.ph)) ** 3;
    case 'dust':
      return 0.35 + 0.35 * Math.sin(t + p.ph);
    default:
      return 1;
  }
}

function usePixelParticles(ref: React.RefObject<HTMLCanvasElement>, fx: Fx, m: SceneMeta, on: boolean) {
  useEffect(() => {
    const cv = ref.current;
    if (!cv || (fx === 'none' && !m.glow && !m.sparkle) || !on) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let parts = Array.from({ length: COUNT[fx] }, () => spawn(fx, m, true));
    let raf = 0;
    let last = performance.now();
    let visible = true;
    let glow = { start: 0.4, dur: 0.9, peak: 1, twin: false };
    // золото на мече: у каждой точки свой ритм
    const sparks = (m.sparkle ?? []).map((_, i) => ({ start: 0.8 + i * 1.3, dur: 0.8, peak: 1 }));
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(cv);
    const cols = COLORS[fx];

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible) {
        last = now;
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      const rect = cv.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = Math.round(rect.width * dpr);
      const H = Math.round(rect.height * dpr);
      if (cv.width !== W || cv.height !== H) {
        cv.width = W;
        cv.height = H;
      }
      const k = W / m.w; // размер пикселя сцены
      ctx.clearRect(0, 0, W, H);
      parts = parts.map((p) => (step(p, fx, m, reduce ? 0 : dt, t) ? p : spawn(fx, m, false)));
      for (const p of parts) {
        let ci = p.c;
        if (fx === 'embers') ci = Math.min(cols.length - 1, Math.floor((p.life / p.max) * cols.length));
        ctx.globalAlpha = alpha(p, fx, t);
        ctx.fillStyle = cols[ci];
        const px = Math.floor(p.x) * k;
        const py = Math.floor(p.y) * k;
        const s = Math.ceil(p.size * k);
        ctx.fillRect(px, py, s, s);
        if (fx === 'fireflies' || (fx === 'stars' && p.c === 0)) {
          ctx.globalAlpha *= 0.35;
          ctx.fillRect(px - k, py, k, k);
          ctx.fillRect(px + k, py, k, k);
          ctx.fillRect(px, py - k, k, k);
          ctx.fillRect(px, py + k, k, k);
        }
      }
      // свечение из смотровой щели: неравномерные вспышки, плавный разгон и затухание
      if (m.glow) {
        if (t >= glow.start + glow.dur) {
          const double = !glow.twin && Math.random() < 0.22; // иногда моргает дважды подряд
          glow = {
            start: t + (double ? 0.12 + Math.random() * 0.2 : 0.6 + Math.random() * 2.6),
            dur: 0.55 + Math.random() * 0.75,
            peak: 0.5 + Math.random() * 0.5,
            twin: double,
          };
        }
        const u = (t - glow.start) / glow.dur;
        if (u >= 0 && u < 1) {
          const sm = (x: number) => x * x * (3 - 2 * x);
          const e = (u < 0.3 ? sm(u / 0.3) : Math.pow(sm(1 - (u - 0.3) / 0.7), 1.4)) * glow.peak;
          const [gx, gy, gw, gh] = m.glow;
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = e * 0.1;
          ctx.fillRect((gx - 3) * k, (gy - 2) * k, (gw + 6) * k, (gh + 4) * k);
          ctx.globalAlpha = e * 0.18;
          ctx.fillRect((gx - 2) * k, (gy - 1) * k, (gw + 4) * k, (gh + 2) * k);
          ctx.globalAlpha = e * 0.3;
          ctx.fillRect((gx - 1) * k, gy * k, (gw + 2) * k, gh * k);
          ctx.globalAlpha = e;
          ctx.fillStyle = '#f4f8ff';
          ctx.fillRect(gx * k, gy * k, gw * k, gh * k);
        }
      }
      // острая четырёхлучевая звёздочка на золотых деталях
      (m.sparkle ?? []).forEach(([sx, sy], i) => {
        const sp = sparks[i];
        if (t >= sp.start + sp.dur) {
          sparks[i] = { start: t + 0.9 + Math.random() * 2.8, dur: 0.55 + Math.random() * 0.6, peak: 0.6 + Math.random() * 0.4 };
          return;
        }
        const u = (t - sp.start) / sp.dur;
        if (u < 0 || u >= 1) return;
        const sm = (x: number) => x * x * (3 - 2 * x);
        const e = (u < 0.35 ? sm(u / 0.35) : sm(1 - (u - 0.35) / 0.65)) * sp.peak;
        const len = Math.max(2, Math.round(3 + e * 7)); // длина луча в пикселях сцены
        ctx.fillStyle = '#fffbe0';
        for (let r = 1; r <= len; r++) {
          const a = Math.min(1, e * 1.15) * (1 - (r - 1) / (len + 0.5)) ** 0.9;
          ctx.globalAlpha = a;
          for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]]) ctx.fillRect((sx + dx) * k, (sy + dy) * k, k, k);
        }
        ctx.globalAlpha = Math.min(1, e * 1.2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx * k, sy * k, k, k);
        ctx.globalAlpha = e * 0.35;
        ctx.fillStyle = '#ffe08a';
        for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) ctx.fillRect((sx + dx) * k, (sy + dy) * k, k, k);
      });
      ctx.globalAlpha = 1;
      if (reduce) cancelAnimationFrame(raf);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [ref, fx, m, on]);
}

interface Props {
  id: string;
  header?: boolean;
  animate?: boolean;
  dim?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function hasScene(id: string) {
  return !!SCENE_IMG[id];
}
export function sceneHasSubject(id: string) {
  return !!SCENE_META[id]?.subject;
}

export function SceneArt({ id, header, animate = true, dim, className, style, children }: Props) {
  const meta = (header ? HEADER_META : SCENE_META)[id];
  const img = (header ? HEADER_IMG : SCENE_IMG)[id];
  const cv = useRef<HTMLCanvasElement>(null);
  usePixelParticles(cv, meta?.fx ?? 'none', meta, animate && !!meta);
  if (!meta || !img) return null;
  return (
    <div
      className={'scene' + (dim ? ' scene--dim' : '') + (className ? ' ' + className : '')}
      style={{ aspectRatio: `${meta.w} / ${meta.h}`, ...style }}
    >
      <img src={img} alt="" draggable={false} />
      {animate && <canvas ref={cv} aria-hidden="true" />}
      {children}
    </div>
  );
}

/** Статичная миниатюра: сцена 1:1, обрезанная по центру. */
export function SceneThumb({ id, dim }: { id: string; dim?: boolean }) {
  const img = SCENE_IMG[id];
  const m = SCENE_META[id];
  if (!img || !m) return null;
  return (
    <div
      className={'scene-thumb' + (dim ? ' scene--dim' : '')}
      style={{ backgroundImage: `url(${img})`, backgroundSize: `max(100%, ${m.w}px) auto` }}
      aria-hidden="true"
    />
  );
}
