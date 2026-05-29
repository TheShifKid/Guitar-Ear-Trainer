import { create } from 'zustand';
import type { IntervalId, Question } from '@shared/types';

type Phase = 'idle' | 'playing' | 'awaiting' | 'revealed';

interface SessionState {
  phase: Phase;
  question: Question | null;
  lastCorrect: boolean | null;
  usedReplay: boolean;
  usedHint: boolean;
  eliminatedIds: IntervalId[];
  sessionStartedAt: number | null;
  setPhase: (p: Phase) => void;
  setQuestion: (q: Question | null) => void;
  setLastCorrect: (c: boolean | null) => void;
  setUsedReplay: (b: boolean) => void;
  setUsedHint: (b: boolean) => void;
  setEliminated: (ids: IntervalId[]) => void;
  beginSession: () => void;
}

export const useSession = create<SessionState>((set) => ({
  phase: 'idle',
  question: null,
  lastCorrect: null,
  usedReplay: false,
  usedHint: false,
  eliminatedIds: [],
  sessionStartedAt: null,
  setPhase: (p) => set({ phase: p }),
  setQuestion: (q) =>
    set({ question: q, lastCorrect: null, usedReplay: false, usedHint: false, eliminatedIds: [] }),
  setLastCorrect: (c) => set({ lastCorrect: c }),
  setUsedReplay: (b) => set({ usedReplay: b }),
  setUsedHint: (b) => set({ usedHint: b }),
  setEliminated: (ids) => set({ eliminatedIds: ids }),
  beginSession: () => set({ sessionStartedAt: Date.now() }),
}));
