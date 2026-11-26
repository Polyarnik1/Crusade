import { useEffect, useState } from 'react';
import { sfx } from './audio/sfx';
import { music } from './audio/music';
import { BenedictDialog } from './components/Benedict';
import { BenedictVisit } from './components/BenedictVisit';
import { TeaDialog } from './components/TeaDialog';
import { ClassDialog, PathSheet } from './components/ClassChoice';
import { dayKey } from './game/achievements';
import { sulking, sulkLeft } from './game/benedict';
import { SULK } from './game/benedictLines';
import { TabBar, Toasts, type Tab } from './components/ui';
import { REGALIA } from './game/achievements';
import { useGame } from './game/store';
import { useWalkTracker } from './game/tracker';
import { ChronicleScreen } from './screens/ChronicleScreen';
import { HeroScreen } from './screens/HeroScreen';
import { KingdomEditor } from './screens/KingdomEditor';
import { MapScreen } from './screens/MapScreen';
import { QuestsScreen } from './screens/QuestsScreen';
import { RegaliaScreen, RegaliaSheet } from './screens/RegaliaScreen';
import { SettingsScreen } from './screens/SettingsScreen';

export function App() {
  const { s, act } = useGame();
  const [tab, setTab] = useState<Tab>('map');
  const [settings, setSettings] = useState(false);
  useWalkTracker();

  useEffect(() => {
    act.markOpened();
  }, [act]);

  useEffect(() => {
    const mono = s.settings.theme === 'mono';
    document.documentElement.dataset.theme = mono ? 'mono' : 'gold';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0b0a10');
  }, [s.settings.theme]);

  useEffect(() => {
    sfx.enabled = s.settings.sound;
    sfx.setVolume(s.settings.volume);
  }, [s.settings.sound, s.settings.volume]);

  // во время похода держим карту на экране
  useEffect(() => {
    if (s.walk) {
      setTab('map');
      setSettings(false);
    }
  }, [!!s.walk]); // eslint-disable-line react-hooks/exhaustive-deps

  // во время похода регалии приходят тостом, а торжественное окно — после похода
  const unlockId = s.walk ? undefined : s.ui.unlockQueue[0];
  const unlock = unlockId ? REGALIA.find((r) => r.id === unlockId) : null;
  // Бенедикт приходит один раз после основания державы, когда все окна закрыты
  const benedictDue = !!s.kingdom && !s.flags.metBenedict && !unlock && !s.ui.showFounding && !s.walk && tab === 'map';
  const [benedict, setBenedict] = useState(false);
  useEffect(() => {
    if (!benedictDue) return;
    music.preload();
    const t = setTimeout(() => setBenedict(true), 1600);
    return () => clearTimeout(t);
  }, [benedictDue]);
  // кнопка-силуэт на карте зовёт Бенедикта
  const [visit, setVisit] = useState(false);
  // на шестой день игры Бенедикт предлагает выбрать путь (рыцарь, чародей, торговец)
  const daysPlayed = Object.values(s.days).filter((d) => d.opened || d.walkedM > 0).length;
  const classDue =
    !!s.kingdom && !!s.flags.metBenedict && !s.cls && (daysPlayed >= 5 || !!s.flags.clsNow) && s.flags.clsDefer !== dayKey() &&
    !unlock && !s.ui.showFounding && !s.walk && tab === 'map' && !benedict && !visit;
  const [pickClass, setPickClass] = useState(false);
  const [pathDone, setPathDone] = useState(false);
  // на седьмой день игры (или с регалией «Семь дней в седле») Бенедикт один раз просит чаю
  const [tea, setTea] = useState(false);
  const teaDue =
    !!s.kingdom && !!s.flags.metBenedict && !s.flags.teaTold && (daysPlayed >= 7 || !!s.unlocked.streak7) && s.flags.clsDefer !== dayKey() &&
    !unlock && !s.ui.showFounding && !s.walk && tab === 'map' && !benedict && !visit && !classDue && !pickClass && !pathDone;
  useEffect(() => {
    if (!teaDue) return;
    music.preload();
    const t = setTimeout(() => setTea(true), 1800);
    return () => clearTimeout(t);
  }, [teaDue]);
  useEffect(() => {
    if (!classDue) return;
    music.preload();
    const t = setTimeout(() => setPickClass(true), 1800);
    return () => clearTimeout(t);
  }, [classDue]);
  useEffect(() => {
    const call = () => {
      if (!s.kingdom) return;
      if (!s.flags.metBenedict) return setBenedict(true);
      if (s.bene && sulking(s.bene)) {
        act.notify('Бенедикт молчит', `${SULK[Math.floor(Math.random() * SULK.length)]} (${sulkLeft(s.bene)})`);
        return;
      }
      setVisit(true);
    };
    window.addEventListener('bene:call', call);
    return () => window.removeEventListener('bene:call', call);
  }, [s.kingdom, s.flags.metBenedict, s.bene, act]);
  const unseen = REGALIA.some((r) => s.unlocked[r.id] && !s.seen[r.id]);

  return (
    <div className="app">
      {tab === 'map' && <MapScreen />}
      {tab === 'quests' && <QuestsScreen />}
      {tab === 'regalia' && <RegaliaScreen />}
      {tab === 'chronicle' && <ChronicleScreen />}
      {tab === 'hero' && (settings ? <SettingsScreen onBack={() => setSettings(false)} /> : <HeroScreen onSettings={() => setSettings(true)} />)}

      <TabBar
        tab={tab}
        onTab={(t) => {
          setTab(t);
          setSettings(false);
        }}
        dots={{ regalia: unseen }}
      />
      <Toasts />

      {s.ui.showFounding && !unlock && <KingdomEditor />}
      {unlock && !visit && !benedict && !pickClass && !pathDone && !tea && (
        <RegaliaSheet
          r={unlock}
          fresh
          onClose={() => {
            act.markSeen(unlock.id);
            act.shiftUnlock();
          }}
        />
      )}
      <div className="rot-lock" aria-hidden="true">
        <div className="rot-phone" />
        <div>Поверни телефон вертикально</div>
      </div>
      {benedict && s.kingdom && (
        <BenedictDialog
          kingdom={s.kingdom.name}
          onDone={(sulk) => {
            setBenedict(false);
            act.meetBenedict(true, sulk);
          }}
        />
      )}
      {visit && <BenedictVisit onDone={() => setVisit(false)} />}
      {pickClass && (
        <ClassDialog onLeaving={(chosen) => chosen && setPathDone(true)} onDone={() => setPickClass(false)} />
      )}
      {tea && (
        <TeaDialog
          onDone={(toTreasury) => {
            setTea(false);
            if (toTreasury) {
              setTab('hero');
              setSettings(true);
            }
          }}
        />
      )}
      {pathDone && s.cls && <PathSheet cls={s.cls} onClose={() => setPathDone(false)} />}
    </div>
  );
}
