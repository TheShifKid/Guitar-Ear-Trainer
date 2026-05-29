import { useState } from 'react';
import { TrainerScreen } from './trainer/TrainerScreen';
import { SettingsScreen } from './settings/SettingsScreen';
import { StatsScreen } from './stats/StatsScreen';
import { ChallengeScreen } from './challenge/ChallengeScreen';
import { ChordScreen } from './chord/ChordScreen';
import { ProgressionScreen } from './progression/ProgressionScreen';
import { MelodicScreen } from './melodic/MelodicScreen';
import { HomeScreen } from './HomeScreen';
import type { HomeItem } from './HomeScreen';

type Tab = 'home' | 'trainer' | 'chords' | 'progressions' | 'melodic' | 'challenge' | 'stats' | 'settings';

const NAV: (HomeItem & { id: Tab })[] = [
  { id: 'trainer', label: 'Practice', icon: 'school', desc: 'Identify intervals by ear on the fretboard.', tone: 'primary' },
  { id: 'chords', label: 'Chords', icon: 'piano', desc: 'Recognize chord qualities and shapes.', tone: 'primary' },
  { id: 'progressions', label: 'Progressions', icon: 'queue_music', desc: 'Hear and name common chord progressions.', tone: 'primary' },
  { id: 'melodic', label: 'Melody', icon: 'graphic_eq', desc: 'Transcribe short melodic phrases.', tone: 'primary' },
  { id: 'challenge', label: 'Challenge', icon: 'timer', desc: 'Beat the clock in a timed drill.', tone: 'secondary' },
  { id: 'stats', label: 'Analytics', icon: 'insights', desc: 'Track accuracy, streaks and mastery.', tone: 'secondary' },
  { id: 'settings', label: 'Gear', icon: 'settings_input_component', desc: 'Tune fret range, audio and goals.', tone: 'secondary' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const current = NAV.find((n) => n.id === tab);

  return (
    <div className="h-full flex text-on-background">
      {/* ── Pro Studio sidebar (desktop only) ── */}
      <nav className="hidden md:flex w-60 shrink-0 h-full flex-col border-r border-outline-variant bg-surface-container-lowest">
        <button onClick={() => setTab('home')} className="p-6 text-left active:opacity-80">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-secondary block mb-1">Pro Studio</span>
          <h1 className="text-2xl font-bold tracking-tighter text-primary-fixed-dim">FretFlow Pro</h1>
          <p className="text-sm text-on-surface-variant/60">Ear Training Active</p>
        </button>

        <div className="flex-1 mt-2 space-y-1 overflow-y-auto">
          <button
            onClick={() => setTab('home')}
            className={[
              'w-full flex items-center gap-4 px-6 py-3.5 transition-all active:translate-x-1',
              tab === 'home'
                ? 'text-primary font-bold border-r-4 border-primary bg-surface-container-low'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
            ].join(' ')}
          >
            <span className="material-symbols-outlined">home</span>
            <span className="text-base">Home</span>
          </button>
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

        <div className="p-6">
          <div className="surface-card rounded-xl p-4 flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-secondary opacity-60 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-secondary" />
            </span>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] tracking-wider text-secondary">ACTIVE SESSION</span>
              <p className="text-sm text-on-surface">Ear Training</p>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main content ── */}
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        {/* Mobile top bar: logo on home, back button elsewhere */}
        <header className="md:hidden shrink-0 flex items-center gap-3 px-4 py-3 border-b border-outline-variant bg-surface-container-lowest">
          {tab === 'home' ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-secondary">Pro Studio</span>
              <h1 className="text-lg font-bold tracking-tighter text-primary-fixed-dim">FretFlow Pro</h1>
            </div>
          ) : (
            <button onClick={() => setTab('home')} className="flex items-center gap-2 text-on-surface active:opacity-70">
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="text-base font-semibold">{current?.label}</span>
            </button>
          )}
        </header>

        <main className="flex-1 overflow-hidden">
          {tab === 'home' && <HomeScreen items={NAV} onSelect={(id) => setTab(id as Tab)} />}
          {tab === 'trainer' && <TrainerScreen />}
          {tab === 'chords' && <ChordScreen />}
          {tab === 'progressions' && <ProgressionScreen />}
          {tab === 'melodic' && <MelodicScreen />}
          {tab === 'challenge' && <ChallengeScreen />}
          {tab === 'stats' && <StatsScreen />}
          {tab === 'settings' && <SettingsScreen />}
        </main>
      </div>
    </div>
  );
}
