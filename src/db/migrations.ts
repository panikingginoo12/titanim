import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Each entry upgrades the schema by one version. Never edit a shipped migration;
 * append a new one instead. The current version is stored in PRAGMA user_version.
 */
export const MIGRATIONS: string[] = [
  `
  CREATE TABLE settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );

  CREATE TABLE plants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT NOT NULL,
    species_id TEXT,
    species_name TEXT,
    scientific_name TEXT,
    location TEXT NOT NULL CHECK (location IN ('indoor', 'outdoor')),
    acquired_day TEXT NOT NULL,
    water_every_days INTEGER,
    created_at TEXT NOT NULL
  );

  CREATE TABLE photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    day TEXT NOT NULL,
    uri TEXT NOT NULL,
    thumb_uri TEXT NOT NULL,
    note TEXT,
    milestone TEXT CHECK (milestone IN ('new_leaf', 'flower', 'fruit')),
    created_at TEXT NOT NULL,
    UNIQUE (plant_id, day)
  );

  CREATE TABLE care_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    day TEXT NOT NULL
  );
  CREATE INDEX care_log_plant_type ON care_log (plant_id, type, day);

  CREATE TABLE quests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day TEXT NOT NULL,
    plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    xp INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'skipped')),
    completed_at TEXT,
    UNIQUE (day, plant_id, type)
  );

  -- XP survives plant deletion so levels and streaks never go backwards.
  CREATE TABLE xp_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day TEXT NOT NULL,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL
  );
  CREATE INDEX xp_log_day ON xp_log (day);

  CREATE TABLE badges (
    id TEXT PRIMARY KEY NOT NULL,
    earned_at TEXT NOT NULL
  );
  `,
];

export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  while (version < MIGRATIONS.length) {
    const sql = MIGRATIONS[version];
    const next = version + 1;
    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
      await db.execAsync(`PRAGMA user_version = ${next}`);
    });
    version = next;
  }
}
