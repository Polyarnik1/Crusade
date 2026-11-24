import { useEffect, useMemo, useRef, useState } from 'react';
import { BENEDICT, BENEDICT_TSUN } from '../art/benedict.gen';

// Бенедикт — загадочный советник. Выплывает из тени слева, говорит и уходит.

type Mood = 'calm' | 'tsun';
interface Node {
  lines: string[];
  mood?: Mood;
  choices?: { label: string; to: string }[];
  next?: string;
}

function script(kingdom: string): Record<string, Node> {
  return {
    intro: {
      lines: [
        'Тише… Не пугайся. Метель привела меня к твоему знамени.',
        `Значит, «${kingdom}». Звучит так, будто о нём ещё сложат песни. Или эпитафии — посмотрим.`,
        'Я Бенедикт. Глаза мои закрыты, но вижу я дальше любого дозорного. И, похоже, теперь я при тебе.',
      ],
      choices: [
        { label: 'Расскажи мне инструктаж', to: 'guide' },
        { label: 'Почему тебя зовут Бенедикт?', to: 'name' },
      ],
    },
    guide: {
      lines: [
        'Слушай же. «Карта» — твоё поле брани. Жми «В поход» и иди. Замкнёшь круг шагами — земля внутри станет твоей.',
        'Чем шире круг, тем больше удел. Пройдёшь по чужим землям — отнимешь и их. Только не удивляйся, когда однажды отнимут у тебя.',
        '«Задания» — дела на каждый день. Мелкие, как шаги. Но из шагов, правитель, складываются империи… и крепкие колени.',
        '«Регалии» — знаки твоей славы. Одни даются за подвиги, другие — за странности. За какие — не скажу. Ищи.',
        '«Летопись» помнит всё, что ты свершил. Даже то, что ты хотел бы забыть.',
        'А «Герой» — это ты сам. Там же сменишь знамя, башню и имя державы. Душу — нет, не проси.',
      ],
      next: 'bye',
    },
    name: {
      mood: 'tsun',
      lines: [
        'Тебя правда это волнует!? Бенедикт — значит «доблестный».',
        'И не смотри так. Не то чтобы мне было приятно, что ты спросил… Хмф.',
      ],
      next: 'byeTsun',
    },
    bye: {
      lines: ['Вот и всё. Метель зовёт меня обратно. Когда понадоблюсь — я рядом. В тени.'],
    },
    byeTsun: {
      mood: 'tsun',
      lines: ['Мне пора. Береги свои земли, правитель… Не то чтобы мне было не всё равно!'],
    },
  };
}

const W = 40;
const H = 44;
const EYES: [number, number][] = [
  [16.5, 17.5],
  [23.5, 17.5],
];

/** Спрайт с живыми искрами из глаз и редким снегом. */
function Sprite({ mood }: { mood: Mood }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.src = mood === 'tsun' ? BENEDICT_TSUN : BENEDICT;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const t0 = performance.now();
    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      if (img.complete) ctx.drawImage(img, 0, 0);
      if (!still) {
        // искры из глаз: вверх и чуть в стороны
        for (let i = 0; i < 24; i++) {
          const [ex, ey] = EYES[i % 2];
          const age = (t / 2 + ((i * 0.618 + (i % 2) * 0.31) % 1)) % 1;
          const sd = i * 7.31;
          const x = ex + Math.sin(sd) * 0.9 * age * 9 + Math.sin(age * 9 + sd) * 0.6;
          const y = ey - 1 - age * 17;
          const a = Math.min(1, (1 - age) * 1.8) * Math.min(1, age * 6);
          ctx.fillStyle = mood === 'tsun' ? `rgba(255,190,205,${a})` : `rgba(235,244,255,${a})`;
          ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
        }
        // метель
        for (let i = 0; i < 10; i++) {
          const ph = (t * (0.08 + (i % 3) * 0.03) + i * 0.137) % 1;
          const x = ((i * 37) % W) + Math.sin(t + i) * 2;
          ctx.fillStyle = 'rgba(220,232,250,0.55)';
          ctx.fillRect(Math.round(x), Math.round(ph * H), 1, 1);
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [mood]);
  return <canvas ref={ref} width={W} height={H} className={'bene-sprite' + (mood === 'tsun' ? ' bene-tsun' : '')} />;
}

export function BenedictDialog({ kingdom, onDone }: { kingdom: string; onDone: () => void }) {
  const nodes = useMemo(() => script(kingdom), [kingdom]);
  const [node, setNode] = useState('intro');
  const [line, setLine] = useState(0);
  const [shown, setShown] = useState(0);
  const [phase, setPhase] = useState<'in' | 'talk' | 'out'>('in');
  const n = nodes[node];
  const text = n.lines[line];
  const done = shown >= text.length;
  const last = line === n.lines.length - 1;
  const mood: Mood = n.mood ?? 'calm';

  useEffect(() => {
    const t = setTimeout(() => setPhase('talk'), 1300);
    return () => clearTimeout(t);
  }, []);

  // печатаем текст по буквам
  useEffect(() => {
    if (phase !== 'talk' || done) return;
    const t = setTimeout(() => setShown((v) => v + 1), text[shown] && /[.,!?…—]/.test(text[shown]) ? 90 : 28);
    return () => clearTimeout(t);
  }, [phase, shown, done, text]);

  const go = (id: string) => {
    setNode(id);
    setLine(0);
    setShown(0);
  };
  const leave = () => {
    setPhase('out');
    setTimeout(onDone, 1100);
  };

  const tap = () => {
    if (phase !== 'talk') return;
    if (!done) return setShown(text.length);
    if (!last) {
      setLine(line + 1);
      setShown(0);
      return;
    }
    if (n.choices) return;
    if (n.next) return go(n.next);
    leave();
  };

  return (
    <div className={'bene bene--' + phase} role="dialog" aria-label="Бенедикт" onClick={tap}>
      <div className="bene-shadow" />
      <div className="bene-figure">
        <Sprite mood={mood} />
      </div>
      <div className="bene-box panel">
        <div className="bene-name pf">Бенедикт</div>
        <p className="bene-text">
          {text.slice(0, shown)}
          <span className="bene-ghost">{text.slice(shown)}</span>
        </p>
        {done && last && n.choices ? (
          <div className="bene-choices">
            {n.choices.map((c) => (
              <button
                key={c.to}
                type="button"
                className="btn btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  go(c.to);
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="bene-more muted">{done ? '▼' : ''}</div>
        )}
      </div>
    </div>
  );
}
