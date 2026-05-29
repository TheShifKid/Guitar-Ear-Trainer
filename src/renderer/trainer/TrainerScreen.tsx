import { useEffect } from 'react';
import { Turtle, Lightbulb } from 'lucide-react';
import { useTrainer } from './useTrainer';
import { AnswerButtons } from './AnswerButtons';
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

  // Fretboard markers: root always visible once a question exists; target only on reveal
  // (or earlier if the "show notes" crutch is on).
  const showTarget = question && (phase === 'revealed' || settings.showNotesBeforeAnswer);
  const markers = question
    ? [
        { position: question.root, color: '#00daf3', label: question.root.noteName.replace(/\d+$/, '') },
        ...(showTarget
          ? [{
              position: question.target,
              color: phase === 'revealed' && lastCorrect === false ? '#ffb4ab' : '#4edea3',
              label: question.target.noteName.replace(/\d+$/, ''),
            }]
          : []),
      ]
    : [];
  const fbMin = question ? Math.max(0, Math.min(settings.fretMin, question.root.fret, question.target.fret) - 1) : settings.fretMin;
  const fbMax = question ? Math.min(24, Math.max(settings.fretMax, question.root.fret, question.target.fret) + 1) : settings.fretMax;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1100px] mx-auto px-6 py-8 flex flex-col gap-8">

        {/* ── Session HUD ── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HudCard label="Current Streak" value={stats.currentStreak} icon="local_fire_department" tone="secondary" />
          <HudCard label="Total Reps" value={stats.totalReps} icon="layers" tone="primary" />
          <HudCard label="Accuracy" value={`${accuracy}%`} icon="monitoring" tone="primaryLight" />
        </section>

        {/* ── Fretboard visualizer ── */}
        <section className="surface-card relative rounded-2xl p-4">
          {question ? (
            <Fretboard minFret={fbMin} maxFret={fbMax} markers={markers} height={240} />
          ) : (
            <div className="h-[240px] flex items-center justify-center text-on-surface-variant/50 font-mono text-sm">
              Press Play to begin
            </div>
          )}
        </section>

        {/* ── Central training interface ── */}
        <section className="flex flex-col items-center gap-6">
          {noIntervals && (
            <div className="w-full rounded-xl border border-error/40 bg-error/10 p-4 text-sm text-error">
              No intervals enabled — open Settings and enable at least one.
            </div>
          )}

          {/* Main actions */}
          <div className="flex flex-wrap justify-center gap-4 w-full">
            <button
              onClick={() => (phase === 'awaiting' ? void replay() : void nextQuestion())}
              disabled={noIntervals || phase === 'playing'}
              className="milled-button active-glow bg-primary-container text-on-primary-container min-h-[64px] px-10 rounded-lg flex items-center gap-3 active:scale-95 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-3xl fill">play_circle</span>
              <span className="text-lg font-semibold">
                {phase === 'idle' ? 'Play Root & Interval' : phase === 'playing' ? 'Playing…' : 'Replay'}
              </span>
            </button>

            <div className="flex gap-3">
              <ActionBtn icon="replay" label="Replay" onClick={() => void replay()} disabled={!question || phase === 'playing'} />
              <button
                onClick={() => void replaySlow()}
                disabled={!question || phase === 'playing'}
                className="milled-button bg-surface-container-high text-on-surface px-5 rounded-lg flex items-center gap-2 hover:bg-surface-bright transition-colors disabled:opacity-40"
              >
                <Turtle className="w-5 h-5" />
                <span className="font-mono text-xs uppercase tracking-wider">Slow</span>
              </button>
              <button
                onClick={useHint}
                disabled={phase !== 'awaiting' || usedHint}
                className="milled-button bg-surface-container-high text-on-surface px-5 rounded-lg flex items-center gap-2 hover:bg-surface-bright transition-colors disabled:opacity-40"
              >
                <Lightbulb className="w-5 h-5" />
                <span className="font-mono text-xs uppercase tracking-wider">Hint</span>
              </button>
              <ActionBtn icon="skip_next" label="Next" onClick={() => void nextQuestion()} disabled={noIntervals} />
            </div>
          </div>

          {/* Interval guessing grid */}
          <div className="w-full max-w-4xl">
            <AnswerButtons onAnswer={answer} />
          </div>

          {/* Feedback area */}
          <FeedbackArea phase={phase} correct={lastCorrect} question={question} />
        </section>

        {/* ── Session performance ── */}
        <section className="surface-card rounded-2xl p-6">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.15em] text-on-surface-variant mb-6">Session Performance</h3>
          <SessionBars daily={stats.daily} />
        </section>
      </div>
    </div>
  );
}

