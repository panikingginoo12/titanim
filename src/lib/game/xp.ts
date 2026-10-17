export type Persona = 'plantito' | 'plantita';

/** Total XP needed to reach `level` (level 1 starts at 0): 0, 50, 150, 300, 500, ... */
export function xpForLevel(level: number): number {
  return 25 * level * (level - 1);
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export function titleForLevel(level: number, persona: Persona): string {
  const tito = persona === 'plantito';
  if (level >= 10) return tito ? 'Hari ng Halamanan' : 'Reyna ng Halamanan';
  if (level >= 6) return tito ? 'Tito ng Halaman' : 'Tita ng Halaman';
  if (level >= 3) return tito ? 'Plantito' : 'Plantita';
  return 'Baguhan';
}

export type LevelProgress = {
  level: number;
  title: string;
  xp: number;
  /** XP earned inside the current level. */
  into: number;
  /** XP the current level spans. */
  span: number;
};

export function levelProgress(xp: number, persona: Persona): LevelProgress {
  const level = levelForXp(xp);
  const start = xpForLevel(level);
  return {
    level,
    title: titleForLevel(level, persona),
    xp,
    into: xp - start,
    span: xpForLevel(level + 1) - start,
  };
}
