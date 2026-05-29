import { useCallback, useRef } from 'react';
import { useSettings } from '@renderer/store/settingsStore';
import { useSession } from '@renderer/store/sessionStore';
import { useStats } from '@renderer/store/statsStore';
import { pickRandomRoot, pickSecondNote } from '@renderer/music/fretboard';
import { planFromSettings, playPlan } from '@renderer/audio/playInterval';
import { nextProgressiveUnlock } from '@renderer/settings/modes';
import { INTERVAL_BY_ID } from '@renderer/music/intervals';
import type { IntervalId, Question } from '@shared/types';

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Shuffle-bag picker with anti-clump: every interval appears once before any
 * repeats, AND two of the same interval will never play back-to-back across
 * bag boundaries.
 */
function makeBagPicker() {
  let bag: IntervalId[] = [];
  let last: IntervalId | null = null;
  return (enabled: IntervalId[]): IntervalId => {
    const enabledSet = new Set(enabled);
    // Refill if empty or stale (settings changed).
    if (bag.length === 0 || bag.some((id) => !enabledSet.has(id))) {
      bag = shuffle(enabled);
      // Avoid front-of-new-bag matching the previous pick.
      if (last && bag[0] === last && bag.length > 1) {
        [bag[0], bag[1]] = [bag[1], bag[0]];
      }
    }
    const pick = bag.shift()!;
    last = pick;
    return pick;
  };
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function useTrainer() {
  const settings = useSettings();
  const stats = useStats();
  const {
    phase, question, setPhase, setQuestion,
    setLastCorrect, setUsedReplay, usedReplay,
    setUsedHint, usedHint, setEliminated,
  } = useSession();
  const pickerRef = useRef(makeBagPicker());

  const nextQuestion = useCallback(async () => {
    if (settings.enabledIntervals.length === 0) return;
    const root = pickRandomRoot(settings);
    const intervalId = pickerRef.current(settings.enabledIntervals);
    const { target, ascending } = pickSecondNote(root, intervalId, settings);
    const q: Question = {
      id: uid(),
      root,
      target,
      intervalId,
      ascending,
      createdAt: Date.now(),
    };
    setQuestion(q);
    setUsedReplay(false);
    setPhase('playing');
    const plan = planFromSettings(root.midi, target.midi, settings);
    await playPlan(plan, settings.soundPack);
    setPhase('awaiting');
  }, [settings, setQuestion, setPhase, setUsedReplay]);

  const replay = useCallback(async (rate = 1) => {
    const current = useSession.getState().question;
    if (!current) return;
    setUsedReplay(true);
    setPhase('playing');
    const plan = planFromSettings(current.root.midi, current.target.midi, settings);
    await playPlan(plan, settings.soundPack, rate);
    setPhase('awaiting');
  }, [settings, setPhase, setUsedReplay]);

  const replaySlow = useCallback(() => replay(0.5), [replay]);

  // Hint: eliminate ~half of the wrong answers, always keeping the correct one.
  const useHintNow = useCallback(() => {
    const current = useSession.getState().question;
    if (!current || useSession.getState().phase !== 'awaiting') return;
    const wrong = settings.enabledIntervals.filter((id) => id !== current.intervalId);
    if (wrong.length <= 1) return;
    const toEliminate = shuffle(wrong).slice(0, Math.ceil(wrong.length / 2));
    setEliminated(toEliminate);
    setUsedHint(true);
  }, [settings.enabledIntervals, setEliminated, setUsedHint]);

  const answer = useCallback(
    (guessedId: IntervalId) => {
      if (!question || phase !== 'awaiting') return;
      const correct = guessedId === question.intervalId;
      setLastCorrect(correct);
      setPhase('revealed');
      const result = {
        questionId: question.id,
        intervalId: question.intervalId,
        guessedId,
        correct,
        usedReplay,
        usedHint,
        answeredAt: Date.now(),
      };
      stats.recordAnswer(result);
      if (settings.mode === 'progressive') {
        const next = nextProgressiveUnlock(settings.enabledIntervals, [...stats.results, result]);
        if (next) {
          settings.setIntervals([...settings.enabledIntervals, next]);
        }
      }
    },
    [question, phase, usedReplay, usedHint, settings, stats, setLastCorrect, setPhase],
  );

  const intervalName = question ? INTERVAL_BY_ID[question.intervalId].name : '';

  return { phase, question, nextQuestion, replay, replaySlow, useHint: useHintNow, answer, intervalName };
}
