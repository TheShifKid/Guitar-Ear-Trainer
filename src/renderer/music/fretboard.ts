import type { FretPosition, IntervalId, Settings, StringIndex } from '@shared/types';
import { ALL_STRINGS, fretToMidi, midiToNoteName, OPEN_STRING_MIDI } from './tuning';
import { INTERVAL_BY_ID } from './intervals';

const MAX_FRET_ON_NECK = 24;

export function makePosition(string: StringIndex, fret: number): FretPosition {
  const midi = fretToMidi(string, fret);
  return { string, fret, midi, noteName: midiToNoteName(midi) };
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickRandomRoot(settings: Settings): FretPosition {
  const strings = settings.enabledStrings.length > 0 ? settings.enabledStrings : ALL_STRINGS;
  const string = pickRandom(strings);
  const fret = randInt(settings.fretMin, settings.fretMax);
  return makePosition(string, fret);
}

/**
 * Find the fret position for a target MIDI note on a given string, or null if
 * it falls outside the valid fret range.
 */
function findFretOnString(string: StringIndex, targetMidi: number): number | null {
  const fret = targetMidi - OPEN_STRING_MIDI[string];
  if (fret >= 0 && fret <= MAX_FRET_ON_NECK) return fret;
  return null;
}

/**
 * Pick the second note for an interval exercise.
 *
 * Priority order so the interval stays in one fretboard position (the way
 * you'd actually practice it holding a guitar):
 *   1. Same string
 *   2. Adjacent strings (|string - root.string| == 1)
 *   3. Strings two away
 *   4. Any remaining enabled string
 *
 * Within each tier, the first valid position found is used — no random
 * shuffling at the string level so the result is consistent and natural.
 */
export function pickSecondNote(
  root: FretPosition,
  intervalId: IntervalId,
  settings: Settings,
): { target: FretPosition; ascending: boolean } {
  const semis = INTERVAL_BY_ID[intervalId].semitones;
  const allowDesc = settings.allowDescending;
  const wantAsc = allowDesc ? Math.random() < 0.5 : true;
  const enabledSet = new Set(
    settings.enabledStrings.length > 0 ? settings.enabledStrings : ALL_STRINGS,
  );

  const tryDirection = (asc: boolean): FretPosition | null => {
    const targetMidi = root.midi + (asc ? semis : -semis);

    // Build candidate strings in proximity order from the root string.
    const allStrings: StringIndex[] = [0, 1, 2, 3, 4, 5];
    const ordered = allStrings
      .filter((s) => enabledSet.has(s))
      .sort((a, b) => Math.abs(a - root.string) - Math.abs(b - root.string));

    for (const s of ordered) {
      const fret = findFretOnString(s, targetMidi);
      if (fret !== null) return makePosition(s, fret);
    }
    return null;
  };

  let target = tryDirection(wantAsc);
  let ascending = wantAsc;

  if (!target) {
    target = tryDirection(!wantAsc);
    ascending = !wantAsc;
  }

  if (!target) {
    // Absolute fallback: same string, unclamped (audio will play, visual may be off-neck).
    const fret = root.fret + (ascending ? semis : -semis);
    target = makePosition(root.string, fret);
  }

  return { target, ascending };
}

export function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}
