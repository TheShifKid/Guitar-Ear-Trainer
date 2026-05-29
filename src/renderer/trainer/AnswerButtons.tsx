import { useSettings } from '@renderer/store/settingsStore';
import { INTERVAL_BY_ID } from '@renderer/music/intervals';
import { useSession } from '@renderer/store/sessionStore';
import type { IntervalId } from '@shared/types';

interface Props {
  onAnswer: (id: IntervalId) => void;
}

export function AnswerButtons({ onAnswer }: Props) {
  const { enabledIntervals } = useSettings();
  const { phase, question, eliminatedIds } = useSession();

  const canAnswer = phase === 'awaiting';
  const isRevealed = phase === 'revealed';

  return (
    <div className="answer-grid" style={{ '--cols': `repeat(${Math.min(enabledIntervals.length, 6)}, 1fr)` } as React.CSSProperties}>
      {enabledIntervals.map((id, idx) => {
        const def = INTERVAL_BY_ID[id];
        const isCorrect = isRevealed && question?.intervalId === id;
        const eliminated = canAnswer && eliminatedIds.includes(id);

        return (
          <button
            key={id}
            onClick={() => canAnswer && !eliminated && onAnswer(id)}
            disabled={(!canAnswer && !isRevealed) || eliminated}
            className={[
              'milled-button relative flex flex-col items-center justify-center py-3 rounded-xl border transition-all select-none',
              isCorrect
                ? 'border-secondary bg-secondary/15 shadow-[0_0_20px_rgba(78,222,163,0.3)] text-secondary'
                : eliminated
                ? 'border-outline-variant/30 bg-surface-container-low text-on-surface-variant/40 line-through cursor-not-allowed opacity-40'
                : canAnswer
                ? 'border-transparent bg-surface-container hover:border-primary/50 text-on-surface cursor-pointer active:scale-95'
                : 'border-transparent bg-surface-container/50 text-on-surface-variant/50 cursor-default',
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
