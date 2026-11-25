import { useEffect, useRef, useState } from 'react';
import { Banner, Tower } from '../art/heraldry';
import { SceneArt } from '../art/SceneArt';
import { music } from '../audio/music';
import { sfx } from '../audio/sfx';
import { CLASSES, COLORS, DEFAULT_BANNER, FORMS, SYMBOLS, TOWERS, type ClassId } from '../game/cosmetics';
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

const PATH: Record<ClassId, { title: string; accent: string; motto: string; lines: string[]; go: string }> = {
  knight: {
    title: 'Путь рыцаря',
    accent: '#d84430',
    motto: 'Пока знамя поднято — держава стоит.',
    lines: [
      'Ты выбрал сталь и честь. Каждая прогулка теперь — дозор по твоим землям.',
      'Рыцарь не ждёт, пока враг постучит в ворота. Он выходит первым — даже под дождём.',
      'Береги серию, как знамя: упавшее, его тяжело поднять.',
    ],
    go: 'В дозор!',
  },
  wizard: {
    title: 'Путь чародея',
    accent: '#8f8cff',
    motto: 'Звёзды смотрят на тех, кто идёт ночью.',
    lines: [
      'Ты выбрал тайну. Мир для тебя — карта знаков: тропинки, тени, странная погода.',
      'Чародей видит узор там, где другие видят улицу. Замыкай круги — в них сила.',
      'И не обижай Бенедикта. Слепые провидцы — лучшие коллеги.',
    ],
    go: 'К звёздам!',
  },
  merchant: {
    title: 'Путь торговца',
    accent: '#e3b341',
    motto: 'Каждая дорога ведёт к выгоде — надо лишь пройти её.',
    lines: [
      'Ты выбрал дороги и звон монет. Земля — лучший товар: новой больше не делают.',
      'Торговец знает цену шагу. Километр сегодня — удел завтра, слава послезавтра.',
      'Соседи — не враги. Это будущие покупатели. Пока что.',
    ],
    go: 'В путь!',
  },
};

export function ClassDialog({ onDone, onLeaving }: { onDone: () => void; onLeaving: (chosen: boolean) => void }) {
  const { act } = useGame();
  const [node, setNode] = useState<'ask' | 'confirm' | 'bye'>('ask');
  const [picked, setPicked] = useState<ClassId | null>(null);
  const [line, setLine] = useState(0);
  const [shown, setShown] = useState(0);
  const [phase, setPhase] = useState<'in' | 'talk' | 'out'>('in');
  const closing = useRef(false);
  const chosen = useRef(false);

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
    onLeaving(chosen.current); // затемнение под Бенедиктом остаётся, пока не выедет окно пути
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
                  if (picked) {
                    act.chooseClass(picked);
                    chosen.current = true;
                  }
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

/** Поздравление после выбора пути: выезжает, когда Бенедикт ушёл. */
export function PathSheet({ cls, onClose }: { cls: ClassId; onClose: () => void }) {
  const { s, act } = useGame();
  const p = PATH[cls];
  const def = CLASSES.find((c) => c.id === cls)!;
  const form = FORMS.find((f) => f.cls === cls)!;
  const tower = TOWERS.find((t) => t.cls === cls)!;
  const syms = SYMBOLS.filter((x) => x.cls === cls);
  const cols = COLORS.filter((x) => x.cls === cls);
  const base = s.kingdom?.banner ?? DEFAULT_BANNER;
  const [out, setOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => sfx.play('title'), 1250);
    return () => clearTimeout(t);
  }, []);

  const close = (edit: boolean) => {
    if (out) return;
    sfx.play('close');
    setOut(true);
    setTimeout(() => {
      onClose();
      if (edit) act.openFounding();
    }, 420);
  };

  let n = 0;
  const d = () => ({ animationDelay: `calc(var(--lag) + ${0.9 + n++ * 0.12}s)` });

  return (
    <div className={'path-back' + (out ? ' path-out' : '')}>
      <div className="path-card" role="dialog" aria-modal="true" aria-label={p.title} style={{ '--pc': p.accent } as React.CSSProperties}>
        <div className="path-scene">
          <SceneArt id={'path_' + cls} />
          <div className="path-badge pf">Путь избран</div>
        </div>
        <div className="path-body">
          <div className="path-title pf">{p.title}</div>
          <blockquote className="quote path-motto">«{p.motto}»</blockquote>
          <div className="path-lines">
            {p.lines.map((l) => (
              <p key={l} className="path-in" style={d()}>
                {l}
              </p>
            ))}
          </div>
          <div className="label path-in" style={{ ...d(), marginTop: 14 }}>
            Открыто для «{s.kingdom?.name ?? 'державы'}»
          </div>
          <div className="path-unlocks">
            <div className="path-item path-in" style={d()}>
              <Tower tower={tower.id} color={base.color} size={40} />
              <span>{tower.name}</span>
            </div>
            {syms.map((x) => (
              <div key={x.id} className="path-item path-in" style={d()}>
                <Banner banner={{ ...base, symbol: x.id, color: cols[0].id, second: cols[1].id }} size={34} />
                <span>{x.name}</span>
              </div>
            ))}
            <div className="path-item path-in" style={d()}>
              <div className="path-swatches">
                {cols.map((c) => (
                  <i key={c.id} style={{ background: c.hex }} />
                ))}
              </div>
              <span>
                {cols[0].name} и {cols[1].name.toLowerCase()}
              </span>
            </div>
          </div>
          <div className="path-form path-in" style={d()}>
            Новая форма правления: <b>{form.name}</b> · {form.ruler} {s.hero.name}
          </div>
          <div className="path-in" style={d()}>
            <button type="button" className="btn btn-gold btn-block" style={{ marginTop: 12 }} onClick={() => close(true)}>
              Украсить королевство
            </button>
            <button type="button" className="btn btn-block" style={{ marginTop: 8 }} onClick={() => close(false)}>
              {p.go}
            </button>
          </div>
        </div>
        <span className="sr-only">{def.name}</span>
      </div>
    </div>
  );
}
