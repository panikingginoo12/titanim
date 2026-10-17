import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, space, type } from '@/theme';

export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        {subtitle ? <Text style={type.small}>{subtitle}</Text> : null}
        <Text style={type.display} accessibilityRole="header">
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.md,
    backgroundColor: colors.bg,
  },
});
