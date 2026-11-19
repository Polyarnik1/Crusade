import { useEffect, useState } from 'react';
import { sfx } from '../audio/sfx';
import { Pixel } from '../art/Pixel';
import { REGALIA_ART } from '../art/arts';
import { SceneArt, SceneThumb, sceneHasSubject } from '../art/SceneArt';
import { Bar, Icon, Sheet } from '../components/ui';
import { RARITY, REGALIA, regaliaCount, type Regalia } from '../game/achievements';
import { nextUnlock } from '../game/cosmetics';
import { useGame } from '../game/store';

type Filter = 'all' | 'deed' | 'curio';

export function RegaliaScreen() {
  const { s, act } = useGame();
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<Regalia | null>(null);
  const count = regaliaCount(s);
  const next = nextUnlock(count);
  const list = REGALIA.filter((r) => filter === 'all' || r.kind === filter).sort(
    (a, b) => Number(!!s.unlocked[b.id]) - Number(!!s.unlocked[a.id]),
  );

  return (
    <div className="screen">
      <div className="screen-hero">
        <SceneArt id="regalia" header />
        <h1 className="screen-title">Регалии</h1>
        <div className="hero-right pf muted" style={{ fontSize: 24 }}>
          <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{count}</span> / {REGALIA.length}
        </div>
      </div>

      {next !== null && (
        <div className="panel dim" style={{ marginTop: 14, padding: '10px 12px' }}>
          <div className="row between" style={{ fontSize: 13 }}>
            <span>Новые цвета, башни и знамёна</span>
            <span className="muted">
              {count} / {next}
            </span>
          </div>
          <div style={{ marginTop: 8 }}>
            <Bar value={count / next} />
          </div>
        </div>
      )}

      <div className="chips" style={{ marginTop: 14 }}>
        {(
          [
            ['all', 'Все'],
            ['deed', 'Подвиги'],
            ['curio', 'Курьёзы'],
          ] as [Filter, string][]
        ).map(([id, name]) => (
          <button key={id} type="button" className={'chip' + (filter === id ? ' on' : '')} onClick={() => setFilter(id)}>
            {name}
          </button>
        ))}
      </div>

      <div className="grid2" style={{ marginTop: 14 }}>
        {list.map((r) => {
          const got = !!s.unlocked[r.id];
          const fresh = got && !s.seen[r.id];
          const rar = RARITY[r.rarity];
          return (
            <button
              key={r.id}
              type="button"
              className={'panel regal' + (got ? '' : ' locked dim')}
              style={{ '--rc': got ? rar.color : '#4a4858' } as React.CSSProperties}
              onClick={() => {
                setOpen(r);
                if (fresh) act.markSeen(r.id);
              }}
            >
              <SceneThumb id={r.id} dim={!got} />
              {fresh && <span className="new">новая</span>}
              <div className="medal">
                <Pixel grid={REGALIA_ART[r.id]} size={r.id === 'couch' ? 40 : 36} gray={!got} />
              </div>
              <div className="pf" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.1, marginTop: 10, color: got ? 'var(--text)' : 'var(--muted)' }}>
                {r.name}
              </div>
              <div className="muted" style={{ fontSize: 12, lineHeight: 1.4, marginTop: 4 }}>
                {r.how}
              </div>
              <div className="pf" style={{ fontSize: 16, marginTop: 8, color: got ? rar.color : 'var(--muted)' }}>
                {got ? 'Получено' : r.soon ? 'Скоро' : 'Закрыто'} · {r.kind === 'curio' ? 'курьёз' : rar.name}
              </div>
            </button>
          );
        })}
      </div>

      {open && <RegaliaSheet r={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

export function RegaliaSheet({ r, onClose, fresh }: { r: Regalia; onClose: () => void; fresh?: boolean }) {
  const { s } = useGame();
  useEffect(() => {
    if (fresh) sfx.play('regalia');
  }, [fresh, r.id]);
  const got = s.unlocked[r.id];
  const rar = RARITY[r.rarity];
  const prog = r.progress?.(s);
  return (
    <Sheet onClose={onClose} label={`Регалия: ${r.name}`} center={fresh}>
      <div className="sheet-scene" style={{ '--rc': got ? rar.color : '#4a4858' } as React.CSSProperties}>
        <SceneArt id={r.id} dim={!got} />
        {fresh && <div className="fresh">Новая регалия!</div>}
        {!got && (
          <div className="lock" aria-label="Закрыто">
            <Icon name="lock" size={20} />
          </div>
        )}
        {!sceneHasSubject(r.id) && (
          <div className="medal">
            <Pixel grid={REGALIA_ART[r.id]} size={60} gray={!got} title={r.name} />
          </div>
        )}
      </div>
      <div className="row between" style={{ marginTop: sceneHasSubject(r.id) ? 16 : 46, alignItems: 'flex-start' }}>
        <div>
          <div className="pf" style={{ fontSize: 32, fontWeight: 600, lineHeight: 1.05 }}>{r.name}</div>
          <div className="pf" style={{ fontSize: 16, marginTop: 6, color: got ? rar.color : 'var(--muted)' }}>
            {r.kind === 'curio' ? 'Курьёз' : 'Подвиг'} · {rar.name}
          </div>
        </div>
      </div>
      <blockquote className="quote" style={{ marginTop: 16, borderLeftColor: got ? rar.color : '#4a4858' }}>
        «{r.quote}»
      </blockquote>
      <div style={{ marginTop: 14, fontSize: 14, lineHeight: 1.5 }}>
        <span className="muted">Как получить: </span>
        {r.how}.
      </div>
      {got ? (
        <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
          Получено {new Date(got).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      ) : prog ? (
        <div style={{ marginTop: 10 }}>
          <Bar value={prog[0] / prog[1]} color={rar.color} />
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            {prog[0]} / {prog[1]}
          </div>
        </div>
      ) : r.soon ? (
        <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
          Появится, когда подключим приём донатов.
        </div>
      ) : null}
      <button type="button" className={'btn btn-block ' + (fresh ? 'btn-gold' : '')} style={{ marginTop: 18 }} onClick={onClose}>
        {fresh ? 'Слава!' : 'Закрыть'}
      </button>
    </Sheet>
  );
}
