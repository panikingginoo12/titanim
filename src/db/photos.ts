import type { SQLiteDatabase } from 'expo-sqlite';
import type { Day } from '@/lib/dates';

export type Milestone = 'new_leaf' | 'flower' | 'fruit';

export type Photo = {
  id: number;
  plantId: number;
  day: Day;
  uri: string;
  thumbUri: string;
  note: string | null;
  milestone: Milestone | null;
  createdAt: string;
};

type Row = {
  id: number;
  plant_id: number;
  day: string;
  uri: string;
  thumb_uri: string;
  note: string | null;
  milestone: Milestone | null;
  created_at: string;
};

const toPhoto = (r: Row): Photo => ({
  id: r.id,
  plantId: r.plant_id,
  day: r.day,
  uri: r.uri,
  thumbUri: r.thumb_uri,
  note: r.note,
  milestone: r.milestone,
  createdAt: r.created_at,
});

/** Newest first. */
export async function listPhotos(db: SQLiteDatabase, plantId: number): Promise<Photo[]> {
  const rows = await db.getAllAsync<Row>('SELECT * FROM photos WHERE plant_id = ? ORDER BY day DESC', plantId);
  return rows.map(toPhoto);
}

export async function getPhotoForDay(db: SQLiteDatabase, plantId: number, day: Day): Promise<Photo | null> {
  const row = await db.getFirstAsync<Row>('SELECT * FROM photos WHERE plant_id = ? AND day = ?', plantId, day);
  return row ? toPhoto(row) : null;
}

/** Most recent photo before `day`, used for the ghost overlay. */
export async function getPreviousPhoto(db: SQLiteDatabase, plantId: number, day: Day): Promise<Photo | null> {
  const row = await db.getFirstAsync<Row>(
    'SELECT * FROM photos WHERE plant_id = ? AND day < ? ORDER BY day DESC LIMIT 1',
    plantId,
    day,
  );
  return row ? toPhoto(row) : null;
}

export async function plantIdsWithPhotoOn(db: SQLiteDatabase, day: Day): Promise<Set<number>> {
  const rows = await db.getAllAsync<{ plant_id: number }>('SELECT plant_id FROM photos WHERE day = ?', day);
  return new Set(rows.map((r) => r.plant_id));
}

export async function upsertPhoto(
  db: SQLiteDatabase,
  p: { plantId: number; day: Day; uri: string; thumbUri: string; note: string | null; milestone: Milestone | null },
): Promise<void> {
  await db.runAsync(
    `INSERT INTO photos (plant_id, day, uri, thumb_uri, note, milestone, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(plant_id, day) DO UPDATE SET
       uri = excluded.uri, thumb_uri = excluded.thumb_uri, note = excluded.note,
       milestone = excluded.milestone, created_at = excluded.created_at`,
    p.plantId,
    p.day,
    p.uri,
    p.thumbUri,
    p.note,
    p.milestone,
    new Date().toISOString(),
  );
}

export async function updatePhotoNote(
  db: SQLiteDatabase,
  id: number,
  note: string | null,
  milestone: Milestone | null,
): Promise<void> {
  await db.runAsync('UPDATE photos SET note = ?, milestone = ? WHERE id = ?', note, milestone, id);
}

export async function deletePhotoRow(db: SQLiteDatabase, id: number): Promise<Photo | null> {
  const row = await db.getFirstAsync<Row>('SELECT * FROM photos WHERE id = ?', id);
  if (!row) return null;
  await db.runAsync('DELETE FROM photos WHERE id = ?', id);
  return toPhoto(row);
}
