import { SPECIES, type Species } from '@/data/species';

export type CatalogResult =
  | { source: 'bundled'; id: string; name: string; scientificName: string; species: Species }
  | { source: 'gbif'; id: string; name: string; scientificName: string; family: string | null };

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function score(species: Species, q: string): number {
  const names = species.commonNames.map(normalize);
  const sci = normalize(species.scientificName);
  if (names.some((n) => n === q) || sci === q) return 100;
  if (names.some((n) => n.startsWith(q)) || sci.startsWith(q)) return 80;
  if (names.some((n) => n.split(' ').some((w) => w.startsWith(q)))) return 60;
  if (names.some((n) => n.includes(q)) || sci.includes(q)) return 40;
  return 0;
}

export function toBundledResult(species: Species): CatalogResult {
  return {
    source: 'bundled',
    id: species.id,
    name: species.commonNames[0],
    scientificName: species.scientificName,
    species,
  };
}

/** Searches the plants that ship with the app. Works offline. */
export function searchBundled(query: string): CatalogResult[] {
  const q = normalize(query);
  if (!q) return SPECIES.map(toBundledResult);
  return SPECIES.map((s) => ({ s, score: score(s, q) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.s.commonNames[0].localeCompare(b.s.commonNames[0]))
    .map((r) => toBundledResult(r.s));
}

/** First two words of a scientific name ("Monstera deliciosa Liebm." -> "monstera deliciosa"). */
export function binomial(scientificName: string): string {
  return normalize(scientificName.replace(/×/g, ' ')).split(' ').filter((w) => w !== 'x').slice(0, 2).join(' ');
}

/** Bundled results first; online results that duplicate a bundled plant are dropped. */
export function mergeResults(bundled: CatalogResult[], online: CatalogResult[]): CatalogResult[] {
  const seen = new Set(bundled.map((r) => binomial(r.scientificName)));
  const out = [...bundled];
  for (const r of online) {
    const key = binomial(r.scientificName);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}
