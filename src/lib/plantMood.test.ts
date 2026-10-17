import { describe, expect, it } from 'vitest';
import { plantMood } from './plantMood';

describe('plantMood', () => {
  const day = '2026-10-17';

  it('is happy right after watering', () => {
    expect(plantMood('2026-10-16', 7, day)).toBe('happy');
  });

  it('is thirsty when watering is due', () => {
    expect(plantMood('2026-10-10', 7, day)).toBe('thirsty');
  });

  it('is neglected when overdue by a full interval', () => {
    expect(plantMood('2026-10-03', 7, day)).toBe('neglected');
  });

  it('asks for a first water check when never watered', () => {
    expect(plantMood(undefined, 7, day)).toBe('thirsty');
  });
});
