import type { SQLiteDatabase } from 'expo-sqlite';
import { getSpecies } from '@/data/species';
import type { Day } from '@/lib/dates';
import { questsForPlant, type CareType, type QuestType } from '@/lib/quests/engine';
import { plantIdsWithPhotoOn } from './photos';
import { lastCareDays, listPlants, logCare } from './plants';

export type QuestStatus = 'pending' | 'done' | 'skipped';

export type Quest = {
  id: number;
  day: Day;
  plantId: number;
  type: QuestType;
  xp: number;
  status: QuestStatus;
  plantName: string;
  plantCover: string | null;
};

/**
 * Creates today's quests for every plant that has none yet. Safe to call many times a day:
 * a plant's quests are fixed once made (so finishing one never adds another), and plants
 * added later in the day get theirs.
 */
export async function generateQuests(db: SQLiteDatabase, day: Day): Promise<void> {
  const [plants, last, withPhoto, planned] = await Promise.all([
    listPlants(db),
    lastCareDays(db),
    plantIdsWithPhotoOn(db, day),
    db.getAllAsync<{ plant_id: number }>('SELECT DISTINCT plant_id FROM quests WHERE day = ?', day),
  ]);
  const hasQuests = new Set(planned.map((r) => r.plant_id));
  const plans = plants
    .filter((p) => !hasQuests.has(p.id))
    .flatMap((p) =>
    questsForPlant(
      {
        id: p.id,
        location: p.location,
        acquiredDay: p.acquiredDay,
        last: last.get(p.id) ?? {},
        waterEveryDaysOverride: p.waterEveryDays,
        hasPhotoToday: withPhoto.has(p.id),
      },
      getSpecies(p.speciesId)?.care,
      day,
    ),
  );
  if (plans.length === 0) return;
  await db.withTransactionAsync(async () => {
    for (const q of plans) {
      await db.runAsync(
        'INSERT OR IGNORE INTO quests (day, plant_id, type, xp) VALUES (?, ?, ?, ?)',
        day,
        q.plantId,
        q.type,
        q.xp,
      );
    }
  });
}

export async function listQuests(db: SQLiteDatabase, day: Day): Promise<Quest[]> {
  const rows = await db.getAllAsync<{
    id: number;
    day: string;
    plant_id: number;
    type: QuestType;
    xp: number;
    status: QuestStatus;
    nickname: string;
    cover_uri: string | null;
  }>(
    `SELECT q.*, p.nickname,
       (SELECT thumb_uri FROM photos ph WHERE ph.plant_id = p.id ORDER BY ph.day DESC LIMIT 1) AS cover_uri
     FROM quests q JOIN plants p ON p.id = q.plant_id
     WHERE q.day = ?
     ORDER BY p.created_at DESC, q.id`,
    day,
  );
  return rows.map((r) => ({
    id: r.id,
    day: r.day,
    plantId: r.plant_id,
    type: r.type,
    xp: r.xp,
    status: r.status,
    plantName: r.nickname,
    plantCover: r.cover_uri,
  }));
}

/**
 * Marks a quest done, logs the care action and awards XP. Returns the XP gained,
 * or 0 if it was already done.
 */
export async function completeQuest(db: SQLiteDatabase, questId: number): Promise<number> {
  let gained = 0;
  await db.withTransactionAsync(async () => {
    const q = await db.getFirstAsync<{ day: string; plant_id: number; type: QuestType; xp: number; status: QuestStatus }>(
      'SELECT day, plant_id, type, xp, status FROM quests WHERE id = ?',
      questId,
    );
    if (!q || q.status === 'done') return;
    await db.runAsync("UPDATE quests SET status = 'done', completed_at = ? WHERE id = ?", new Date().toISOString(), questId);
    if (q.type !== 'photo') await logCare(db, q.plant_id, q.type, q.day);
    await db.runAsync('INSERT INTO xp_log (day, amount, reason) VALUES (?, ?, ?)', q.day, q.xp, `quest:${q.type}`);
    gained = q.xp;
  });
  return gained;
}

/** Completes today's photo quest for a plant if there is one. */
export async function completePhotoQuest(db: SQLiteDatabase, plantId: number, day: Day): Promise<number> {
  // Quests may not exist yet if the Today tab hasn't been opened today.
  await generateQuests(db, day);
  const q = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM quests WHERE plant_id = ? AND day = ? AND type = 'photo' AND status != 'done'",
    plantId,
    day,
  );
  return q ? completeQuest(db, q.id) : 0;
}

/**
 * "I watered it" from the plant screen. Completes today's matching quest (with XP) when
 * there is one; otherwise just logs the care so tomorrow's quests account for it.
 */
export async function logCareAction(db: SQLiteDatabase, plantId: number, type: CareType, day: Day): Promise<number> {
  await generateQuests(db, day);
  const q = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM quests WHERE plant_id = ? AND day = ? AND type = ? AND status != 'done'",
    plantId,
    day,
    type,
  );
  if (q) return completeQuest(db, q.id);
  await logCare(db, plantId, type, day);
  return 0;
}

export async function setQuestStatus(db: SQLiteDatabase, questId: number, status: 'pending' | 'skipped'): Promise<void> {
  await db.runAsync("UPDATE quests SET status = ? WHERE id = ? AND status != 'done'", status, questId);
}
