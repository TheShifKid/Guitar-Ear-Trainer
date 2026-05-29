import { useEffect } from 'react';
import { Play, RotateCcw, ChevronRight, Turtle, Lightbulb } from 'lucide-react';
import { useTrainer } from './useTrainer';
import { AnswerButtons } from './AnswerButtons';
import { FretboardReveal } from './FretboardReveal';
import { Fretboard } from '@renderer/fretboard/Fretboard';
import { useSession } from '@renderer/store/sessionStore';
import { useSettings } from '@renderer/store/settingsStore';
import { useStats } from '@renderer/store/statsStore';
import { useKeyboard } from '@renderer/shortcuts/useKeyboard';
import { INTERVAL_BY_ID } from '@renderer/music/intervals';

export function TrainerScreen() {
  const { phase, question, nextQuestion, replay, replaySlow, useHint, answer } = useTrainer();
  const { lastCorrect, usedHint } = useSession();
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
    } else if (phase === 'awaiting' && (e.key === 'h' || e.key === 'H')) {
      useHint();
    } else if (phase === 'awaiting' && (e.key === 's' || e.key === 'S')) {
      void replaySlow();
    } else if (phase === 'awaiting' && /^[1-9]$/.test(e.key)) {
      const id = settings.enabledIntervals[parseInt(e.key, 10) - 1];
      if (id) answer(id);
    }
  }, [phase, settings.enabledIntervals]);

  const noIntervals = settings.enabledIntervals.length === 0;
  const accuracy = stats.results.length
    ? Math.round((stats.results.filter((r) => r.correct).length / stats.results.length) * 100)
    : 0;

  return (
    <div className="h-full flex flex-col">

      {/* ── Session HUD ── */}
      <div className="shrink-0 grid grid-cols-3 gap-3 px-6 py-3 border-b border-outline-variant/30">
        <HudCard label="Current Streak" value={stats.currentStreak} icon="local_fire_department" tone="secondary" />
        <HudCard label="Total Reps" value={stats.totalReps} icon="layers" tone="primary" />
        <HudCard label="Accuracy" value={`${accuracy}%`} icon="monitoring" tone="primaryLight" />
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
                    'milled-button active-glow bg-primary-container text-on-primary-container',
                    phase === 'playing' ? 'scale-95 cursor-default pulse-ring' : 'hover:scale-105 active:scale-95',
                  ].join(' ')}
                >
                  <Play className={['w-9 h-9', phase === 'playing' ? 'opacity-50' : ''].join(' ')} />
                </button>
                <p className="text-slate-500 text-sm">
                  {phase === 'idle' ? 'Press play or hit Space' : 'Listening…'}
                </p>
              </div>
            )}

            {phase === 'awaiting' && question && (
              <div className="flex flex-col items-center gap-5 w-full max-w-3xl">
                <p className="text-2xl font-semibold text-slate-200">What interval was that?</p>

                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <button
                    onClick={() => void replay()}
                    className="milled-button inline-flex items-center gap-2 px-5 py-3 rounded-full bg-surface-container border-2 border-accent/40 text-accent font-semibold text-sm hover:bg-accent/10 hover:border-accent transition active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4" /> Replay
                    <kbd className="text-[10px] font-mono bg-ink-900/60 border border-accent/30 px-1.5 py-0.5 rounded">Space</kbd>
                  </button>
                  <button
                    onClick={() => void replaySlow()}
                    className="milled-button inline-flex items-center gap-2 px-4 py-3 rounded-full bg-surface-container-high border border-outline-variant/40 text-on-surface text-sm hover:bg-surface-bright transition active:scale-95"
                  >
                    <Turtle className="w-4 h-4" /> Slow
                    <kbd className="text-[10px] font-mono bg-ink-900/60 border border-ink-600 px-1.5 py-0.5 rounded">S</kbd>
                  </button>
                  <button
                    onClick={useHint}
                    disabled={usedHint}
                    className="milled-button inline-flex items-center gap-2 px-4 py-3 rounded-full bg-surface-container-high border border-outline-variant/40 text-on-surface text-sm hover:bg-surface-bright transition active:scale-95 disabled:opacity-40"
                  >
                    <Lightbulb className="w-4 h-4" /> {usedHint ? 'Hint used' : 'Hint'}
                    {!usedHint && <kbd className="text-[10px] font-mono bg-ink-900/60 border border-ink-600 px-1.5 py-0.5 rounded">H</kbd>}
                  </button>
                </div>

                {/* Optional pre-answer fretboard crutch */}
                {settings.showNotesBeforeAnswer && (
                  <div className="w-full rounded-xl border border-ink-700 bg-ink-800/60 p-4">
                    <Fretboard
                      minFret={Math.max(0, Math.min(settings.fretMin, question.root.fret, question.target.fret) - 1)}
                      maxFret={Math.min(24, Math.max(settings.fretMax, question.root.fret, question.target.fret) + 1)}
                      markers={[
                        { position: question.root, color: '#22d3ee', label: question.root.noteName.replace(/\d+$/, '') },
                        { position: question.target, color: '#a78bfa', label: question.target.noteName.replace(/\d+$/, '') },
                      ]}
                    />
                    <p className="text-[11px] text-slate-500 mt-2 text-center">Crutch on — both notes shown before you answer</p>
                  </div>
                )}
              </div>
            )}

            {phase === 'revealed' && question && (
              <div className="w-full max-w-3xl flex flex-col gap-4">
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
                    className="milled-button active-glow inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-on-primary font-bold text-sm hover:brightness-110 transition"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                    <kbd className="text-[10px] font-mono bg-ink-900/40 text-ink-900 px-1.5 py-0.5 rounded">Enter</kbd>
                  </button>
                </div>

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

function HudCard({
  label, value, icon, tone,
}: { label: string; value: number | string; icon: string; tone: 'secondary' | 'primary' | 'primaryLight' }) {
  const color =
    tone === 'secondary' ? 'text-secondary' : tone === 'primary' ? 'text-primary-fixed-dim' : 'text-primary';
  return (
    <div className="relative bg-surface-container rounded-xl px-4 py-3 border border-outline-variant/30 overflow-hidden">
      <p className={['text-[10px] font-mono uppercase tracking-[0.15em]', color].join(' ')}>{label}</p>
      <p className={['text-3xl font-bold leading-tight', color].join(' ')}>{value}</p>
      <span className={['material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-5xl opacity-10', color].join(' ')}>
        {icon}
      </span>
    </div>
  );
}
