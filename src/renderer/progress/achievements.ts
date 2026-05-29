import type { StatsState } from '@shared/types';
import { levelFromXp } from './xp';

export interface AchievementContext {
  stats: StatsState;
  level: number;
  dayStreak: number;
  masteredCount: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  test: (c: AchievementContext) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_correct', name: 'First Steps', description: 'Get your first answer right', icon: '🌱',
    test: (c) => c.stats.results.some((r) => r.correct) },
  { id: 'streak_10', name: 'On a Roll', description: '10 correct in a row', icon: '🔥',
    test: (c) => c.stats.bestStreak >= 10 },
  { id: 'streak_25', name: 'Locked In', description: '25 correct in a row', icon: '⚡',
    test: (c) => c.stats.bestStreak >= 25 },
  { id: 'streak_50', name: 'Unstoppable', description: '50 correct in a row', icon: '🚀',
    test: (c) => c.stats.bestStreak >= 50 },
  { id: 'streak_100', name: 'Perfect Pitch?', description: '100 correct in a row', icon: '👑',
    test: (c) => c.stats.bestStreak >= 100 },
  { id: 'reps_100', name: 'Warmed Up', description: '100 total reps', icon: '💪',
    test: (c) => c.stats.totalReps >= 100 },
  { id: 'reps_500', name: 'Dedicated', description: '500 total reps', icon: '🎯',
    test: (c) => c.stats.totalReps >= 500 },
  { id: 'reps_1000', name: 'Veteran', description: '1000 total reps', icon: '🏆',
    test: (c) => c.stats.totalReps >= 1000 },
  { id: 'level_5', name: 'Level 5', description: 'Reach level 5', icon: '⭐',
    test: (c) => c.level >= 5 },
  { id: 'level_10', name: 'Level 10', description: 'Reach level 10', icon: '🌟',
    test: (c) => c.level >= 10 },
  { id: 'days_3', name: 'Habit Forming', description: 'Practice 3 days in a row', icon: '📅',
    test: (c) => c.dayStreak >= 3 },
  { id: 'days_7', name: 'Full Week', description: 'Practice 7 days in a row', icon: '🗓️',
    test: (c) => c.dayStreak >= 7 },
  { id: 'days_30', name: 'Monthly Master', description: 'Practice 30 days in a row', icon: '💎',
    test: (c) => c.dayStreak >= 30 },
  { id: 'master_1', name: 'Sharp Ear', description: 'Master an interval (85%+ over last 20)', icon: '🎵',
    test: (c) => c.masteredCount >= 1 },
  { id: 'master_5', name: 'Tuned In', description: 'Master 5 intervals', icon: '🎼',
    test: (c) => c.masteredCount >= 5 },
  { id: 'timed_20', name: 'Quick Draw', description: 'Score 20 in a timed challenge', icon: '⏱️',
    test: (c) => c.stats.bestTimedScore >= 20 },
  { id: 'timed_30', name: 'Lightning Ears', description: 'Score 30 in a timed challenge', icon: '⚡',
    test: (c) => c.stats.bestTimedScore >= 30 },
];

export function buildContext(stats: StatsState, masteredCount: number, dayStreak: number): AchievementContext {
  return { stats, level: levelFromXp(stats.totalXp), dayStreak, masteredCount };
}
