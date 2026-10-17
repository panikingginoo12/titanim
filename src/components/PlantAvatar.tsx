import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme';
import { Icon } from './ui';

export function PlantAvatar({ uri, size = 56, rounded = true }: { uri: string | null; size?: number; rounded?: boolean }) {
  const r = rounded ? size / 2 : 14;
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: r, backgroundColor: colors.surfaceAlt }}
        contentFit="cover"
        transition={150}
        accessibilityIgnoresInvertColors
      />
    );
  }
  return (
    <View style={[styles.placeholder, { width: size, height: size, borderRadius: r }]}>
      <Icon name="leaf" size={size * 0.45} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
});
