import type { SQLiteDatabase } from 'expo-sqlite';
import type { Reward } from '@/components/Celebration';
import { checkBadges, totalXp } from '@/db/game';
import { getSettings } from '@/db/settings';
import { levelForXp, titleForLevel } from './game/xp';

/**
 * Runs an action that may award XP, then works out level-ups and new badges.
 * `action` returns the XP it awarded.
 */
export async function withRewards(db: SQLiteDatabase, action: () => Promise<number>): Promise<Reward> {
  const before = levelForXp(await totalXp(db));
  const xp = await action();
  const after = levelForXp(await totalXp(db));
  const badges = await checkBadges(db);
  let levelUp: Reward['levelUp'];
  if (after > before) {
    const { persona } = await getSettings(db);
    levelUp = { level: after, title: titleForLevel(after, persona) };
  }
  return { xp, levelUp, badges };
}
