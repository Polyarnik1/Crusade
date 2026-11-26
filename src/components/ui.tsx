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
  className = '',
}: {
  children: ReactNode;
  onClose: () => void;
  center?: boolean;
  label: string;
  className?: string;
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
        className={'sheet' + (center ? ' center' : '') + (className ? ' ' + className : '')}
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
  '....KKKKKKKKK....',
  '...KKwwwwwwwKK...',
  '..KKwwwwwwwwwKK..',
  '.KKwwwwwKwwwwwKK.',
  '.KwwwwwwKwwwwwlK.',
  'KKwwwwwKKKwwwwwKK',
  '.KwKKKKKKKKKKKlK.',
  '.KwKKKKKKKKKKKlK.',
  'KKwwwKKKKKKKwwwKK',
  'KwwwKwwKKKwwKwwlK',
  '.KwKwKwKKKwKwKlK.',
  '.KwwKwwKKKwwKwlK.',
  '.KwKwKwKKKwKwKlK.',
  '..KwKwwKKKwwKlK..',
  '..KwwKwKKKwKwlK..',
  '..KKwwwKKKwwwKK..',
  '....KKwwwwwKK....',
  '.....KKwwwKK.....',
  '......KKKKK......',
];
const HELM_COL: Record<string, string> = { K: '#14151c', w: '#ffffff', l: '#cdd1dd', m: '#8a90a4' };

/** Шлем рыцаря с кнопки «В поход»: пиксель-арт автора, белый корпус с чёрным контуром. */
export function CrusaderHelm({ size = 40 }: { size?: number }) {
  return (
    <span className="helm-glow" style={{ width: size }}>
    <svg width={size} height={(size * HELM.length) / 17} viewBox={`0 0 17 ${HELM.length}`} shapeRendering="crispEdges" aria-hidden="true" style={{ display: 'block' }}>
      {HELM.flatMap((row, y) =>
        [...row].map((c, x) => (c === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={HELM_COL[c]} />)),
      )}
    </svg>
    </span>
  );
}
