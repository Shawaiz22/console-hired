/**
 * Delivery numbers that can be derived from the transcript and the recording length.
 * These are computed here rather than asked of the model: they are exact, they cost
 * nothing, and they survive a failed audio call.
 */

const FILLERS = /\b(um|uh|erm|like|you know|basically|actually|i mean|sort of|kind of)\b/gi;

/** Bands used by the UI to say what a WPM number means, rather than just showing it. */
export const PACE_BANDS = {
  hesitant: 110,
  comfortableLow: 130,
  comfortableHigh: 160,
  rushed: 180,
} as const;

export function paceLabel(wordsPerMinute: number): string {
  if (wordsPerMinute === 0) return "not measured";
  if (wordsPerMinute < PACE_BANDS.hesitant) return "slow — may read as hesitant";
  if (wordsPerMinute < PACE_BANDS.comfortableLow) return "slightly slow";
  if (wordsPerMinute <= PACE_BANDS.comfortableHigh) return "comfortable pace";
  if (wordsPerMinute <= PACE_BANDS.rushed) return "slightly fast";
  return "fast — may read as rushed";
}

export function computeMetrics(transcript: string, durationMs: number) {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const minutes = durationMs / 60000;

  const fillerCount = transcript.match(FILLERS)?.length ?? 0;

  return {
    wordsPerMinute: minutes > 0 ? Math.round(words.length / minutes) : 0,
    wordCount: words.length,
    durationSeconds: Math.round(durationMs / 1000),
    fillerCount,
    fillerRate: words.length > 0 ? +((fillerCount / words.length) * 100).toFixed(1) : 0,
  };
}
