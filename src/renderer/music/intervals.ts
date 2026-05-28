import type { IntervalDef, IntervalId } from '@shared/types';

export const INTERVALS: IntervalDef[] = [
  { id: 'm2', semitones: 1,  name: 'Minor 2nd',        short: 'm2', defaultOn: false },
  { id: 'M2', semitones: 2,  name: 'Major 2nd',        short: 'M2', defaultOn: false },
  { id: 'm3', semitones: 3,  name: 'Minor 3rd',        short: 'm3', defaultOn: true  },
  { id: 'M3', semitones: 4,  name: 'Major 3rd',        short: 'M3', defaultOn: true  },
  { id: 'P4', semitones: 5,  name: 'Perfect 4th',      short: 'P4', defaultOn: true  },
  { id: 'TT', semitones: 6,  name: 'Tritone (♯4/♭5)',  short: 'TT', defaultOn: true  },
  { id: 'P5', semitones: 7,  name: 'Perfect 5th',      short: 'P5', defaultOn: true  },
  { id: 'm6', semitones: 8,  name: 'Minor 6th',        short: 'm6', defaultOn: false },
  { id: 'M6', semitones: 9,  name: 'Major 6th',        short: 'M6', defaultOn: false },
  { id: 'm7', semitones: 10, name: 'Minor 7th',        short: 'm7', defaultOn: false },
  { id: 'M7', semitones: 11, name: 'Major 7th',        short: 'M7', defaultOn: false },
  { id: 'P8', semitones: 12, name: 'Octave',           short: 'P8', defaultOn: false },
];

export const INTERVAL_BY_ID: Record<IntervalId, IntervalDef> =
  Object.fromEntries(INTERVALS.map((i) => [i.id, i])) as Record<IntervalId, IntervalDef>;

export const DEFAULT_ENABLED: IntervalId[] = INTERVALS.filter((i) => i.defaultOn).map((i) => i.id);

export const PROGRESSIVE_ORDER: IntervalId[] = [
  'P5', 'P4', 'M3', 'm3', 'TT', 'P8', 'M6', 'm6', 'M2', 'm2', 'M7', 'm7',
];
