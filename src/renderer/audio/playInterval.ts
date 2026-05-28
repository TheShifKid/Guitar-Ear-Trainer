import * as Tone from 'tone';
import { midiToNoteName } from '@renderer/music/tuning';
import { ensureAudioStarted, getSampler } from './sampler';
import type { Settings } from '@shared/types';

export interface PlayPlan {
  rootMidi: number;
  targetMidi: number;
  noteDurationMs: number;
  gapMs: number;
}

export function planFromSettings(rootMidi: number, targetMidi: number, settings: Settings): PlayPlan {
  const { gapMinMs, gapMaxMs, noteDurationMs } = settings;
  const lo = Math.min(gapMinMs, gapMaxMs);
  const hi = Math.max(gapMinMs, gapMaxMs);
  const gapMs = Math.floor(lo + Math.random() * (hi - lo));
  return { rootMidi, targetMidi, noteDurationMs, gapMs };
}

export async function playPlan(plan: PlayPlan, pack: 'acoustic' | 'electric' = 'acoustic') {
  await ensureAudioStarted();
  const { sampler, ready } = getSampler(pack);
  await ready;
  const dur = plan.noteDurationMs / 1000;
  const now = Tone.now() + 0.05;
  sampler.triggerAttackRelease(midiToNoteName(plan.rootMidi), dur, now);
  sampler.triggerAttackRelease(
    midiToNoteName(plan.targetMidi),
    dur,
    now + dur + plan.gapMs / 1000,
  );
  // Total time the interval will be sounding
  const totalMs = (dur * 2 + plan.gapMs / 1000) * 1000 + 100;
  return new Promise<void>((resolve) => setTimeout(resolve, totalMs));
}

export async function playSingle(midi: number, durationMs = 800, pack: 'acoustic' | 'electric' = 'acoustic') {
  await ensureAudioStarted();
  const { sampler, ready } = getSampler(pack);
  await ready;
  sampler.triggerAttackRelease(midiToNoteName(midi), durationMs / 1000);
}
