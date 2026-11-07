import { describe, expect, it } from 'vitest';
import { DAILY_IDENTIFY_LIMIT, identifyRemaining, matchBundled, parseMatches } from './plantnet';

describe('parseMatches', () => {
  const response = {
    bestMatch: 'Monstera deliciosa Liebm.',
    results: [
      {
        score: 0.91,
        species: {
          scientificNameWithoutAuthor: 'Monstera deliciosa',
          commonNames: ['Ceriman'],
          family: { scientificNameWithoutAuthor: 'Araceae' },
        },
      },
      {
        score: 0.04,
        species: { scientificNameWithoutAuthor: 'Monstera adansonii', commonNames: ['Swiss cheese vine'], family: {} },
      },
      { score: 0.02, species: { scientificNameWithoutAuthor: 'Philodendron bipinnatifidum' } },
      { score: 0.01, species: { scientificNameWithoutAuthor: 'Extra one' } },
      { score: 0.5 },
    ],
  };

  it('keeps the top three and links built-in plants', () => {
    const m = parseMatches(response);
    expect(m.map((x) => x.scientificName)).toEqual(['Monstera deliciosa', 'Monstera adansonii', 'Philodendron bipinnatifidum']);
    expect(m[0]).toMatchObject({ commonName: 'Monstera', family: 'Araceae', score: 0.91 });
    expect(m[0].species?.id).toBe('monstera-deliciosa');
    expect(m[1]).toMatchObject({ commonName: 'Swiss cheese vine', family: null, species: null });
    expect(m[2].commonName).toBeNull();
  });

  it('handles empty or malformed responses', () => {
    expect(parseMatches({})).toEqual([]);
    expect(parseMatches(null)).toEqual([]);
  });
});

describe('matchBundled', () => {
  it('ignores authors and hybrid markers', () => {
    expect(matchBundled('Citrus × microcarpa Bunge')?.id).toBe('citrus-microcarpa');
    expect(matchBundled('Unknownus plantus')).toBeNull();
  });
});

describe('identifyRemaining', () => {
  it('resets each day', () => {
    expect(identifyRemaining('2026-11-06', 5, '2026-11-07')).toBe(DAILY_IDENTIFY_LIMIT);
    expect(identifyRemaining('2026-11-07', 2, '2026-11-07')).toBe(DAILY_IDENTIFY_LIMIT - 2);
    expect(identifyRemaining('2026-11-07', 9, '2026-11-07')).toBe(0);
  });
});
