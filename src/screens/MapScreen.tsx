import L from 'leaflet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { attachTiles, type TileHandle } from '../art/tiles';
import { Banner, towerSvg } from '../art/heraldry';
import { Bar, Icon, Sheet } from '../components/ui';
import { streak } from '../game/achievements';
import { FORMS, colorHex } from '../game/cosmetics';
import { formatArea, formatKm, landArea, landCenter, towerSpots } from '../game/geo';
import { titleOf } from '../game/levels';
import { DEFAULT_CENTER, useGame } from '../game/store';
import { dayKey } from '../game/achievements';
import type { LatLng, Neighbor } from '../game/types';

const NEUTRAL = '#E3B341';

export function MapScreen() {
  const { s, act } = useGame();
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layers = useRef<{ own?: L.Layer; nb?: L.LayerGroup; towers?: L.LayerGroup; track?: L.Polyline; me?: L.Marker }>({});
  const tiles = useRef<TileHandle | null>(null);
  const [light, setLight] = useState(false);
  const [picked, setPicked] = useState<Neighbor | null>(null);
  const walk = s.walk;
  const myColor = s.kingdom ? colorHex(s.kingdom.banner.color) : NEUTRAL;
  const myTower = s.kingdom?.tower ?? 'watch';

  // смена источника подложки из настроек
  useEffect(() => {
    if (!map.current) return;
    tiles.current?.remove();
    tiles.current = attachTiles(map.current, s.settings.mapSource, setLight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.settings.mapSource]);

  // создание карты
  useEffect(() => {
    if (!el.current || map.current) return;
    const start = s.lastPos ?? landCenter(s.land) ?? DEFAULT_CENTER;
    const m = L.map(el.current, { zoomControl: false, attributionControl: true, zoomSnap: 0.5 }).setView(start, s.land ? 16 : 15.5);
    map.current = m;
    tiles.current = attachTiles(m, s.settings.mapSource, setLight);
    if ('geolocation' in navigator && !s.walk) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          const pos: LatLng = [p.coords.latitude, p.coords.longitude];
          act.setPos(pos);
          if (!s.lastPos) m.setView(pos, 16);
        },
        () => {
          if (!s.lastPos) act.setPos(DEFAULT_CENTER);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    }
    return () => {
      tiles.current?.remove();
      m.remove();
      map.current = null;
    };
    // карта создаётся один раз
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // свои земли
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    layers.current.own?.remove();
    if (s.land) {
      layers.current.own = L.geoJSON(s.land, {
        style: { color: myColor, weight: 3, fillColor: myColor, fillOpacity: 0.3, lineJoin: 'miter' },
        interactive: false,
      }).addTo(m);
    }
  }, [s.land, myColor]);

  // соседи: подсвечены своим цветом, по желанию — красный пунктир по границе
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    layers.current.nb?.remove();
    const g = L.layerGroup();
    for (const n of s.neighbors) {
      if (!n.land) continue;
      const c = colorHex(n.banner.color);
      L.geoJSON(n.land, {
        style: {
          color: s.settings.redBorders ? '#E85D4F' : c,
          dashArray: s.settings.redBorders ? '6 5' : undefined,
          weight: 2,
          fillColor: c,
          fillOpacity: 0.26,
        },
      })
        .on('click', () => setPicked(n))
        .addTo(g);
    }
    g.addTo(m);
    layers.current.nb = g;
  }, [s.neighbors, s.settings.redBorders]);

  // башни
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    layers.current.towers?.remove();
    const g = L.layerGroup();
    const add = (p: LatLng, tower: string, color: string, onClick?: () => void) => {
      const icon = L.divIcon({ className: 'tower-icon', html: towerSvg(tower, color, 30), iconSize: [30, 34], iconAnchor: [15, 30] });
      const mk = L.marker(p, { icon, interactive: !!onClick, keyboard: false });
      if (onClick) mk.on('click', onClick);
      mk.addTo(g);
    };
    for (const p of towerSpots(s.land)) add(p, myTower, s.kingdom?.banner.color ?? 'gold');
    for (const n of s.neighbors) for (const p of towerSpots(n.land, 3)) add(p, n.tower, n.banner.color, () => setPicked(n));
    g.addTo(m);
    layers.current.towers = g;
  }, [s.land, s.neighbors, myTower, s.kingdom?.banner.color]);

  // след похода
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    layers.current.track?.remove();
    if (walk && walk.track.length > 1) {
      const parts: LatLng[][] = [[]];
      for (const p of walk.track) {
        if (Number.isNaN(p[0])) parts.push([]);
        else parts[parts.length - 1].push(p);
      }
      layers.current.track = L.polyline(parts, { color: '#F5D273', weight: 4, dashArray: '2 7', lineCap: 'square' }).addTo(m);
    }
  }, [walk?.track.length, walk]);

  // где я
  useEffect(() => {
    const m = map.current;
    if (!m || !s.lastPos) return;
    if (!layers.current.me) {
      layers.current.me = L.marker(s.lastPos, {
        icon: L.divIcon({ className: 'me-icon', html: '<div></div>', iconSize: [22, 22], iconAnchor: [11, 11] }),
        interactive: false,
        zIndexOffset: 1000,
      }).addTo(m);
    } else layers.current.me.setLatLng(s.lastPos);
    if (walk && !walk.pausedAt) m.panTo(s.lastPos, { animate: true });
  }, [s.lastPos, walk]);

  const locate = () => {
    const m = map.current;
    if (!m) return;
    if (s.lastPos) m.setView(s.lastPos, Math.max(m.getZoom(), 16));
    navigator.geolocation?.getCurrentPosition((p) => {
      const pos: LatLng = [p.coords.latitude, p.coords.longitude];
      act.setPos(pos);
      m.setView(pos, Math.max(m.getZoom(), 16));
    });
  };

  const t = titleOf(s.glory);
  const st = streak(s);
  const area = landArea(s.land);
  const todayM = s.days[dayKey()]?.walkedM ?? 0;
  const goal = s.settings.dailyGoalKm * 1000;

  return (
    <div className="map-wrap">
      <div ref={el} className={'map' + (light ? ' map--light' : '')} aria-label="Карта владений" />

      <div className="hud hud-top">
        <div className="panel row" style={{ padding: '10px 12px' }}>
          <div className="lvl" aria-label={`Уровень ${t.level}`}>{t.level}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="h2">{t.name}</div>
            <div style={{ margin: '6px 0 4px' }}>
              <Bar value={t.progress} />
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              Слава {s.glory.toLocaleString('ru-RU')}
              {t.next ? ` / ${t.next.from.toLocaleString('ru-RU')}` : ''}
            </div>
          </div>
          <div style={{ textAlign: 'center', color: st ? 'var(--gold)' : 'var(--muted)', minWidth: 44 }}>
            <Icon name="flame" size={24} />
            <div className="pf" style={{ fontSize: 24, fontWeight: 600, color: 'var(--text)', lineHeight: 1 }}>{st}</div>
            <div className="muted" style={{ fontSize: 11 }}>дней</div>
          </div>
        </div>

        <div className="row" style={{ marginTop: 8, alignItems: 'flex-start' }}>
          <div className="panel" style={{ padding: '8px 10px', fontSize: 12 }}>
            <div className="row" style={{ gap: 8 }}>
              <span className="legend-sw" style={{ background: myColor }} />
              <span className="pf" style={{ fontSize: 16 }}>
                {s.kingdom ? s.kingdom.name : 'Мои земли'}: {formatArea(area)}
              </span>
            </div>
            {s.neighbors.length > 0 && (
              <div className="row muted" style={{ gap: 8, marginTop: 4 }}>
                <span
                  className="legend-sw"
                  style={{ background: '#5B8DEF', borderColor: s.settings.redBorders ? '#E85D4F' : '#0b0a10', borderStyle: s.settings.redBorders ? 'dashed' : 'solid' }}
                />
                Соседи: {s.neighbors.length} — нажми, чтобы узнать
              </div>
            )}
          </div>
          <div style={{ flex: 1 }} />
          <button type="button" className="btn btn-icon" onClick={locate} aria-label="Показать, где я">
            <Icon name="locate" size={22} />
          </button>
        </div>
      </div>

      <div className="hud hud-bottom">{walk ? <WalkPanel /> : <IdlePanel todayM={todayM} goal={goal} />}</div>

      {picked && <NeighborSheet n={picked} onClose={() => setPicked(null)} />}
    </div>
  );
}

