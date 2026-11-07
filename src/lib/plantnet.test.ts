import { afterEach, describe, expect, it, vi } from 'vitest';
import { DAILY_IDENTIFY_LIMIT, IdentifyError, identifyPlant, identifyRemaining, matchBundled, parseMatches } from './plantnet';

// expo-file-system's File is a native Blob; a plain Blob stands in for it here.
vi.mock('expo-file-system', () => ({
  File: class extends Blob {
    uri: string;
    constructor(uri: string) {
      super([new Uint8Array([0xff, 0xd8])], { type: 'image/jpeg' });
      this.uri = uri;
    }
  },
}));

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

describe('identifyPlant', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uploads the photo as a file Blob that Expo fetch can send', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ results: [{ score: 0.8, species: { scientificNameWithoutAuthor: 'Aloe vera' } }] }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const matches = await identifyPlant('file:///cache/plant.jpg', 'KEY');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('api-key=KEY');
    const form = init.body as FormData;
    expect(form.get('images')).toBeInstanceOf(Blob);
    expect(form.get('organs')).toBe('auto');
    expect(matches[0].species?.id).toBe('aloe-vera');
  });

  it('maps HTTP errors to friendly messages', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 404 })));
    await expect(identifyPlant('file:///x.jpg', 'KEY')).rejects.toMatchObject({ kind: 'no-plant' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })));
    await expect(identifyPlant('file:///x.jpg', 'KEY')).rejects.toBeInstanceOf(IdentifyError);
  });
});
