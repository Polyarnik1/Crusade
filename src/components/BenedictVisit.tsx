import { useEffect, useMemo, useRef, useState } from 'react';
import { music } from '../audio/music';
import { sfx } from '../audio/sfx';
import { answer, asksLeft, BENE_ASKS, freshDay, newBene, plural, solve, take, type Topic } from '../game/benedict';
import * as T from '../game/benedictLines';
import { streak } from '../game/achievements';
import { useGame } from '../game/store';
import type { BeneState } from '../game/types';
import { Sprite } from './Benedict';

// Визит к Бенедикту по кнопке: он спит на окне, просыпается от касания и отвечает на вопросы.

type Phase = 'in' | 'sleep' | 'jolt' | 'rise' | 'menu' | 'talk' | 'pick' | 'mumble' | 'out';

const TOPICS: { id: Topic; label: string }[] = [
  { id: 'week', label: 'Как моя неделя?' },
  { id: 'rumour', label: 'Слухи о соседях' },
  { id: 'riddle', label: 'Загадай загадку' },
  { id: 'fortune', label: 'Погадай мне' },
  { id: 'who', label: 'Кто ты такой?' },
];

const shuffle = <X,>(a: X[]) => {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
};

export function BenedictVisit({ onDone }: { onDone: () => void }) {
  const { s, act } = useGame();
  const [b, setB] = useState<BeneState>(() => freshDay(s.bene ?? newBene(false)));
  const tired = useRef(asksLeft(b) <= 0);
  const [phase, setPhase] = useState<Phase>('in');
  const [bubble, setBubble] = useState<string | null>(null);
  const [rub, setRub] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [line, setLine] = useState(0);
  const [shown, setShown] = useState(0);
  const [tsun, setTsun] = useState(false);
  const [then, setThen] = useState<'menu' | 'pick' | 'leave'>('menu');
  const [riddle, setRiddle] = useState<number | null>(null);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      music.fadeOut(1.2);
    },
    [],
  );

  const opts = useMemo(() => (riddle === null ? [] : shuffle([T.RIDDLES[riddle].a, ...T.RIDDLES[riddle].w])), [riddle]);
  const text = lines[line] ?? '';
  const done = shown >= text.length;
  const last = line >= lines.length - 1;

  const persist = (nb: BeneState) => {
    setB(nb);
    act.saveBene(nb);
  };

  useEffect(() => {
    if (!tired.current) music.preload();
    later(() => setPhase('sleep'), 1100);
  }, []);

  // печать по буквам с «голосом»
  useEffect(() => {
    if (phase !== 'talk' || done) return;
    const ch = text[shown];
    const t = setTimeout(() => {
      if (ch && /[\p{L}\p{N}]/u.test(ch) && shown % 2 === 0) sfx.play(tsun ? 'speakTsun' : 'speak');
      setShown((v) => v + 1);
    }, ch && /[.,!?…—]/.test(ch) ? 90 : 28);
    return () => clearTimeout(t);
  }, [phase, shown, done, text, tsun]);

  const say = (ls: string[], next: 'menu' | 'pick' | 'leave', isTsun = false) => {
    if (isTsun) music.tapeStop();
    else if (music.cut && next !== 'leave') void music.play(6); // неловкая пауза кончилась — тема тихо возвращается
    setLines(ls);
    setLine(0);
    setShown(0);
    setTsun(isTsun);
    setThen(next);
    setPhase('talk');
  };

  const leave = () => {
    setBubble(null);
    setPhase('out');
    music.fadeOut(2.4);
    later(onDone, 1200);
  };

  const wake = () => {
    const nb = structuredClone(b);
    if (tired.current) {
      // лимит на сегодня исчерпан: бормочет сквозь сон и не просыпается
      setBubble(take(nb, 'sl', T.SLEEPY));
      persist(nb);
      sfx.play('dlgSkip');
      setPhase('mumble');
      later(leave, 2800);
      return;
    }
    setBubble(null);
    sfx.play('dlgNext');
    setPhase('jolt');
    later(() => setPhase('rise'), 560);
    later(() => {
      setRub(true);
      void music.play(6);
      setBubble(take(nb, 'wk', T.WAKE));
      persist(nb);
      setPhase('menu');
    }, 1200);
    later(() => setRub(false), 2200);
    later(() => setBubble(null), 3900);
  };

  // ответ закончен: если вопросы кончились — прощальная фраза и уход
  // раз в жизни, когда игрок уже несколько дней подряд заходит: просьба про чай перед уходом
  const tea = (): string[] => {
    if (s.flags.teaTold) return [];
    const st = streak(s);
    if (st < 3) return [];
    act.teaTold();
    const v = T.TEA[Math.floor(Math.random() * T.TEA.length)];
    return v.map((l) => l.replace('{streak}', `${st} ${plural(st, 'день', 'дня', 'дней')}`));
  };

  const finish = (ls: string[], nb: BeneState, isTsun?: boolean) => {
    if (asksLeft(nb) <= 0) {
      const lim = take(nb, 'lm', T.LIMIT);
      persist(nb);
      say([...ls, lim, ...tea()], 'leave', isTsun);
    } else {
      persist(nb);
      say(ls, 'menu', isTsun);
    }
  };

  const ask = (topic: Topic) => {
    sfx.play('dlgNext');
    setBubble(null);
    const nb = freshDay(b);
    const a = answer(topic, s, nb);
    if (a.cost) {
      nb.asks = (nb.asks ?? 0) + 1;
      nb.talks++;
    }
    if (a.riddle !== undefined) {
      persist(nb);
      setRiddle(a.riddle);
      say(a.lines, 'pick');
      return;
    }
    finish(a.lines, nb, a.tsun);
  };

  const pick = (opt: string) => {
    if (riddle === null) return;
    sfx.play('dlgNext');
    const nb = structuredClone(b);
    const r = solve(nb, riddle, opt);
    setRiddle(null);
    finish(r, nb);
  };

  const bye = () => {
    sfx.play('dlgNext');
    setBubble(null);
    const nb = structuredClone(b);
    const l = take(nb, 'fw', T.FAREWELL);
    persist(nb);
    say([l, ...tea()], 'leave');
  };

  const tap = () => {
    if (phase === 'sleep') return wake();
    if (phase !== 'talk') return;
    if (!done) {
      sfx.play('dlgSkip');
      return setShown(text.length);
    }
    sfx.play('dlgNext');
    if (!last) {
      setLine(line + 1);
      setShown(0);
      return;
    }
    if (then === 'menu') setPhase('menu');
    else if (then === 'pick') setPhase('pick');
    else leave();
  };

  const lying = phase === 'in' || phase === 'sleep' || phase === 'jolt' || phase === 'mumble';
  const closed = lying || phase === 'rise';
  const left = asksLeft(b);

  return (
    <div className={'bene bene--' + phase} role="dialog" aria-label="Бенедикт" onClick={tap}>
      <div className="bene-unit">
        <div className={'bene-figure' + (lying ? ' bene-lying' : '') + (phase === 'jolt' ? ' bene-jolt' : '')}>
          <Sprite mood={tsun && phase === 'talk' ? 'tsun' : 'calm'} sleep={closed} rub={rub} />
        </div>
        {(phase === 'in' || phase === 'sleep' || phase === 'mumble') && (
          <div className="bene-zzz" aria-hidden="true">
            <span>z</span>
            <span>z</span>
            <span>Z</span>
          </div>
        )}
        {bubble && (
          <div key={bubble} className={'bene-bubble' + (lying ? ' bene-bubble--low' : '')}>
            {bubble}
          </div>
        )}
        <div className="bene-box bene-box--visit">
          <i className="bene-corner tl" />
          <i className="bene-corner tr" />
          <i className="bene-corner bl" />
          <i className="bene-corner br" />
          <div className="bene-name pf">Бенедикт</div>

          {(phase === 'in' || phase === 'sleep' || phase === 'mumble') && (
            <p className="bene-text bene-hint">
              {tired.current ? 'Бенедикт спит глубоким сном. Сегодня его уже не добудиться.' : 'Бенедикт спит. Коснись его, чтобы разбудить.'}
            </p>
          )}

          {phase === 'menu' && (
            <>
              <div className="bene-left">
                Вопросов на сегодня: {left} из {BENE_ASKS}
              </div>
              <div className="bene-grid">
                {TOPICS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="btn btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      ask(t.id);
                    }}
                  >
                    {t.label}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn btn-sm bene-bye"
                  onClick={(e) => {
                    e.stopPropagation();
                    bye();
                  }}
                >
                  Прощай
                </button>
              </div>
            </>
          )}

          {(phase === 'talk' || phase === 'out') && (
            <>
              <p className="bene-text">
                {text.slice(0, shown)}
                <span className="bene-ghost">{text.slice(shown)}</span>
              </p>
              <div className="bene-more">{phase === 'talk' && done ? '▼' : ''}</div>
            </>
          )}

          {phase === 'pick' && riddle !== null && (
            <>
              <p className="bene-text">{T.RIDDLES[riddle].q}</p>
              <div className="bene-choices">
                {opts.map((o) => (
                  <button
                    key={o}
                    type="button"
                    className="btn btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      pick(o);
                    }}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
