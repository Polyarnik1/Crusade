import { useMemo, useState } from 'react';
import { AVATAR_SHEETS } from '../art/avatars.gen';
import { sfx } from '../audio/sfx';
import { AVATARS, AVATAR_SETS, type AvatarPick } from '../game/avatars';
import { useGame } from '../game/store';
import { Sheet } from './ui';

/** Аватарка из листа 4×4. size должен быть кратен размеру спрайта (48 или 32), иначе пиксели поплывут. */
export function Avatar({ a, size = 96, className = '' }: { a: AvatarPick; size?: number; className?: string }) {
  const sheet = AVATAR_SHEETS[a.set];
  const idx = Math.max(0, AVATARS.findIndex((x) => x.id === a.id));
  if (!sheet) return null;
  return (
    <span
      className={'avatar ' + className}
      role="img"
      aria-label={AVATARS[idx]?.name}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${sheet.src})`,
        backgroundSize: `${size * 4}px ${size * 4}px`,
        backgroundPosition: `${-(idx % 4) * size}px ${-Math.floor(idx / 4) * size}px`,
      }}
    />
  );
}

const TILE = 96;

export function AvatarPicker({ onClose }: { onClose: () => void }) {
  const { s, act } = useGame();
  const cur = s.avatar;
  const [tab, setTab] = useState(cur?.set ?? 'moon');
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

  const tiles = useMemo(() => AVATARS, []);

  return (
    <Sheet onClose={onClose} label="Облик героя" className="av-sheet">
      <div className="av-head">
        <div className={'av-stage' + (pick ? '' : ' av-empty')} key={flash}>
          <i className="av-glow" />
          <Avatar a={preview} size={144} className="av-big" />
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
        {tiles.map((t, i) => {
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
              <Avatar a={{ set: tab, id: t.id }} size={TILE} />
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
