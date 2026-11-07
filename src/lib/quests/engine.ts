import type { CareProfile } from '@/data/species';
import { daysBetween, type Day } from '@/lib/dates';
import { NO_WEATHER, type WeatherFlags } from '@/lib/weather';

export type QuestType = 'shelter' | 'drain' | 'water' | 'photo' | 'fertilize' | 'inspect' | 'rotate' | 'mist';

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
  shelter: 10,
  drain: 10,
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

/**
 * Quests for one plant on one day, most important first, capped at three.
 * Weather only changes outdoor plants: rain replaces watering, heat shortens the
 * watering interval, and strong wind or heavy rain adds a protect-the-pot quest.
 */
export function questsForPlant(
  plant: PlantState,
  care: Pick<CareProfile, 'waterEveryDays' | 'fertilizeEveryDays' | 'humidity'> | undefined,
  day: Day,
  weather: WeatherFlags = NO_WEATHER,
): QuestPlan[] {
  const c = care ?? GENERIC_CARE;
  const outdoor = plant.location === 'outdoor';
  const w = outdoor ? weather : NO_WEATHER;
  const baseWaterEvery = plant.waterEveryDaysOverride ?? c.waterEveryDays;
  const waterEvery = w.hot ? Math.max(1, baseWaterEvery - 1) : baseWaterEvery;
  const types: QuestType[] = [];

  if (w.windy) types.push('shelter');
  if (w.heavyRain) types.push('drain');
  // A new plant with no watering history gets a water check right away.
  if (!w.rainy && isDue(plant.last.water, plant.acquiredDay, day, waterEvery, 0)) types.push('water');
  if (!plant.hasPhotoToday) types.push('photo');
  if (c.fertilizeEveryDays && isDue(plant.last.fertilize, plant.acquiredDay, day, c.fertilizeEveryDays, c.fertilizeEveryDays)) {
    types.push('fertilize');
  }
  if (isDue(plant.last.inspect, plant.acquiredDay, day, INSPECT_EVERY, 3)) types.push('inspect');
  if (!outdoor && isDue(plant.last.rotate, plant.acquiredDay, day, ROTATE_EVERY, ROTATE_EVERY)) {
    types.push('rotate');
  }
  if (!outdoor && c.humidity === 'high' && isDue(plant.last.mist, plant.acquiredDay, day, MIST_EVERY, 1)) {
    types.push('mist');
  }

  return types.slice(0, MAX_QUESTS_PER_PLANT).map((type) => ({ plantId: plant.id, type, xp: QUEST_XP[type] }));
}
