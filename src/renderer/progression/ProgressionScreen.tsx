import { useCallback, useState } from 'react';
import { Play, RotateCcw, ChevronRight } from 'lucide-react';
import { useSettings } from '@renderer/store/settingsStore';
import { useStats } from '@renderer/store/statsStore';
import { PROGRESSIONS, DIATONIC, MAJOR_SCALE, buildProgressionMidis, type ProgressionDef } from '@renderer/music/progressions';
import { playProgression } from '@renderer/audio/playInterval';
import { midiToPitchClass } from '@renderer/music/tuning';
import { CHORD_BY_ID } from '@renderer/music/chords';
import { useKeyboard } from '@renderer/shortcuts/useKeyboard';

type Phase = 'idle' | 'playing' | 'awaiting' | 'revealed';
interface ProgQ { keyRootMidi: number; prog: ProgressionDef; choices: ProgressionDef[] }

function shuffle<T>(a: T[]): T[] {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

export function ProgressionScreen() {
  const settings = useSettings();
  const stats = useStats();
  const [phase, setPhase] = useState<Phase>('idle');
  const [q, setQ] = useState<ProgQ | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);

  const play = useCallback(async (question: ProgQ) => {
    setPhase('playing');
    await playProgression(buildProgressionMidis(question.keyRootMidi, question.prog.degrees), 950, 1150, settings.soundPack);
    setPhase('awaiting');
  }, [settings.soundPack]);

  const next = useCallback(async () => {
    const prog = PROGRESSIONS[Math.floor(Math.random() * PROGRESSIONS.length)];
    const distractors = shuffle(PROGRESSIONS.filter((p) => p.id !== prog.id)).slice(0, 3);
    const choices = shuffle([prog, ...distractors]);
    const keyRootMidi = 48 + Math.floor(Math.random() * 12); // C3–B3
    const question = { keyRootMidi, prog, choices };
    setQ(question);
    setCorrect(null);
    await play(question);
  }, [play]);

  const replay = useCallback(async () => { if (q) await play(q); }, [q, play]);

  const answer = useCallback((choice: ProgressionDef) => {
    if (!q || phase !== 'awaiting') return;
    const ok = choice.id === q.prog.id;
    setCorrect(ok);
    setPhase('revealed');
    stats.recordGeneric(ok);
  }, [q, phase, stats]);

  useKeyboard((e) => {
    if (e.key === ' ') {
      e.preventDefault();
      if (phase === 'idle' || phase === 'revealed') void next();
      else if (phase === 'awaiting') void replay();
    } else if (e.key === 'Enter' && phase === 'revealed') {
      void next();
    } else if (phase === 'awaiting' && /^[1-4]$/.test(e.key) && q) {
      const c = q.choices[parseInt(e.key, 10) - 1];
      if (c) answer(c);
    }
  }, [phase, q]);

  const keyName = q ? midiToPitchClass(q.keyRootMidi) : '';

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 flex items-center gap-5 px-6 py-2.5 border-b border-ink-800 text-sm">
        <span className="text-slate-300 font-semibold">Chord Progressions</span>
        <span className="ml-auto text-slate-500">Streak <span className="text-accent font-bold">{stats.currentStreak}</span></span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-4 min-h-0">
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
              {phase === 'idle' ? 'Hear a progression, name the roman numerals' : 'Listening…'}
            </p>
          </div>
        )}

        {phase === 'awaiting' && q && (
          <div className="flex flex-col items-center gap-5 w-full max-w-md">
            <p className="text-2xl font-semibold text-slate-200">Which progression?</p>
            <button
              onClick={() => void replay()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink-700 border-2 border-accent/40 text-accent font-semibold text-sm hover:bg-accent/10 hover:border-accent transition active:scale-95"
            >
              <RotateCcw className="w-4 h-4" /> Replay
              <kbd className="text-[10px] font-mono bg-ink-900/60 border border-accent/30 px-1.5 py-0.5 rounded">Space</kbd>
            </button>
            <div className="grid grid-cols-2 gap-2 w-full">
              {q.choices.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => answer(c)}
                  className="relative py-4 rounded-xl border-2 border-ink-600 bg-ink-700/80 hover:border-accent/60 hover:bg-ink-700 text-slate-200 font-semibold active:scale-95 transition"
                >
                  <span className="absolute top-1.5 left-2 text-[10px] font-mono text-slate-600">{idx + 1}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 'revealed' && q && (
          <div className="flex flex-col items-center gap-4 w-full max-w-lg">
            <p className={['text-2xl font-bold', correct ? 'text-good' : 'text-bad'].join(' ')}>
              {correct ? '✓ Correct' : '✗ Incorrect'}
            </p>
            <p className="text-slate-300">
              Key of <span className="font-semibold text-slate-100">{keyName} major</span> · <span className="font-semibold">{q.prog.label}</span>
            </p>
            <div className="flex gap-2 flex-wrap justify-center">
              {q.prog.degrees.map((d, i) => {
                const chordRootPc = midiToPitchClass(q.keyRootMidi + MAJOR_SCALE[d]);
                return (
                  <div key={i} className="px-3 py-2 rounded-lg border border-ink-700 bg-ink-800 text-center">
                    <div className="text-accent font-bold text-sm">{DIATONIC[d].numeral}</div>
                    <div className="text-xs text-slate-400">{chordRootPc} {CHORD_BY_ID[DIATONIC[d].quality].short}</div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => void next()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-ink-900 font-bold text-sm hover:bg-accent-soft transition"
            >
              Next <ChevronRight className="w-4 h-4" />
              <kbd className="text-[10px] font-mono bg-ink-900/40 text-ink-900 px-1.5 py-0.5 rounded">Enter</kbd>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
