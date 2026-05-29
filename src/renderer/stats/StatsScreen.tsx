import { useState } from 'react';
import { useStats, accuracyForInterval, buildConfusionMatrix, computeDayStreak } from '@renderer/store/statsStore';
import { useSettings } from '@renderer/store/settingsStore';
import { INTERVAL_BY_ID, INTERVALS } from '@renderer/music/intervals';
import { ConfusionMatrix } from './ConfusionMatrix';
import { AccuracyChart } from './AccuracyChart';
import { levelProgress } from '@renderer/progress/xp';
import { ACHIEVEMENTS } from '@renderer/progress/achievements';
import type { AnswerResult, IntervalId } from '@shared/types';

type Window = 7 | 30 | 0;

export function StatsScreen() {
  const stats = useStats();
  const { enabledIntervals } = useSettings();
  const [w, setW] = useState<Window>(30);

  const focus = enabledIntervals.length > 0 ? enabledIntervals : INTERVALS.map((i) => i.id);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayReps = stats.daily.find((d) => d.date === todayKey)?.total ?? 0;
  const lp = levelProgress(stats.totalXp);
  const dayStreak = computeDayStreak(stats.daily);
  const advice = buildAdvice(focus, stats.results);
  const unlocked = stats.unlockedAchievements.length;

  return (
    <div className="h-full overflow-y-auto">
      <header className="flex justify-between items-end px-4 md:px-8 py-6 md:py-8 sticky top-0 z-10 bg-surface-container-low border-b border-outline-variant/30">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tighter text-primary-fixed-dim leading-none">Progress Overview</h1>
          <p className="text-on-surface-variant mt-2 text-lg">Tracking your evolution from Novice to Virtuoso.</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="font-mono text-[11px] tracking-wider text-secondary">TOTAL REPS</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-on-surface">{stats.totalReps.toLocaleString()}</span>
            {todayReps > 0 && <span className="font-mono text-xs text-secondary-container">+{todayReps} today</span>}
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-6 grid grid-cols-12 gap-4 md:gap-6">
        {/* Accuracy chart */}
        <section className="col-span-12 lg:col-span-8 surface-card rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-semibold text-on-surface">Accuracy Over Time</h3>
              <p className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">Consolidated across all modules</p>
            </div>
            <div className="flex bg-surface-container-highest rounded-full p-1 border border-outline-variant/20">
              {([7, 30, 0] as Window[]).map((d) => (
                <button key={d} onClick={() => setW(d)}
                  className={['px-4 py-1 rounded-full font-mono text-[10px]', w === d ? 'bg-primary text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'].join(' ')}>
                  {d === 0 ? 'ALL' : `${d}D`}
                </button>
              ))}
            </div>
          </div>
          <AccuracyChart daily={stats.daily} days={w === 0 ? stats.daily.length : w} />
        </section>

        {/* Mastery levels */}
        <section className="col-span-12 lg:col-span-4 surface-card rounded-2xl p-6">
          <h3 className="text-2xl font-semibold text-on-surface">Mastery Levels</h3>
          <p className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant mb-5">Rolling 20-rep accuracy</p>
          <div className="flex flex-col gap-4">
            {focus.slice(0, 6).map((id) => {
              const acc = accuracyForInterval(stats.results, id, 20);
              const reps = stats.results.filter((r) => r.intervalId === id).length;
              const pctv = Math.round(acc * 100);
              const color = reps === 0 ? 'text-outline' : pctv >= 85 ? 'text-secondary' : pctv >= 70 ? 'text-primary-fixed-dim' : pctv >= 50 ? 'text-on-tertiary-container' : 'text-on-surface-variant';
              const bar = reps === 0 ? 'bg-outline/40' : pctv >= 85 ? 'bg-secondary' : pctv >= 70 ? 'bg-primary-fixed-dim' : pctv >= 50 ? 'bg-on-tertiary-container' : 'bg-outline';
              return (
                <div key={id} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface">{INTERVAL_BY_ID[id].name}</span>
                    <span className={['font-mono', color].join(' ')}>{reps === 0 ? '–' : `${pctv}%`}</span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                    <div className={['h-full rounded-full', bar, pctv >= 85 ? 'shadow-[0_0_15px_rgba(78,222,163,0.4)]' : ''].join(' ')} style={{ width: `${reps === 0 ? 0 : pctv}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Confusion matrix */}
        <section className="col-span-12 lg:col-span-7 surface-card rounded-2xl p-6">
          <h3 className="text-2xl font-semibold text-on-surface">Confusion Matrix</h3>
          <p className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant mb-5">Identifying frequent mistakes</p>
          <ConfusionMatrix results={stats.results} intervals={focus} />
        </section>

        {/* Recent sessions */}
        <section className="col-span-12 lg:col-span-5 surface-card rounded-2xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-2xl font-semibold text-on-surface">Recent Activity</h3>
              <p className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">Last practiced days</p>
            </div>
            <span className="material-symbols-outlined text-primary-fixed-dim">history</span>
          </div>
          <div className="flex flex-col gap-3 flex-grow">
            {stats.daily.slice(-4).reverse().map((d, i) => {
              const acc = d.total ? Math.round((d.correct / d.total) * 100) : 0;
              const color = acc >= 90 ? 'text-secondary' : acc >= 75 ? 'text-primary-fixed-dim' : 'text-on-surface';
              return (
                <div key={d.date} className="bg-surface-container-highest p-4 rounded-lg flex items-center justify-between border border-transparent hover:border-outline-variant transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-primary-container/20 flex items-center justify-center text-primary-fixed-dim">
                      <span className="material-symbols-outlined">{['music_note', 'piano', 'album', 'graphic_eq'][i % 4]}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface">{d.date.slice(5)}</h4>
                      <p className="font-mono text-[10px] uppercase text-on-surface-variant">{d.total} reps</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={['font-bold', color].join(' ')}>{acc}%</div>
                    <div className="font-mono text-[10px] text-on-surface-variant">ACCURACY</div>
                  </div>
                </div>
              );
            })}
            {stats.daily.length === 0 && <p className="text-on-surface-variant/50 text-sm">No activity yet — start practicing.</p>}
          </div>
        </section>

        {/* Practice advice */}
        <section className="col-span-12 bg-gradient-to-r from-surface-container-low to-surface-container-high rounded-xl p-8 border border-outline-variant/30 relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary-fixed-dim/5 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl text-center md:text-left">
              <h3 className="text-2xl font-bold text-on-surface mb-2">Practice Advice</h3>
              <p className="text-lg text-on-surface-variant">{advice}</p>
            </div>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <span className="font-mono text-[11px] text-secondary">DAY STREAK</span>
              <span className="text-5xl font-bold text-secondary">{dayStreak}</span>
            </div>
          </div>
        </section>

        {/* Level + achievements (extra) */}
        <section className="col-span-12 surface-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-fixed-dim/15 border-2 border-primary-fixed-dim flex items-center justify-center text-primary-fixed-dim font-bold">{lp.level}</div>
              <div>
                <div className="font-semibold text-on-surface">Level {lp.level}</div>
                <div className="font-mono text-xs text-on-surface-variant">{stats.totalXp} XP · {unlocked}/{ACHIEVEMENTS.length} achievements</div>
              </div>
            </div>
            <div className="w-1/2 max-w-xs">
              <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
                <div className="h-full bg-primary-fixed-dim" style={{ width: `${Math.round(lp.pct * 100)}%` }} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {ACHIEVEMENTS.map((a) => {
              const got = stats.unlockedAchievements.some((u) => u.id === a.id);
              return (
                <span key={a.id} title={`${a.name} — ${a.description}`}
                  className={['text-xl w-9 h-9 flex items-center justify-center rounded-lg border', got ? 'border-secondary/40 bg-secondary/5' : 'border-outline-variant/30 opacity-30 grayscale'].join(' ')}>
                  {a.icon}
                </span>
              );
            })}
          </div>
        </section>

        <div className="col-span-12 flex justify-center">
          <button onClick={() => { if (confirm('Reset all stats? This cannot be undone.')) stats.reset(); }}
            className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant hover:text-error transition-colors">
            Reset all stats
          </button>
        </div>
      </div>
    </div>
  );
}

// Find the most-confused interval pair and turn it into advice text.
function buildAdvice(focus: IntervalId[], results: AnswerResult[]): string {
  if (results.length < 10) return 'Keep practicing — once you have more reps, personalized advice will appear here based on your most common mix-ups.';
  const m = buildConfusionMatrix(results, focus);
  let best = { a: '' as IntervalId, b: '' as IntervalId, n: 0 };
  for (const a of focus) for (const b of focus) {
    if (a !== b && m[a]?.[b] > best.n) best = { a, b, n: m[a][b] };
  }
  if (best.n === 0) return 'Your accuracy is clean across the board — try enabling a harder interval to keep growing.';
  return `You're confusing ${INTERVAL_BY_ID[best.a].name} with ${INTERVAL_BY_ID[best.b].name} most often. Try drilling just those two in isolation for a few minutes to internalize their difference.`;
}
