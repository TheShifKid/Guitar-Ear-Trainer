import type { AnswerResult, IntervalId } from '@shared/types';
import { PROGRESSIVE_ORDER } from '@renderer/music/intervals';
import { accuracyForInterval } from '@renderer/store/statsStore';

const UNLOCK_THRESHOLD = 0.85;
const UNLOCK_WINDOW = 20;

/**
 * Given recent results and the currently-enabled set under progressive mode,
 * return the next interval id to unlock (or null if none / fully unlocked).
 *
 * Rule: every currently-enabled interval must have ≥85% accuracy over the
 * last 20 reps AND have at least UNLOCK_WINDOW reps recorded.
 */
export function nextProgressiveUnlock(
  enabled: IntervalId[],
  results: AnswerResult[],
): IntervalId | null {
  const enabledSet = new Set(enabled);
  for (const id of enabled) {
    const recent = results.filter((r) => r.intervalId === id).slice(-UNLOCK_WINDOW);
    if (recent.length < UNLOCK_WINDOW) return null;
    if (accuracyForInterval(recent, id) < UNLOCK_THRESHOLD) return null;
  }
  for (const id of PROGRESSIVE_ORDER) {
    if (!enabledSet.has(id)) return id;
  }
  return null;
}
