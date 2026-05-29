import { useState, type ReactNode } from 'react';
import { Headphones, BarChart3, SlidersHorizontal, Timer, Music2, ListMusic, AudioWaveform } from 'lucide-react';
import { TrainerScreen } from './trainer/TrainerScreen';
import { SettingsScreen } from './settings/SettingsScreen';
import { StatsScreen } from './stats/StatsScreen';
import { ChallengeScreen } from './challenge/ChallengeScreen';
import { ChordScreen } from './chord/ChordScreen';
import { ProgressionScreen } from './progression/ProgressionScreen';
import { MelodicScreen } from './melodic/MelodicScreen';

type Tab = 'trainer' | 'chords' | 'progressions' | 'melodic' | 'challenge' | 'stats' | 'settings';

export default function App() {
  const [tab, setTab] = useState<Tab>('trainer');

  return (
    <div className="h-full flex flex-col bg-ink-900">
      {/* Top bar */}
      <header className="shrink-0 h-14 flex items-center justify-between px-5 border-b border-outline-variant/40 bg-surface-container-low">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold tracking-tighter text-primary-fixed-dim">FretFlow</span>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-secondary">Pro</span>
        </div>
        <nav className="flex items-center gap-1">
          <NavTab id="trainer"      current={tab} label="Intervals"  icon={<Headphones className="w-4 h-4" />}      onClick={setTab} />
          <NavTab id="chords"       current={tab} label="Chords"     icon={<Music2 className="w-4 h-4" />}          onClick={setTab} />
          <NavTab id="progressions" current={tab} label="Progress."  icon={<ListMusic className="w-4 h-4" />}       onClick={setTab} />
          <NavTab id="melodic"      current={tab} label="Melody"     icon={<AudioWaveform className="w-4 h-4" />}   onClick={setTab} />
          <NavTab id="challenge"    current={tab} label="Challenge"  icon={<Timer className="w-4 h-4" />}           onClick={setTab} />
          <NavTab id="stats"        current={tab} label="Stats"      icon={<BarChart3 className="w-4 h-4" />}       onClick={setTab} />
          <NavTab id="settings"     current={tab} label="Settings"   icon={<SlidersHorizontal className="w-4 h-4" />} onClick={setTab} />
        </nav>
      </header>

      <main className="flex-1 overflow-hidden">
        {tab === 'trainer'      && <TrainerScreen />}
        {tab === 'chords'       && <ChordScreen />}
        {tab === 'progressions' && <ProgressionScreen />}
        {tab === 'melodic'      && <MelodicScreen />}
        {tab === 'challenge'    && <ChallengeScreen />}
        {tab === 'stats'        && <StatsScreen />}
        {tab === 'settings'     && <SettingsScreen />}
      </main>
    </div>
  );
}

function NavTab({
  id, current, label, icon, onClick,
}: { id: Tab; current: Tab; label: string; icon: ReactNode; onClick: (t: Tab) => void }) {
  const active = id === current;
  return (
    <button
      onClick={() => onClick(id)}
      className={[
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition',
        active
          ? 'bg-primary-fixed-dim/15 text-primary-fixed-dim shadow-[inset_0_0_0_1px_rgba(0,218,243,0.25)]'
          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  );
}
