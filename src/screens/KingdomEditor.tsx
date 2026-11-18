import { useState } from 'react';
import { Banner, Tower } from '../art/heraldry';
import { Icon, Sheet } from '../components/ui';
import { regaliaCount } from '../game/achievements';
import { COLORS, DEFAULT_BANNER, FORMS, PATTERNS, SHAPES, SYMBOLS, TOWERS, isOpen, type BannerDef, type Unlockable } from '../game/cosmetics';
import { useGame } from '../game/store';

const NAME_IDEAS = ['Северный Предел', 'Серая Застава', 'Медвежий Угол', 'Тихая Гавань', 'Ледяная Марка', 'Дворовый Форт'];

/** Основание королевства (после первого похода) и его последующая перестройка. */
export function KingdomEditor() {
  const { s, act } = useGame();
  const k = s.kingdom;
  const reg = regaliaCount(s);
  const [name, setName] = useState(k?.name ?? '');
  const [form, setForm] = useState(k?.form ?? 'principality');
  const [tower, setTower] = useState(k?.tower ?? 'watch');
  const [banner, setBanner] = useState<BannerDef>(k?.banner ?? DEFAULT_BANNER);
  const set = (p: Partial<BannerDef>) => setBanner((b) => ({ ...b, ...p }));
  const formDef = FORMS.find((f) => f.id === form)!;
  const ok = name.trim().length >= 2;

  const lockedNote = (i: Unlockable) => (isOpen(i, reg) ? undefined : `откроется за ${i.need} регалий`);

  return (
    <Sheet onClose={act.closeFounding} label={k ? 'Перестройка королевства' : 'Основание королевства'}>
      <div className="pf" style={{ fontSize: 32, fontWeight: 600, lineHeight: 1.05 }}>
        {k ? 'Перестроить королевство' : 'Основать королевство'}
      </div>
      {!k && (
        <p className="muted" style={{ fontSize: 14, lineHeight: 1.45, margin: '8px 0 0' }}>
          Первый поход позади. Пора дать своим землям имя, знамя и башни, чтобы соседи знали, чьё это.
        </p>
      )}

      <div className="panel dim row" style={{ marginTop: 14, gap: 14 }}>
        <Banner banner={banner} size={72} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="label">{formDef.name}</div>
          <div className="pf" style={{ fontSize: 24, fontWeight: 600, marginTop: 4, overflowWrap: 'anywhere' }}>{name.trim() || 'Без имени'}</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
            {formDef.ruler} {s.hero.name}
          </div>
        </div>
        <Tower tower={tower} color={banner.color} size={44} />
      </div>

      <Section title="Название">
        <input className="input" value={name} maxLength={32} placeholder="Например: Северный Предел" onChange={(e) => setName(e.target.value)} aria-label="Название государства" />
        <div className="chips" style={{ marginTop: 8 }}>
          {NAME_IDEAS.slice(0, 3).map((n) => (
            <button key={n} type="button" className="chip" onClick={() => setName(n)}>
              {n}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Форма правления">
        <div className="chips">
          {FORMS.map((f) => {
            const open = isOpen(f, reg);
            return (
              <button
                key={f.id}
                type="button"
                className={'chip' + (form === f.id ? ' on' : '') + (open ? '' : ' locked')}
                disabled={!open}
                title={lockedNote(f)}
                onClick={() => setForm(f.id)}
              >
                {!open && <Icon name="lock" size={10} />}
                {f.name}
                {!open && <small style={{ fontFamily: 'var(--sans)', fontSize: 11 }}>· {f.need}</small>}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Цвет королевства">
        <Swatches value={banner.color} reg={reg} onPick={(id) => set({ color: id })} />
        <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
          Этим цветом подсветятся твои земли и у соседей на карте.
        </div>
      </Section>

      <Section title="Знамя">
        <Picks items={SHAPES} value={banner.shape} reg={reg} onPick={(id) => set({ shape: id })} render={(i) => <Banner banner={{ ...banner, shape: i.id }} size={30} />} />
        <div style={{ height: 10 }} />
        <Picks items={PATTERNS} value={banner.pattern} reg={reg} onPick={(id) => set({ pattern: id })} render={(i) => <Banner banner={{ ...banner, pattern: i.id }} size={30} />} />
        <div style={{ height: 10 }} />
        <Picks items={SYMBOLS} value={banner.symbol} reg={reg} onPick={(id) => set({ symbol: id })} render={(i) => <Banner banner={{ ...banner, symbol: i.id }} size={30} />} />
        <div className="label" style={{ marginTop: 12 }}>
          Второй цвет
        </div>
        <div style={{ marginTop: 8 }}>
          <Swatches value={banner.second} reg={reg} onPick={(id) => set({ second: id })} />
        </div>
      </Section>

      <Section title="Башни на карте">
        <Picks items={TOWERS} value={tower} reg={reg} onPick={setTower} render={(i) => <Tower tower={i.id} color={banner.color} size={32} />} />
      </Section>

      {!k && !s.land && (
        <div className="muted" style={{ marginTop: 16, fontSize: 13 }}>
          Вокруг места, где ты стоишь, сразу появится стартовая столица в 1 га. Дальше расширяй владения походами по замкнутым петлям.
        </div>
      )}
      <button
        type="button"
        className="btn btn-gold btn-big"
        style={{ marginTop: 20 }}
        disabled={!ok}
        onClick={() => act.saveKingdom({ name: name.trim(), form, tower, banner })}
      >
        {k ? 'Сохранить' : 'Основать'}
      </button>
      {!k && (
        <button type="button" className="btn btn-block" style={{ marginTop: 10 }} onClick={act.closeFounding}>
          Позже
        </button>
      )}
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 18 }}>
      <div className="label" style={{ marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </section>
  );
}

export function Swatches({ value, reg, onPick }: { value: string; reg: number; onPick: (id: string) => void }) {
  return (
    <div className="chips">
      {COLORS.map((c) => {
        const open = isOpen(c, reg);
        return (
          <button
            key={c.id}
            type="button"
            className={'swatch' + (value === c.id ? ' on' : '') + (open ? '' : ' locked')}
            style={{ background: c.hex }}
            disabled={!open}
            aria-label={open ? c.name : `${c.name} — откроется за ${c.need} регалий`}
            aria-pressed={value === c.id}
            title={open ? c.name : `${c.name}: ${c.need} регалий`}
            onClick={() => onPick(c.id)}
          />
        );
      })}
    </div>
  );
}

export function Picks({
  items,
  value,
  reg,
  onPick,
  render,
}: {
  items: Unlockable[];
  value: string;
  reg: number;
  onPick: (id: string) => void;
  render: (i: Unlockable) => React.ReactNode;
}) {
  return (
    <div className="grid3">
      {items.map((i) => {
        const open = isOpen(i, reg);
        return (
          <button
            key={i.id}
            type="button"
            className={'pick' + (value === i.id ? ' on' : '') + (open ? '' : ' locked')}
            disabled={!open}
            aria-pressed={value === i.id}
            onClick={() => onPick(i.id)}
          >
            {render(i)}
            <span>{i.name}</span>
            {!open && (
              <small className="row" style={{ gap: 4 }}>
                <Icon name="lock" size={8} /> {i.need} регалий
              </small>
            )}
          </button>
        );
      })}
    </div>
  );
}
