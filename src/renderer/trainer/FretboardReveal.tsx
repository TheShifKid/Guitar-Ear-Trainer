import { Fretboard } from '@renderer/fretboard/Fretboard';
import { useSettings } from '@renderer/store/settingsStore';
import type { Question } from '@shared/types';

interface Props {
  question: Question;
  correct: boolean;
}

export function FretboardReveal({ question, correct }: Props) {
  const { fretMin, fretMax } = useSettings();
  const minF = Math.max(0,  Math.min(fretMin, question.root.fret, question.target.fret) - 1);
  const maxF = Math.min(24, Math.max(fretMax, question.root.fret, question.target.fret) + 1);

  return (
    <div className="rounded-xl border border-ink-700 bg-ink-800/60 p-4 space-y-3">
      <Fretboard
        minFret={minF}
        maxFret={maxF}
        markers={[
          {
            position: question.root,
            color: '#22d3ee',
            label: question.root.noteName.replace(/\d+$/, ''),
          },
          {
            position: question.target,
            color: correct ? '#22c55e' : '#ef4444',
            label: question.target.noteName.replace(/\d+$/, ''),
          },
        ]}
      />
      <div className="flex gap-6 text-xs font-mono text-slate-500">
        <span>
          <span className="text-accent">Root</span>{' '}
          {question.root.noteName} · str {6 - question.root.string} · fret {question.root.fret}
        </span>
        <span>
          <span className={correct ? 'text-good' : 'text-bad'}>Target</span>{' '}
          {question.target.noteName} · str {6 - question.target.string} · fret {question.target.fret}
        </span>
      </div>
    </div>
  );
}
