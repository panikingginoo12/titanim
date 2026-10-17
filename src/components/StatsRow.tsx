import { StyleSheet, Text, View } from 'react-native';
import type { Streak } from '@/lib/game/streak';
import type { LevelProgress } from '@/lib/game/xp';
import { colors, radius, space, type } from '@/theme';
import { Icon, ProgressBar } from './ui';

export function StatsRow({ level, streak }: { level: LevelProgress; streak: Streak }) {
  const flameColor = streak.current > 0 ? colors.terracotta : colors.textFaint;
  return (
    <View style={styles.row}>
      <View style={[styles.box, { flex: 1.6 }]}>
        <Text style={type.label}>Level {level.level}</Text>
        <Text style={type.heading} numberOfLines={1}>
          {level.title}
        </Text>
        <ProgressBar value={level.into / level.span} />
        <Text style={type.small}>
          {level.into}/{level.span} XP to level {level.level + 1}
        </Text>
      </View>
      <View
        style={[styles.box, { flex: 1, alignItems: 'center' }]}
        accessible
        accessibilityLabel={`Dilig streak ${streak.current} days. ${streak.freezeAvailable ? 'Streak freeze available this week.' : 'Streak freeze used this week.'}`}
      >
        <Icon name="flame" size={26} color={flameColor} />
        <Text style={[type.title, { color: flameColor }]}>{streak.current}</Text>
        <Text style={type.small}>day streak</Text>
        <View style={styles.freeze}>
          <Icon name="snow-outline" size={12} color={streak.freezeAvailable ? colors.water : colors.textFaint} />
          <Text style={[styles.freezeText, !streak.freezeAvailable && { color: colors.textFaint }]}>
            {streak.freezeAvailable ? 'Freeze ready' : 'Freeze used'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, paddingHorizontal: space.lg },
  box: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: 4,
  },
  freeze: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  freezeText: { fontSize: 11, fontWeight: '700', color: colors.water },
});
