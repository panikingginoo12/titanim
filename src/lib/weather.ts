// Weather by Open-Meteo (https://open-meteo.com): free, no API key, CC BY 4.0.

export type Place = { name: string; lat: number; lon: number };

export type Forecast = {
  /** Local day the forecast is for (YYYY-MM-DD). */
  day: string;
  rainMm: number;
  rainChance: number;
  gustKmh: number;
  tempMax: number;
};

export type WeatherFlags = {
  /** Enough rain is likely that outdoor plants don't need watering. */
  rainy: boolean;
  /** Heavy rain: pots may waterlog. */
  heavyRain: boolean;
  /** Strong gusts: move or secure outdoor pots. */
  windy: boolean;
  /** Very hot: outdoor plants dry out faster. */
  hot: boolean;
};

export const NO_WEATHER: WeatherFlags = { rainy: false, heavyRain: false, windy: false, hot: false };

export function weatherFlags(f: Forecast): WeatherFlags {
  return {
    rainy: f.rainChance >= 60 && f.rainMm >= 2,
    heavyRain: f.rainMm >= 20,
    windy: f.gustKmh >= 50,
    hot: f.tempMax >= 34,
  };
}

/** One friendly line for the Today screen. */
export function weatherTip(f: WeatherFlags): string {
  if (f.windy) return 'Malakas ang hangin ngayon. Ipasok o itali ang mga paso sa labas.';
  if (f.heavyRain) return 'Malakas ang ulan. Siguraduhing hindi babad sa tubig ang mga paso sa labas.';
  if (f.rainy) return 'Uulan ngayon. Hindi na kailangang diligan ang mga halaman sa labas.';
  if (f.hot) return 'Mainit ngayon. Diligan ang mga halaman sa labas nang maaga, bago tumirik ang araw.';
  return 'Magandang araw para sa mga halaman.';
}

const num = (v: unknown, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

/** Reads today's values from an Open-Meteo `daily` forecast response. */
export function parseForecast(json: unknown): Forecast | null {
  const daily = (json as { daily?: Record<string, unknown[]> })?.daily;
  const day = daily?.time?.[0];
  if (typeof day !== 'string') return null;
  return {
    day,
    rainMm: num(daily?.precipitation_sum?.[0]),
    rainChance: num(daily?.precipitation_probability_max?.[0]),
    gustKmh: num(daily?.wind_gusts_10m_max?.[0]),
    tempMax: num(daily?.temperature_2m_max?.[0], 30),
  };
}

export function parsePlaces(json: unknown): Place[] {
  const results = (json as { results?: Record<string, unknown>[] })?.results ?? [];
  return results
    .filter((r) => typeof r.latitude === 'number' && typeof r.longitude === 'number' && typeof r.name === 'string')
    .map((r) => ({
      name: [r.name, r.admin1].filter((x): x is string => typeof x === 'string' && x.length > 0).join(', '),
      lat: roundCoord(r.latitude as number),
      lon: roundCoord(r.longitude as number),
    }));
}

/** About 1 km precision: enough for weather, without storing an exact address. */
export function roundCoord(v: number): number {
  return Math.round(v * 100) / 100;
}

async function getJson(url: string, timeoutMs: number, signal?: AbortSignal): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  signal?.addEventListener('abort', () => controller.abort());
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchForecast(place: Place): Promise<Forecast | null> {
  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${place.lat}&longitude=${place.lon}` +
    '&daily=precipitation_sum,precipitation_probability_max,wind_gusts_10m_max,temperature_2m_max' +
    '&timezone=auto&forecast_days=1';
  return parseForecast(await getJson(url, 4000));
}

export async function searchPlaces(name: string, signal?: AbortSignal): Promise<Place[]> {
  const url =
    'https://geocoding-api.open-meteo.com/v1/search' +
    `?name=${encodeURIComponent(name.trim())}&count=8&language=en&countryCode=PH&format=json`;
  return parsePlaces(await getJson(url, 6000, signal));
}
