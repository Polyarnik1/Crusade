import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { REGALIA, dayKey } from './achievements';
import type { SfxName } from '../audio/sfx';
import { CHRON, TAILED, TAILS, fill, walkKey, type ChronKey } from './chronicleLines';
import { CLASSES, FORMS, type ClassId } from './cosmetics';
import { newBene } from './benedict';
import { CLOSE_DIST, MIN_LOOP_LEN, dist, formatArea, landArea, landCenter, loopPieces, merge, overlapArea, rect, subtract } from './geo';
import { gloryForArea, gloryForDistance, titleOf } from './levels';
import { makeNeighbors } from './neighbors';
import type { BeneState, ChronicleEntry, DayActivity, GameState, Hero, Kingdom, LatLng, Settings } from './types';

const KEY = 'crusade.v1';
export const DEFAULT_CENTER: LatLng = [55.752, 37.6175];
export const WEEKLY_GOAL = 3;
export const WEEKLY_REWARD = 300;
export const DAILY_GOAL_REWARD = 60;

const uid = () => Math.random().toString(36).slice(2, 10);

export function freshState(): GameState {
  return {
    version: 1,
    hero: { name: 'Безымянный рыцарь', about: '', books: [], films: [], games: [] },
    kingdom: null,
    land: null,
    captures: 0,
    totalArea: 0,
    totalDistance: 0,
    glory: 0,
    habitsDone: 0,
    habits: [
      { id: uid(), title: 'Выпить воды', glory: 10, doneDates: [] },
      { id: uid(), title: 'Зарядка 5 минут', glory: 20, doneDates: [] },
      { id: uid(), title: 'Прочитать 20 страниц', glory: 30, doneDates: [] },
    ],
    walks: [],
    walk: null,
    days: {},
    unlocked: {},
    seen: {},
    weeklyClaimed: [],
    chronicle: [],
    neighbors: [],
    lastPos: null,
    settings: {
      redBorders: true,
      demoNeighbors: true,
      hideHome: false,
      home: null,
      homeRadius: 300,
      dailyGoalKm: 3,
      simulate: false,
      mapSource: 'auto',
      sound: true,
      volume: 0.7,
    },
    flags: { tinyLoop: false, tookFromNeighbor: false, changedTower: false, changedBanner: false, patron: false },
    ui: { showFounding: false, unlockQueue: [], toasts: [] },
  };
}

function load(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw) as GameState;
    // мягкая миграция: недостающие поля берём из свежего состояния
    const base = freshState();
    return {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...parsed.settings },
      flags: { ...base.flags, ...parsed.flags },
      hero: { ...base.hero, ...parsed.hero },
      ui: {
        ...base.ui,
        ...parsed.ui,
        toasts: [],
        // убранные регалии не должны застревать в очереди
        unlockQueue: (parsed.ui?.unlockQueue ?? []).filter((id) => REGALIA.some((r) => r.id === id)),
      },
    };
  } catch {
    return freshState();
  }
}

export function weekKey(ts = Date.now()): string {
  const d = new Date(ts);
  const day = (d.getDay() + 6) % 7; // понедельник = 0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return dayKey(d);
}

export function weeklyCaptures(s: GameState): number {
  const wk = weekKey();
  return s.chronicle.filter((c) => c.kind === 'capture' && weekKey(c.ts) === wk).length;
}

function today(d: GameState): DayActivity {
  const k = dayKey();
  if (!d.days[k]) d.days[k] = { opened: false, walkedM: 0, tasksDone: 0, goalRewarded: false };
  return d.days[k];
}

/** Запись в летописи слогом хроники: формулировка выбирается из набора и не повторяет предыдущую. */
function chron(d: GameState, kind: ChronicleEntry['kind'], key: ChronKey, vars: Record<string, string | number | undefined> = {}, extra = '') {
  const list = CHRON[key];
  const last = d.chronicle.find((c) => c.key === key)?.v;
  let v = Math.floor(Math.random() * list.length);
  if (list.length > 1 && v === last) v = (v + 1 + Math.floor(Math.random() * (list.length - 1))) % list.length;
  const k = d.kingdom?.name ?? '';
  const form = (FORMS.find((f) => f.id === d.kingdom?.form)?.name ?? 'государство').toLowerCase();
  let text = fill(list[v], { k, r: rulerOf(d), form, ...vars });
  if (extra) text += ' ' + extra;
  if (TAILED.includes(key) && Math.random() < 0.14) text += ' ' + TAILS[Math.floor(Math.random() * TAILS.length)];
  d.chronicle.unshift({ id: uid(), ts: Date.now(), kind, text, key, v });
  if (d.chronicle.length > 300) d.chronicle.length = 300;
}

