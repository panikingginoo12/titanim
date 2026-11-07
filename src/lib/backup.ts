import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteBindValue, SQLiteDatabase } from 'expo-sqlite';
import { getSettings, saveSettings } from '@/db/settings';
import {
  BACKUP_VERSION,
  BackupError,
  packBackup,
  TABLE_COLUMNS,
  TABLES,
  toRelativePhotoPath,
  unpackBackup,
  type BackupData,
  type Row,
} from './backupFormat';
import { today } from './dates';
import { scheduleDailyReminder } from './notifications';

export { BackupError };

async function readRows(db: SQLiteDatabase): Promise<BackupData['tables']> {
  const tables = {} as BackupData['tables'];
  for (const t of TABLES) {
    tables[t] = await db.getAllAsync<Row>(`SELECT ${TABLE_COLUMNS[t].join(', ')} FROM ${t}`);
  }
  return tables;
}

/**
 * Packs every table and photo into one zip and opens the share sheet,
 * so it can be saved to Google Drive, Files, or sent to another phone.
 */
export async function exportBackup(db: SQLiteDatabase): Promise<{ photos: number }> {
  const tables = await readRows(db);
  const files: Record<string, Uint8Array> = {};
  const photos: Row[] = [];

  for (const row of tables.photos) {
    const full = toRelativePhotoPath(String(row.uri));
    const thumb = toRelativePhotoPath(String(row.thumb_uri));
    const fullFile = new File(String(row.uri));
    if (!full || !thumb || !fullFile.exists) continue; // skip rows whose file is gone
    files[full] = await fullFile.bytes();
    const thumbFile = new File(String(row.thumb_uri));
    files[thumb] = thumbFile.exists ? await thumbFile.bytes() : files[full];
    photos.push({ ...row, uri: full, thumb_uri: thumb });
  }
  tables.photos = photos;
  // The cached forecast is day-specific; don't carry it over.
  tables.settings = tables.settings.filter((r) => r.key !== 'forecast');

  const zip = packBackup({ app: 'titanim', version: BACKUP_VERSION, createdAt: new Date().toISOString(), tables }, files);
  const out = new File(Paths.cache, `titanim-backup-${today()}.zip`);
  if (out.exists) out.delete();
  out.write(zip);

  await Sharing.shareAsync(out.uri, { mimeType: 'application/zip', dialogTitle: 'Save your Titanim backup', UTI: 'public.zip-archive' });
  return { photos: photos.length };
}

/** Lets the user pick a backup zip. Returns its parsed contents, or null if they cancelled. */
export async function pickBackup(): Promise<ReturnType<typeof unpackBackup> | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets[0]) return null;
  const file = new File(result.assets[0].uri);
  return unpackBackup(await file.bytes());
}

/**
 * Replaces everything on this phone with the backup. Photos are written to a temporary
 * folder first and only swapped in after the database restore succeeds.
 */
export async function restoreBackup(db: SQLiteDatabase, backup: ReturnType<typeof unpackBackup>): Promise<void> {
  const { data, files } = backup;
  const staging = new Directory(Paths.document, 'photos-restore');
  if (staging.exists) staging.delete();
  staging.create({ intermediates: true });

  for (const [path, bytes] of Object.entries(files)) {
    const [, plantId, name] = path.split('/');
    const dir = new Directory(staging, plantId);
    dir.create({ intermediates: true, idempotent: true });
    new File(dir, name).write(bytes);
  }

  const finalUri = (rel: unknown) => new File(Paths.document, String(rel)).uri;

  await db.withTransactionAsync(async () => {
    for (const t of [...TABLES].reverse()) await db.runAsync(`DELETE FROM ${t}`);
    for (const t of TABLES) {
      const cols = TABLE_COLUMNS[t];
      const sql = `INSERT INTO ${t} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`;
      for (const row of data.tables[t]) {
        const values: SQLiteBindValue[] = cols.map((c) => {
          if (t === 'photos' && (c === 'uri' || c === 'thumb_uri')) return finalUri(row[c]);
          return row[c] ?? null;
        });
        await db.runAsync(sql, values);
      }
    }
  });

  const photosDir = new Directory(Paths.document, 'photos');
  if (photosDir.exists) photosDir.delete();
  staging.rename('photos');

  // The restored phone keeps working as before: same reminder, fresh forecast.
  await saveSettings(db, { onboarded: true, forecast: null });
  const s = await getSettings(db);
  await scheduleDailyReminder(s.reminderEnabled, s.reminderHour, s.reminderMinute, s.name).catch(() => undefined);
}
