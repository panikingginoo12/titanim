import type { SQLiteDatabase } from 'expo-sqlite';
import { getSpecies, type Species } from '@/data/species';
import type { Day } from '@/lib/dates';
import type { CareType } from '@/lib/quests/engine';

export type Plant = {
  id: number;
  nickname: string;
  speciesId: string | null;
  speciesName: string | null;
  scientificName: string | null;
  location: 'indoor' | 'outdoor';
  acquiredDay: Day;
  waterEveryDays: number | null;
  createdAt: string;
  /** Latest progress photo thumbnail, if any. */
  coverUri: string | null;
  photoCount: number;
  species?: Species;
};

export type PlantInput = {
  nickname: string;
  speciesId: string | null;
  speciesName: string | null;
  scientificName: string | null;
  location: 'indoor' | 'outdoor';
  acquiredDay: Day;
  waterEveryDays: number | null;
};

type Row = {
  id: number;
  nickname: string;
  species_id: string | null;
  species_name: string | null;
  scientific_name: string | null;
  location: 'indoor' | 'outdoor';
  acquired_day: string;
  water_every_days: number | null;
  created_at: string;
  cover_uri: string | null;
  photo_count: number;
};

const SELECT = `
  SELECT p.*,
    (SELECT thumb_uri FROM photos ph WHERE ph.plant_id = p.id ORDER BY ph.day DESC LIMIT 1) AS cover_uri,
    (SELECT COUNT(*) FROM photos ph WHERE ph.plant_id = p.id) AS photo_count
  FROM plants p`;

function toPlant(r: Row): Plant {
  return {
    id: r.id,
    nickname: r.nickname,
    speciesId: r.species_id,
    speciesName: r.species_name,
    scientificName: r.scientific_name,
    location: r.location,
    acquiredDay: r.acquired_day,
    waterEveryDays: r.water_every_days,
    createdAt: r.created_at,
    coverUri: r.cover_uri,
    photoCount: r.photo_count,
    species: getSpecies(r.species_id),
  };
}

export async function listPlants(db: SQLiteDatabase): Promise<Plant[]> {
  const rows = await db.getAllAsync<Row>(`${SELECT} ORDER BY p.created_at DESC`);
  return rows.map(toPlant);
}

export async function getPlant(db: SQLiteDatabase, id: number): Promise<Plant | null> {
  const row = await db.getFirstAsync<Row>(`${SELECT} WHERE p.id = ?`, id);
  return row ? toPlant(row) : null;
}

export async function createPlant(db: SQLiteDatabase, input: PlantInput): Promise<number> {
  const res = await db.runAsync(
    `INSERT INTO plants (nickname, species_id, species_name, scientific_name, location, acquired_day, water_every_days, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    input.nickname.trim(),
    input.speciesId,
    input.speciesName,
    input.scientificName,
    input.location,
    input.acquiredDay,
    input.waterEveryDays,
    new Date().toISOString(),
  );
  return res.lastInsertRowId;
}

export async function updatePlant(db: SQLiteDatabase, id: number, input: PlantInput): Promise<void> {
  await db.runAsync(
    `UPDATE plants SET nickname = ?, species_id = ?, species_name = ?, scientific_name = ?,
       location = ?, acquired_day = ?, water_every_days = ? WHERE id = ?`,
    input.nickname.trim(),
    input.speciesId,
    input.speciesName,
    input.scientificName,
    input.location,
    input.acquiredDay,
    input.waterEveryDays,
    id,
  );
}

/** Deletes the row; photos, care log and quests cascade. Returns photo files to remove. */
export async function deletePlantRow(db: SQLiteDatabase, id: number): Promise<string[]> {
  const files = await db.getAllAsync<{ uri: string; thumb_uri: string }>(
    'SELECT uri, thumb_uri FROM photos WHERE plant_id = ?',
    id,
  );
  await db.runAsync('DELETE FROM plants WHERE id = ?', id);
  return files.flatMap((f) => [f.uri, f.thumb_uri]);
}

/** Last day each care action was logged, per plant. */
export async function lastCareDays(db: SQLiteDatabase): Promise<Map<number, Partial<Record<CareType, Day>>>> {
  const rows = await db.getAllAsync<{ plant_id: number; type: CareType; day: string }>(
    'SELECT plant_id, type, MAX(day) AS day FROM care_log GROUP BY plant_id, type',
  );
  const out = new Map<number, Partial<Record<CareType, Day>>>();
  for (const r of rows) {
    const entry = out.get(r.plant_id) ?? {};
    entry[r.type] = r.day;
    out.set(r.plant_id, entry);
  }
  return out;
}

export async function logCare(db: SQLiteDatabase, plantId: number, type: CareType, day: Day): Promise<void> {
  await db.runAsync('INSERT INTO care_log (plant_id, type, day) VALUES (?, ?, ?)', plantId, type, day);
}

export function displaySpecies(p: Pick<Plant, 'species' | 'speciesName' | 'scientificName'>): string | null {
  return p.species?.commonNames[0] ?? p.speciesName ?? p.scientificName ?? null;
}
