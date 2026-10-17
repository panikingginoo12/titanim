import type { SQLiteDatabase } from 'expo-sqlite';
import { BADGES, newBadges, type Badge } from '@/lib/game/badges';
import { computeStreak, type Streak } from '@/lib/game/streak';
import { levelForXp } from '@/lib/game/xp';
import { today, type Day } from '@/lib/dates';

export async function totalXp(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ xp: number | null }>('SELECT SUM(amount) AS xp FROM xp_log');
  return row?.xp ?? 0;
}

/** Days with at least one completed quest. */
export async function activeDays(db: SQLiteDatabase): Promise<Day[]> {
  const rows = await db.getAllAsync<{ day: string }>("SELECT DISTINCT day FROM xp_log WHERE reason LIKE 'quest:%'");
  return rows.map((r) => r.day);
}

export async function getStreak(db: SQLiteDatabase): Promise<Streak> {
  return computeStreak(await activeDays(db), today());
}

export async function ownedBadges(db: SQLiteDatabase): Promise<{ id: string; earnedAt: string }[]> {
  const rows = await db.getAllAsync<{ id: string; earned_at: string }>('SELECT id, earned_at FROM badges');
  const known = new Set(BADGES.map((b) => b.id));
  return rows.filter((r) => known.has(r.id)).map((r) => ({ id: r.id, earnedAt: r.earned_at }));
}

/** Awards any badges the user has newly earned and returns them. */
export async function checkBadges(db: SQLiteDatabase): Promise<Badge[]> {
  const [counts, xp, streak, owned] = await Promise.all([
    db.getFirstAsync<{
      plants: number;
      photos: number;
      max_one: number | null;
      quests: number;
      new_leaf: number;
      flower: number;
    }>(`SELECT
        (SELECT COUNT(*) FROM plants) AS plants,
        (SELECT COUNT(*) FROM photos) AS photos,
        (SELECT MAX(c) FROM (SELECT COUNT(*) AS c FROM photos GROUP BY plant_id)) AS max_one,
        (SELECT COUNT(*) FROM xp_log WHERE reason LIKE 'quest:%') AS quests,
        (SELECT COUNT(*) FROM photos WHERE milestone = 'new_leaf') AS new_leaf,
        (SELECT COUNT(*) FROM photos WHERE milestone IN ('flower', 'fruit')) AS flower`),
    totalXp(db),
    getStreak(db),
    ownedBadges(db),
  ]);
  const earned = newBadges(
    {
      plantCount: counts?.plants ?? 0,
      photoCount: counts?.photos ?? 0,
      maxPhotosOnePlant: counts?.max_one ?? 0,
      questsDone: counts?.quests ?? 0,
      newLeafCount: counts?.new_leaf ?? 0,
      flowerCount: counts?.flower ?? 0,
      bestStreak: streak.best,
      level: levelForXp(xp),
    },
    owned.map((b) => b.id),
  );
  const now = new Date().toISOString();
  for (const b of earned) {
    await db.runAsync('INSERT OR IGNORE INTO badges (id, earned_at) VALUES (?, ?)', b.id, now);
  }
  return earned;
}
