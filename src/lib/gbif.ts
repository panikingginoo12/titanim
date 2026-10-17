import type { CatalogResult } from './search';

// GBIF species API: free, no key. https://techdocs.gbif.org/en/openapi/v1/species
const BASE = 'https://api.gbif.org/v1/species/search';
const BACKBONE = 'd7dddbf4-2cf0-4f39-9b2a-bb099caae36c';
const PLANTAE = 6;

type GbifSpecies = {
  key: number;
  scientificName?: string;
  canonicalName?: string;
  kingdom?: string;
  family?: string;
  rank?: string;
  vernacularNames?: { vernacularName: string; language?: string }[];
};

function pickName(s: GbifSpecies): string {
  const names = s.vernacularNames ?? [];
  const preferred =
    names.find((n) => n.language === 'tgl' || n.language === 'fil') ??
    names.find((n) => n.language === 'eng') ??
    names[0];
  return preferred?.vernacularName ?? s.canonicalName ?? s.scientificName ?? 'Unknown plant';
}

export function parseGbif(json: unknown): CatalogResult[] {
  const results = (json as { results?: GbifSpecies[] })?.results ?? [];
  const out: CatalogResult[] = [];
  const seen = new Set<string>();
  for (const s of results) {
    const sci = s.canonicalName ?? s.scientificName;
    if (!sci || (s.kingdom && s.kingdom !== 'Plantae')) continue;
    if (s.rank && s.rank !== 'SPECIES') continue;
    if (seen.has(sci)) continue;
    seen.add(sci);
    out.push({ source: 'gbif', id: `gbif:${s.key}`, name: pickName(s), scientificName: sci, family: s.family ?? null });
  }
  return out;
}

async function fetchJson(url: string, signal?: AbortSignal) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`GBIF ${res.status}`);
  return res.json();
}

/** Searches GBIF for plant species. Throws when offline; callers fall back to bundled results. */
export async function searchGbif(query: string, signal?: AbortSignal): Promise<CatalogResult[]> {
  const q = encodeURIComponent(query.trim());
  const common = `q=${q}&rank=SPECIES&status=ACCEPTED&limit=20`;
  const primary = parseGbif(
    await fetchJson(`${BASE}?${common}&datasetKey=${BACKBONE}&highertaxonKey=${PLANTAE}`, signal),
  );
  if (primary.length > 0) return primary;
  // The backbone may be retired in future; fall back to an unfiltered search.
  return parseGbif(await fetchJson(`${BASE}?${common}`, signal));
}
