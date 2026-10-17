import { describe, expect, it } from 'vitest';
import { parseGbif } from './gbif';
import { binomial, mergeResults, searchBundled } from './search';

describe('searchBundled', () => {
  it('finds plants by English and Tagalog names', () => {
    expect(searchBundled('monstera')[0].id).toBe('monstera-deliciosa');
    expect(searchBundled('malunggay')[0].id).toBe('moringa-oleifera');
    expect(searchBundled('sampaguita')[0].id).toBe('jasminum-sambac');
    expect(searchBundled('Calamansi')[0].id).toBe('citrus-microcarpa');
  });

  it('finds plants by scientific name', () => {
    expect(searchBundled('ficus lyrata')[0].id).toBe('ficus-lyrata');
  });

  it('returns everything for an empty query and nothing for nonsense', () => {
    expect(searchBundled('').length).toBeGreaterThan(40);
    expect(searchBundled('zzzqqq')).toEqual([]);
  });
});

describe('mergeResults', () => {
  it('drops online duplicates of bundled plants', () => {
    const bundled = searchBundled('monstera');
    const online = parseGbif({
      results: [
        { key: 1, canonicalName: 'Monstera deliciosa', kingdom: 'Plantae', rank: 'SPECIES' },
        { key: 2, canonicalName: 'Monstera adansonii', kingdom: 'Plantae', rank: 'SPECIES' },
      ],
    });
    const merged = mergeResults(bundled, online);
    expect(merged.map((r) => r.scientificName)).toEqual(['Monstera deliciosa', 'Monstera adansonii']);
    expect(merged[1].source).toBe('gbif');
  });

  it('normalizes hybrid markers in binomials', () => {
    expect(binomial('Citrus × microcarpa Bunge')).toBe('citrus microcarpa');
  });
});

describe('parseGbif', () => {
  it('keeps plant species, prefers Tagalog then English common names, and dedupes', () => {
    const results = parseGbif({
      results: [
        {
          key: 10,
          canonicalName: 'Moringa oleifera',
          kingdom: 'Plantae',
          rank: 'SPECIES',
          family: 'Moringaceae',
          vernacularNames: [
            { vernacularName: 'Horseradish tree', language: 'eng' },
            { vernacularName: 'Malunggay', language: 'tgl' },
          ],
        },
        { key: 11, canonicalName: 'Moringa oleifera', kingdom: 'Plantae', rank: 'SPECIES' },
        { key: 12, canonicalName: 'Felis catus', kingdom: 'Animalia', rank: 'SPECIES' },
        { key: 13, canonicalName: 'Moringa', kingdom: 'Plantae', rank: 'GENUS' },
      ],
    });
    expect(results).toEqual([
      { source: 'gbif', id: 'gbif:10', name: 'Malunggay', scientificName: 'Moringa oleifera', family: 'Moringaceae' },
    ]);
  });

  it('handles empty or malformed input', () => {
    expect(parseGbif(null)).toEqual([]);
    expect(parseGbif({})).toEqual([]);
  });
});
