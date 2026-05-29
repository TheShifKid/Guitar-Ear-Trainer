import { useCallback, useState } from 'react';
import { Play, RotateCcw, ChevronRight, Undo2, Eraser, Check } from 'lucide-react';
import { useSettings } from '@renderer/store/settingsStore';
import { useStats } from '@renderer/store/statsStore';
import { generateMelody } from '@renderer/music/melody';
import { playSequence, playSingle } from '@renderer/audio/playInterval';
import { Fretboard } from '@renderer/fretboard/Fretboard';
import { OPEN_STRING_MIDI, midiToPitchClass } from '@renderer/music/tuning';
import { makePosition } from '@renderer/music/fretboard';
import { useKeyboard } from '@renderer/shortcuts/useKeyboard';
import type { FretPosition, StringIndex } from '@shared/types';

type Phase = 'idle' | 'playing' | 'awaiting' | 'revealed';
interface MelQ { notes: number[]; anchor: FretPosition }

function placeMidi(midi: number): FretPosition {
  for (const s of [2, 3, 1, 4, 0, 5] as StringIndex[]) {
    const fret = midi - OPEN_STRING_MIDI[s];
    if (fret >= 0 && fret <= 15) return makePosition(s, fret);
  }
  return makePosition(2, Math.max(0, midi - OPEN_STRING_MIDI[2]));
}

