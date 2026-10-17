import * as Haptics from 'expo-haptics';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import type { Badge } from '@/lib/game/badges';
import { colors, radius, space, type } from '@/theme';
import { Button, Icon, type IconName } from './ui';

export type Reward = {
  xp: number;
  levelUp?: { level: number; title: string };
  badges: Badge[];
};

const CelebrationContext = createContext<(r: Reward) => void>(() => undefined);

export function useCelebrate() {
  return useContext(CelebrationContext);
}

/** Shows a modal for level-ups and new badges. Plain XP gains only get a haptic tap. */
export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [reward, setReward] = useState<Reward | null>(null);

  const celebrate = useCallback((r: Reward) => {
    if (r.levelUp || r.badges.length > 0) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setReward(r);
    } else if (r.xp > 0) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const value = useMemo(() => celebrate, [celebrate]);

  return (
    <CelebrationContext.Provider value={value}>
      {children}
      <Modal visible={reward !== null} transparent animationType="fade" onRequestClose={() => setReward(null)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet} accessibilityViewIsModal>
            {reward?.levelUp ? (
              <View style={styles.block}>
                <Text style={styles.burst}>🎉</Text>
                <Text style={type.label}>Level {reward.levelUp.level}</Text>
                <Text style={[type.title, { textAlign: 'center' }]}>{reward.levelUp.title} ka na!</Text>
                <Text style={[type.small, { textAlign: 'center' }]}>Ang galing! Keep caring for your plants.</Text>
              </View>
            ) : null}
            {reward?.badges.map((b) => (
              <View key={b.id} style={styles.badgeRow}>
                <View style={styles.badgeIcon}>
                  <Icon name={b.icon as IconName} size={22} color={colors.terracotta} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={type.heading}>{b.name}</Text>
                  <Text style={type.small}>{b.description}</Text>
                </View>
              </View>
            ))}
            {reward && !reward.levelUp ? <Text style={[type.label, { textAlign: 'center' }]}>New badge!</Text> : null}
            <Button label="Salamat!" onPress={() => setReward(null)} />
          </View>
        </View>
      </Modal>
    </CelebrationContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: space.xl },
  sheet: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.xl, gap: space.lg },
  block: { alignItems: 'center', gap: space.xs },
  burst: { fontSize: 48 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.terracottaSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
