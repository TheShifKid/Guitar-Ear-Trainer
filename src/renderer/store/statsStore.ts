import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AnswerResult, IntervalId, StatsState } from '@shared/types';

interface StatsStoreActions {
  recordAnswer: (r: AnswerResult) => void;
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
};

function todayKey(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
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
        // Cap results to last 5000 for memory
        const results = s.results.length >= 5000 ? [...s.results.slice(-4999), r] : [...s.results, r];
        set({
          results,
          totalReps: s.totalReps + 1,
          currentStreak: newStreak,
          bestStreak: Math.max(s.bestStreak, newStreak),
          daily,
        });
      },
      reset: () => set({ ...initial }),
    }),
    { name: 'ear-trainer-stats' },
  ),
);

export function accuracyForInterval(results: AnswerResult[], id: IntervalId, window = Infinity): number {
  const filtered = results.filter((r) => r.intervalId === id);
  const slice = window === Infinity ? filtered : filtered.slice(-window);
  if (slice.length === 0) return 0;
  return slice.filter((r) => r.correct).length / slice.length;
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
