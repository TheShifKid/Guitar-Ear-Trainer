import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ALL_STRINGS } from '@renderer/music/tuning';
import { DEFAULT_ENABLED, PROGRESSIVE_ORDER } from '@renderer/music/intervals';
import { DEFAULT_CHORDS } from '@renderer/music/chords';
import type { ChordQuality, IntervalId, Settings, StringIndex } from '@shared/types';

interface SettingsStore extends Settings {
  setIntervals: (ids: IntervalId[]) => void;
  toggleInterval: (id: IntervalId) => void;
  setMode: (mode: Settings['mode']) => void;
  setFretRange: (min: number, max: number) => void;
  setStrings: (s: StringIndex[]) => void;
  toggleString: (s: StringIndex) => void;
  setNoteDuration: (ms: number) => void;
  setGapRange: (min: number, max: number) => void;
  setSoundPack: (p: 'acoustic' | 'electric') => void;
  setAllowDescending: (b: boolean) => void;
  setPlaybackMode: (m: 'melodic' | 'harmonic') => void;
  setEnableReferenceTone: (b: boolean) => void;
  setReferencePitch: (midi: number) => void;
  setShowNotesBeforeAnswer: (b: boolean) => void;
  setDailyGoalReps: (n: number) => void;
  toggleChord: (q: ChordQuality) => void;
  setMelodyLength: (n: number) => void;
  resetToDefaults: () => void;
}

const defaults: Settings = {
  enabledIntervals: DEFAULT_ENABLED,
  mode: 'comfortable',
  fretMin: 0,
  fretMax: 12,
  enabledStrings: ALL_STRINGS,
  noteDurationMs: 1200,
  gapMinMs: 400,
  gapMaxMs: 1500,
  soundPack: 'acoustic',
  allowDescending: false,
  playbackMode: 'melodic',
  enableReferenceTone: false,
  referencePitch: 48, // C3
  showNotesBeforeAnswer: false,
  dailyGoalReps: 50,
  enabledChords: DEFAULT_CHORDS,
  melodyLength: 4,
};

export const useSettings = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...defaults,
      setIntervals: (ids) => set({ enabledIntervals: ids }),
      toggleInterval: (id) => {
        const cur = new Set(get().enabledIntervals);
        if (cur.has(id)) cur.delete(id); else cur.add(id);
        const ordered = PROGRESSIVE_ORDER.filter((i) => cur.has(i));
        set({ enabledIntervals: ordered.length ? ordered : Array.from(cur) });
      },
      setMode: (mode) => {
        if (mode === 'progressive') {
          set({ mode, enabledIntervals: PROGRESSIVE_ORDER.slice(0, 2) });
        } else if (mode === 'comfortable') {
          set({ mode, enabledIntervals: DEFAULT_ENABLED });
        } else {
          set({ mode });
        }
      },
      setFretRange: (min, max) => set({ fretMin: Math.min(min, max), fretMax: Math.max(min, max) }),
      setStrings: (s) => set({ enabledStrings: s }),
      toggleString: (s) => {
        const cur = new Set(get().enabledStrings);
        if (cur.has(s)) cur.delete(s); else cur.add(s);
        set({ enabledStrings: Array.from(cur).sort((a, b) => a - b) as StringIndex[] });
      },
      setNoteDuration: (ms) => set({ noteDurationMs: ms }),
      setGapRange: (min, max) => set({ gapMinMs: Math.min(min, max), gapMaxMs: Math.max(min, max) }),
      setSoundPack: (p) => set({ soundPack: p }),
      setAllowDescending: (b) => set({ allowDescending: b }),
      setPlaybackMode: (m) => set({ playbackMode: m }),
      setEnableReferenceTone: (b) => set({ enableReferenceTone: b }),
      setReferencePitch: (midi) => set({ referencePitch: midi }),
      setShowNotesBeforeAnswer: (b) => set({ showNotesBeforeAnswer: b }),
      setDailyGoalReps: (n) => set({ dailyGoalReps: n }),
      setMelodyLength: (n) => set({ melodyLength: n }),
      toggleChord: (q) => {
        const cur = new Set(get().enabledChords);
        if (cur.has(q)) cur.delete(q); else cur.add(q);
        set({ enabledChords: DEFAULT_CHORDS.filter((c) => cur.has(c)).concat([...cur].filter((c) => !DEFAULT_CHORDS.includes(c))) });
      },
      resetToDefaults: () => set({ ...defaults }),
    }),
    { name: 'ear-trainer-settings' },
  ),
);
