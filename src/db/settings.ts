import type { SQLiteDatabase } from 'expo-sqlite';
import type { Persona } from '@/lib/game/xp';
import type { Forecast, Place } from '@/lib/weather';

export type Settings = {
  onboarded: boolean;
  name: string;
  persona: Persona;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  ghostOverlay: boolean;
  saveToGallery: boolean;
  /** Where weather comes from; null until the user sets it. */
  location: Place | null;
  /** Last forecast fetched, reused for the rest of that day. */
  forecast: Forecast | null;
  /** Snap-to-identify uses per day, to stay inside the shared free quota. */
  identifyDay: string;
  identifyCount: number;
  /** ISO time of the last backup export, or '' if never. */
  lastBackupAt: string;
};

export const DEFAULT_SETTINGS: Settings = {
  onboarded: false,
  name: '',
  persona: 'plantita',
  reminderEnabled: false,
  reminderHour: 7,
  reminderMinute: 0,
  ghostOverlay: true,
  saveToGallery: false,
  location: null,
  forecast: null,
  identifyDay: '',
  identifyCount: 0,
  lastBackupAt: '',
};

export async function getSettings(db: SQLiteDatabase): Promise<Settings> {
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
  const stored = Object.fromEntries(rows.map((r) => [r.key, JSON.parse(r.value)]));
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function saveSettings(db: SQLiteDatabase, patch: Partial<Settings>): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const [key, value] of Object.entries(patch)) {
      await db.runAsync(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        key,
        JSON.stringify(value),
      );
    }
  });
}