export function MelodicScreen() {
  const settings = useSettings();
  const stats = useStats();
  const [phase, setPhase] = useState<Phase>('idle');
  const [q, setQ] = useState<MelQ | null>(null);
  const [entered, setEntered] = useState<FretPosition[]>([]);
  const [correct, setCorrect] = useState<boolean | null>(null);

  const playMelody = useCallback(async (notes: number[]) => {
    setPhase('playing');
    await playSequence(notes, Math.max(280, settings.noteDurationMs / 2.5), settings.soundPack);
    setPhase('awaiting');
  }, [settings.noteDurationMs, settings.soundPack]);

  const next = useCallback(async () => {
    const m = generateMelody(settings, settings.melodyLength);
    setQ(m);
    setEntered([m.anchor]); // first note given as anchor
    setCorrect(null);
    await playMelody(m.notes);
  }, [settings, playMelody]);

  const onSelect = useCallback((pos: FretPosition) => {
    if (phase !== 'awaiting' || !q) return;
    if (entered.length >= q.notes.length) return;
    void playSingle(pos.midi, 500, settings.soundPack);
    setEntered((e) => [...e, pos]);
  }, [phase, q, entered.length, settings.soundPack]);

  const check = useCallback(() => {
    if (!q || entered.length !== q.notes.length) return;
    const ok = entered.every((p, i) => p.midi === q.notes[i]);
    setCorrect(ok);
    setPhase('revealed');
    stats.recordGeneric(ok);
  }, [q, entered, stats]);

  useKeyboard((e) => {
    if (e.key === ' ') {
      e.preventDefault();
      if (phase === 'idle' || phase === 'revealed') void next();
      else if (phase === 'awaiting' && q) void playMelody(q.notes);
    } else if (e.key === 'Enter') {
      if (phase === 'revealed') void next();
      else if (phase === 'awaiting' && q && entered.length === q.notes.length) check();
    } else if (phase === 'awaiting' && (e.key === 'Backspace')) {
      setEntered((arr) => (arr.length > 1 ? arr.slice(0, -1) : arr));
    }
  }, [phase, q, entered.length]);

  const full = !!q && entered.length === q.notes.length;

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 flex items-center gap-5 px-6 py-2.5 border-b border-ink-800 text-sm">
        <span className="text-slate-300 font-semibold">Melodic Dictation</span>
        <span className="ml-auto text-slate-500">Streak <span className="text-accent font-bold">{stats.currentStreak}</span></span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-4 min-h-0 overflow-y-auto">
        {(phase === 'idle' || phase === 'playing') && (
          <div className="flex flex-col items-center gap-5">
            <button
              onClick={() => void next()}
              disabled={phase === 'playing'}
              className={[
                'relative w-24 h-24 rounded-full flex items-center justify-center transition-transform',
                'bg-accent text-ink-900 shadow-[0_0_40px_rgba(34,211,238,0.3)]',
                phase === 'playing' ? 'scale-95 cursor-default pulse-ring' : 'hover:scale-105 active:scale-95',
              ].join(' ')}
            >
              <Play className={['w-9 h-9', phase === 'playing' ? 'opacity-50' : ''].join(' ')} />
            </button>
            <p className="text-slate-500 text-sm text-center max-w-xs">
              {phase === 'idle' ? `Hear a ${settings.melodyLength}-note melody, then tap it back. The first note is given.` : 'Listening…'}
            </p>
          </div>
        )}

        {(phase === 'awaiting' || phase === 'revealed') && q && (
          <div className="w-full max-w-3xl flex flex-col gap-4">
            {phase === 'revealed' && (
              <p className={['text-2xl font-bold text-center', correct ? 'text-good' : 'text-bad'].join(' ')}>
                {correct ? '✓ Correct!' : '✗ Not quite'}
              </p>
            )}

            {/* Entered / target sequence chips */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {q.notes.map((targetMidi, i) => {
                const got = entered[i];
                const isAnchor = i === 0;
                const matched = got && got.midi === targetMidi;
                return (
                  <div
                    key={i}
                    className={[
                      'w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center font-mono',
                      phase === 'revealed'
                        ? matched ? 'border-good bg-good/10 text-good' : 'border-bad bg-bad/10 text-bad'
                        : isAnchor ? 'border-accent bg-accent/10 text-accent'
                        : got ? 'border-ink-500 bg-ink-700 text-slate-200' : 'border-dashed border-ink-600 text-slate-600',
                    ].join(' ')}
                  >
                    <span className="text-sm font-bold">{got ? midiToPitchClass(got.midi) : '·'}</span>
                    {phase === 'revealed' && !matched && (
                      <span className="text-[10px] text-slate-400">{midiToPitchClass(targetMidi)}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => q && void playMelody(q.notes)} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink-700 border-2 border-accent/40 text-accent text-sm font-semibold hover:bg-accent/10 transition">
                <RotateCcw className="w-4 h-4" /> Replay
              </button>
              {phase === 'awaiting' && (
                <>
                  <button onClick={() => setEntered((a) => (a.length > 1 ? a.slice(0, -1) : a))} className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-ink-700 border border-ink-600 text-slate-300 text-sm hover:bg-ink-600 transition">
                    <Undo2 className="w-4 h-4" /> Undo
                  </button>
                  <button onClick={() => q && setEntered([q.anchor])} className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-ink-700 border border-ink-600 text-slate-300 text-sm hover:bg-ink-600 transition">
                    <Eraser className="w-4 h-4" /> Clear
                  </button>
                  <button onClick={check} disabled={!full} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-ink-900 font-bold text-sm hover:bg-accent-soft transition disabled:opacity-40">
                    <Check className="w-4 h-4" /> Check
                  </button>
                </>
              )}
              {phase === 'revealed' && (
                <button onClick={() => void next()} className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent text-ink-900 font-bold text-sm hover:bg-accent-soft transition">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Interactive fretboard */}
            <div className="rounded-xl border border-ink-700 bg-ink-800/60 p-4">
              <Fretboard
                minFret={0}
                maxFret={12}
                onSelect={phase === 'awaiting' ? onSelect : undefined}
                markers={
                  phase === 'revealed'
                    ? q.notes.map((m, i) => ({ position: placeMidi(m), color: '#10b981', label: String(i + 1) }))
                    : entered.map((p, i) => ({ position: p, color: i === 0 ? '#22d3ee' : '#67e8f9', label: String(i + 1) }))
                }
              />
              {phase === 'awaiting' && (
                <p className="text-[11px] text-slate-500 mt-2 text-center">Tap notes in order · first note is your anchor · Backspace to undo</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
