import { useCallback, useState } from 'react';
import { Play, RotateCcw, ChevronRight } from 'lucide-react';
import { useSettings } from '@renderer/store/settingsStore';
import { useStats } from '@renderer/store/statsStore';
import { CHORD_BY_ID, CHORDS, pickChordRoot, buildChordVoicing } from '@renderer/music/chords';
import { playChord } from '@renderer/audio/playInterval';
import { Fretboard } from '@renderer/fretboard/Fretboard';
import { useKeyboard } from '@renderer/shortcuts/useKeyboard';
import { midiToPitchClass } from '@renderer/music/tuning';
import type { ChordQuality, FretPosition } from '@shared/types';

type Phase = 'idle' | 'playing' | 'awaiting' | 'revealed';
interface ChordQ { root: FretPosition; voicing: FretPosition[]; quality: ChordQuality }

export function ChordScreen() {
  const settings = useSettings();
  const stats = useStats();
  const [phase, setPhase] = useState<Phase>('idle');
  const [q, setQ] = useState<ChordQ | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);

  const enabled = settings.enabledChords;

  const next = useCallback(async () => {
    if (enabled.length === 0) return;
    const quality = enabled[Math.floor(Math.random() * enabled.length)];
    const root = pickChordRoot(settings);
    const voicing = buildChordVoicing(root, CHORD_BY_ID[quality].intervals);
    const question = { root, voicing, quality };
    setQ(question);
    setCorrect(null);
    setPhase('playing');
    await playChord(voicing.map((v) => v.midi), settings.noteDurationMs, settings.soundPack);
    setPhase('awaiting');
  }, [enabled, settings]);

  const replay = useCallback(async () => {
    if (!q) return;
    setPhase('playing');
    await playChord(q.voicing.map((v) => v.midi), settings.noteDurationMs, settings.soundPack);
    setPhase('awaiting');
  }, [q, settings.noteDurationMs, settings.soundPack]);

  const answer = useCallback((guessed: ChordQuality) => {
    if (!q || phase !== 'awaiting') return;
    const ok = guessed === q.quality;
    setCorrect(ok);
    setPhase('revealed');
    stats.recordChordAnswer({ quality: q.quality, guessed, correct: ok, answeredAt: Date.now() });
  }, [q, phase, stats]);

  useKeyboard((e) => {
    if (e.key === ' ') {
      e.preventDefault();
      if (phase === 'idle' || phase === 'revealed') void next();
      else if (phase === 'awaiting') void replay();
    } else if (e.key === 'Enter' && phase === 'revealed') {
      void next();
    } else if (phase === 'awaiting' && /^[1-9]$/.test(e.key)) {
      const c = enabled[parseInt(e.key, 10) - 1];
      if (c) answer(c);
    }
  }, [phase, enabled, q]);

  const none = enabled.length === 0;

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 flex items-center gap-5 px-6 py-2.5 border-b border-ink-800 text-sm">
        <span className="text-slate-300 font-semibold">Chord Recognition</span>
        <span className="ml-auto text-slate-500">Streak <span className="text-accent font-bold">{stats.currentStreak}</span></span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-4 min-h-0">
        {none ? (
          <p className="text-sm text-bad">No chords enabled — pick some in Settings.</p>
        ) : (
          <>
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
                <p className="text-slate-500 text-sm">{phase === 'idle' ? 'Press play or hit Space' : 'Listening…'}</p>
              </div>
            )}

            {phase === 'awaiting' && (
              <div className="flex flex-col items-center gap-5">
                <p className="text-2xl font-semibold text-slate-200">What chord was that?</p>
                <button
                  onClick={() => void replay()}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-ink-700 border-2 border-accent/40 text-accent font-semibold text-sm hover:bg-accent/10 hover:border-accent transition active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" /> Replay
                  <kbd className="text-[10px] font-mono bg-ink-900/60 border border-accent/30 px-1.5 py-0.5 rounded">Space</kbd>
                </button>
              </div>
            )}

            {phase === 'revealed' && q && (
              <div className="w-full max-w-3xl flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={['text-2xl font-bold', correct ? 'text-good' : 'text-bad'].join(' ')}>
                      {correct ? '✓ Correct' : '✗ Incorrect'}
                    </p>
                    <p className="text-slate-400 text-sm mt-0.5">
                      It was <span className="text-slate-200 font-semibold">{midiToPitchClass(q.root.midi)} {CHORD_BY_ID[q.quality].name}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => void next()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-ink-900 font-bold text-sm hover:bg-accent-soft transition"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                    <kbd className="text-[10px] font-mono bg-ink-900/40 text-ink-900 px-1.5 py-0.5 rounded">Enter</kbd>
                  </button>
                </div>
                <div className="rounded-xl border border-ink-700 bg-ink-800/60 p-4">
                  <Fretboard
                    minFret={Math.max(0, Math.min(...q.voicing.map((v) => v.fret)) - 1)}
                    maxFret={Math.min(24, Math.max(...q.voicing.map((v) => v.fret)) + 1)}
                    markers={q.voicing.map((v, i) => ({
                      position: v,
                      color: i === 0 ? '#22d3ee' : '#a78bfa',
                      label: midiToPitchClass(v.midi),
                    }))}
                  />
                  <p className="text-[11px] text-slate-500 mt-2 font-mono">
                    {q.voicing.map((v) => `${midiToPitchClass(v.midi)}(${6 - v.string}/${v.fret})`).join('  ')}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="shrink-0 px-6 pb-5 pt-3 border-t border-ink-800">
        <div className="answer-grid" style={{ '--cols': `repeat(${Math.min(enabled.length, 7)}, 1fr)` } as React.CSSProperties}>
          {enabled.map((id, idx) => {
            const def = CHORD_BY_ID[id];
            const isCorrect = phase === 'revealed' && q?.quality === id;
            const canAnswer = phase === 'awaiting';
            return (
              <button
                key={id}
                onClick={() => canAnswer && answer(id)}
                disabled={!canAnswer && phase !== 'revealed'}
                className={[
                  'relative flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all select-none',
                  isCorrect
                    ? 'border-good bg-good/15 text-good'
                    : canAnswer
                    ? 'border-ink-600 bg-ink-700/80 hover:border-accent/60 hover:bg-ink-700 text-slate-200 cursor-pointer active:scale-95'
                    : 'border-ink-700 bg-ink-800/50 text-slate-600 cursor-default',
                ].join(' ')}
              >
                <span className="absolute top-1.5 left-2 text-[10px] font-mono text-slate-600">{idx < 9 ? idx + 1 : ''}</span>
                <span className="font-mono font-bold text-base leading-none">{def.short}</span>
                <span className="text-[10px] mt-1 text-slate-500">{def.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
