import { useEffect, useState } from 'react';
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
  const unseen = Object.keys(s.unlocked).some((id) => !s.seen[id]);

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
    </div>
  );
}
