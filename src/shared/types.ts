export type IntervalId =
  | 'P1' | 'm2' | 'M2' | 'm3' | 'M3' | 'P4' | 'TT'
  | 'P5' | 'm6' | 'M6' | 'm7' | 'M7' | 'P8';

export interface IntervalDef {
  id: IntervalId;
  semitones: number;
  name: string;
  short: string;
  defaultOn: boolean;
}

export type StringIndex = 0 | 1 | 2 | 3 | 4 | 5;

export interface FretPosition {
  string: StringIndex;
  fret: number;
  midi: number;
  noteName: string;
}

export interface Question {
  id: string;
  root: FretPosition;
  target: FretPosition;
  intervalId: IntervalId;
  ascending: boolean;
  createdAt: number;
}

export interface AnswerResult {
  questionId: string;
  intervalId: IntervalId;
  guessedId: IntervalId;
  correct: boolean;
  usedReplay: boolean;
  usedHint: boolean;
  answeredAt: number;
}

export type ChordQuality = 'maj' | 'min' | 'dim' | 'aug' | 'dom7' | 'maj7' | 'min7';

export interface ChordResult {
  quality: ChordQuality;
  guessed: ChordQuality;
  correct: boolean;
  answeredAt: number;
}

export type TrainerMode = 'comfortable' | 'progressive' | 'custom';

export interface Settings {
  enabledIntervals: IntervalId[];
  mode: TrainerMode;
  fretMin: number;
  fretMax: number;
  enabledStrings: StringIndex[];
  noteDurationMs: number;
  gapMinMs: number;
  gapMaxMs: number;
  soundPack: 'acoustic' | 'electric';
  allowDescending: boolean;
  playbackMode: 'melodic' | 'harmonic';
  enableReferenceTone: boolean;
  referencePitch: number;
  showNotesBeforeAnswer: boolean;
  dailyGoalReps: number;
  enabledChords: ChordQuality[];
  melodyLength: number;
}

export interface DailyAggregate {
  date: string;
  total: number;
  correct: number;
}

export interface UnlockedAchievement {
  id: string;
  at: number;
}

export interface StatsState {
  results: AnswerResult[];
  bestStreak: number;
  currentStreak: number;
  totalReps: number;
  totalSessions: number;
  practiceMs: number;
  daily: DailyAggregate[];
  totalXp: number;
  unlockedAchievements: UnlockedAchievement[];
  bestTimedScore: number;
  chordResults: ChordResult[];
}
