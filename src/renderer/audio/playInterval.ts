import * as Tone from 'tone';
import { midiToNoteName } from '@renderer/music/tuning';
import { ensureAudioStarted, getSampler } from './sampler';
import type { Settings } from '@shared/types';

export interface PlayPlan {
  rootMidi: number;
  targetMidi: number;
  noteDurationMs: number;
  gapMs: number;
  harmonic: boolean;
  referenceMidi: number | null;
}

export function planFromSettings(rootMidi: number, targetMidi: number, settings: Settings): PlayPlan {
  const { gapMinMs, gapMaxMs, noteDurationMs } = settings;
  const lo = Math.min(gapMinMs, gapMaxMs);
  const hi = Math.max(gapMinMs, gapMaxMs);
  const gapMs = Math.floor(lo + Math.random() * (hi - lo));
  return {
    rootMidi,
    targetMidi,
    noteDurationMs,
    gapMs,
    harmonic: settings.playbackMode === 'harmonic',
    referenceMidi: settings.enableReferenceTone ? settings.referencePitch : null,
  };
}

/**
 * Play an interval plan. `rate` scales tempo: 1 = normal, 0.5 = half speed
 * (slow replay). Resolves once the whole thing has finished sounding.
 */
export async function playPlan(
  plan: PlayPlan,
  pack: 'acoustic' | 'electric' = 'acoustic',
  rate = 1,
) {
  await ensureAudioStarted();
  const { sampler, ready } = getSampler(pack);
  await ready;

  const dur = plan.noteDurationMs / 1000 / rate;
  const gap = plan.gapMs / 1000 / rate;
  let t = Tone.now() + 0.05;

  // Optional reference tone first, with a short breath after it.
  if (plan.referenceMidi != null) {
    sampler.triggerAttackRelease(midiToNoteName(plan.referenceMidi), dur, t);
    t += dur + 0.35 / rate;
  }

  if (plan.harmonic) {
    sampler.triggerAttackRelease(midiToNoteName(plan.rootMidi), dur, t);
    sampler.triggerAttackRelease(midiToNoteName(plan.targetMidi), dur, t);
    t += dur;
  } else {
    sampler.triggerAttackRelease(midiToNoteName(plan.rootMidi), dur, t);
    t += dur + gap;
    sampler.triggerAttackRelease(midiToNoteName(plan.targetMidi), dur, t);
    t += dur;
  }

  const totalMs = (t - Tone.now()) * 1000 + 120;
  return new Promise<void>((resolve) => setTimeout(resolve, Math.max(0, totalMs)));
}

export async function playSingle(midi: number, durationMs = 800, pack: 'acoustic' | 'electric' = 'acoustic') {
  await ensureAudioStarted();
  const { sampler, ready } = getSampler(pack);
  await ready;
  sampler.triggerAttackRelease(midiToNoteName(midi), durationMs / 1000);
}

/** Strum a chord low-to-high with a small per-string delay. */
export async function playChord(
  midis: number[],
  durationMs = 1600,
  pack: 'acoustic' | 'electric' = 'acoustic',
  strumMs = 30,
) {
  await ensureAudioStarted();
  const { sampler, ready } = getSampler(pack);
  await ready;
  const dur = durationMs / 1000;
  const now = Tone.now() + 0.05;
  midis.forEach((m, i) => sampler.triggerAttackRelease(midiToNoteName(m), dur, now + (i * strumMs) / 1000));
  const totalMs = dur * 1000 + midis.length * strumMs + 150;
  return new Promise<void>((resolve) => setTimeout(resolve, totalMs));
}

/** Play a sequence of strummed chords, one per beat (for progressions). */
export async function playProgression(
  chords: number[][],
  chordGapMs = 950,
  ringMs = 1150,
  pack: 'acoustic' | 'electric' = 'acoustic',
  strumMs = 24,
) {
  await ensureAudioStarted();
  const { sampler, ready } = getSampler(pack);
  await ready;
  let t = Tone.now() + 0.05;
  for (const chord of chords) {
    chord.forEach((m, i) => sampler.triggerAttackRelease(midiToNoteName(m), ringMs / 1000, t + (i * strumMs) / 1000));
    t += chordGapMs / 1000;
  }
  const totalMs = (t - Tone.now()) * 1000 + ringMs + 150;
  return new Promise<void>((resolve) => setTimeout(resolve, totalMs));
}

/** Play a sequence of notes (for scales / arpeggios) at a given note length. */
export async function playSequence(
  midis: number[],
  noteMs = 350,
  pack: 'acoustic' | 'electric' = 'acoustic',
) {
  await ensureAudioStarted();
  const { sampler, ready } = getSampler(pack);
  await ready;
  const dur = noteMs / 1000;
  let t = Tone.now() + 0.05;
  for (const m of midis) {
    sampler.triggerAttackRelease(midiToNoteName(m), dur * 0.95, t);
    t += dur;
  }
  const totalMs = (t - Tone.now()) * 1000 + 150;
  return new Promise<void>((resolve) => setTimeout(resolve, totalMs));
}
