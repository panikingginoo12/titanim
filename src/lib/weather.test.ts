import { describe, expect, it } from 'vitest';
import { parseForecast, parsePlaces, roundCoord, weatherFlags, weatherTip } from './weather';

describe('parseForecast', () => {
  it('reads today from an Open-Meteo daily response', () => {
    const f = parseForecast({
      daily: {
        time: ['2026-11-07'],
        precipitation_sum: [12.4],
        precipitation_probability_max: [85],
        wind_gusts_10m_max: [38],
        temperature_2m_max: [31.2],
      },
    });
    expect(f).toEqual({ day: '2026-11-07', rainMm: 12.4, rainChance: 85, gustKmh: 38, tempMax: 31.2 });
  });

  it('tolerates missing values and bad input', () => {
    expect(parseForecast({ daily: { time: ['2026-11-07'], precipitation_sum: [null] } })).toMatchObject({ rainMm: 0 });
    expect(parseForecast(null)).toBeNull();
    expect(parseForecast({ error: true })).toBeNull();
  });
});

describe('weatherFlags', () => {
  const base = { day: '2026-11-07', rainMm: 0, rainChance: 0, gustKmh: 10, tempMax: 30 };

  it('needs both a high chance and real rain to call it rainy', () => {
    expect(weatherFlags({ ...base, rainChance: 90, rainMm: 0.5 }).rainy).toBe(false);
    expect(weatherFlags({ ...base, rainChance: 40, rainMm: 10 }).rainy).toBe(false);
    expect(weatherFlags({ ...base, rainChance: 70, rainMm: 5 }).rainy).toBe(true);
  });

  it('flags heavy rain, wind and heat', () => {
    expect(weatherFlags({ ...base, rainMm: 25, rainChance: 95, gustKmh: 60, tempMax: 35 })).toEqual({
      rainy: true,
      heavyRain: true,
      windy: true,
      hot: true,
    });
  });

  it('gives the most urgent tip first', () => {
    expect(weatherTip({ rainy: true, heavyRain: false, windy: true, hot: false })).toMatch(/hangin/);
    expect(weatherTip({ rainy: false, heavyRain: false, windy: false, hot: false })).toMatch(/Magandang araw/);
  });
});

describe('parsePlaces', () => {
  it('builds a readable name and rounds coordinates', () => {
    expect(
      parsePlaces({
        results: [
          { name: 'Quezon City', admin1: 'Metro Manila', latitude: 14.6488, longitude: 121.0509 },
          { name: 'Broken', latitude: 'x' },
        ],
      }),
    ).toEqual([{ name: 'Quezon City, Metro Manila', lat: 14.65, lon: 121.05 }]);
    expect(parsePlaces({})).toEqual([]);
  });

  it('rounds to about 1 km', () => {
    expect(roundCoord(14.64876)).toBe(14.65);
  });
});
