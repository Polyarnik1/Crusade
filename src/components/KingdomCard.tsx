import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { REGALIA_ART } from '../art/arts';
import { Banner, Tower } from '../art/heraldry';
import { Pixel } from '../art/Pixel';
import { sfx } from '../audio/sfx';
import { dayKey, REGALIA, regaliaCount } from '../game/achievements';
import { plural } from '../game/benedict';
import { CLASSES, FORMS, colorHex } from '../game/cosmetics';
import { formatArea, landArea } from '../game/geo';
import { titleOf } from '../game/levels';
import { profileOf, type NeighborProfile } from '../game/neighbors';
import { useGame } from '../game/store';
import type { GameState, Neighbor } from '../game/types';
import { Avatar } from './Avatar';

// Карточка чужого королевства: висит над картой отдельно от нижней кромки экрана.
// Внутри — знамя, правитель, три шкалы и переход в профиль правителя.

const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];

const fmtNum = (n: number) => Math.round(n).toLocaleString('ru-RU');
const fmtKm = (km: number) => km.toLocaleString('ru-RU', { maximumFractionDigits: 1, minimumFractionDigits: km < 100 ? 1 : 0 });

/** Мои вёрсты за текущий месяц (по дневным записям). */
function myKmMonth(s: GameState): number {
  const pre = dayKey().slice(0, 7);
  let m = 0;
  for (const [k, d] of Object.entries(s.days)) if (k.startsWith(pre)) m += d.walkedM;
  return m / 1000;
}

function niceMax(v: number) {
  for (const x of [25, 50, 100, 150, 200, 300, 500, 1000]) if (v <= x) return x;
  return Math.ceil(v / 500) * 500;
}

export function Gauge({
  icon,
  label,
  value,
  frac,
  tone,
  me,
  meLabel,
  delay,
  foot,
  compact,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  frac: number;
  tone: 'gold' | 'violet' | 'ice';
  me?: number;
  meLabel?: string;
  delay: number;
  foot?: string;
  compact?: boolean;
}) {
  const w = Math.max(0, Math.min(1, frac));
  return (
    <div className={'gauge gauge-' + tone + (compact ? ' gauge-c' : '')} style={{ '--w': `${w * 100}%`, '--dl': `${delay}s` } as CSSProperties}>
      <div className="gauge-top">
        <span className="gauge-icon" aria-hidden="true">{icon}</span>
        <span className="gauge-label">{label}</span>
        <span className="gauge-value">{value}</span>
      </div>
      <div className="gauge-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(w * 100)}>
        <i className="gauge-fill">
          <b className="gauge-cap" />
        </i>
        {me !== undefined && <i className="gauge-me" style={{ left: `${Math.max(0, Math.min(1, me)) * 100}%` }} />}
      </div>
      {!compact && (meLabel || foot) && (
        <div className="gauge-foot">
          {meLabel && (
            <span className="gauge-me-l">
              <i /> {meLabel}
            </span>
          )}
          {foot && <span className="gauge-scale">{foot}</span>}
        </div>
      )}
    </div>
  );
}

/** Маленькие пиксельные значки для шкал. */
const ICO = {
  crown: ['..y.y.y..', '..YyYyY..', '.YYYYYYY.', '.YMYMYMY.', '.YYYYYYY.'],
  cup: ['.YYYYYYY.', 'YyYYYYYyY', 'Y.YMYYY.Y', '.YYYYYYY.', '...YYY...', '..YYYYY..'],
  boot: ['..ttt....', '..ttt....', '..tTt....', '..tTtttt.', '.tTTTTTTt', '.KKKKKKKK'],
  flame: ['...R....', '...RR...', '..RRO...', '..ROOR..', '.RROMOR.', '.ROMMOR.', '.ROMMOR.', '..RMMR..'],
};

function stats(p: NeighborProfile, s: GameState) {
  const t = titleOf(p.glory);
  const total = REGALIA.length;
  const reg = p.regalia.length;
  const mine = regaliaCount(s);
  const myKm = myKmMonth(s);
  const kmMax = niceMax(Math.max(p.kmMonth, myKm, 20));
  return { t, total, reg, mine, myKm, kmMax };
}