function toast(d: GameState, title: string, text?: string, sound: SfxName = 'toast') {
  d.ui.toasts.push({ id: uid(), title, text, sound });
  if (d.ui.toasts.length > 3) d.ui.toasts.shift();
}

/** Захват петли. Возвращает true, если петля засчитана (сегмент можно начинать заново). */
function capture(d: GameState, ring: LatLng[]): boolean {
  const pieces = loopPieces(ring);
  if (!pieces.length) return false;
  const before = landArea(d.land);
  let loopArea = 0;
  for (const piece of pieces) {
    loopArea += landArea(piece);
    for (const n of d.neighbors) {
      if (overlapArea(n.land, piece) > 50) {
        n.land = subtract(n.land, piece);
        if (!d.flags.tookFromNeighbor) d.flags.tookFromNeighbor = true;
        chron(d, 'border', 'takeNeighbor', { n: n.name, nr: n.ruler });
        toast(d, 'Граница сдвинулась', `Часть земель «${n.name}» теперь твоя`, 'border');
      }
    }
    d.land = merge(d.land, piece);
  }
  const after = landArea(d.land);
  const gained = Math.max(0, after - before);
  d.totalArea = after;
  if (gained < 100) {
    toast(d, 'Эти земли уже твои', 'Обойди новые кварталы, чтобы расширить владения');
    return true;
  }
  if (loopArea < 2500) d.flags.tinyLoop = true;
  d.captures++;
  if (d.walk) {
    d.walk.captured += gained;
    d.walk.loops++;
  }
  const g = gloryForArea(gained);
  d.glory += g;
  chron(d, 'capture', 'capture', { area: formatArea(gained), g });
  toast(d, `Новый удел! +${g} славы`, `+${formatArea(gained)} к владениям`, 'capture');
  return true;
}

/** Меньше этого — земель считай что нет: правитель оказывается в изгнании. */
export const EXILE_BELOW = 30; // м²

export function isExiled(s: GameState): boolean {
  return !!s.kingdom && !!s.flags.exiled;
}

function rulerOf(d: GameState): string {
  return FORMS.find((f) => f.id === d.kingdom?.form)?.ruler ?? 'Правитель';
}

function checkExile(d: GameState) {
  if (!d.kingdom) return;
  const has = landArea(d.land) >= EXILE_BELOW;
  if (!has && !d.flags.exiled) {
    d.flags.exiled = true;
    d.flags.everExiled = true;
    d.land = null;
    d.totalArea = 0;
    const r = rulerOf(d);
    chron(d, 'border', 'exile');
    toast(d, `${r} в изгнании`, 'Земель не осталось. Захвати любой клочок, чтобы вернуть владения', 'exile');
  } else if (has && d.flags.exiled) {
    d.flags.exiled = false;
    d.flags.returned = true;
    const r = rulerOf(d);
    chron(d, 'border', 'returned');
    toast(d, 'Владения возвращены', `${r} снова правит`, 'restore');
  }
}

function postProcess(d: GameState, prevGlory: number) {
  checkExile(d);
  // недельный вызов
  const wk = weekKey();
  if (!d.weeklyClaimed.includes(wk) && weeklyCaptures(d) >= WEEKLY_GOAL) {
    d.weeklyClaimed.push(wk);
    d.glory += WEEKLY_REWARD;
    chron(d, 'quest', 'weekly', { g: WEEKLY_REWARD });
    toast(d, 'Недельный вызов выполнен', `+${WEEKLY_REWARD} славы`, 'quest');
  }
  // регалии (по кругу, т.к. одна может открыть другую, например «Слава в веках»)
  for (let pass = 0; pass < 2; pass++) {
    for (const r of REGALIA) {
      if (d.unlocked[r.id]) continue;
      if (r.check(d)) {
        d.unlocked[r.id] = Date.now();
        d.ui.unlockQueue.push(r.id);
        chron(d, 'regalia', 'regalia', { reg: r.name });
        if (d.walk) toast(d, 'Новая регалия!', r.name, 'regalia');
      }
    }
  }
  const was = titleOf(prevGlory);
  const now = titleOf(d.glory);
  if (now.level > was.level) {
    chron(d, 'title', 'title', { title: now.name });
    toast(d, `Новый титул: ${now.name}`, `Уровень ${now.level}`, 'title');
  }
}

