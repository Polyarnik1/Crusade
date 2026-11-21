import { sfx, type SfxName } from '../audio/sfx';
import { useEffect, type ReactNode } from 'react';
import { Pixel } from '../art/Pixel';
import { useGame } from '../game/store';

const CUR = { X: 'currentColor', o: 'rgba(0,0,0,0)' };

export const ICONS: Record<string, string[]> = {
  map: ['............', '.XXXXXXXXXX.', '.X..X..X..X.', '.X..X..X..X.', '.X..X..X..X.', '.X..X..X..X.', '.X..X..X..X.', '.X..X..X..X.', '.X..X..X..X.', '.XXXXXXXXXX.', '............'],
  quests: ['............', '.XX.XXXXXXX.', '.XX.XXXXXXX.', '............', '.XX.XXXXXXX.', '.XX.XXXXXXX.', '............', '.XX.XXXXXXX.', '.XX.XXXXXXX.', '............'],
  regalia: ['............', '..XXXXXXXX..', '..XXX..XXX..', '..XXX..XXX..', '...XX..XX...', '...XXXXXX...', '....XXXX....', '.....XX.....', '....XXXX....', '...XXXXXX...'],
  scroll: ['............', '.XXXXXXXXX..', '.X.......XX.', '.X.XXXXX.X..', '.X.......X..', '.X.XXXXX.X..', '.X.......X..', '.X.XXX...X..', '.X.......X..', '.XXXXXXXXX..'],
  hero: ['...XXXXXX...', '..XXXXXXXX..', '..XXXXXXXX..', '..X......X..', '..XXXXXXXX..', '..XXX..XXX..', '..XXX..XXX..', '...XX..XX...', '............', '.XXXXXXXXXX.', 'XXXXXXXXXXXX'],
  gear: ['.....XX.....', '..X.XXXX.X..', '.XXXXXXXXXX.', '..XXX..XXX..', '.XXX....XXX.', 'XXX......XXX', '.XXX....XXX.', '..XXX..XXX..', '.XXXXXXXXXX.', '..X.XXXX.X..', '.....XX.....'],
  play: ['XX....', 'XXXX..', 'XXXXXX', 'XXXX..', 'XX....'],
  pause: ['XX.XX', 'XX.XX', 'XX.XX', 'XX.XX', 'XX.XX'],
  locate: ['....X....', '....X....', '..XXXXX..', '.X.....X.', 'XXX.X.XXX', '.X.....X.', '..XXXXX..', '....X....', '....X....'],
  back: ['...X', '..XX', '.XXX', 'XXXX', '.XXX', '..XX', '...X'],
  check: ['.......X', '......XX', 'X....XX.', 'XX..XX..', '.XXXX...', '..XX....'],
  lock: ['.XXX.', 'X...X', 'X...X', 'XXXXX', 'XX.XX', 'XXXXX'],
  flame: ['...X....', '...XX...', '..XXX...', '..XXXX..', '.XXXXXX.', '.XX.XXX.', 'XX...XXX', 'XX...XXX', '.XX.XXX.', '..XXXX..'],
  close: ['X...X', '.X.X.', '..X..', '.X.X.', 'X...X'],
  plus: ['..X..', '..X..', 'XXXXX', '..X..', '..X..'],
};

export function Icon({ name, size = 22 }: { name: keyof typeof ICONS | string; size?: number }) {
  const g = ICONS[name] ?? ICONS.map;
  return <Pixel grid={g} palette={CUR} size={size} />;
}

export function Bar({ value, color, dark }: { value: number; color?: string; dark?: string }) {
  const style = { '--c': color, '--cd': dark } as React.CSSProperties;
  return (
    <div className="bar" style={style} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}>
      <i style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className="switch" onClick={() => onChange(!on)}>
      <span />
    </button>
  );
}