function useGauges(p: NeighborProfile, base: number, compact = false) {
  const { s } = useGame();
  const { t, total, reg, mine, myKm, kmMax } = useMemo(() => stats(p, s), [p, s]);
  const month = MONTHS[new Date().getMonth()];
  return (
    <div className={'gauges' + (compact ? ' gauges-c' : '')}>
      <Gauge
        icon={<Pixel grid={ICO.crown} size={compact ? 14 : 18} />}
        label={compact ? `Ур. ${t.level} · слава` : `Ур. ${t.level} · ${t.name}`}
        value={t.next ? `${fmtNum(p.glory)} / ${fmtNum(t.next.from)}` : `${fmtNum(p.glory)} · предел`}
        frac={t.progress}
        tone="gold"
        delay={base}
        compact={compact}
        foot={t.next ? `до титула «${t.next.name}» — ${fmtNum(t.next.from - p.glory)} славы` : 'высший титул'}
      />
      <Gauge
        icon={<Pixel grid={ICO.cup} size={compact ? 14 : 18} />}
        label="Регалии"
        value={`${reg} из ${total} · ${Math.round((reg / total) * 100)}%`}
        frac={reg / total}
        tone="violet"
        me={mine / total}
        meLabel={`у тебя ${mine}`}
        delay={base + 0.12}
        compact={compact}
      />
      <Gauge
        icon={<Pixel grid={ICO.boot} size={compact ? 14 : 18} />}
        label={`Вёрсты за ${month}`}
        value={`${fmtKm(p.kmMonth)} км`}
        frac={p.kmMonth / kmMax}
        tone="ice"
        me={myKm / kmMax}
        meLabel={`у тебя ${fmtKm(myKm)} км`}
        foot={`шкала до ${kmMax} км`}
        delay={base + 0.24}
        compact={compact}
      />
    </div>
  );
}

export function KingdomCard({ n, onClose }: { n: Neighbor; onClose: () => void }) {
  const p = profileOf(n);
  const form = FORMS.find((f) => f.id === n.form);
  const t = titleOf(p.glory);
  const cls = CLASSES.find((c) => c.id === p.cls);
  const [closing, setClosing] = useState(false);
  const [profile, setProfile] = useState(false);
  const gauges = useGauges(p, 0.45, true);

  useEffect(() => {
    sfx.play('open');
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 220);
  };

  const tone = { '--kc': colorHex(n.banner.color), '--kc2': colorHex(n.banner.second) } as CSSProperties;

  return (
    <>
      <div className={'kc-back' + (closing ? ' out' : '')} onClick={close}>
        <div className="kc" role="dialog" aria-modal="true" aria-label={`${form?.name ?? 'Государство'} ${n.name}`} style={tone} onClick={(e) => e.stopPropagation()}>
          <i className="kc-stripe" />
          <i className="kc-corner tl" />
          <i className="kc-corner bl" />
          <i className="kc-corner br" />

          <div className="kc-seal" aria-label={`Ударных дней подряд: ${p.streak}`} title="Ударных дней подряд">
            <Pixel grid={ICO.flame} size={14} />
            <b className="pf">{p.streak}</b>
            <span>{plural(p.streak, 'день', 'дня', 'дней')}</span>
          </div>

          <div className="kc-top">
            <div className="kc-ava">
              <Avatar a={p.avatar} size={72} live="full" />
              <span className="kc-crest">
                <Banner banner={n.banner} size={24} />
              </span>
            </div>
            <div className="kc-who">
              <div className="kc-form">
                {form?.name ?? 'Государство'}
                {n.demo && <i className="kc-demo">демо</i>}
              </div>
              <div className="kc-name pf">{n.name}</div>
              <div className="kc-ruler">
                {p.title ?? form?.ruler ?? 'Правитель'} <b className="pf">{n.ruler}</b>
              </div>
              <div className="kc-chips">
                <span className="kc-chip">{t.name}</span>
                {cls && <span className="kc-chip kc-chip-path">{cls.name}</span>}
                <span className="kc-chip kc-chip-dim">{formatArea(landArea(n.land))}</span>
              </div>
            </div>
          </div>

          {gauges}

          <div className="kc-actions">
            <button
              type="button"
              className="btn btn-gold btn-sm kc-go"
              onClick={() => {
                sfx.play('dlgNext');
                setProfile(true);
              }}
            >
              Профиль правителя
            </button>
            <button type="button" className="btn btn-sm kc-x" aria-label="Закрыть" onClick={close}>
              ✕
            </button>
          </div>
          <div className="kc-legend">
            <i /> твой результат
          </div>
        </div>
      </div>
      {profile && <RulerProfile n={n} onClose={() => setProfile(false)} />}
    </>
  );
}

