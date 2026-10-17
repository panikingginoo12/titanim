import type { SQLiteDatabase } from 'expo-sqlite';
import type { Persona } from '@/lib/game/xp';

export type Settings = {
  onboarded: boolean;
  name: string;
  persona: Persona;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  ghostOverlay: boolean;
  saveToGallery: boolean;
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
