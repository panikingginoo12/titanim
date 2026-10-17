import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Quest } from '@/db/quests';
import { QUEST_COPY } from '@/lib/quests/copy';
import { colors, radius, space, type } from '@/theme';
import { Icon, XpChip, type IconName } from './ui';

type Props = {
  quest: Quest;
  onComplete: () => void;
  onSkip: () => void;
  onUndoSkip: () => void;
};

export function QuestItem({ quest, onComplete, onSkip, onUndoSkip }: Props) {
  const copy = QUEST_COPY[quest.type];
  const done = quest.status === 'done';
  const skipped = quest.status === 'skipped';
  const isPhoto = quest.type === 'photo';

  return (
    <View style={[styles.row, (done || skipped) && styles.rowDim]}>
      <View style={[styles.icon, done && { backgroundColor: colors.primarySoft }]}>
        <Icon name={copy.icon as IconName} size={20} color={done ? colors.primary : colors.water} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.heading, done && styles.strike]}>{copy.title(quest.plantName)}</Text>
        {!done && !skipped ? <Text style={type.small}>{copy.body}</Text> : null}
        <View style={styles.meta}>
          <XpChip xp={quest.xp} done={done} />
          {!done ? (
            <Pressable
              onPress={skipped ? onUndoSkip : onSkip}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={skipped ? 'Undo skip' : 'Skip this quest'}
            >
              <Text style={styles.skip}>{skipped ? 'Skipped · undo' : 'Skip'}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <Pressable
        onPress={onComplete}
        disabled={done}
        accessibilityRole="button"
        accessibilityLabel={done ? 'Done' : isPhoto ? 'Open camera' : 'Mark as done'}
        accessibilityState={{ disabled: done, checked: done }}
        style={({ pressed }) => [styles.check, done && styles.checkDone, pressed && { transform: [{ scale: 0.92 }] }]}
      >
        <Icon name={done ? 'checkmark' : isPhoto ? 'camera' : 'checkmark'} size={22} color={done ? colors.onPrimary : colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, paddingVertical: space.md },
  rowDim: { opacity: 0.6 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.waterSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strike: { textDecorationLine: 'line-through', color: colors.textMuted },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.xs },
  skip: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  check: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: colors.primary },
});
