import { create } from 'zustand';
import type { Question } from '@shared/types';

type Phase = 'idle' | 'playing' | 'awaiting' | 'revealed';

interface SessionState {
  phase: Phase;
  question: Question | null;
  lastCorrect: boolean | null;
  usedReplay: boolean;
  sessionStartedAt: number | null;
  setPhase: (p: Phase) => void;
  setQuestion: (q: Question | null) => void;
  setLastCorrect: (c: boolean | null) => void;
  setUsedReplay: (b: boolean) => void;
  beginSession: () => void;
}

export const useSession = create<SessionState>((set) => ({
  phase: 'idle',
  question: null,
  lastCorrect: null,
  usedReplay: false,
  sessionStartedAt: null,
  setPhase: (p) => set({ phase: p }),
  setQuestion: (q) => set({ question: q, lastCorrect: null, usedReplay: false }),
  setLastCorrect: (c) => set({ lastCorrect: c }),
  setUsedReplay: (b) => set({ usedReplay: b }),
  beginSession: () => set({ sessionStartedAt: Date.now() }),
}));
