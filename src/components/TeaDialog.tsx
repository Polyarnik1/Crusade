import { useEffect, useRef, useState } from 'react';
import { music } from '../audio/music';
import { sfx } from '../audio/sfx';
import { TEA, TEA_BYE } from '../game/benedictLines';
import { useGame } from '../game/store';
import { Sprite } from './Benedict';

// На седьмой день игры Бенедикт сам приходит и один раз ненавязчиво говорит про чай (поддержку проекта).

export function TeaDialog({ onDone }: { onDone: (toTreasury: boolean) => void }) {
  const { act } = useGame();
  const [lines, setLines] = useState<string[]>(() => TEA[Math.floor(Math.random() * TEA.length)]);
  const [line, setLine] = useState(0);
  const [shown, setShown] = useState(0);
  const [phase, setPhase] = useState<'in' | 'talk' | 'out'>('in');
  const [bye, setBye] = useState(false);
  const closing = useRef(false);
  const dest = useRef(false);
  const text = lines[line];
  const done = shown >= text.length;
  const last = line === lines.length - 1;

  useEffect(() => {
    act.teaTold(); // просьба звучит один раз, даже если окно закроют на полуслове
    music.preload();
    const t = setTimeout(() => {
      setPhase('talk');
      void music.play(6);
    }, 1100);
    return () => {
      clearTimeout(t);
      music.fadeOut(1.2);
    };
  }, [act]);

  useEffect(() => {
    if (phase !== 'talk' || done) return;
    const ch = text[shown];
    const t = setTimeout(() => {
      if (ch && /[\p{L}\p{N}]/u.test(ch) && shown % 2 === 0) sfx.play('speak');
      setShown((v) => v + 1);
    }, ch && /[.,!?…—]/.test(ch) ? 90 : 28);
    return () => clearTimeout(t);
  }, [phase, shown, done, text]);

  const leave = () => {
    if (closing.current) return;
    closing.current = true;
    setPhase('out');
    music.fadeOut(2.4);
    setTimeout(() => onDone(dest.current), 1200);
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
    if (bye) {
      sfx.play('dlgNext');
      leave();
    }
  };

  const answer = (toTreasury: boolean) => {
    sfx.play('dlgNext');
    dest.current = toTreasury;
    setBye(true);
    setLines([toTreasury ? 'Казна в настройках. Спасибо. Только не говори, что я просил.' : TEA_BYE[Math.floor(Math.random() * TEA_BYE.length)]]);
    setLine(0);
    setShown(0);
  };

  return (
    <div className={'bene bene--' + phase} role="dialog" aria-label="Бенедикт" onClick={tap}>
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
          {done && last && !bye && phase === 'talk' && (
            <div className="bene-choices">
              <button type="button" className="btn btn-gold" onClick={(e) => (e.stopPropagation(), answer(true))}>
                Загляну в казну
              </button>
              <button type="button" className="btn btn-sm" onClick={(e) => (e.stopPropagation(), answer(false))}>
                Может, потом
              </button>
            </div>
          )}
          <div className="bene-more">{phase === 'talk' && done && (bye || !last) ? '▼' : ''}</div>
        </div>
      </div>
    </div>
  );
}
