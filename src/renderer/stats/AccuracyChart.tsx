import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { DailyAggregate } from '@shared/types';

interface Props {
  daily: DailyAggregate[];
  days: number;
}

export function AccuracyChart({ daily, days }: Props) {
  const sliced = daily.slice(-days);
  const data = sliced.map((d) => ({
    date: d.date.slice(5),
    accuracy: d.total === 0 ? 0 : Math.round((d.correct / d.total) * 100),
    reps: d.total,
  }));

  if (data.length === 0) {
    return <p className="text-sm text-slate-500">No data yet — practice a session first.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a313c" />
        <XAxis dataKey="date" stroke="#7a8290" fontSize={11} />
        <YAxis stroke="#7a8290" fontSize={11} domain={[0, 100]} unit="%" />
        <Tooltip contentStyle={{ background: '#13171c', border: '1px solid #2a313c' }} />
        <Line type="monotone" dataKey="accuracy" stroke="#00daf3" strokeWidth={2} dot={{ r: 3, fill: '#00daf3' }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
