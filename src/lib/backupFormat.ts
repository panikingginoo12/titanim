import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';

export const BACKUP_VERSION = 1;
const MANIFEST = 'backup.json';

export type Row = Record<string, string | number | null>;

/** Columns restored for each table, in insert order. Anything else in a backup is ignored. */
export const TABLE_COLUMNS = {
  settings: ['key', 'value'],
  plants: ['id', 'nickname', 'species_id', 'species_name', 'scientific_name', 'location', 'acquired_day', 'water_every_days', 'created_at'],
  photos: ['id', 'plant_id', 'day', 'uri', 'thumb_uri', 'note', 'milestone', 'created_at'],
  care_log: ['id', 'plant_id', 'type', 'day'],
  quests: ['id', 'day', 'plant_id', 'type', 'xp', 'status', 'completed_at'],
  xp_log: ['id', 'day', 'amount', 'reason'],
  badges: ['id', 'earned_at'],
} as const;

export type TableName = keyof typeof TABLE_COLUMNS;
export const TABLES = Object.keys(TABLE_COLUMNS) as TableName[];

export type BackupData = {
  app: 'titanim';
  version: number;
  createdAt: string;
  tables: Record<TableName, Row[]>;
};

export class BackupError extends Error {}

/** "file:///.../Documents/photos/3/2026-11-07-123.jpg" -> "photos/3/2026-11-07-123.jpg" */
export function toRelativePhotoPath(uri: string): string | null {
  const match = /(?:^|\/)(photos\/\d+\/[^/]+\.jpg)$/.exec(uri);
  return match ? match[1] : null;
}

const SAFE_PATH = /^photos\/\d+\/[A-Za-z0-9._-]+\.jpg$/;

/** One zip with the database rows as JSON plus the photo files. Photos are stored, not recompressed. */
export function packBackup(data: BackupData, files: Record<string, Uint8Array>): Uint8Array {
  return zipSync({ [MANIFEST]: strToU8(JSON.stringify(data)), ...files }, { level: 0 });
}

export function unpackBackup(bytes: Uint8Array): { data: BackupData; files: Record<string, Uint8Array> } {
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(bytes);
  } catch {
    throw new BackupError('This file is not a Titanim backup.');
  }
  const manifest = entries[MANIFEST];
  if (!manifest) throw new BackupError('This file is not a Titanim backup.');

  let data: BackupData;
  try {
    data = JSON.parse(strFromU8(manifest));
  } catch {
    throw new BackupError('The backup file is damaged.');
  }
  if (data?.app !== 'titanim') throw new BackupError('This file is not a Titanim backup.');
  if (data.version > BACKUP_VERSION) throw new BackupError('This backup is from a newer version of Titanim. Update the app first.');
  for (const t of TABLES) {
    if (!Array.isArray(data.tables?.[t])) throw new BackupError('The backup file is damaged.');
  }
  for (const p of data.tables.photos) {
    if (typeof p.uri !== 'string' || !SAFE_PATH.test(p.uri) || typeof p.thumb_uri !== 'string' || !SAFE_PATH.test(p.thumb_uri)) {
      throw new BackupError('The backup file is damaged.');
    }
  }

  const files: Record<string, Uint8Array> = {};
  for (const [path, content] of Object.entries(entries)) {
    if (SAFE_PATH.test(path)) files[path] = content;
  }
  return { data, files };
}
