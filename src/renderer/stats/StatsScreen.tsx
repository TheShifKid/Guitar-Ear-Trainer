import { useState } from 'react';
import { useStats, accuracyForInterval } from '@renderer/store/statsStore';
import { useSettings } from '@renderer/store/settingsStore';
import { INTERVAL_BY_ID, INTERVALS } from '@renderer/music/intervals';
import { ConfusionMatrix } from './ConfusionMatrix';
import { AccuracyChart } from './AccuracyChart';

type Window = 7 | 30 | 0;

export function StatsScreen() {
  const stats = useStats();
  const { enabledIntervals } = useSettings();
  const [w, setW] = useState<Window>(7);

  const focusIntervals = enabledIntervals.length > 0 ? enabledIntervals : INTERVALS.map((i) => i.id);
  const minutes = Math.round(stats.practiceMs / 60000);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 overflow-y-auto h-full">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stats</h1>
        <button
          onClick={() => {
            if (confirm('Reset all stats? This cannot be undone.')) stats.reset();
          }}
          className="text-xs px-2 py-1 rounded border border-ink-600 text-slate-400 hover:text-bad"
        >
          Reset stats
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total reps" value={stats.totalReps} />
        <Stat label="Current streak" value={stats.currentStreak} accent />
        <Stat label="Best streak" value={stats.bestStreak} />
        <Stat label="Sessions" value={stats.totalSessions} />
      </div>

      <section className="rounded-xl border border-ink-600 bg-ink-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm uppercase tracking-wide text-slate-400">Daily accuracy</h2>
          <div className="flex gap-1 text-xs">
            {([7, 30, 0] as Window[]).map((d) => (
              <button
                key={d}
                onClick={() => setW(d)}
                className={`px-2 py-1 rounded ${w === d ? 'bg-accent/20 text-accent' : 'text-slate-400'}`}
              >
                {d === 0 ? 'All' : `${d}d`}
              </button>
            ))}
          </div>
        </div>
        <AccuracyChart daily={stats.daily} days={w === 0 ? stats.daily.length : w} />
      </section>

      <section className="rounded-xl border border-ink-600 bg-ink-800 p-4">
        <h2 className="text-sm uppercase tracking-wide text-slate-400 mb-3">Per-interval accuracy</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {focusIntervals.map((id) => {
            const all = accuracyForInterval(stats.results, id);
            const recent = accuracyForInterval(stats.results, id, 20);
            const reps = stats.results.filter((r) => r.intervalId === id).length;
            const mastery = reps >= 20 && recent >= 0.85;
            return (
              <div key={id} className="p-3 rounded-md border border-ink-700 bg-ink-700/50">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">{INTERVAL_BY_ID[id].short}</span>
                  {mastery && (
                    <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-good/20 text-good">
                      mastered
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400">{INTERVAL_BY_ID[id].name}</div>
                <div className="mt-1 text-xs font-mono">
                  <span>all: {pct(all)}</span>
                  <span className="ml-3">last 20: {pct(recent)}</span>
                  <span className="ml-3 text-slate-500">{reps} reps</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-ink-600 bg-ink-800 p-4">
        <h2 className="text-sm uppercase tracking-wide text-slate-400 mb-3">Confusion matrix</h2>
        <ConfusionMatrix results={stats.results} intervals={focusIntervals} />
      </section>

      <section className="text-xs text-slate-500">
        Practice time: {minutes} min · stored in browser localStorage (ear-trainer-stats).
      </section>
    </div>
  );
}

function pct(v: number): string {
  return v === 0 ? '–' : `${Math.round(v * 100)}%`;
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-ink-600 bg-ink-800 p-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`text-2xl font-bold ${accent ? 'text-accent' : 'text-slate-100'}`}>{value}</div>
    </div>
  );
}
