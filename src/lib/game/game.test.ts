import { describe, expect, it } from 'vitest';
import { addDays } from '@/lib/dates';
import { newBadges, type BadgeStats } from './badges';
import { computeStreak } from './streak';
import { levelForXp, levelProgress, titleForLevel, xpForLevel } from './xp';

describe('xp and levels', () => {
  it('uses growing thresholds', () => {
    expect([1, 2, 3, 4, 5, 10].map(xpForLevel)).toEqual([0, 50, 150, 300, 500, 2250]);
  });

  it('changes level exactly at thresholds', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(49)).toBe(1);
    expect(levelForXp(50)).toBe(2);
    expect(levelForXp(149)).toBe(2);
    expect(levelForXp(150)).toBe(3);
  });

  it('maps levels to Filipino titles', () => {
    expect(titleForLevel(1, 'plantita')).toBe('Baguhan');
    expect(titleForLevel(3, 'plantito')).toBe('Plantito');
    expect(titleForLevel(3, 'plantita')).toBe('Plantita');
    expect(titleForLevel(6, 'plantita')).toBe('Tita ng Halaman');
    expect(titleForLevel(10, 'plantito')).toBe('Hari ng Halamanan');
    expect(titleForLevel(12, 'plantita')).toBe('Reyna ng Halamanan');
  });

  it('reports progress within a level', () => {
    expect(levelProgress(70, 'plantito')).toEqual({ level: 2, title: 'Baguhan', xp: 70, into: 20, span: 100 });
  });
});

const T = '2026-10-17'; // Saturday
const daysBack = (...n: number[]) => n.map((k) => addDays(T, -k));

describe('computeStreak', () => {
  it('is zero with no activity', () => {
    expect(computeStreak([], T)).toMatchObject({ current: 0, best: 0, freezeAvailable: true });
  });

  it('counts consecutive days including today', () => {
    expect(computeStreak(daysBack(0, 1, 2), T)).toMatchObject({ current: 3, doneToday: true });
  });

  it('does not break just because today is not done yet', () => {
    expect(computeStreak(daysBack(1, 2, 3), T)).toMatchObject({ current: 3, doneToday: false });
  });

  it('forgives one missed day per week with a freeze', () => {
    // Missed Thursday 10-15, same week as today.
    const s = computeStreak(daysBack(0, 1, 3, 4), T);
    expect(s.current).toBe(4);
    expect(s.frozen).toEqual(['2026-10-15']);
    expect(s.freezeAvailable).toBe(false);
  });

  it('breaks on a second missed day in the same week', () => {
    // Missed 10-13 and 10-15 (both in the week of 10-12).
    const s = computeStreak(daysBack(0, 1, 3, 5, 6), T);
    expect(s.current).toBe(2);
    expect(s.best).toBe(3);
  });

  it('breaks on two missed days in a row and refunds the wasted freeze', () => {
    // Missed 10-14 and 10-15, then active 10-16 and today.
    const s = computeStreak(daysBack(0, 1, 4, 5), T);
    expect(s.current).toBe(2);
    expect(s.best).toBe(2);
    expect(s.freezeAvailable).toBe(true);
  });

  it('breaks when yesterday was missed and the week freeze is used', () => {
    const s = computeStreak(daysBack(2, 4, 5), T); // missed 10-14 (frozen) and 10-16
    expect(s.current).toBe(0);
    expect(s.best).toBe(3);
  });

  it('allows a freeze in each week', () => {
    // Missed Sunday 10-11 (previous week) and Wednesday 10-14 (this week).
    const s = computeStreak(daysBack(0, 1, 2, 4, 5, 7, 8), T);
    expect(s.current).toBe(7);
    expect(s.frozen).toEqual(['2026-10-11', '2026-10-14']);
  });
});

describe('badges', () => {
  const base: BadgeStats = {
    plantCount: 0,
    photoCount: 0,
    maxPhotosOnePlant: 0,
    questsDone: 0,
    bestStreak: 0,
    level: 1,
    newLeafCount: 0,
    flowerCount: 0,
  };

  it('awards badges once', () => {
    const stats = { ...base, plantCount: 1, photoCount: 1 };
    expect(newBadges(stats, []).map((b) => b.id)).toEqual(['unang-tanim', 'unang-litrato']);
    expect(newBadges(stats, ['unang-tanim', 'unang-litrato'])).toEqual([]);
  });

  it('awards milestone badges', () => {
    const ids = newBadges({ ...base, bestStreak: 30, level: 3, newLeafCount: 1, questsDone: 50 }, []).map((b) => b.id);
    expect(ids).toEqual(expect.arrayContaining(['dilig-7', 'dilig-30', 'certified', 'unang-usbong', 'masipag']));
  });
});