function IdlePanel({ todayM, goal }: { todayM: number; goal: number }) {
  const { s, act } = useGame();
  return (
    <div className="panel">
      <div className="label">Поход дня</div>
      <div className="row between" style={{ marginTop: 4, alignItems: 'baseline' }}>
        <div className="h2" style={{ fontSize: 24 }}>Пройти {s.settings.dailyGoalKm} км</div>
        <div className="pf muted" style={{ fontSize: 16 }}>
          {formatKm(todayM)} / {s.settings.dailyGoalKm} км
        </div>
      </div>
      <div style={{ margin: '10px 0 14px' }}>
        <Bar value={todayM / goal} />
      </div>
      <button type="button" className="btn btn-gold btn-big" onClick={() => act.startWalk(s.settings.simulate)}>
        <Icon name="play" size={18} />
        {s.settings.simulate ? 'Тестовый поход' : 'В поход'}
      </button>
      {!s.land && (
        <p className="muted" style={{ fontSize: 13, margin: '10px 0 0', lineHeight: 1.4 }}>
          Пройди маршрут и вернись к своему следу — всё, что внутри петли, станет твоей землёй.
        </p>
      )}
    </div>
  );
}

function WalkPanel() {
  const { s, act } = useGame();
  const w = s.walk!;
  const [, tick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => tick((x) => x + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  const elapsed = Math.max(0, (w.pausedAt ?? Date.now()) - w.startedAt - w.pausedTotal);
  const mm = Math.floor(elapsed / 60000);
  const ss = Math.floor((elapsed % 60000) / 1000);
  const hh = Math.floor(mm / 60);
  const time = (hh ? `${hh}:` + String(mm % 60).padStart(2, '0') : String(mm).padStart(2, '0')) + ':' + String(ss).padStart(2, '0');
  const gps = w.sim
    ? { t: 'Тестовый маршрут', c: 'var(--blue)' }
    : w.gps === 'ok'
      ? { t: 'GPS стабилен', c: '#4FB36A' }
      : w.gps === 'weak'
        ? { t: 'GPS слабый — выйди на открытое место', c: 'var(--gold)' }
        : { t: 'Ищем спутники…', c: 'var(--red)' };
  return (
    <div className="panel">
      <div className="row between">
        <div className="row" style={{ gap: 8, fontSize: 13 }}>
          <span style={{ width: 10, height: 10, background: gps.c, display: 'inline-block' }} />
          {w.pausedAt ? 'Привал' : gps.t}
        </div>
        <div className="muted" style={{ fontSize: 12 }}>уделов: {w.loops}</div>
      </div>
      <div className="pf" style={{ fontSize: 48, fontWeight: 600, textAlign: 'center', lineHeight: 1.1, margin: '6px 0 2px' }}>
        {time}
      </div>
      <div className="grid3" style={{ marginTop: 8 }}>
        <div className="stat">
          <b>{formatKm(w.distance)}</b>
          <span>км</span>
        </div>
        <div className="stat">
          <b style={{ color: 'var(--gold)' }}>{formatArea(w.captured).replace(' ', ' ')}</b>
          <span>захвачено</span>
        </div>
        <div className="stat">
          <b>{Math.round(w.distance / 0.72).toLocaleString('ru-RU')}</b>
          <span>шагов</span>
        </div>
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        {w.pausedAt ? (
          <button type="button" className="btn" style={{ flex: 1 }} onClick={act.resumeWalk}>
            <Icon name="play" size={16} />
            Дальше
          </button>
        ) : (
          <button type="button" className="btn" style={{ flex: 1 }} onClick={act.pauseWalk}>
            <Icon name="pause" size={16} />
            Привал
          </button>
        )}
        <button type="button" className="btn btn-gold" style={{ flex: 1.4 }} onClick={act.finishWalk}>
          Завершить
        </button>
      </div>
      {!w.sim && (
        <p className="muted" style={{ fontSize: 12, margin: '10px 0 0', lineHeight: 1.4 }}>
          Не блокируй экран: в браузере GPS засыпает вместе с ним. В приложении это исправим.
        </p>
      )}
    </div>
  );
}

function NeighborSheet({ n, onClose }: { n: Neighbor; onClose: () => void }) {
  const form = useMemo(() => FORMS.find((f) => f.id === n.form), [n.form]);
  return (
    <Sheet onClose={onClose} label={`Соседнее государство ${n.name}`}>
      <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
        <Banner banner={n.banner} size={72} />
        <div style={{ flex: 1 }}>
          <div className="label">{form?.name ?? 'Государство'}</div>
          <div className="h2" style={{ fontSize: 24, marginTop: 4 }}>{n.name}</div>
          <div className="muted" style={{ marginTop: 6, fontSize: 14 }}>
            {form?.ruler ?? 'Правитель'}: <b style={{ color: 'var(--text)' }}>{n.ruler}</b>
          </div>
          <div className="muted" style={{ marginTop: 2, fontSize: 14 }}>Владения: {formatArea(landArea(n.land))}</div>
        </div>
      </div>
      <p style={{ lineHeight: 1.5, fontSize: 14, margin: '16px 0' }}>
        Соседи — не враги. Но если замкнёшь петлю по их землям, граница сдвинется в твою пользу.
      </p>
      <p className="muted" style={{ fontSize: 13, lineHeight: 1.45, margin: '0 0 16px' }}>
        Это демо-сосед: настоящие игроки появятся, когда подключим сервер. Убрать демо-соседей можно в настройках.
      </p>
      <button type="button" className="btn btn-block" onClick={onClose}>
        Понятно
      </button>
    </Sheet>
  );
}
