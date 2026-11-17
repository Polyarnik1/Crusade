import { useEffect, useRef } from 'react';
import { offset } from './geo';
import { DEFAULT_CENTER, useGame } from './store';
import type { LatLng } from './types';

/** Маршрут тестового похода: две петли, вторая примыкает к первой — видно, как растут владения. */
export function simRoute(start: LatLng): LatLng[] {
  const way: [number, number][] = [
    [0, 0],
    [-160, 0],
    [-160, 180],
    [0, 180],
    [0, 0], // первая петля замкнулась
    [170, 0],
    [170, 180],
    [0, 180],
    [0, 0], // вторая петля по общей стене
    [60, -40],
    [120, -30],
  ];
  const pts: LatLng[] = [];
  for (let i = 0; i < way.length - 1; i++) {
    const [x1, y1] = way[i];
    const [x2, y2] = way[i + 1];
    const len = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.max(1, Math.round(len / 7));
    for (let k = 0; k < steps; k++) {
      const t = k / steps;
      const jx = Math.sin((i * 31 + k) * 1.7) * 0.4;
      const jy = Math.cos((i * 17 + k) * 1.3) * 0.4;
      pts.push(offset(start, x1 + (x2 - x1) * t + jx, y1 + (y2 - y1) * t + jy));
    }
  }
  const [lx, ly] = way[way.length - 1];
  pts.push(offset(start, lx, ly));
  return pts;
}

type WakeLockLike = { release: () => Promise<void> };

/** Подписка на GPS (или симуляцию) на время активного похода. */
export function useWalkTracker() {
  const { s, act } = useGame();
  const walk = s.walk;
  const active = !!walk && !walk.pausedAt;
  const sim = !!walk?.sim;
  const startedAt = walk?.startedAt ?? 0;
  const simIndex = useRef(0);
  const simStart = useRef<LatLng | null>(null);
  const lastPosRef = useRef<LatLng | null>(s.lastPos);
  lastPosRef.current = s.lastPos;

  // экран не гаснет, пока идёт поход (в браузере GPS засыпает вместе с экраном)
  useEffect(() => {
    if (!active) return;
    let lock: WakeLockLike | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<WakeLockLike> } };
    nav.wakeLock
      ?.request('screen')
      .then((l) => (lock = l))
      .catch(() => {});
    return () => {
      lock?.release().catch(() => {});
    };
  }, [active]);

  useEffect(() => {
    if (!startedAt) return;
    simIndex.current = 0;
    simStart.current = null;
  }, [startedAt]);

  useEffect(() => {
    if (!active) return;
    if (sim) {
      if (!simStart.current) simStart.current = lastPosRef.current ?? DEFAULT_CENTER;
      const route = simRoute(simStart.current);
      const id = window.setInterval(() => {
        const i = simIndex.current;
        if (i >= route.length) return;
        simIndex.current = i + 1;
        const [lat, lng] = route[i];
        act.addPoint(lat, lng, 5, Date.now());
      }, 180);
      return () => window.clearInterval(id);
    }
    if (!('geolocation' in navigator)) {
      act.gpsState('lost');
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => act.addPoint(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy, pos.timestamp),
      () => act.gpsState('lost'),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [active, sim, act]);
}
