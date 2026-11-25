import { useEffect, useRef, useState } from 'react';
import { Tower } from '../art/heraldry';
import { music } from '../audio/music';
import { sfx } from '../audio/sfx';
import { CLASSES, type ClassId } from '../game/cosmetics';
import { useGame } from '../game/store';
import { Sprite } from './Benedict';

// Через несколько дней игры Бенедикт предлагает выбрать путь: рыцарь, чародей или торговец.
// Путь не меняет возможностей — он открывает скрытые украшения королевства.

const ASK = [
  'Пять дней ты ходишь по своей земле. Метель это заметила.',
  'Правитель, которого узнала земля, выбирает путь. Не по силе и не по выгоде — по тому, кем ему хочется быть.',
  'Путей три. Ноги от них не станут быстрее. Зато каждый откроет скрытые украшения для твоей державы.',
];

const CONFIRM: Record<ClassId, string> = {
  knight: 'Рыцарь. Предсказуемо. Но железо в этом мире всегда в цене. Это твой путь?',
  wizard: 'Чародей… Что ж. Только не превращай меня ни во что. Я и так прекрасен. Это твой путь?',
  merchant: 'Торговец! Значит, и я что-нибудь продам. Например, загадку. Недорого. Это твой путь?',
};

const BYE = ['Путь выбран. Дальше пойдёшь сам. Я рядом — в тени.'];

export function ClassDialog({ onDone }: { onDone: () => void }) {
  const { act } = useGame();
  const [node, setNode] = useState<'ask' | 'confirm' | 'bye'>('ask');
  const [picked, setPicked] = useState<ClassId | null>(null);
  const [line, setLine] = useState(0);
  const [shown, setShown] = useState(0);
  const [phase, setPhase] = useState<'in' | 'talk' | 'out'>('in');
  const closing = useRef(false);

  const lines = node === 'ask' ? ASK : node === 'confirm' ? [CONFIRM[picked ?? 'knight']] : BYE;
  const text = lines[line];
  const done = shown >= text.length;
  const last = line === lines.length - 1;

  useEffect(() => {
    const t = setTimeout(() => {
      setPhase('talk');
      void music.play(6);
    }, 1100);
    return () => {
      clearTimeout(t);
      music.fadeOut(1.2);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'talk' || done) return;
    const ch = text[shown];
    const t = setTimeout(() => {
      if (ch && /[\p{L}\p{N}]/u.test(ch) && shown % 2 === 0) sfx.play('speak');
      setShown((v) => v + 1);
    }, ch && /[.,!?…—]/.test(ch) ? 90 : 28);
    return () => clearTimeout(t);
  }, [phase, shown, done, text]);

  const go = (n: 'ask' | 'confirm' | 'bye', l = 0) => {
    setNode(n);
    setLine(l);
    setShown(0);
  };
  const leave = () => {
    if (closing.current) return;
    closing.current = true;
    setPhase('out');
    music.fadeOut(2.6);
    setTimeout(onDone, 1200);
  };

  const tap = () => {
    if (phase !== 'talk') return;
    if (!done) {
      sfx.play('dlgSkip');
      return setShown(text.length);
    }
    if (!last) {
      sfx.play('dlgNext');
      setLine(line + 1);
      setShown(0);
      return;
    }
    if (node === 'bye') {
      sfx.play('dlgNext');
      leave();
    }
  };

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className={'bene bene--' + phase} role="dialog" aria-label="Выбор пути" onClick={tap}>
      <div className="bene-unit">
        <div className="bene-figure">
          <Sprite mood="calm" />
        </div>
        <div className="bene-box">
          <i className="bene-corner tl" />
          <i className="bene-corner tr" />
          <i className="bene-corner bl" />
          <i className="bene-corner br" />
          <div className="bene-name pf">Бенедикт</div>
          <p className="bene-text">
            {text.slice(0, shown)}
            <span className="bene-ghost">{text.slice(shown)}</span>
          </p>

          {done && last && node === 'ask' && (
            <div className="bene-choices">
              {CLASSES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="btn cls-card"
                  onClick={(e) => {
                    stop(e);
                    sfx.play('dlgNext');
                    setPicked(c.id);
                    go('confirm');
                  }}
                >
                  <Tower tower={c.tower} color={c.color} size={44} />
                  <span>
                    <b>{c.name}</b>
                    <small>{c.blurb}</small>
                    <small className="cls-opens">Откроет: {c.opens}.</small>
                  </span>
                </button>
              ))}
              <button
                type="button"
                className="btn btn-sm"
                onClick={(e) => {
                  stop(e);
                  sfx.play('dlgNext');
                  act.deferClass();
                  leave();
                }}
              >
                Подумаю до завтра
              </button>
            </div>
          )}

          {done && last && node === 'confirm' && (
            <div className="bene-choices">
              <button
                type="button"
                className="btn btn-gold"
                onClick={(e) => {
                  stop(e);
                  sfx.play('dlgNext');
                  if (picked) act.chooseClass(picked);
                  go('bye');
                }}
              >
                Да, это мой путь
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={(e) => {
                  stop(e);
                  sfx.play('dlgNext');
                  go('ask', ASK.length - 1);
                  setShown(ASK[ASK.length - 1].length);
                }}
              >
                Выбрать другой
              </button>
            </div>
          )}

          {!(done && last && node !== 'bye') && <div className="bene-more">{done ? '▼' : ''}</div>}
        </div>
      </div>
    </div>
  );
}