function HudCard({
  label, value, icon, tone,
}: { label: string; value: number | string; icon: string; tone: 'secondary' | 'primary' | 'primaryLight' }) {
  const color = tone === 'secondary' ? 'text-secondary' : tone === 'primary' ? 'text-primary-fixed-dim' : 'text-primary';
  const glow = tone === 'secondary' ? 'rgba(78,222,163,0.18)' : 'rgba(0,218,243,0.18)';
  return (
    <div className="surface-card rounded-2xl p-6 flex items-center justify-between overflow-hidden">
      <div className="relative z-10">
        <p className={['font-mono text-[11px] uppercase tracking-[0.15em]', color].join(' ')}>{label}</p>
        <p className={['text-5xl font-bold leading-tight mt-1 tabular-nums', color].join(' ')}>{value}</p>
      </div>
      <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full blur-2xl" style={{ background: glow }} />
      <span className={['material-symbols-outlined text-6xl opacity-25 relative z-10', color].join(' ')}>{icon}</span>
    </div>
  );
}

function ActionBtn({ icon, label, onClick, disabled }: { icon: string; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="milled-button bg-surface-container-high text-on-surface px-5 rounded-lg flex items-center gap-2 hover:bg-surface-bright transition-colors disabled:opacity-40"
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span className="font-mono text-xs uppercase tracking-wider">{label}</span>
    </button>
  );
}

function FeedbackArea({
  phase, correct, question,
}: { phase: string; correct: boolean | null; question: ReturnType<typeof useTrainer>['question'] }) {
  if (phase === 'revealed' && question) {
    const def = INTERVAL_BY_ID[question.intervalId];
    return (
      <div
        className={[
          'w-full max-w-4xl min-h-[96px] flex items-center justify-center rounded-xl border-2 transition-all px-6',
          correct ? 'bg-secondary/10 border-secondary/50' : 'bg-error/10 border-error/50',
        ].join(' ')}
      >
        <div className={['flex items-center gap-4', correct ? 'text-secondary' : 'text-error'].join(' ')}>
          <span className="material-symbols-outlined text-4xl">{correct ? 'check_circle' : 'cancel'}</span>
          <div>
            <p className="text-xl font-semibold">
              {correct ? `Correct: ${def.name}` : `It was a ${def.name}`}
            </p>
            <p className="text-sm opacity-80">
              {question.root.noteName.replace(/\d+$/, '')} to {question.target.noteName.replace(/\d+$/, '')}
              {' · '}{question.ascending ? 'ascending' : 'descending'}
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full max-w-4xl min-h-[96px] flex items-center justify-center rounded-xl bg-surface-container-low border-2 border-dashed border-outline-variant/30">
      <p className="text-on-surface-variant text-lg italic">
        {phase === 'awaiting' ? 'Pick the interval you heard…' : 'Make a guess to see the result…'}
      </p>
    </div>
  );
}

function SessionBars({ daily }: { daily: { date: string; total: number; correct: number }[] }) {
  const last = daily.slice(-12);
  if (last.length === 0) {
    return <div className="h-40 flex items-center justify-center text-on-surface-variant/40 text-sm">No data yet — start practicing.</div>;
  }
  return (
    <div className="h-40 w-full flex items-end gap-1.5 px-1">
      {last.map((d) => {
        const acc = d.total ? Math.round((d.correct / d.total) * 100) : 0;
        return (
          <div
            key={d.date}
            title={`${d.date}: ${acc}% (${d.total} reps)`}
            className="flex-1 bg-primary-fixed-dim/25 hover:bg-primary-fixed-dim/50 transition-colors rounded-t-sm"
            style={{ height: `${Math.max(4, acc)}%` }}
          />
        );
      })}
    </div>
  );
}