export function RulerProfile({ n, onClose }: { n: Neighbor; onClose: () => void }) {
  const p = profileOf(n);
  const form = FORMS.find((f) => f.id === n.form);
  const t = titleOf(p.glory);
  const cls = CLASSES.find((c) => c.id === p.cls);
  const [closing, setClosing] = useState(false);
  const gauges = useGauges(p, 0.35);
  const close = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 240);
  };
  const tone = { '--kc': colorHex(n.banner.color), '--kc2': colorHex(n.banner.second) } as CSSProperties;
  const favs: [string, string[]][] = [
    ['Книги', p.books],
    ['Фильмы и сериалы', p.films],
    ['Игры', p.games],
  ];
  const showcase = p.showcase.map((id) => REGALIA.find((r) => r.id === id)).filter(Boolean);

  return (
    <div className={'rp' + (closing ? ' out' : '')} role="dialog" aria-modal="true" aria-label={`Профиль: ${n.ruler}`} style={tone}>
      <div className="rp-top">
        <button type="button" className="btn btn-sm rp-back" onClick={close}>
          ‹ Назад
        </button>
        <div className="rp-top-t">Профиль правителя</div>
      </div>
      <div className="rp-body">
        <div className="rp-head">
          <div className="rp-ava">
            <Avatar a={p.avatar} size={144} live="full" />
            <span className="rp-badge">
              <Banner banner={n.banner} size={30} />
            </span>
          </div>
          <div className="rp-nick pf">{n.ruler}</div>
          <div className="rp-sub">
            {p.title ?? form?.ruler ?? 'Правитель'} · {form?.name ?? 'Государство'} «{n.name}»
          </div>
          <div className="kc-chips" style={{ justifyContent: 'center', marginTop: 8 }}>
            <span className="kc-chip">
              Ур. {t.level} · {t.name}
            </span>
            {cls && <span className="kc-chip kc-chip-path">Путь: {cls.name}</span>}
          </div>
        </div>

        <div className="rp-stats">
          <div>
            <b>{formatArea(landArea(n.land))}</b>
            <span>владений</span>
          </div>
          <div>
            <b>{p.streak}</b>
            <span>{plural(p.streak, 'день', 'дня', 'дней')} подряд</span>
          </div>
          <div>
            <b>{p.regalia.length}</b>
            <span>регалий</span>
          </div>
        </div>

        <div className="rp-panel">{gauges}</div>

        <div className="rp-panel">
          <div className="label">О себе</div>
          <p className="rp-about">{p.about}</p>
        </div>

        <div className="rp-panel">
          <div className="label">Витрина регалий</div>
          <div className="rp-show">
            {showcase.map((r) => (
              <div key={r!.id} className="rp-medal" title={r!.name}>
                <Pixel grid={REGALIA_ART[r!.id]} size={44} title={r!.name} />
                <span>{r!.name}</span>
              </div>
            ))}
          </div>
        </div>

        {favs.some(([, l]) => l.length) && (
          <div className="rp-panel">
            <div className="label">Любимое</div>
            {favs
              .filter(([, l]) => l.length)
              .map(([k, l]) => (
                <div key={k} className="rp-fav">
                  <span className="muted">{k}</span>
                  <div className="kc-chips">
                    {l.map((x) => (
                      <span key={x} className="kc-chip">
                        {x}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}

        <div className="rp-panel rp-realm">
          <Tower tower={n.tower} color={n.banner.color} size={40} />
          <div>
            <div className="label">{form?.name}</div>
            <div className="h2" style={{ fontSize: 22, marginTop: 2 }}>
              {n.name}
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
              Основано {p.foundedDaysAgo} {plural(p.foundedDaysAgo, 'день', 'дня', 'дней')} назад
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
