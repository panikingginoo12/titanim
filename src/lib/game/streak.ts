import { addDays, daysBetween, weekStart, type Day } from '@/lib/dates';

export type Streak = {
  /** Days in the current streak, including today if a quest is done. */
  current: number;
  best: number;
  /** Missed days covered by a streak freeze in the current streak. */
  frozen: Day[];
  /** Whether this week's freeze is still unused. */
  freezeAvailable: boolean;
  doneToday: boolean;
};

/**
 * A "Dilig streak" counts days with at least one completed quest.
 * One missed day per week (Monday–Sunday) is forgiven by a streak freeze.
 * Today never breaks the streak: there is still time to finish a quest.
 */
export function computeStreak(activeDays: Iterable<Day>, today: Day): Streak {
  const active = new Set(activeDays);
  const sorted = [...active].filter((d) => d <= today).sort();
  const doneToday = active.has(today);

  if (sorted.length === 0) {
    return { current: 0, best: 0, frozen: [], freezeAvailable: true, doneToday };
  }

  let run = 0;
  let best = 0;
  let frozen: Day[] = [];
  const usedWeeks = new Set<Day>();
  const total = daysBetween(sorted[0], today);

  for (let i = 0; i <= total; i++) {
    const d = addDays(sorted[0], i);
    if (active.has(d)) {
      run++;
      best = Math.max(best, run);
      continue;
    }
    if (d === today) break;

    const week = weekStart(d);
    const prev = addDays(d, -1);
    const prevWasFrozen = frozen.includes(prev);
    if (run > 0 && !prevWasFrozen && !usedWeeks.has(week)) {
      usedWeeks.add(week);
      frozen.push(d);
      continue;
    }
    // The streak breaks. A freeze spent on the day before was wasted, so give it back.
    if (prevWasFrozen) usedWeeks.delete(weekStart(prev));
    run = 0;
    frozen = [];
  }

  return {
    current: run,
    best,
    frozen,
    freezeAvailable: !usedWeeks.has(weekStart(today)),
    doneToday,
  };
}
