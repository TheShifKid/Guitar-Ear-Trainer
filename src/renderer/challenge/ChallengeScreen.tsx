import { useCallback, useEffect, useRef, useState } from 'react';
import { Timer, Play } from 'lucide-react';
import { useSettings } from '@renderer/store/settingsStore';
import { useStats } from '@renderer/store/statsStore';
import { pickRandomRoot, pickSecondNote } from '@renderer/music/fretboard';
import { planFromSettings, playPlan } from '@renderer/audio/playInterval';
import { INTERVAL_BY_ID } from '@renderer/music/intervals';
import { useKeyboard } from '@renderer/shortcuts/useKeyboard';
import type { FretPosition, IntervalId } from '@shared/types';

const DURATION_MS = 60_000;

type Status = 'idle' | 'running' | 'done';
interface Q { root: FretPosition; target: FretPosition; intervalId: IntervalId }

export function ChallengeScreen() {
  const settings = useSettings();
  const stats = useStats();
  const [status, setStatus] = useState<Status>('idle');
  const [timeLeft, setTimeLeft] = useState(DURATION_MS);
  const [score, setScore] = useState(0);
  const [q, setQ] = useState<Q | null>(null);
  const [flash, setFlash] = useState<'none' | 'good' | 'bad'>('none');
  const endAtRef = useRef(0);
  const statusRef = useRef<Status>('idle');
  statusRef.current = status;

  const newQuestion = useCallback(() => {
    const root = pickRandomRoot(settings);
    const intervalId = settings.enabledIntervals[Math.floor(Math.random() * settings.enabledIntervals.length)];
    const { target } = pickSecondNote(root, intervalId, settings);
    const question = { root, target, intervalId };
    setQ(question);
    void playPlan(planFromSettings(root.midi, target.midi, settings), settings.soundPack);
  }, [settings]);

  const start = useCallback(() => {
    if (settings.enabledIntervals.length === 0) return;
    setScore(0);
    setTimeLeft(DURATION_MS);
    setStatus('running');
    endAtRef.current = Date.now() + DURATION_MS;
    newQuestion();
  }, [settings.enabledIntervals.length, newQuestion]);

  // Countdown
  useEffect(() => {
    if (status !== 'running') return;
    const iv = setInterval(() => {
      const left = Math.max(0, endAtRef.current - Date.now());
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(iv);
        setStatus('done');
        setScore((sc) => { stats.recordTimedScore(sc); return sc; });
      }
    }, 100);
    return () => clearInterval(iv);
  }, [status, stats]);

  const answer = useCallback((id: IntervalId) => {
    if (statusRef.current !== 'running' || !q) return;
    const correct = id === q.intervalId;
    stats.recordAnswer({
      questionId: `c-${Date.now()}`,
      intervalId: q.intervalId,
      guessedId: id,
      correct,
      usedReplay: false,
      usedHint: false,
      answeredAt: Date.now(),
    });
    if (correct) setScore((s) => s + 1);
    setFlash(correct ? 'good' : 'bad');
    setTimeout(() => setFlash('none'), 180);
    newQuestion();
  }, [q, stats, newQuestion]);

  useKeyboard((e) => {
    if (status === 'idle' && e.key === ' ') { e.preventDefault(); start(); }
    else if (status === 'done' && e.key === ' ') { e.preventDefault(); start(); }
    else if (status === 'running' && /^[1-9]$/.test(e.key)) {
      const id = settings.enabledIntervals[parseInt(e.key, 10) - 1];
      if (id) answer(id);
    }
  }, [status, settings.enabledIntervals, answer, start]);

  const seconds = Math.ceil(timeLeft / 1000);
  const noIntervals = settings.enabledIntervals.length === 0;

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 flex items-center justify-between px-6 py-2.5 border-b border-ink-800 text-sm">
        <span className="flex items-center gap-2 text-slate-300 font-semibold">
          <Timer className="w-4 h-4 text-accent" /> Timed Challenge · 60s
        </span>
        <span className="text-slate-500">Best <span className="text-accent font-bold">{stats.bestTimedScore}</span></span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 min-h-0">
        {noIntervals && <p className="text-sm text-bad">Enable intervals in Settings first.</p>}

        {status === 'idle' && !noIntervals && (
          <div className="flex flex-col items-center gap-5 text-center">
            <p className="text-slate-400 max-w-sm">As many correct as you can in 60 seconds. No reveals, no mercy. Answer with the buttons or number keys.</p>
            <button onClick={start} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-accent text-ink-900 font-bold hover:bg-accent-soft transition">
              <Play className="w-5 h-5" /> Start
            </button>
          </div>
        )}

        {status === 'running' && (
          <>
            <div className="flex items-center gap-8">
              <Metric label="Time" value={`${seconds}s`} warn={seconds <= 10} />
              <Metric label="Score" value={String(score)} accent />
            </div>
            <div className={[
              'w-20 h-20 rounded-full transition-colors flex items-center justify-center text-3xl',
              flash === 'good' ? 'bg-good/30' : flash === 'bad' ? 'bg-bad/30' : 'bg-ink-700',
            ].join(' ')}>
              {flash === 'good' ? '✓' : flash === 'bad' ? '✗' : '🎧'}
            </div>
            <p className="text-slate-500 text-sm">Which interval?</p>
          </>
        )}

        {status === 'done' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-slate-400">Time!</p>
            <p className="text-6xl font-bold text-accent">{score}</p>
            <p className="text-slate-400">
              {score > stats.bestTimedScore ? '🎉 New best!' : `Best: ${stats.bestTimedScore}`}
            </p>
            <button onClick={start} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-ink-900 font-bold hover:bg-accent-soft transition">
              <Play className="w-4 h-4" /> Play again <kbd className="text-[10px] bg-ink-900/30 px-1.5 py-0.5 rounded">Space</kbd>
            </button>
          </div>
        )}
      </div>

      {/* Answer buttons */}
      {status === 'running' && (
        <div className="shrink-0 px-6 pb-5 pt-3 border-t border-ink-800">
          <div className="answer-grid" style={{ '--cols': `repeat(${Math.min(settings.enabledIntervals.length, 6)}, 1fr)` } as React.CSSProperties}>
            {settings.enabledIntervals.map((id, idx) => {
              const def = INTERVAL_BY_ID[id];
              return (
                <button
                  key={id}
                  onClick={() => answer(id)}
                  className="relative flex flex-col items-center justify-center py-3 rounded-xl border-2 border-ink-600 bg-ink-700/80 hover:border-accent/60 hover:bg-ink-700 text-slate-200 active:scale-95 transition"
                >
                  <span className="absolute top-1.5 left-2 text-[10px] font-mono text-slate-600">{idx < 9 ? idx + 1 : ''}</span>
                  <span className="font-mono font-bold text-lg leading-none">{def.short}</span>
                  <span className="text-[11px] mt-1 text-slate-500">{def.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, accent, warn }: { label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      <span className={['text-4xl font-bold', warn ? 'text-bad' : accent ? 'text-accent' : 'text-slate-100'].join(' ')}>{value}</span>
    </div>
  );
}
