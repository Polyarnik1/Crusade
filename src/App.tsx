import { useEffect, useState } from 'react';
import { sfx } from './audio/sfx';
import { BenedictDialog } from './components/Benedict';
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
    const t = setTimeout(() => setBenedict(true), 1600);
    return () => clearTimeout(t);
  }, [benedictDue]);
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
      {unlock && (
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
          onDone={() => {
            setBenedict(false);
            act.meetBenedict();
          }}
        />
      )}
    </div>
  );
}
