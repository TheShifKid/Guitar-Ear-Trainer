import type { ChordQuality, FretPosition, Settings, StringIndex } from '@shared/types';
import { fretToMidi } from './tuning';
import { makePosition } from './fretboard';

export interface ChordDef {
  id: ChordQuality;
  name: string;
  short: string;
  intervals: number[]; // semitone offsets from root
}

export const CHORDS: ChordDef[] = [
  { id: 'maj',  name: 'Major',        short: 'maj',  intervals: [0, 4, 7] },
  { id: 'min',  name: 'Minor',        short: 'min',  intervals: [0, 3, 7] },
  { id: 'dim',  name: 'Diminished',   short: 'dim',  intervals: [0, 3, 6] },
  { id: 'aug',  name: 'Augmented',    short: 'aug',  intervals: [0, 4, 8] },
  { id: 'dom7', name: 'Dominant 7th', short: '7',    intervals: [0, 4, 7, 10] },
  { id: 'maj7', name: 'Major 7th',    short: 'maj7', intervals: [0, 4, 7, 11] },
  { id: 'min7', name: 'Minor 7th',    short: 'm7',   intervals: [0, 3, 7, 10] },
];

export const CHORD_BY_ID = Object.fromEntries(CHORDS.map((c) => [c.id, c])) as Record<ChordQuality, ChordDef>;
export const DEFAULT_CHORDS: ChordQuality[] = ['maj', 'min', 'dim', 'aug', 'dom7'];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Pick a root on a low-ish string so there's room to stack the voicing upward. */
export function pickChordRoot(settings: Settings): FretPosition {
  const low = [5, 4, 3].filter((s) => settings.enabledStrings.includes(s as StringIndex));
  const pool = low.length ? low : [5];
  const string = pool[Math.floor(Math.random() * pool.length)] as StringIndex;
  const fret = randInt(settings.fretMin, Math.min(settings.fretMax, 12));
  return makePosition(string, fret);
}

/**
 * Build an ascending, compact chord voicing: the root, then one chord tone per
 * higher string (toward the high E), each the lowest playable tone above the
 * previous note. Pitches are always correct chord tones, so it sounds right and
 * displays as a real fretboard shape.
 */
export function buildChordVoicing(root: FretPosition, intervals: number[]): FretPosition[] {
  const rootMidi = root.midi;
  const rootPc = ((rootMidi % 12) + 12) % 12;
  const chordPcs = new Set(intervals.map((i) => (rootPc + i) % 12));
  const maxStrings = intervals.length >= 4 ? 5 : 4;

  const voicing: FretPosition[] = [makePosition(root.string, root.fret)];
  let prevMidi = rootMidi;

  for (let s = (root.string - 1) as StringIndex; s >= 0 && voicing.length < maxStrings; s--) {
    let chosen = -1;
    for (let fret = Math.max(0, root.fret - 1); fret <= root.fret + 5; fret++) {
      const midi = fretToMidi(s, fret);
      if (midi > prevMidi && chordPcs.has(((midi % 12) + 12) % 12)) { chosen = fret; break; }
    }
    if (chosen >= 0) {
      voicing.push(makePosition(s, chosen));
      prevMidi = fretToMidi(s, chosen);
    }
  }
  return voicing;
}
