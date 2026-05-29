import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AnswerResult, ChordResult, DailyAggregate, IntervalId, StatsState } from '@shared/types';
import { xpForAnswer } from '@renderer/progress/xp';
import { ACHIEVEMENTS, buildContext } from '@renderer/progress/achievements';

interface StatsStoreActions {
  recordAnswer: (r: AnswerResult) => void;
  recordChordAnswer: (r: ChordResult) => void;
  recordGeneric: (correct: boolean) => void;
  recordTimedScore: (score: number) => void;
  startSession: () => void;
  addPracticeMs: (ms: number) => void;
  reset: () => void;
}

const initial: StatsState = {
  results: [],
  bestStreak: 0,
  currentStreak: 0,
  totalReps: 0,
  totalSessions: 0,
  practiceMs: 0,
  daily: [],
  totalXp: 0,
  unlockedAchievements: [],
  bestTimedScore: 0,
  chordResults: [],
};

function todayKey(d = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// Re-check all achievements against current state; append any newly unlocked.
function refreshAchievements(s: StatsState): StatsState['unlockedAchievements'] {
  const ctx = buildContext(s, masteredIntervalCount(s.results), computeDayStreak(s.daily));
  const have = new Set(s.unlockedAchievements.map((a) => a.id));
  const now = Date.now();
  const added = ACHIEVEMENTS.filter((a) => !have.has(a.id) && a.test(ctx)).map((a) => ({ id: a.id, at: now }));
  return added.length ? [...s.unlockedAchievements, ...added] : s.unlockedAchievements;
}

export const useStats = create<StatsState & StatsStoreActions>()(
  persist(
    (set, get) => ({
      ...initial,
      startSession: () => set({ totalSessions: get().totalSessions + 1 }),
      addPracticeMs: (ms) => set({ practiceMs: get().practiceMs + ms }),
      recordAnswer: (r) => {
        const s = get();
        const newStreak = r.correct ? s.currentStreak + 1 : 0;
        const today = todayKey();
        const daily = [...s.daily];
        const idx = daily.findIndex((d) => d.date === today);
        if (idx >= 0) {
          daily[idx] = { ...daily[idx], total: daily[idx].total + 1, correct: daily[idx].correct + (r.correct ? 1 : 0) };
        } else {
          daily.push({ date: today, total: 1, correct: r.correct ? 1 : 0 });
        }
        const results = s.results.length >= 5000 ? [...s.results.slice(-4999), r] : [...s.results, r];
        const next: StatsState = {
          ...s,
          results,
          totalReps: s.totalReps + 1,
          currentStreak: newStreak,
          bestStreak: Math.max(s.bestStreak, newStreak),
          daily,
          totalXp: s.totalXp + xpForAnswer(r, newStreak),
        };
        set({ ...next, unlockedAchievements: refreshAchievements(next) });
      },
      recordChordAnswer: (r) => {
        const s = get();
        const newStreak = r.correct ? s.currentStreak + 1 : 0;
        const today = todayKey();
        const daily = [...s.daily];
        const idx = daily.findIndex((d) => d.date === today);
        if (idx >= 0) {
          daily[idx] = { ...daily[idx], total: daily[idx].total + 1, correct: daily[idx].correct + (r.correct ? 1 : 0) };
        } else {
          daily.push({ date: today, total: 1, correct: r.correct ? 1 : 0 });
        }
        const chordResults = s.chordResults.length >= 5000 ? [...s.chordResults.slice(-4999), r] : [...s.chordResults, r];
        const xp = r.correct ? 10 + Math.min(10, Math.floor(newStreak / 5)) : 0;
        const next: StatsState = {
          ...s,
          chordResults,
          totalReps: s.totalReps + 1,
          currentStreak: newStreak,
          bestStreak: Math.max(s.bestStreak, newStreak),
          daily,
          totalXp: s.totalXp + xp,
        };
        set({ ...next, unlockedAchievements: refreshAchievements(next) });
      },
      recordGeneric: (correct) => {
        const s = get();
        const newStreak = correct ? s.currentStreak + 1 : 0;
        const today = todayKey();
        const daily = [...s.daily];
        const idx = daily.findIndex((d) => d.date === today);
        if (idx >= 0) {
          daily[idx] = { ...daily[idx], total: daily[idx].total + 1, correct: daily[idx].correct + (correct ? 1 : 0) };
        } else {
          daily.push({ date: today, total: 1, correct: correct ? 1 : 0 });
        }
        const xp = correct ? 12 + Math.min(10, Math.floor(newStreak / 5)) : 0;
        const next: StatsState = {
          ...s,
          totalReps: s.totalReps + 1,
          currentStreak: newStreak,
          bestStreak: Math.max(s.bestStreak, newStreak),
          daily,
          totalXp: s.totalXp + xp,
        };
        set({ ...next, unlockedAchievements: refreshAchievements(next) });
      },
      recordTimedScore: (score) => {
        const s = get();
        const next: StatsState = { ...s, bestTimedScore: Math.max(s.bestTimedScore, score) };
        set({ bestTimedScore: next.bestTimedScore, unlockedAchievements: refreshAchievements(next) });
      },
      reset: () => set({ ...initial }),
    }),
    {
      name: 'ear-trainer-stats',
      // Older saved state may lack new fields — backfill on load.
      merge: (persisted, current) => ({ ...current, ...(persisted as object) }),
    },
  ),
);

export function accuracyForInterval(results: AnswerResult[], id: IntervalId, window = Infinity): number {
  const filtered = results.filter((r) => r.intervalId === id);
  const slice = window === Infinity ? filtered : filtered.slice(-window);
  if (slice.length === 0) return 0;
  return slice.filter((r) => r.correct).length / slice.length;
}

export function masteredIntervalCount(results: AnswerResult[]): number {
  const ids = new Set(results.map((r) => r.intervalId));
  let count = 0;
  for (const id of ids) {
    const recent = results.filter((r) => r.intervalId === id).slice(-20);
    if (recent.length >= 20 && recent.filter((r) => r.correct).length / recent.length >= 0.85) count++;
  }
  return count;
}

// Consecutive calendar days (ending today or yesterday) with at least 1 rep.
export function computeDayStreak(daily: DailyAggregate[]): number {
  const days = new Set(daily.filter((d) => d.total > 0).map((d) => d.date));
  if (days.size === 0) return 0;
  let streak = 0;
  const cursor = new Date();
  // Allow the streak to count from today; if nothing today, start from yesterday.
  if (!days.has(todayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(todayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function buildConfusionMatrix(
  results: AnswerResult[],
  ids: IntervalId[],
): Record<IntervalId, Record<IntervalId, number>> {
  const m = {} as Record<IntervalId, Record<IntervalId, number>>;
  for (const i of ids) {
    m[i] = {} as Record<IntervalId, number>;
    for (const j of ids) m[i][j] = 0;
  }
  for (const r of results) {
    if (!m[r.intervalId] || m[r.intervalId][r.guessedId] === undefined) continue;
    m[r.intervalId][r.guessedId] += 1;
  }
  return m;
}
