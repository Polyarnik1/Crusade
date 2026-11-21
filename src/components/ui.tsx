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
  '......KK2334K443KK......',
  '.....K233335244443K.....',
  '....K23333352444443K....',
  '...K2355333524455543K...',
  '..K235533335244455543K..',
  '..K235333335244455543K..',
  '.K23553333352444455543K.',
  '.K23553333352444444443K.',
  '.K23553333352444444443K.',
  '.K23333333352444444443K.',
  '.KKKKKKKKKKKKKKKKKKKKKK.',
  'K5555555555555555555555K',
  'K35333333333334333333533',
  'K2222222222222222222222K',
  '.KKKKKKKKKKKKKKKKKKKKKK.',
  '..KBBBBBBBBBBBBBBBBBBK..',
  '..KBBBBBBBBBBBBBBBBBBK..',
  '...KBBBBBBBBBBBBBBBBK...',
  '..K322222225344444445K..',
  '..K3B2B2B225344B4B4B5K..',
  '.KKKB2B2B22534B4B4B5KKK.',
  'K1212B2B2B2534B4B4B1212K',
  '.K1213B2B2B534B4B4B212K.',
  '.K2121B2B2B53B4B4B2121K.',
  '.K12123322253444551212K.',
  'KK21212322253444512121KK',
  '555552123225344512145444',
  '333335555555444454422222',
  'KKKKK33333332222222KKKKK',
  '.....KKKKKKKKKKKKKK.....',
  '........................',
];
const HELM_COL: Record<string, string> = { K: '#14151c', B: '#06060a', '1': '#2a2c36', '2': '#4b4e5c', '3': '#767a8a', '4': '#a3a7b6', '5': '#d6d9e2' };

/** Закрытый шлем рыцаря: купол с гребнем, налобная полоса, смотровая щель, лицевая пластина, кольчуга. Без цвета. */
export function CrusaderHelm({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={(size * HELM.length) / 24} viewBox={`0 0 24 ${HELM.length}`} shapeRendering="crispEdges" aria-hidden="true" style={{ display: 'block' }}>
      {HELM.flatMap((row, y) =>
        [...row].map((c, x) => (c === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={HELM_COL[c]} />)),
      )}
    </svg>
  );
}
