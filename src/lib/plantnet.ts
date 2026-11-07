import { SPECIES, type Species } from '@/data/species';
import { binomial } from './search';

// Plant identification by Pl@ntNet (https://my.plantnet.org). The free plan allows
// 500 identifications a day for the whole app, so each phone gets a small daily share.
export const DAILY_IDENTIFY_LIMIT = 5;
const ENDPOINT = 'https://my-api.plantnet.org/v2/identify/all';

export type Match = {
  scientificName: string;
  commonName: string | null;
  family: string | null;
  /** 0–1 */
  score: number;
  /** Set when the plant is in Titanim's built-in catalog. */
  species: Species | null;
};

export class IdentifyError extends Error {
  readonly kind: 'no-plant' | 'quota' | 'auth' | 'network';

  constructor(kind: IdentifyError['kind'], message: string) {
    super(message);
    this.kind = kind;
  }
}

const bundledByBinomial = new Map(SPECIES.map((s) => [binomial(s.scientificName), s]));

export function matchBundled(scientificName: string): Species | null {
  return bundledByBinomial.get(binomial(scientificName)) ?? null;
}

type RawResult = {
  score?: number;
  species?: {
    scientificNameWithoutAuthor?: string;
    commonNames?: string[];
    family?: { scientificNameWithoutAuthor?: string };
  };
};

export function parseMatches(json: unknown, limit = 3): Match[] {
  const results = (json as { results?: RawResult[] })?.results ?? [];
  return results
    .filter((r) => typeof r.species?.scientificNameWithoutAuthor === 'string')
    .slice(0, limit)
    .map((r) => {
      const scientificName = r.species!.scientificNameWithoutAuthor!;
      const species = matchBundled(scientificName);
      return {
        scientificName,
        commonName: species?.commonNames[0] ?? r.species?.commonNames?.[0] ?? null,
        family: r.species?.family?.scientificNameWithoutAuthor ?? null,
        score: typeof r.score === 'number' ? r.score : 0,
        species,
      };
    });
}

/** How many identifications are left today, given the stored counter. */
export function identifyRemaining(counterDay: string, count: number, today: string): number {
  return Math.max(0, DAILY_IDENTIFY_LIMIT - (counterDay === today ? count : 0));
}

export function plantNetKey(): string | undefined {
  return process.env.EXPO_PUBLIC_PLANTNET_API_KEY || undefined;
}

export async function identifyPlant(imageUri: string, apiKey: string): Promise<Match[]> {
  const form = new FormData();
  // React Native's FormData takes a file descriptor object for uploads.
  form.append('images', { uri: imageUri, name: 'plant.jpg', type: 'image/jpeg' } as unknown as Blob);
  form.append('organs', 'auto');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  let res: Response;
  try {
    res = await fetch(`${ENDPOINT}?api-key=${encodeURIComponent(apiKey)}&lang=en&nb-results=3`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });
  } catch {
    throw new IdentifyError('network', 'Could not reach Pl@ntNet. Check your internet connection.');
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 404) throw new IdentifyError('no-plant', 'No plant found in the photo. Try a closer shot of a leaf or flower.');
  if (res.status === 429) throw new IdentifyError('quota', 'Plant ID is busy today. Please try again tomorrow.');
  if (res.status === 401 || res.status === 403) throw new IdentifyError('auth', 'Plant ID is not set up correctly.');
  if (!res.ok) throw new IdentifyError('network', 'Pl@ntNet could not identify this photo right now.');
  return parseMatches(await res.json());
}
