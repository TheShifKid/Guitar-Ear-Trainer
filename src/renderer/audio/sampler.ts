import * as Tone from 'tone';

// nbrosowsky's free guitar samples, used by tonejs-instruments. Hosted on
// GitHub Pages — works without bundling at the cost of a one-time online load.
// TODO: bundle these locally under src/renderer/audio/samples for offline use.
const BASE_ACOUSTIC = 'https://nbrosowsky.github.io/tonejs-instruments/samples/guitar-acoustic/';
const BASE_ELECTRIC = 'https://nbrosowsky.github.io/tonejs-instruments/samples/guitar-electric/';

const ACOUSTIC_MAP: Record<string, string> = {
  A2: 'A2.mp3', A3: 'A3.mp3', A4: 'A4.mp3',
  'C#3': 'Cs3.mp3', 'C#4': 'Cs4.mp3', 'C#5': 'Cs5.mp3',
  E2: 'E2.mp3', E3: 'E3.mp3', E4: 'E4.mp3',
  'F#2': 'Fs2.mp3', 'F#3': 'Fs3.mp3', 'F#4': 'Fs4.mp3',
};

const ELECTRIC_MAP: Record<string, string> = {
  A2: 'A2.mp3', A3: 'A3.mp3', A4: 'A4.mp3', A5: 'A5.mp3',
  'C#3': 'Cs3.mp3', 'C#4': 'Cs4.mp3', 'C#5': 'Cs5.mp3',
  E2: 'E2.mp3', E3: 'E3.mp3', E4: 'E4.mp3', E5: 'E5.mp3',
  'F#2': 'Fs2.mp3', 'F#3': 'Fs3.mp3', 'F#4': 'Fs4.mp3', 'F#5': 'Fs5.mp3',
};

type Pack = 'acoustic' | 'electric';

let currentPack: Pack | null = null;
let sampler: Tone.Sampler | null = null;
let loadPromise: Promise<void> | null = null;

export function getSampler(pack: Pack = 'acoustic'): { sampler: Tone.Sampler; ready: Promise<void> } {
  if (sampler && currentPack === pack && loadPromise) {
    return { sampler, ready: loadPromise };
  }
  if (sampler) sampler.dispose();
  currentPack = pack;
  const map = pack === 'electric' ? ELECTRIC_MAP : ACOUSTIC_MAP;
  const base = pack === 'electric' ? BASE_ELECTRIC : BASE_ACOUSTIC;
  sampler = new Tone.Sampler({
    urls: map,
    baseUrl: base,
    release: 1,
  }).toDestination();
  loadPromise = Tone.loaded();
  return { sampler, ready: loadPromise };
}

export async function ensureAudioStarted() {
  if (Tone.getContext().state !== 'running') {
    await Tone.start();
  }
}
