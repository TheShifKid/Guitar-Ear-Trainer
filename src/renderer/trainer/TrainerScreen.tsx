import { useEffect } from 'react';
import { Play, RotateCcw, ChevronRight } from 'lucide-react';
import { useTrainer } from './useTrainer';
import { AnswerButtons } from './AnswerButtons';
import { FretboardReveal } from './FretboardReveal';
import { useSession } from '@renderer/store/sessionStore';
import { useSettings } from '@renderer/store/settingsStore';
import { useStats } from '@renderer/store/statsStore';
import { useKeyboard } from '@renderer/shortcuts/useKeyboard';
import { INTERVAL_BY_ID } from '@renderer/music/intervals';

export function TrainerScreen() {
  const { phase, question, nextQuestion, replay, answer } = useTrainer();
  const { lastCorrect } = useSession();
  const settings = useSettings();
  const stats = useStats();

  useEffect(() => { stats.startSession(); }, []); // eslint-disable-line

  useKeyboard((e) => {
    if (e.key === ' ') {
      e.preventDefault();
      if (phase === 'idle' || phase === 'revealed') void nextQuestion();
      else if (phase === 'awaiting') void replay();
    } else if (e.key === 'Enter' && phase === 'revealed') {
      void nextQuestion();
    } else if (phase === 'awaiting' && /^[1-9]$/.test(e.key)) {
      const id = settings.enabledIntervals[parseInt(e.key, 10) - 1];
      if (id) answer(id);
    }
  }, [phase, settings.enabledIntervals]);

  const noIntervals = settings.enabledIntervals.length === 0;

  return (
    <div className="h-full flex flex-col">

      {/* ── Thin stats strip ── */}
      <div className="shrink-0 flex items-center gap-5 px-6 py-2.5 border-b border-ink-800 text-sm">
        <Stat label="Streak" value={stats.currentStreak} accent />
        <Stat label="Best"   value={stats.bestStreak} />
        <Stat label="Reps"   value={stats.totalReps} />
      </div>

      {/* ── Stage — flexible, centered ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-4 min-h-0">
        {noIntervals ? (
          <p className="text-sm text-bad">No intervals enabled — go to Settings.</p>
        ) : (
          <>
            {/* Play / status zone */}
            {(phase === 'idle' || phase === 'playing') && (
              <div className="flex flex-col items-center gap-5">
                <button
                  onClick={() => void nextQuestion()}
                  disabled={phase === 'playing'}
                  className={[
                    'relative w-24 h-24 rounded-full flex items-center justify-center transition-transform',
                    'bg-accent text-ink-900 shadow-[0_0_40px_rgba(245,158,11,0.25)]',
                    phase === 'playing' ? 'scale-95 cursor-default pulse-ring' : 'hover:scale-105 active:scale-95',
                  ].join(' ')}
                >
                  <Play className={['w-9 h-9', phase === 'playing' ? 'opacity-50' : ''].join(' ')} />
                </button>
                <p className="text-slate-500 text-sm">
                  {phase === 'idle'    ? 'Press play or hit Space'  : 'Listening…'}
                </p>
              </div>
            )}

            {phase === 'awaiting' && (
              <div className="flex flex-col items-center gap-5">
                <p className="text-2xl font-semibold text-slate-200">What interval was that?</p>
                <button
                  onClick={() => void replay()}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-ink-700 border-2 border-accent/40 text-accent font-semibold text-sm hover:bg-accent/10 hover:border-accent transition active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  Replay
                  <kbd className="ml-1 text-[10px] font-mono bg-ink-900/60 border border-accent/30 px-1.5 py-0.5 rounded">
                    Space
                  </kbd>
                </button>
              </div>
            )}

            {phase === 'revealed' && question && (
              <div className="w-full max-w-3xl flex flex-col gap-4">
                {/* Result headline */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className={['text-2xl font-bold', lastCorrect ? 'text-good' : 'text-bad'].join(' ')}>
                      {lastCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </p>
                    <p className="text-slate-400 text-sm mt-0.5">
                      It was <span className="text-slate-200 font-semibold">{INTERVAL_BY_ID[question.intervalId].name}</span>
                      <span className="text-slate-500"> · {question.ascending ? 'ascending' : 'descending'}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => void nextQuestion()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-ink-900 font-bold text-sm hover:bg-accent-soft transition"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                    <kbd className="text-[10px] font-mono bg-ink-900/40 text-ink-900 px-1.5 py-0.5 rounded">Enter</kbd>
                  </button>
                </div>

                {/* Fretboard */}
                <FretboardReveal question={question} correct={!!lastCorrect} />
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Answer buttons — always at bottom ── */}
      <div className="shrink-0 px-6 pb-5 pt-3 border-t border-ink-800">
        <AnswerButtons onAnswer={answer} />
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <span className="text-slate-500">
      {label}{' '}
      <span className={['font-bold', accent ? 'text-accent' : 'text-slate-300'].join(' ')}>{value}</span>
    </span>
  );
}
