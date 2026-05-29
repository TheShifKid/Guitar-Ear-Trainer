import type { ChordQuality } from '@shared/types';
import { CHORD_BY_ID } from './chords';

export const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];

// Diatonic triad quality for each scale degree (0-indexed) in a major key.
export const DIATONIC: { numeral: string; quality: ChordQuality }[] = [
  { numeral: 'I',   quality: 'maj' },
  { numeral: 'ii',  quality: 'min' },
  { numeral: 'iii', quality: 'min' },
  { numeral: 'IV',  quality: 'maj' },
  { numeral: 'V',   quality: 'maj' },
  { numeral: 'vi',  quality: 'min' },
  { numeral: 'vii°', quality: 'dim' },
];

export interface ProgressionDef {
  id: string;
  label: string;
  degrees: number[]; // 0-based scale degrees
}

export const PROGRESSIONS: ProgressionDef[] = [
  { id: 'I-IV-V',     label: 'I–IV–V',     degrees: [0, 3, 4] },
  { id: 'I-V-vi-IV',  label: 'I–V–vi–IV',  degrees: [0, 4, 5, 3] },
  { id: 'ii-V-I',     label: 'ii–V–I',     degrees: [1, 4, 0] },
  { id: 'I-vi-IV-V',  label: 'I–vi–IV–V',  degrees: [0, 5, 3, 4] },
  { id: 'vi-IV-I-V',  label: 'vi–IV–I–V',  degrees: [5, 3, 0, 4] },
  { id: 'I-IV-V-IV',  label: 'I–IV–V–IV',  degrees: [0, 3, 4, 3] },
  { id: 'I-V-IV',     label: 'I–V–IV',     degrees: [0, 4, 3] },
  { id: 'I-iii-IV-V', label: 'I–iii–IV–V', degrees: [0, 2, 3, 4] },
];

export const PROGRESSION_BY_ID = Object.fromEntries(PROGRESSIONS.map((p) => [p.id, p])) as Record<string, ProgressionDef>;

export function chordMidisForDegree(keyRootMidi: number, degree: number): number[] {
  const quality = DIATONIC[degree].quality;
  const chordRoot = keyRootMidi + MAJOR_SCALE[degree];
  return CHORD_BY_ID[quality].intervals.map((i) => chordRoot + i);
}

export function buildProgressionMidis(keyRootMidi: number, degrees: number[]): number[][] {
  return degrees.map((d) => chordMidisForDegree(keyRootMidi, d));
}
