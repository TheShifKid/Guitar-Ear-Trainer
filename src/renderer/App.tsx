import { useState } from 'react';
import { TrainerScreen } from './trainer/TrainerScreen';
import { SettingsScreen } from './settings/SettingsScreen';
import { StatsScreen } from './stats/StatsScreen';
import { ChallengeScreen } from './challenge/ChallengeScreen';
import { ChordScreen } from './chord/ChordScreen';
import { ProgressionScreen } from './progression/ProgressionScreen';
import { MelodicScreen } from './melodic/MelodicScreen';

type Tab = 'trainer' | 'chords' | 'progressions' | 'melodic' | 'challenge' | 'stats' | 'settings';

const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: 'trainer', label: 'Practice', icon: 'school' },
  { id: 'chords', label: 'Chords', icon: 'piano' },
  { id: 'progressions', label: 'Progressions', icon: 'queue_music' },
  { id: 'melodic', label: 'Melody', icon: 'graphic_eq' },
  { id: 'challenge', label: 'Challenge', icon: 'timer' },
  { id: 'stats', label: 'Analytics', icon: 'insights' },
  { id: 'settings', label: 'Gear', icon: 'settings_input_component' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('trainer');

  return (
    <div className="h-full flex text-on-background">
      {/* ── Pro Studio sidebar ── */}
      <nav className="w-60 shrink-0 h-full flex flex-col border-r border-outline-variant bg-surface-container-lowest">
        <div className="p-6">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-secondary block mb-1">Pro Studio</span>
          <h1 className="text-2xl font-bold tracking-tighter text-primary-fixed-dim">FretFlow Pro</h1>
          <p className="text-sm text-on-surface-variant/60">Ear Training Active</p>
        </div>

        <div className="flex-1 mt-2 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const active = item.id === tab;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={[
                  'w-full flex items-center gap-4 px-6 py-3.5 transition-all active:translate-x-1',
                  active
                    ? 'text-primary font-bold border-r-4 border-primary bg-surface-container-low'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
                ].join(' ')}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-base">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant flex flex-col gap-1">
            <span className="font-mono text-[10px] tracking-wider text-secondary">ACTIVE SESSION</span>
            <p className="text-sm text-on-surface">Ear Training Active</p>
          </div>
          <button className="w-full py-3.5 px-4 bg-primary-container text-on-primary-container font-semibold rounded-lg active:scale-95 transition-transform milled-button">
            Upgrade Pro
          </button>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main className="flex-1 h-full overflow-hidden">
        {tab === 'trainer' && <TrainerScreen />}
        {tab === 'chords' && <ChordScreen />}
        {tab === 'progressions' && <ProgressionScreen />}
        {tab === 'melodic' && <MelodicScreen />}
        {tab === 'challenge' && <ChallengeScreen />}
        {tab === 'stats' && <StatsScreen />}
        {tab === 'settings' && <SettingsScreen />}
      </main>
    </div>
  );
}
