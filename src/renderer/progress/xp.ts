import type { AnswerResult } from '@shared/types';

// XP for a single answer. Correct answers earn a base amount plus a small
// streak bonus; using a hint halves it; wrong answers earn nothing.
export function xpForAnswer(r: AnswerResult, streakAfter: number): number {
  if (!r.correct) return 0;
  let xp = r.usedHint ? 5 : 10;
  xp += Math.min(10, Math.floor(streakAfter / 5)); // up to +10 for hot streaks
  return xp;
}

// Quadratic level curve: level N starts at (N-1)^2 * 100 XP.
export function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
}

export function xpForLevel(level: number): number {
  return (level - 1) * (level - 1) * 100;
}

export function levelProgress(xp: number): { level: number; into: number; span: number; pct: number } {
  const level = levelFromXp(xp);
  const start = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const span = next - start;
  const into = xp - start;
  return { level, into, span, pct: span > 0 ? into / span : 0 };
}
