import { daysBetween, type Day } from './dates';

export type Mood = 'happy' | 'thirsty' | 'neglected';

/**
 * How a plant "feels" based on watering. Thirsty when watering is due,
 * neglected when it is overdue by more than its whole watering interval.
 */
export function plantMood(lastWatered: Day | undefined, waterEvery: number, day: Day): Mood {
  // Never watered in the app yet: nudge the first water check without scolding a new plant.
  if (!lastWatered) return 'thirsty';
  const since = daysBetween(lastWatered, day);
  if (since >= waterEvery * 2) return 'neglected';
  if (since >= waterEvery) return 'thirsty';
  return 'happy';
}

export const MOOD_LABEL: Record<Mood, { label: string; icon: 'happy-outline' | 'water-outline' | 'sad-outline' }> = {
  happy: { label: 'Masaya', icon: 'happy-outline' },
  thirsty: { label: 'Nauuhaw', icon: 'water-outline' },
  neglected: { label: 'Nalulungkot', icon: 'sad-outline' },
};
