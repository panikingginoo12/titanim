import type { CareProfile } from '@/data/species';
import { daysBetween, type Day } from '@/lib/dates';

export type QuestType = 'water' | 'photo' | 'fertilize' | 'inspect' | 'rotate' | 'mist';

/** Care actions that are logged when a quest is completed. Photos are tracked separately. */
export type CareType = Exclude<QuestType, 'photo'>;

export type PlantState = {
  id: number;
  location: 'indoor' | 'outdoor';
  acquiredDay: Day;
  /** Last day each care action was done, if ever. */
  last: Partial<Record<CareType, Day>>;
  /** Interval set by the user for this plant; overrides the care profile. */
  waterEveryDaysOverride: number | null;
  hasPhotoToday: boolean;
};

export type QuestPlan = { plantId: number; type: QuestType; xp: number };

export const MAX_QUESTS_PER_PLANT = 3;

export const QUEST_XP: Record<QuestType, number> = {
  water: 10,
  photo: 15,
  fertilize: 15,
  inspect: 10,
  rotate: 5,
  mist: 5,
};

/** Used for plants that are not linked to a bundled care profile. */
export const GENERIC_CARE: Pick<CareProfile, 'waterEveryDays' | 'fertilizeEveryDays' | 'humidity'> = {
  waterEveryDays: 4,
  fertilizeEveryDays: 30,
  humidity: 'medium',
};

const INSPECT_EVERY = 7;
const ROTATE_EVERY = 7;
const MIST_EVERY = 2;

/**
 * Due when the action has never been done and the plant has been owned for `firstAfter` days,
 * or when `interval` days have passed since it was last done.
 */
function isDue(last: Day | undefined, acquired: Day, day: Day, interval: number, firstAfter: number): boolean {
  if (last) return daysBetween(last, day) >= interval;
  return daysBetween(acquired, day) >= firstAfter;
}

/** Quests for one plant on one day, most important first, capped at three. */
export function questsForPlant(
  plant: PlantState,
  care: Pick<CareProfile, 'waterEveryDays' | 'fertilizeEveryDays' | 'humidity'> | undefined,
  day: Day,
): QuestPlan[] {
  const c = care ?? GENERIC_CARE;
  const waterEvery = plant.waterEveryDaysOverride ?? c.waterEveryDays;
  const types: QuestType[] = [];

  // A new plant with no watering history gets a water check right away.
  if (isDue(plant.last.water, plant.acquiredDay, day, waterEvery, 0)) types.push('water');
  if (!plant.hasPhotoToday) types.push('photo');
  if (c.fertilizeEveryDays && isDue(plant.last.fertilize, plant.acquiredDay, day, c.fertilizeEveryDays, c.fertilizeEveryDays)) {
    types.push('fertilize');
  }
  if (isDue(plant.last.inspect, plant.acquiredDay, day, INSPECT_EVERY, 3)) types.push('inspect');
  if (plant.location === 'indoor' && isDue(plant.last.rotate, plant.acquiredDay, day, ROTATE_EVERY, ROTATE_EVERY)) {
    types.push('rotate');
  }
  if (plant.location === 'indoor' && c.humidity === 'high' && isDue(plant.last.mist, plant.acquiredDay, day, MIST_EVERY, 1)) {
    types.push('mist');
  }

  return types.slice(0, MAX_QUESTS_PER_PLANT).map((type) => ({ plantId: plant.id, type, xp: QUEST_XP[type] }));
}
