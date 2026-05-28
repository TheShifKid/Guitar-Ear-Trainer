import { useSettings } from '@renderer/store/settingsStore';
import { INTERVAL_BY_ID } from '@renderer/music/intervals';
import { useSession } from '@renderer/store/sessionStore';
import type { IntervalId } from '@shared/types';

interface Props {
  onAnswer: (id: IntervalId) => void;
}

export function AnswerButtons({ onAnswer }: Props) {
  const { enabledIntervals } = useSettings();
  const { phase, question } = useSession();

  const canAnswer = phase === 'awaiting';
  const isRevealed = phase === 'revealed';

  return (
    <div className="answer-grid" style={{ '--cols': `repeat(${Math.min(enabledIntervals.length, 6)}, 1fr)` } as React.CSSProperties}>
      {enabledIntervals.map((id, idx) => {
        const def = INTERVAL_BY_ID[id];
        const isCorrect = isRevealed && question?.intervalId === id;

        return (
          <button
            key={id}
            onClick={() => canAnswer && onAnswer(id)}
            disabled={!canAnswer && !isRevealed}
            className={[
              'relative flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all select-none',
              isCorrect
                ? 'border-good bg-good/15 shadow-[0_0_20px_rgba(34,197,94,0.2)] text-good'
                : canAnswer
                ? 'border-ink-600 bg-ink-700/80 hover:border-accent/60 hover:bg-ink-700 text-slate-200 cursor-pointer active:scale-95'
                : 'border-ink-700 bg-ink-800/50 text-slate-600 cursor-default',
            ].join(' ')}
          >
            {/* Keyboard shortcut */}
            <span className="absolute top-1.5 left-2 text-[10px] font-mono text-slate-600">
              {idx < 9 ? idx + 1 : ''}
            </span>

            <span className={['font-mono font-bold text-lg leading-none', isCorrect ? 'text-good' : ''].join(' ')}>
              {def.short}
            </span>
            <span className={['text-[11px] mt-1', isCorrect ? 'text-good/70' : 'text-slate-500'].join(' ')}>
              {def.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
