import { useState } from 'react';
import { useStats, accuracyForInterval, computeDayStreak, masteredIntervalCount } from '@renderer/store/statsStore';
import { useSettings } from '@renderer/store/settingsStore';
import { INTERVAL_BY_ID, INTERVALS } from '@renderer/music/intervals';
import { ConfusionMatrix } from './ConfusionMatrix';
import { AccuracyChart } from './AccuracyChart';
import { levelProgress } from '@renderer/progress/xp';
import { ACHIEVEMENTS } from '@renderer/progress/achievements';
import { CHORDS } from '@renderer/music/chords';

type Window = 7 | 30 | 0;

export function StatsScreen() {
  const stats = useStats();
  const { enabledIntervals, dailyGoalReps } = useSettings();
  const [w, setW] = useState<Window>(7);

  const focusIntervals = enabledIntervals.length > 0 ? enabledIntervals : INTERVALS.map((i) => i.id);
  const minutes = Math.round(stats.practiceMs / 60000);

  const lp = levelProgress(stats.totalXp);
  const dayStreak = computeDayStreak(stats.daily);
  const mastered = masteredIntervalCount(stats.results);
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const todayReps = stats.daily.find((d) => d.date === todayKey)?.total ?? 0;
  const goalPct = dailyGoalReps > 0 ? Math.min(1, todayReps / dailyGoalReps) : 0;
  const unlockedIds = new Set(stats.unlockedAchievements.map((a) => a.id));

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

      {/* Level + XP hero */}
      <section className="rounded-xl border border-ink-600 bg-gradient-to-br from-ink-700 to-ink-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-accent/15 border-2 border-accent flex items-center justify-center">
              <span className="text-accent font-bold text-lg">{lp.level}</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100">Level {lp.level}</div>
              <div className="text-xs text-slate-500">{stats.totalXp} XP total</div>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            {lp.span - lp.into} XP to level {lp.level + 1}
          </div>
        </div>
        <div className="h-2 rounded-full bg-ink-900 overflow-hidden">
          <div className="h-full bg-accent transition-all" style={{ width: `${Math.round(lp.pct * 100)}%` }} />
        </div>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Day streak" value={dayStreak} accent />
        <Stat label="Best streak" value={stats.bestStreak} />
        <Stat label="Total reps" value={stats.totalReps} />
        <Stat label="Timed best" value={stats.bestTimedScore} />
      </div>

      {/* Daily goal */}
      <section className="rounded-xl border border-ink-600 bg-ink-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm uppercase tracking-wide text-slate-400">Today's goal</h2>
          <span className="text-xs text-slate-500">{todayReps} / {dailyGoalReps} reps</span>
        </div>
        <div className="h-3 rounded-full bg-ink-900 overflow-hidden">
          <div
            className={`h-full transition-all ${goalPct >= 1 ? 'bg-good' : 'bg-accent'}`}
            style={{ width: `${Math.round(goalPct * 100)}%` }}
          />
        </div>
        {goalPct >= 1 && <p className="text-xs text-good mt-2">✓ Goal hit today — nice.</p>}
      </section>

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

      {stats.chordResults.length > 0 && (
        <section className="rounded-xl border border-ink-600 bg-ink-800 p-4">
          <h2 className="text-sm uppercase tracking-wide text-slate-400 mb-3">Chord accuracy</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {CHORDS.map((c) => {
              const rs = stats.chordResults.filter((r) => r.quality === c.id);
              if (rs.length === 0) return null;
              const acc = rs.filter((r) => r.correct).length / rs.length;
              return (
                <div key={c.id} className="p-3 rounded-md border border-ink-700 bg-ink-700/50">
                  <div className="font-mono text-sm text-slate-200">{c.short}</div>
                  <div className="text-xs text-slate-400">{c.name}</div>
                  <div className="mt-1 text-xs font-mono">{pct(acc)} · {rs.length} reps</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Calendar heatmap (last ~16 weeks) */}
      <section className="rounded-xl border border-ink-600 bg-ink-800 p-4">
        <h2 className="text-sm uppercase tracking-wide text-slate-400 mb-3">Practice calendar</h2>
        <CalendarHeatmap daily={stats.daily} />
      </section>

      {/* Achievements */}
      <section className="rounded-xl border border-ink-600 bg-ink-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm uppercase tracking-wide text-slate-400">Achievements</h2>
          <span className="text-xs text-slate-500">{unlockedIds.size} / {ACHIEVEMENTS.length}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {ACHIEVEMENTS.map((a) => {
            const got = unlockedIds.has(a.id);
            return (
              <div
                key={a.id}
                className={[
                  'flex items-center gap-2 p-2.5 rounded-lg border',
                  got ? 'border-accent/40 bg-accent/5' : 'border-ink-700 bg-ink-900/40 opacity-50',
                ].join(' ')}
                title={a.description}
              >
                <span className={['text-xl', got ? '' : 'grayscale'].join(' ')}>{a.icon}</span>
                <div className="min-w-0">
                  <div className={['text-xs font-semibold truncate', got ? 'text-slate-200' : 'text-slate-500'].join(' ')}>{a.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{a.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="text-xs text-slate-500">
        Practice time: {minutes} min · {mastered} intervals mastered · stored in browser localStorage.
      </section>
    </div>
  );
}

function CalendarHeatmap({ daily }: { daily: { date: string; total: number }[] }) {
  const byDate = new Map(daily.map((d) => [d.date, d.total]));
  const weeks = 16;
  const cols: { date: string; total: number }[][] = [];
  const cursor = new Date();
  // Move cursor back to the most recent Sunday for clean week columns.
  cursor.setDate(cursor.getDate() - cursor.getDay());
  for (let w = weeks - 1; w >= 0; w--) {
    const col: { date: string; total: number }[] = [];
    for (let day = 0; day < 7; day++) {
      const d = new Date(cursor);
      d.setDate(cursor.getDate() - w * 7 + day);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      col.push({ date: key, total: byDate.get(key) ?? 0 });
    }
    cols.push(col);
  }
  const level = (n: number) => (n === 0 ? 'bg-ink-700' : n < 10 ? 'bg-accent/30' : n < 25 ? 'bg-accent/60' : 'bg-accent');
  return (
    <div className="flex gap-1 overflow-x-auto">
      {cols.map((col, i) => (
        <div key={i} className="flex flex-col gap-1">
          {col.map((cell) => (
            <div key={cell.date} title={`${cell.date}: ${cell.total} reps`} className={`w-3 h-3 rounded-sm ${level(cell.total)}`} />
          ))}
        </div>
      ))}
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
