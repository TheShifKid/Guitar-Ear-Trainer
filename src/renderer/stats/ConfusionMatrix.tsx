import { INTERVAL_BY_ID } from '@renderer/music/intervals';
import { buildConfusionMatrix } from '@renderer/store/statsStore';
import type { AnswerResult, IntervalId } from '@shared/types';

interface Props {
  results: AnswerResult[];
  intervals: IntervalId[];
}

export function ConfusionMatrix({ results, intervals }: Props) {
  if (intervals.length === 0) {
    return <p className="text-sm text-slate-500">Enable some intervals to see confusion data.</p>;
  }
  const m = buildConfusionMatrix(results, intervals);
  const maxVal = Math.max(1, ...intervals.flatMap((i) => intervals.map((j) => m[i][j])));

  return (
    <div className="overflow-x-auto">
      <table className="text-xs font-mono">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left text-slate-500">actual ↓ / guess →</th>
            {intervals.map((i) => (
              <th key={i} className="px-2 py-1 text-slate-400">{INTERVAL_BY_ID[i].short}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {intervals.map((actual) => (
            <tr key={actual}>
              <td className="px-2 py-1 text-slate-400">{INTERVAL_BY_ID[actual].short}</td>
              {intervals.map((guess) => {
                const v = m[actual][guess];
                const isDiag = actual === guess;
                const alpha = v === 0 ? 0 : 0.15 + (v / maxVal) * 0.7;
                const bg = isDiag
                  ? `rgba(34, 197, 94, ${alpha})`
                  : `rgba(239, 68, 68, ${alpha})`;
                return (
                  <td
                    key={guess}
                    className="px-2 py-1 text-center"
                    style={{ background: v ? bg : 'transparent' }}
                  >
                    {v || ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
