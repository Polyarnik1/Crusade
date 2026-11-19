import { SceneArt } from '../art/SceneArt';
import { useState } from 'react';
import { Banner, Tower } from '../art/heraldry';
import { Pixel } from '../art/Pixel';
import { REGALIA_ART } from '../art/arts';
import { Icon } from '../components/ui';
import { REGALIA, regaliaCount, streak } from '../game/achievements';
import { FORMS, colorHex } from '../game/cosmetics';
import { formatArea, formatKm } from '../game/geo';
import { titleOf } from '../game/levels';
import { isExiled, useGame } from '../game/store';
import type { Hero } from '../game/types';

export function HeroScreen({ onSettings }: { onSettings: () => void }) {
  const { s, act } = useGame();
  const t = titleOf(s.glory);
  const k = s.kingdom;
  const form = FORMS.find((f) => f.id === k?.form);
  const showcase = Object.entries(s.unlocked)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([id]) => REGALIA.find((r) => r.id === id)!)
    .filter(Boolean);

  return (
    <div className="screen">
      <div className="screen-hero">
        <SceneArt id="hero" header />
        <div className="label" style={{ position: 'absolute', left: 16, top: 16, textShadow: '0 2px 0 #000' }}>
          Герой
        </div>
        <button type="button" className="btn btn-icon" style={{ position: 'absolute', right: 12, top: 10 }} onClick={onSettings} aria-label="Настройки">
          <Icon name="gear" size={22} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: -64, position: 'relative' }}>
        <div style={{ padding: 10, background: 'var(--panel)', border: '3px solid var(--line)', boxShadow: '0 4px 0 #000a' }}>
          {k ? <Banner banner={k.banner} size={84} /> : <Pixel grid={REGALIA_ART.couch} size={96} />}
        </div>
        <NameField value={s.hero.name} onSave={(name) => act.setHero({ name })} />
        <div className="muted" style={{ marginTop: 2, fontSize: 14 }}>
          Ур. {t.level} · {t.name}
        </div>
        {isExiled(s) && (
          <div className="panel" style={{ marginTop: 10, padding: '8px 12px', fontSize: 13 }}>
            {form?.ruler ?? 'Правитель'} в изгнании: своих земель нет. Захвати любой клочок, чтобы вернуть владения.
          </div>
        )}
      </div>

      <div className="grid3" style={{ marginTop: 16 }}>
        <div className="stat">
          <b style={{ color: 'var(--gold)', fontSize: 16 }}>{formatArea(s.totalArea)}</b>
          <span>владений</span>
        </div>
        <div className="stat">
          <b style={{ color: 'var(--gold)' }}>{streak(s)}</b>
          <span>дней подряд</span>
        </div>
        <div className="stat">
          <b style={{ color: 'var(--gold)' }}>{regaliaCount(s)}</b>
          <span>регалий</span>
        </div>
      </div>

      {k ? (
        <div className="panel" style={{ marginTop: 12, borderColor: colorHex(k.banner.color) }}>
          <div className="row" style={{ gap: 12 }}>
            <Tower tower={k.tower} color={k.banner.color} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="label">{form?.name}</div>
              <div className="h2" style={{ fontSize: 24, marginTop: 2, overflowWrap: 'anywhere' }}>{k.name}</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                Основано {new Date(k.foundedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
          <button type="button" className="btn btn-block btn-sm" style={{ marginTop: 12 }} onClick={act.openFounding}>
            Перестроить королевство
          </button>
        </div>
      ) : (
        <div className="panel gold" style={{ marginTop: 12 }}>
          <div className="h2">Королевства пока нет</div>
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.45, margin: '6px 0 12px' }}>
            Выйди в первый поход — после него можно основать своё княжество, королевство или вольный город. Или сделай это прямо сейчас.
          </p>
          <button type="button" className="btn btn-gold btn-block" onClick={act.openFounding}>
            Основать
          </button>
        </div>
      )}

      <div className="panel" style={{ marginTop: 12 }}>
        <label className="label" htmlFor="about">
          О себе
        </label>
        <textarea
          id="about"
          className="input"
          style={{ marginTop: 8 }}
          placeholder="Пара слов для соседей: кто ты и зачем ходишь"
          defaultValue={s.hero.about}
          maxLength={280}
          onBlur={(e) => act.setHero({ about: e.target.value })}
        />
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        <div className="label">Любимое</div>
        <Favorites title="Книги" field="books" />
        <Favorites title="Фильмы и сериалы" field="films" />
        <Favorites title="Игры" field="games" />
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        <div className="label">Витрина регалий</div>
        {showcase.length ? (
          <div className="row" style={{ marginTop: 10, gap: 10, flexWrap: 'wrap' }}>
            {showcase.map((r) => (
              <div key={r.id} title={r.name} style={{ padding: 6, background: 'var(--bg)', border: '3px solid var(--line)' }}>
                <Pixel grid={REGALIA_ART[r.id]} size={44} title={r.name} />
              </div>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ fontSize: 14, margin: '8px 0 0' }}>
            Пока пусто. Первая регалия ближе, чем кажется.
          </p>
        )}
      </div>

      <div className="muted" style={{ fontSize: 12, textAlign: 'center', marginTop: 16 }}>
        Пройдено {formatKm(s.totalDistance)} км · походов: {s.walks.length}
      </div>
    </div>
  );
}

function NameField({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState(value);
  if (!edit)
    return (
      <button type="button" className="pf" onClick={() => setEdit(true)} style={{ background: 'none', border: 0, fontSize: 32, fontWeight: 600, marginTop: 12, minHeight: 44 }}>
        {value} <span className="muted" style={{ fontSize: 14 }}>✎</span>
      </button>
    );
  return (
    <form
      className="row"
      style={{ marginTop: 12, width: '100%' }}
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim()) onSave(v.trim().slice(0, 24));
        setEdit(false);
      }}
    >
      <input className="input" autoFocus value={v} maxLength={24} onChange={(e) => setV(e.target.value)} aria-label="Имя героя" />
      <button type="submit" className="btn btn-gold btn-sm">
        Ок
      </button>
    </form>
  );
}

function Favorites({ title, field }: { title: string; field: keyof Pick<Hero, 'books' | 'films' | 'games'> }) {
  const { s, act } = useGame();
  const [v, setV] = useState('');
  const list = s.hero[field];
  return (
    <div style={{ marginTop: 12 }}>
      <div className="muted" style={{ fontSize: 12 }}>
        {title}
      </div>
      <div className="chips" style={{ marginTop: 6 }}>
        {list.map((x, i) => (
          <button
            key={x + i}
            type="button"
            className="chip"
            aria-label={`Убрать: ${x}`}
            onClick={() => act.setHero({ [field]: list.filter((_, j) => j !== i) })}
            style={{ fontFamily: 'var(--sans)', fontSize: 13 }}
          >
            {x} <Icon name="close" size={8} />
          </button>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const t = v.trim();
            if (t && list.length < 8) act.setHero({ [field]: [...list, t.slice(0, 40)] });
            setV('');
          }}
        >
          <input className="input" style={{ minHeight: 44, width: 150, padding: '6px 10px', borderWidth: 2 }} value={v} onChange={(e) => setV(e.target.value)} placeholder="+ добавить" aria-label={`Добавить: ${title}`} />
        </form>
      </div>
    </div>
  );
}
