export type BadgeStats = {
  plantCount: number;
  photoCount: number;
  maxPhotosOnePlant: number;
  questsDone: number;
  bestStreak: number;
  level: number;
  newLeafCount: number;
  flowerCount: number;
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: (s: BadgeStats) => boolean;
};

export const BADGES: Badge[] = [
  { id: 'unang-tanim', name: 'Unang Tanim', description: 'Add your first plant', icon: 'leaf', earned: (s) => s.plantCount >= 1 },
  { id: 'unang-litrato', name: 'Unang Litrato', description: 'Take your first progress photo', icon: 'camera', earned: (s) => s.photoCount >= 1 },
  { id: 'unang-usbong', name: 'Unang Usbong', description: 'Log a new leaf', icon: 'sparkles', earned: (s) => s.newLeafCount >= 1 },
  { id: 'namumulaklak', name: 'Namumulaklak', description: 'Log a flower or bud', icon: 'flower', earned: (s) => s.flowerCount >= 1 },
  { id: 'dilig-7', name: '7-day Dilig', description: 'Keep a 7-day streak', icon: 'flame', earned: (s) => s.bestStreak >= 7 },
  { id: 'dilig-30', name: '30-day Dilig', description: 'Keep a 30-day streak', icon: 'bonfire', earned: (s) => s.bestStreak >= 30 },
  { id: 'kolektor', name: 'Kolektor', description: 'Have 10 plants in your garden', icon: 'albums', earned: (s) => s.plantCount >= 10 },
  { id: 'masipag', name: 'Masipag', description: 'Complete 50 quests', icon: 'ribbon', earned: (s) => s.questsDone >= 50 },
  { id: 'glow-up', name: 'Glow-up', description: 'Take 30 photos of one plant', icon: 'images', earned: (s) => s.maxPhotosOnePlant >= 30 },
  { id: 'certified', name: 'Certified!', description: 'Reach level 3 (Plantito/a)', icon: 'medal', earned: (s) => s.level >= 3 },
];

/** Badges earned by these stats that are not yet in `owned`. */
export function newBadges(stats: BadgeStats, owned: Iterable<string>): Badge[] {
  const have = new Set(owned);
  return BADGES.filter((b) => !have.has(b.id) && b.earned(stats));
}

export function getBadge(id: string): Badge | undefined {
  return BADGES.find((b) => b.id === id);
}
