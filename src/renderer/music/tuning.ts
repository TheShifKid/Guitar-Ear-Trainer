import type { StringIndex } from '@shared/types';

// Index 0 = high E (1st string), index 5 = low E (6th string).
// MIDI for open strings in standard tuning EADGBE.
export const OPEN_STRING_MIDI: Record<StringIndex, number> = {
  0: 64, // E4 - high E (1st)
  1: 59, // B3 (2nd)
  2: 55, // G3 (3rd)
  3: 50, // D3 (4th)
  4: 45, // A2 (5th)
  5: 40, // E2 - low E (6th)
};

export const STRING_LABELS: Record<StringIndex, string> = {
  0: 'E', 1: 'B', 2: 'G', 3: 'D', 4: 'A', 5: 'E',
};

export const ALL_STRINGS: StringIndex[] = [0, 1, 2, 3, 4, 5];

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiToNoteName(midi: number): string {
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[pc]}${octave}`;
}

export function midiToPitchClass(midi: number): string {
  return NOTE_NAMES[((midi % 12) + 12) % 12];
}

export function fretToMidi(string: StringIndex, fret: number): number {
  return OPEN_STRING_MIDI[string] + fret;
}