export function Sheet({
  children,
  onClose,
  center,
  label,
}: {
  children: ReactNode;
  onClose: () => void;
  center?: boolean;
  label: string;
}) {
  useEffect(() => {
    if (!center) sfx.play('open');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="backdrop" onClick={onClose}>
      <div
        className={'sheet' + (center ? ' center' : '')}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function Toasts() {
  const { s, act } = useGame();
  return (
    <div className="toasts" aria-live="polite">
      {s.ui.toasts.map((t) => (
        <ToastItem key={t.id} id={t.id} title={t.title} text={t.text} sound={t.sound} onDone={act.dismissToast} />
      ))}
    </div>
  );
}

function ToastItem({ id, title, text, sound, onDone }: { id: string; title: string; text?: string; sound?: SfxName; onDone: (id: string) => void }) {
  useEffect(() => {
    sfx.play(sound ?? 'toast');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  useEffect(() => {
    const h = window.setTimeout(() => onDone(id), 2800);
    return () => window.clearTimeout(h);
  }, [id, onDone]);
  return (
    <div className="toast" onClick={() => onDone(id)}>
      <b>{title}</b>
      {text && <span>{text}</span>}
    </div>
  );
}

export type Tab = 'map' | 'quests' | 'regalia' | 'chronicle' | 'hero';

const TABS: { id: Tab; name: string; icon: string }[] = [
  { id: 'map', name: 'Карта', icon: 'map' },
  { id: 'quests', name: 'Задания', icon: 'quests' },
  { id: 'regalia', name: 'Регалии', icon: 'regalia' },
  { id: 'chronicle', name: 'Летопись', icon: 'scroll' },
  { id: 'hero', name: 'Герой', icon: 'hero' },
];

export function TabBar({ tab, onTab, dots }: { tab: Tab; onTab: (t: Tab) => void; dots: Partial<Record<Tab, boolean>> }) {
  return (
    <nav className="tabbar" aria-label="Разделы">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          className={'tab' + (tab === t.id ? ' on' : '')}
          aria-current={tab === t.id ? 'page' : undefined}
          onClick={() => {
            if (t.id !== tab) sfx.play('tap');
            onTab(t.id);
          }}
        >
          <Icon name={t.icon} size={24} />
          {t.name}
          {dots[t.id] && <span className="dot" aria-label="есть новое" />}
        </button>
      ))}
    </nav>
  );
}

const HELM = [
  '.....KK77777777777777777KK......',
  '...KK766767676666555544331KK....',
  '..K7566666666656555544443321K...',
  '..K7667676767666655554444331K...',
  '..K7665656565655554544332321K...',
  '..K7777877777777333333338333K...',
  '..K5555155555555222222221222K...',
  '..K7656666667544332154433231K...',
  '..K766565656751KK12144332321K...',
  '..K765666666751KK12144433231K...',
  '..K766565856851KK12844332321K...',
  '..K765666685151KK12144433231K...',
  '..K766565656751KK12148332321K...',
  '..K765656665751KK12184433231K...',
  '..K766565656751KK12144332321K...',
  '..K767777777771KK17777777771K...',
  '..K7655833333313111111118551K...',
  '..K76561KKKKKK1KK1KKKKKK1221K...',
  '..K76556KKKKKK1KK1KKKKKK2221K...',
  '..K76565KKKKKK1KK1KKKKKK3221K...',
  '..K7655688888818515555552221K...',
  '..K763383333331KK13333338331K...',
  '..K762212222221KK12222221221K...',
  '..K76565K5K5751KK1214K4K3221K...',
  '..K765565K56851KK12834K32221K...',
  '..K76565K5K5151KK1214K4K3221K...',
  '..K765565K56751KK12134K32221K...',
  '..K765656565751KK12143433221K...',
  '...K77777777754433213333333K....',
  '....K555585555552222228222K.....',
  '.....K7651555555444433121K......',
  '......K76565655554433231K.......',
  '.......K765555554433221K........',
  '........K7656555544331K.........',
  '.........K76555544331K..........',
  '..........KKKKKKKKKKK...........',
];
const HELM_COL: Record<string, string> = { K: '#0e0f16', '1': '#1e2130', '2': '#363c54', '3': '#565f80', '4': '#7a86aa', '5': '#9eaacc', '6': '#bac4e0', '7': '#d6def0', '8': '#f4f7ff' };

/** Закрытый топфхельм с крестообразной прорезью: усиливающие полосы, заклёпки, отверстия для дыхания. */
export function CrusaderHelm({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={(size * HELM.length) / 32} viewBox={`0 0 32 ${HELM.length}`} shapeRendering="crispEdges" aria-hidden="true" style={{ display: 'block' }}>
      {HELM.flatMap((row, y) =>
        [...row].map((c, x) => (c === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={HELM_COL[c]} />)),
      )}
    </svg>
  );
}
