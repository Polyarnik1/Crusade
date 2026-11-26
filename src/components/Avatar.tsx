import { useMemo, useState, type CSSProperties } from 'react';
import { AVATAR_GLOW, AVATAR_SHEETS } from '../art/avatars.gen';
import { sfx } from '../audio/sfx';
import { AVATARS, AVATAR_SETS, type AvatarPick } from '../game/avatars';
import { useGame } from '../game/store';
import { Sheet } from './ui';

const rnd = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

/** Мелкие косметические эффекты поверх портрета: снег, угли, звёзды, блик. */
function Fx({ set }: { set: string }) {
  const items = useMemo(() => {
    const n = set === 'winter' ? 16 : set === 'ash' ? 11 : set === 'moon' ? 9 : 0;
    return Array.from({ length: n }, (_, i) => ({
      '--l': `${Math.round(rnd(i, 1) * 96)}%`,
      '--t': `${Math.round(rnd(i, 4) * 70)}%`,
      '--s': rnd(i, 2) > 0.65 ? 2 : 1,
      '--d': `${(set === 'winter' ? 5 + rnd(i, 3) * 5 : set === 'ash' ? 3.2 + rnd(i, 3) * 3.4 : 1.8 + rnd(i, 3) * 2.6).toFixed(2)}s`,
      '--dl': `-${(rnd(i, 5) * 9).toFixed(2)}s`,
      '--dx': `${Math.round((rnd(i, 6) - 0.5) * 26)}px`,
    })) as CSSProperties[];
  }, [set]);
  return (
    <span className={'av-fx av-fx-' + set} aria-hidden="true">
      {items.map((st, i) => (
        <i key={i} style={st} />
      ))}
      {set === 'moon' && <b className="av-shoot" />}
      {set === 'glass' && <b className="av-glint" />}
    </span>
  );
}

/**
 * Аватарка из листов 4×4 (фон и фигура — отдельные слои).
 * size должен быть кратен размеру спрайта (48 или 32), иначе пиксели поплывут.
 * live: 'full' — дыхание, свечение и эффекты; 'lite' — только дыхание и свечение; 'off' — статично.
 */
export function Avatar({
  a,
  size = 96,
  live = 'off',
  className = '',
}: {
  a: AvatarPick;
  size?: number;
  live?: 'off' | 'lite' | 'full';
  className?: string;
}) {
  const set = AVATAR_SHEETS[a.set] ? a.set : 'winter';
  const sheet = AVATAR_SHEETS[set];
  const idx = Math.max(0, AVATARS.findIndex((x) => x.id === a.id));
  const px = size / sheet.n;
  const pos = `${-(idx % 4) * size}px ${-Math.floor(idx / 4) * size}px`;
  const layer = (src: string): CSSProperties => ({
    backgroundImage: `url(${src})`,
    backgroundSize: `${size * 4}px ${size * 4}px`,
    backgroundPosition: pos,
  });
  const glow = live === 'off' ? [] : (AVATAR_GLOW[set]?.[AVATARS[idx]?.id] ?? []);
  return (
    <span
      className={'avatar ' + className}
      role="img"
      aria-label={AVATARS[idx]?.name}
      style={{ width: size, height: size, ['--px' as string]: `${px}px` } as CSSProperties}
    >
      <span className="av-layer" style={layer(sheet.bg)} />
      <span className={'av-layer av-fig' + (live === 'off' ? '' : ' live')} style={{ animationDelay: `-${(idx * 0.37).toFixed(2)}s` }}>
        <span className="av-layer" style={layer(sheet.fig)} />
        {glow.map(([x, y, c, k], i) => (
          <i
            key={i}
            className={'av-gl av-gl-' + k}
            style={{ left: x * px, top: y * px, color: c, animationDelay: `-${((x * 7 + y * 3) % 5) * 0.4}s` }}
          />
        ))}
      </span>
      {live === 'full' && <Fx set={set} />}
    </span>
  );
}

const TILE = 96;

export function AvatarPicker({ onClose }: { onClose: () => void }) {
  const { s, act } = useGame();
  const cur = s.avatar;
  const [tab, setTab] = useState(AVATAR_SETS.some((x) => x.id === cur?.set) ? cur!.set : 'moon');
  const [pick, setPick] = useState<AvatarPick | null>(cur ?? null);
  const [flash, setFlash] = useState(0);
  const info = pick ? AVATARS.find((x) => x.id === pick.id) : null;
  const setInfo = AVATAR_SETS.find((x) => x.id === pick?.set);

  const choose = (id: string) => {
    sfx.play('dlgNext');
    setPick({ set: tab, id });
    setFlash((n) => n + 1);
    act.setAvatar(tab, id);
  };

  // без выбранного героя в превью показываем первого из текущего стиля
  const preview = pick ?? { set: tab, id: AVATARS[0].id };

  return (
    <Sheet onClose={onClose} label="Облик героя" className="av-sheet">
      <div className="av-head">
        <div className={'av-stage' + (pick ? '' : ' av-empty')} key={flash}>
          <i className="av-glow" />
          <Avatar a={preview} size={144} live={pick ? 'full' : 'off'} className="av-big" />
          <i className="av-sheen" />
          <i className="av-corner tl" /><i className="av-corner tr" /><i className="av-corner bl" /><i className="av-corner br" />
        </div>
        <div className="av-text" key={'t' + flash}>
          <div className="av-name pf">{info ? info.name : 'Выбери облик'}</div>
          <div className="av-set">{info && setInfo ? setInfo.name : 'Облик можно менять в любой момент'}</div>
          <p className="av-blurb">{info ? info.blurb : 'Нажми на героя ниже. Он станет твоим лицом в профиле.'}</p>
        </div>
      </div>

      <div className="av-tabs" role="tablist" aria-label="Стили аватарок">
        {AVATAR_SETS.map((st) => (
          <button
            key={st.id}
            type="button"
            role="tab"
            aria-selected={tab === st.id}
            className={'av-tab' + (tab === st.id ? ' on' : '')}
            onClick={() => {
              if (tab !== st.id) {
                sfx.play('dlgSkip');
                setTab(st.id);
              }
            }}
          >
            {st.name}
            {pick?.set === st.id && <i className="av-dot" />}
          </button>
        ))}
      </div>
      <div className="av-sub">{AVATAR_SETS.find((x) => x.id === tab)?.blurb}</div>

      <div className="av-grid" key={tab} role="listbox" aria-label="Герои">
        {AVATARS.map((t, i) => {
          const on = pick?.set === tab && pick.id === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="option"
              aria-selected={on}
              aria-label={t.name}
              className={'av-tile' + (on ? ' on' : '')}
              style={{ animationDelay: `${i * 28}ms` }}
              onClick={() => choose(t.id)}
            >
              <Avatar a={{ set: tab, id: t.id }} size={TILE} live="lite" />
              {on && <i className="av-check pf">✓</i>}
              <span className="av-label">{t.name}</span>
            </button>
          );
        })}
      </div>

      <button type="button" className="btn btn-gold btn-block" style={{ marginTop: 14 }} onClick={onClose}>
        Готово
      </button>
    </Sheet>
  );
}
