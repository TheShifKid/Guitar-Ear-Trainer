import type { FretPosition, Settings, StringIndex } from '@shared/types';
import { fretToMidi } from './tuning';
import { makePosition } from './fretboard';

// Major pentatonic — pleasant, forgiving for dictation.
const MAJOR_PENT = [0, 2, 4, 7, 9];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a short stepwise melody in major pentatonic. The first note (the
 * anchor) is returned with a concrete fretboard position so it can be shown as
 * a reference; the rest the user transcribes by ear.
 */
export function generateMelody(settings: Settings, length: number): { notes: number[]; anchor: FretPosition } {
  const anchorString = 2 as StringIndex; // G string — central, easy to reach
  const minF = settings.fretMin;
  const maxF = Math.max(minF + 2, Math.min(settings.fretMax, 12));
  const anchorFret = randInt(minF, Math.max(minF, maxF - 2));
  const rootMidi = fretToMidi(anchorString, anchorFret);

  const scale: number[] = [];
  for (let oct = -1; oct <= 1; oct++) for (const d of MAJOR_PENT) scale.push(rootMidi + d + oct * 12);
  scale.sort((a, b) => a - b);

  let idx = scale.indexOf(rootMidi);
  const notes = [scale[idx]];
  for (let i = 1; i < length; i++) {
    const step = [-2, -1, 1, 2][Math.floor(Math.random() * 4)];
    idx = Math.max(0, Math.min(scale.length - 1, idx + step));
    notes.push(scale[idx]);
  }
  return { notes, anchor: makePosition(anchorString, anchorFret) };
}
