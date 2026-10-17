import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, toDay, weekStart } from './dates';

describe('dates', () => {
  it('formats local days', () => {
    expect(toDay(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(toDay(new Date(2026, 0, 6, 0, 1))).toBe('2026-01-06');
  });

  it('adds days across month and year ends', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('counts days between', () => {
    expect(daysBetween('2026-10-01', '2026-10-17')).toBe(16);
    expect(daysBetween('2026-10-17', '2026-10-01')).toBe(-16);
    expect(daysBetween('2026-10-17', '2026-10-17')).toBe(0);
  });

  it('finds the Monday of the week', () => {
    expect(weekStart('2026-10-17')).toBe('2026-10-12'); // Saturday
    expect(weekStart('2026-10-18')).toBe('2026-10-12'); // Sunday
    expect(weekStart('2026-10-19')).toBe('2026-10-19'); // Monday
  });
});
