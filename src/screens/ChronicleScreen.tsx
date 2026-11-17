import { Icon } from '../components/ui';
import { formatKm } from '../game/geo';
import { useGame } from '../game/store';
import type { ChronicleEntry } from '../game/types';

const KIND_ICON: Record<ChronicleEntry['kind'], { icon: string; color: string }> = {
  capture: { icon: 'map', color: 'var(--gold)' },
  regalia: { icon: 'regalia', color: '#B58CFF' },
  title: { icon: 'hero', color: 'var(--gold)' },
  walk: { icon: 'play', color: '#4FB36A' },
  kingdom: { icon: 'regalia', color: 'var(--gold)' },
  border: { icon: 'map', color: 'var(--red)' },
  quest: { icon: 'quests', color: 'var(--blue)' },
};

function when(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === today.toDateString()) return `сегодня, ${time}`;
  if (d.toDateString() === y.toDateString()) return `вчера, ${time}`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) + `, ${time}`;
}

export function ChronicleScreen() {
  const { s } = useGame();
  const totalKm = formatKm(s.totalDistance);
  return (
    <div className="screen">
      <h1 className="screen-title">Летопись</h1>
      <p className="muted" style={{ margin: '8px 0 0', lineHeight: 1.45, fontSize: 14 }}>
        Здесь записано всё, что ты совершил. Скоро рядом откроется таверна — лента, где можно хвастаться и щитпостить.
      </p>

      <div className="grid3" style={{ marginTop: 16 }}>
        <div className="stat">
          <b>{s.walks.length}</b>
          <span>походов</span>
        </div>
        <div className="stat">
          <b>{totalKm}</b>
          <span>км всего</span>
        </div>
        <div className="stat">
          <b>{s.captures}</b>
          <span>уделов</span>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 14, paddingTop: 6, paddingBottom: 6 }}>
        {s.chronicle.length === 0 ? (
          <p className="muted" style={{ textAlign: 'center', padding: '24px 0', margin: 0 }}>
            Летопись пока пуста. Выйди в первый поход.
          </p>
        ) : (
          s.chronicle.slice(0, 120).map((c) => {
            const k = KIND_ICON[c.kind];
            return (
              <div key={c.id} className="chron">
                <div className="ico" style={{ color: k.color }}>
                  <Icon name={k.icon} size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, lineHeight: 1.4 }}>{c.text}</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                    {when(c.ts)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