function useGameState() {
  const [s, setS] = useState<GameState>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...s, ui: { ...s.ui, toasts: [] } }));
    } catch {
      /* хранилище переполнено — молча пропускаем */
    }
  }, [s]);

  const mutate = useCallback((fn: (d: GameState) => void) => {
    setS((prev) => {
      const d = structuredClone(prev);
      const g = d.glory;
      fn(d);
      postProcess(d, g);
      return d;
    });
  }, []);

  const act = useMemo(
    () => ({
      markOpened: () => mutate((d) => void (today(d).opened = true)),

      setPos: (p: LatLng) =>
        mutate((d) => {
          d.lastPos = p;
          if (d.settings.demoNeighbors) {
            // демо-соседи живут рядом с игроком: если их оставила старая (ложная) позиция — пересоздаём
            const first = d.neighbors.find((n) => n.land);
            const c = first ? landCenter(first.land) : null;
            if (d.neighbors.length === 0 || (c && dist(c, p) > 20000)) d.neighbors = makeNeighbors(p);
          }
        }),

      startWalk: (sim: boolean) =>
        mutate((d) => {
          d.walk = {
            startedAt: Date.now(),
            pausedAt: null,
            pausedTotal: 0,
            distance: 0,
            captured: 0,
            loops: 0,
            track: [],
            segment: [],
            segmentLen: [],
            lastTs: Date.now(),
            sim,
            gps: 'lost',
          };
          if (d.settings.demoNeighbors && d.neighbors.length === 0 && d.lastPos) d.neighbors = makeNeighbors(d.lastPos);
        }),

      pauseWalk: () =>
        mutate((d) => {
          if (d.walk && !d.walk.pausedAt) d.walk.pausedAt = Date.now();
        }),

      resumeWalk: () =>
        mutate((d) => {
          const w = d.walk;
          if (w && w.pausedAt) {
            w.pausedTotal += Date.now() - w.pausedAt;
            w.pausedAt = null;
            // после паузы начинаем новый сегмент, чтобы не замкнуть «телепорт»
            w.segment = [];
            w.segmentLen = [];
            w.track.push([NaN, NaN]);
          }
        }),

      /** Страница ушла в фон / вернулась: в фоне браузер не отдаёт GPS. */
      walkHidden: (hidden: boolean) =>
        mutate((d) => {
          const w = d.walk;
          if (!w || w.pausedAt || w.sim) return;
          if (hidden) w.hiddenAt = w.hiddenAt ?? Date.now();
        }),

      gpsState: (gps: 'ok' | 'weak' | 'lost') =>
        mutate((d) => {
          if (d.walk) d.walk.gps = gps;
        }),

      addPoint: (lat: number, lng: number, acc: number, ts: number) =>
        mutate((d) => {
          const w = d.walk;
          if (!w || w.pausedAt) return;
          const p: LatLng = [lat, lng];
          d.lastPos = p;
          if (d.settings.demoNeighbors && d.neighbors.length === 0) d.neighbors = makeNeighbors(p);
          if (acc > 40) {
            w.gps = 'weak';
            return;
          }
          let lastSeg: LatLng | undefined = w.segment[w.segment.length - 1];
          // разрыв: экран гас или GPS молчал. Прямую через «слепой» участок не считаем стеной
          // для захвата — иначе срезанная хорда даёт землю, по которой рыцарь не ходил.
          if (lastSeg && !w.sim) {
            const gapDt = (ts - w.lastTs) / 1000;
            const gd = dist(lastSeg, p);
            const wasHidden = !!w.hiddenAt;
            if ((wasHidden || gapDt > 25) && gd > 40) {
              if (gd / Math.max(1, gapDt) <= 12) {
                // пройденное всё равно засчитываем в километры (по прямой — это минимум)
                w.distance += gd;
                d.totalDistance += gd;
                today(d).walkedM += gd;
              }
              w.track.push([NaN, NaN]);
              w.segment = [];
              w.segmentLen = [];
              w.gaps = (w.gaps ?? 0) + 1;
              if (wasHidden && w.gaps === 1)
                toast(d, 'Путь прервался', 'Пока экран был выключен, браузер не видел GPS. Этот участок не пойдёт в захват — держи экран включённым.', 'toast');
              lastSeg = undefined;
            }
          }
          w.hiddenAt = null;
          if (lastSeg) {
            const dd = dist(lastSeg, p);
            const dt = (ts - w.lastTs) / 1000;
            if (dd < 4) {
              w.gps = 'ok';
              return;
            }
            if (!w.sim && dt > 0 && dd / dt > 12) return; // скачок GPS, а не рыцарь на коне
            w.distance += dd;
            d.totalDistance += dd;
            const day = today(d);
            day.walkedM += dd;
            const goal = d.settings.dailyGoalKm * 1000;
            if (!day.goalRewarded && day.walkedM >= goal) {
              day.goalRewarded = true;
              d.glory += DAILY_GOAL_REWARD;
              chron(d, 'quest', 'daily', { goal: d.settings.dailyGoalKm, g: DAILY_GOAL_REWARD });
              toast(d, 'Поход дня выполнен', `+${DAILY_GOAL_REWARD} славы`, 'quest');
            }
          }
          w.gps = 'ok';
          w.lastTs = ts;
          w.track.push(p);
          if (w.track.length > 8000) w.track.splice(0, w.track.length - 8000);
          const len = lastSeg ? w.segmentLen[w.segmentLen.length - 1] + dist(lastSeg, p) : 0;
          w.segment.push(p);
          w.segmentLen.push(len);
          const n = w.segment.length - 1;
          for (let i = 0; i <= n - 6; i++) {
            if (len - w.segmentLen[i] < MIN_LOOP_LEN) break;
            if (dist(w.segment[i], p) <= CLOSE_DIST) {
              if (capture(d, w.segment.slice(i))) {
                w.segment = [p];
                w.segmentLen = [0];
              }
              break;
            }
          }
        }),

      finishWalk: () =>
        mutate((d) => {
          const w = d.walk;
          if (!w) return;
          // если вернулся почти к началу — замыкаем петлю
          if (w.segment.length > 6) {
            const a = w.segment[0];
            const b = w.segment[w.segment.length - 1];
            const len = w.segmentLen[w.segmentLen.length - 1];
            if (dist(a, b) <= 60 && len >= MIN_LOOP_LEN) capture(d, w.segment);
          }
          const g = gloryForDistance(w.distance);
          d.glory += g;
          d.walks.unshift({
            id: uid(),
            startedAt: w.startedAt,
            endedAt: Date.now(),
            distance: w.distance,
            captured: w.captured,
            loops: w.loops,
            sim: w.sim,
            startPos: w.track[0],
          });
          if (d.walks.length > 100) d.walks.length = 100;
          const km = w.distance / 1000;
          chron(
            d,
            'walk',
            walkKey(km),
            { km: km.toFixed(2).replace('.', ',') },
            (w.loops ? `Замкнуто уделов: ${w.loops}.` : '') + (g ? `${w.loops ? ' ' : ''}Слава: +${g}.` : ''),
          );
          d.walk = null;
          if (!d.kingdom) d.ui.showFounding = true;
        }),

      cancelWalk: () =>
        mutate((d) => {
          d.walk = null;
        }),

      saveKingdom: (k: Omit<Kingdom, 'foundedAt'>) =>
        mutate((d) => {
          const isNew = !d.kingdom;
          if (!isNew && d.kingdom) {
            const ob = d.kingdom.banner;
            const nb = k.banner;
            if (
              ob.shape !== nb.shape ||
              ob.pattern !== nb.pattern ||
              ob.symbol !== nb.symbol ||
              ob.color !== nb.color ||
              ob.second !== nb.second
            )
              d.flags.changedBanner = true;
            if (d.kingdom.tower !== k.tower) d.flags.changedTower = true;
          }
          d.kingdom = { ...k, foundedAt: d.kingdom?.foundedAt ?? Date.now() };
          d.ui.showFounding = false;
          // стартовая столица: у нового государства без земель сразу есть удел 100×100 м вокруг игрока
          if (isNew && !d.land && d.lastPos) {
            const cap = rect(d.lastPos, -50, -50, 100, 100);
            for (const n of d.neighbors) if (overlapArea(n.land, cap) > 50) n.land = subtract(n.land, cap);
            d.land = merge(d.land, cap);
            d.totalArea = landArea(d.land);
            chron(d, 'capture', 'capital', { area: formatArea(landArea(cap)) });
          }
          if (isNew) {
            chron(d, 'kingdom', 'founded');
            toast(d, 'Королевство основано', k.name, 'found');
          }
        }),

      setTower: (tower: string) =>
        mutate((d) => {
          if (!d.kingdom || d.kingdom.tower === tower) return;
          d.kingdom.tower = tower;
          d.flags.changedTower = true;
        }),

      meetBenedict: (met = true, sulk = false) =>
        mutate((d) => {
          if (met && !d.flags.metBenedict) chron(d, 'bene', 'bene');
          d.flags.metBenedict = met;
          if (met) d.bene = d.bene ? { ...d.bene, sulkUntil: newBene(sulk).sulkUntil } : newBene(sulk);
        }),
      chooseClass: (c: ClassId) =>
        mutate((d) => {
          if (d.cls) return;
          d.cls = c;
          const def = CLASSES.find((x) => x.id === c)!;
          chron(d, 'class', 'class', { cls: def.name });
          toast(d, `Путь выбран: ${def.name}`, 'В редакторе королевства открылись скрытые украшения', 'regalia');
        }),
      deferClass: () =>
        mutate((d) => {
          d.flags.clsDefer = dayKey();
        }),
      // для разработки: снова предложить выбор пути
      askClass: () =>
        mutate((d) => {
          d.cls = undefined;
          d.flags.clsDefer = undefined;
          d.flags.clsNow = true;
        }),
      saveBene: (b: BeneState) =>
        mutate((d) => {
          d.bene = b;
        }),
      // для разработки: Бенедикт снова свеж — без лимита и обиды
      restBene: () =>
        mutate((d) => {
          if (!d.bene) return;
          d.bene.sulkUntil = undefined;
          d.bene.day = undefined;
          d.bene.riddleDay = d.bene.fortuneDay = d.bene.loreDay = undefined;
        }),
      notify: (title: string, text?: string) => mutate((d) => toast(d, title, text)),

      // для разработки: отобрать все земли, чтобы посмотреть, как выглядит изгнание
      loseLand: () =>
        mutate((d) => {
          d.land = null;
          d.totalArea = 0;
        }),

      openFounding: () => mutate((d) => void (d.ui.showFounding = true)),
      closeFounding: () => mutate((d) => void (d.ui.showFounding = false)),

      toggleHabit: (id: string) =>
        mutate((d) => {
          const h = d.habits.find((x) => x.id === id);
          if (!h) return;
          const k = dayKey();
          const day = today(d);
          if (h.doneDates.includes(k)) {
            h.doneDates = h.doneDates.filter((x) => x !== k);
            d.glory = Math.max(0, d.glory - h.glory);
            d.habitsDone = Math.max(0, d.habitsDone - 1);
            day.tasksDone = Math.max(0, day.tasksDone - 1);
          } else {
            h.doneDates.push(k);
            if (h.doneDates.length > 400) h.doneDates.splice(0, h.doneDates.length - 400);
            d.glory += h.glory;
            d.habitsDone++;
            day.tasksDone++;
          }
        }),

      addHabit: (title: string, glory: number) =>
        mutate((d) => {
          const t = title.trim();
          if (t) d.habits.push({ id: uid(), title: t.slice(0, 60), glory, doneDates: [] });
        }),

      removeHabit: (id: string) =>
        mutate((d) => {
          d.habits = d.habits.filter((h) => h.id !== id);
        }),

      setHero: (patch: Partial<Hero>) => mutate((d) => void Object.assign(d.hero, patch)),

      setSettings: (patch: Partial<Settings>) =>
        mutate((d) => {
          Object.assign(d.settings, patch);
          if (patch.demoNeighbors === false) d.neighbors = [];
          if (patch.demoNeighbors === true && d.neighbors.length === 0 && d.lastPos) d.neighbors = makeNeighbors(d.lastPos);
        }),

      markHome: () =>
        mutate((d) => {
          if (d.lastPos) d.settings.home = d.lastPos;
        }),

      shiftUnlock: () => mutate((d) => void d.ui.unlockQueue.shift()),
      dismissToast: (id: string) => mutate((d) => void (d.ui.toasts = d.ui.toasts.filter((t) => t.id !== id))),
      markSeen: (id: string) => mutate((d) => void (d.seen[id] = true)),

      importState: (raw: string): boolean => {
        try {
          const parsed = JSON.parse(raw) as GameState;
          if (parsed.version !== 1) return false;
          localStorage.setItem(KEY, JSON.stringify(parsed));
          setS(load());
          return true;
        } catch {
          return false;
        }
      },

      resetAll: () => {
        try {
          localStorage.removeItem(KEY);
        } catch {
          /* нет доступа к хранилищу */
        }
        setS(freshState());
      },
    }),
    [mutate],
  );

  return { s, act };
}

type GameCtx = ReturnType<typeof useGameState>;
const Ctx = createContext<GameCtx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const value = useGameState();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame(): GameCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useGame вне GameProvider');
  return v;
}
