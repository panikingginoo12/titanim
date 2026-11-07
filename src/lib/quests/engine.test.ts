import { describe, expect, it } from 'vitest';
import { NO_WEATHER, type WeatherFlags } from '@/lib/weather';
import { MAX_QUESTS_PER_PLANT, questsForPlant, type PlantState } from './engine';

const day = '2026-10-17';
const care = { waterEveryDays: 7, fertilizeEveryDays: 30, humidity: 'medium' as const };

function plant(overrides: Partial<PlantState> = {}): PlantState {
  return {
    id: 1,
    location: 'outdoor',
    acquiredDay: '2026-10-10',
    last: { water: '2026-10-16', inspect: '2026-10-16', fertilize: '2026-10-10' },
    waterEveryDaysOverride: null,
    hasPhotoToday: true,
    ...overrides,
  };
}

const types = (p: PlantState, c: Parameters<typeof questsForPlant>[1] = care) =>
  questsForPlant(p, c, day).map((q) => q.type);

describe('questsForPlant', () => {
  it('gives nothing when everything is up to date', () => {
    expect(types(plant())).toEqual([]);
  });

  it('asks for water only when due', () => {
    expect(types(plant({ last: { water: '2026-10-11', inspect: day } }))).toEqual([]);
    expect(types(plant({ last: { water: '2026-10-10', inspect: day } }))).toEqual(['water']);
  });

  it('respects a per-plant watering override', () => {
    expect(types(plant({ last: { water: '2026-10-15', inspect: day }, waterEveryDaysOverride: 2 }))).toEqual(['water']);
  });

  it('asks a brand-new plant for a water check and a photo', () => {
    expect(types(plant({ acquiredDay: day, last: {}, hasPhotoToday: false }))).toEqual(['water', 'photo']);
  });

  it('asks for a photo until one is taken today', () => {
    expect(types(plant({ hasPhotoToday: false }))).toEqual(['photo']);
  });

  it('schedules fertilizer from the acquired day when never fed', () => {
    const p = plant({ acquiredDay: '2026-09-17', last: { water: day, inspect: day } });
    expect(types(p)).toEqual(['fertilize']);
  });

  it('only rotates and mists indoor plants', () => {
    const humid = { ...care, humidity: 'high' as const };
    const outdoor = plant({ acquiredDay: '2026-10-01', last: { water: day, inspect: day, fertilize: day } });
    expect(types(outdoor, humid)).toEqual([]);
    expect(types({ ...outdoor, location: 'indoor' }, humid)).toEqual(['rotate', 'mist']);
  });

  it('caps quests per plant, keeping the most important', () => {
    const p = plant({
      location: 'indoor',
      acquiredDay: '2026-08-01',
      last: {},
      hasPhotoToday: false,
    });
    const result = types(p, { ...care, humidity: 'high' });
    expect(result).toHaveLength(MAX_QUESTS_PER_PLANT);
    expect(result).toEqual(['water', 'photo', 'fertilize']);
  });

  it('uses generic care when the plant has no profile', () => {
    const p = plant({ last: { water: '2026-10-13', inspect: day } });
    expect(questsForPlant(p, undefined, day).map((q) => q.type)).toEqual(['water']);
  });

  describe('weather', () => {
    const due = plant({ last: { water: '2026-10-10', inspect: day } });
    const flags = (f: Partial<WeatherFlags>): WeatherFlags => ({ ...NO_WEATHER, ...f });

    it('skips watering outdoor plants when rain is coming', () => {
      expect(questsForPlant(due, care, day, flags({ rainy: true })).map((q) => q.type)).toEqual([]);
    });

    it('still waters indoor plants on rainy days', () => {
      const indoor = { ...due, location: 'indoor' as const };
      expect(questsForPlant(indoor, care, day, flags({ rainy: true })).map((q) => q.type)).toContain('water');
    });

    it('puts wind and heavy-rain protection first', () => {
      const types = questsForPlant(due, care, day, flags({ windy: true, heavyRain: true, rainy: true })).map((q) => q.type);
      expect(types).toEqual(['shelter', 'drain']);
    });

    it('waters a day earlier when it is hot', () => {
      const almost = plant({ last: { water: '2026-10-11', inspect: day } }); // 6 of 7 days
      expect(questsForPlant(almost, care, day).map((q) => q.type)).toEqual([]);
      expect(questsForPlant(almost, care, day, flags({ hot: true })).map((q) => q.type)).toEqual(['water']);
    });
  });
});
