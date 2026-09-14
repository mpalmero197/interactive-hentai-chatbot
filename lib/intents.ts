export type SleepIntent = "sleep" | "wake" | null;

const SLEEP_RE =
  /\b(go to sleep|go sleep|sleep now|take a nap|nap time|bedtime|go to bed|fall asleep|sleeps?)\b/i;
const WAKE_RE =
  /\b(wake up|wakeup|wake her|wake them|get up|rise and shine|good morning|open your eyes)\b/i;

export function detectSleepIntent(text: string): SleepIntent {
  if (WAKE_RE.test(text)) return "wake";
  if (SLEEP_RE.test(text)) return "sleep";
  return null;
}
