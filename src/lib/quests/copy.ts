import type { QuestType } from './engine';

type Copy = { title: (name: string) => string; body: string; icon: string };

export const QUEST_COPY: Record<QuestType, Copy> = {
  water: {
    title: (n) => `Diligan si ${n}`,
    body: 'Check the soil first. Kapag tuyo na ang ibabaw, diligan nang mabuti hanggang tumulo sa butas.',
    icon: 'water',
  },
  photo: {
    title: (n) => `Picture day ni ${n}`,
    body: 'Take today\'s progress photo. Same spot, same angle para kita ang glow-up.',
    icon: 'camera',
  },
  fertilize: {
    title: (n) => `Pakainin si ${n}`,
    body: 'Feed with diluted fertilizer, half-strength lang. Diligan muna bago lagyan ng abono.',
    icon: 'nutrition',
  },
  inspect: {
    title: (n) => `Silipin ang dahon ni ${n}`,
    body: 'Check under the leaves for pests: mealybugs, spider mites, aphids, scale.',
    icon: 'search',
  },
  rotate: {
    title: (n) => `Ikutin ang paso ni ${n}`,
    body: 'Give the pot a quarter turn so it grows evenly toward the light.',
    icon: 'sync',
  },
  mist: {
    title: (n) => `I-mist si ${n}`,
    body: 'Mahilig siya sa humid. A light mist in the morning helps.',
    icon: 'rainy',
  },
};
