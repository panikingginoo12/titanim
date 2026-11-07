import type { SQLiteDatabase } from 'expo-sqlite';
import { today } from '@/lib/dates';
import { fetchForecast, NO_WEATHER, weatherFlags, type Forecast, type WeatherFlags } from '@/lib/weather';
import { getSettings, saveSettings } from './settings';

/**
 * Today's forecast for the user's saved place. Fetched at most once a day and cached,
 * so quests stay the same all day and the app works offline after the first fetch.
 * Returns null when no place is set, or when offline before today's first fetch.
 */
export async function todayForecast(db: SQLiteDatabase, refresh: boolean): Promise<Forecast | null> {
  const settings = await getSettings(db);
  if (!settings.location) return null;
  const day = today();
  if (settings.forecast?.day === day) return settings.forecast;
  if (!refresh) return null;
  try {
    const forecast = await fetchForecast(settings.location);
    if (!forecast) return null;
    await saveSettings(db, { forecast });
    return forecast;
  } catch {
    return null;
  }
}

export async function todayWeatherFlags(db: SQLiteDatabase): Promise<WeatherFlags> {
  const forecast = await todayForecast(db, false);
  return forecast ? weatherFlags(forecast) : NO_WEATHER;
}
