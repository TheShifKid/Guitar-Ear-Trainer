import { useState, type ReactNode } from 'react';
import { Headphones, BarChart3, SlidersHorizontal } from 'lucide-react';
import { TrainerScreen } from './trainer/TrainerScreen';
import { SettingsScreen } from './settings/SettingsScreen';
import { StatsScreen } from './stats/StatsScreen';

type Tab = 'trainer' | 'stats' | 'settings';

export default function App() {
  const [tab, setTab] = useState<Tab>('trainer');

  return (
    <div className="h-full flex flex-col bg-ink-900">
      {/* Top bar */}
      <header className="shrink-0 h-11 flex items-center justify-between px-5 border-b border-ink-700 bg-ink-900">
        <div className="flex items-center gap-2.5">
          <Headphones className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold tracking-tight text-slate-200">Guitar Ear Trainer</span>
        </div>
        <nav className="flex items-center gap-1">
          <NavTab id="trainer" current={tab} label="Train"    icon={<Headphones className="w-4 h-4" />}         onClick={setTab} />
          <NavTab id="stats"   current={tab} label="Stats"   icon={<BarChart3 className="w-4 h-4" />}           onClick={setTab} />
          <NavTab id="settings" current={tab} label="Settings" icon={<SlidersHorizontal className="w-4 h-4" />} onClick={setTab} />
        </nav>
      </header>

      <main className="flex-1 overflow-hidden">
        {tab === 'trainer'  && <TrainerScreen />}
        {tab === 'stats'    && <StatsScreen />}
        {tab === 'settings' && <SettingsScreen />}
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
          ? 'bg-accent/15 text-accent'
          : 'text-slate-500 hover:text-slate-300 hover:bg-ink-700',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  );
}
