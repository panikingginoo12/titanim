import { describe, expect, it } from 'vitest';
import { validatePlantForm, waterOverride } from './plantForm';

describe('validatePlantForm', () => {
  it('accepts a valid plant', () => {
    expect(validatePlantForm({ nickname: 'Monching', waterEveryDays: 7 })).toEqual({});
  });

  it('requires a nickname', () => {
    expect(validatePlantForm({ nickname: '   ', waterEveryDays: 7 }).nickname).toBeDefined();
  });

  it('limits nickname length', () => {
    expect(validatePlantForm({ nickname: 'x'.repeat(41), waterEveryDays: 7 }).nickname).toBeDefined();
  });

  it('keeps the watering interval in range', () => {
    expect(validatePlantForm({ nickname: 'A', waterEveryDays: 0 }).waterEveryDays).toBeDefined();
    expect(validatePlantForm({ nickname: 'A', waterEveryDays: 61 }).waterEveryDays).toBeDefined();
    expect(validatePlantForm({ nickname: 'A', waterEveryDays: 2.5 }).waterEveryDays).toBeDefined();
  });
});

describe('waterOverride', () => {
  it('stores nothing when the guide default is kept', () => {
    expect(waterOverride(7, 7)).toBeNull();
  });

  it('stores the chosen value when it differs or there is no guide', () => {
    expect(waterOverride(5, 7)).toBe(5);
    expect(waterOverride(4, undefined)).toBe(4);
  });
});
