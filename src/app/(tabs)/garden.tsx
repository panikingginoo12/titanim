import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlantAvatar } from '@/components/PlantAvatar';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button, EmptyState, Icon } from '@/components/ui';
import { displaySpecies, lastCareDays, listPlants, type Plant } from '@/db/plants';
import { today } from '@/lib/dates';
import { MOOD_LABEL, plantMood, type Mood } from '@/lib/plantMood';
import { GENERIC_CARE } from '@/lib/quests/engine';
import { useFocusData } from '@/lib/useFocusData';
import { colors, radius, space, type } from '@/theme';

async function load(db: Parameters<typeof listPlants>[0]) {
  const [plants, last] = await Promise.all([listPlants(db), lastCareDays(db)]);
  const day = today();
  return plants.map((p) => {
    const every = p.waterEveryDays ?? p.species?.care.waterEveryDays ?? GENERIC_CARE.waterEveryDays;
    return { plant: p, mood: plantMood(last.get(p.id)?.water, every, day) };
  });
}

const MOOD_COLOR: Record<Mood, { bg: string; fg: string }> = {
  happy: { bg: colors.primarySoft, fg: colors.primary },
  thirsty: { bg: colors.waterSoft, fg: colors.water },
  neglected: { bg: colors.terracottaSoft, fg: colors.terracotta },
};

function PlantTile({ plant, mood, width, onPress }: { plant: Plant; mood: Mood; width: number; onPress: () => void }) {
  const species = displaySpecies(plant);
  const m = MOOD_LABEL[mood];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, { width }, pressed && { opacity: 0.9 }]}
      accessibilityRole="button"
      accessibilityLabel={`${plant.nickname}${species ? `, ${species}` : ''}. ${m.label}`}
    >
      <PlantAvatar uri={plant.coverUri} size={width - 2} rounded={false} />
      <View style={[styles.mood, { backgroundColor: MOOD_COLOR[mood].bg }]}>
        <Icon name={m.icon} size={14} color={MOOD_COLOR[mood].fg} />
        <Text style={[styles.moodText, { color: MOOD_COLOR[mood].fg }]}>{m.label}</Text>
      </View>
      <View style={styles.tileBody}>
        <Text style={type.heading} numberOfLines={1}>
          {plant.nickname}
        </Text>
        <Text style={type.small} numberOfLines={1}>
          {species ?? 'Unknown species'} · {plant.photoCount} {plant.photoCount === 1 ? 'photo' : 'photos'}
        </Text>
      </View>
    </Pressable>
  );
}

export default function Garden() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { data } = useFocusData(load);
  const tileWidth = (width - space.lg * 2 - space.md) / 2;

  const addButton = (
    <Pressable
      onPress={() => router.push('/catalog')}
      style={styles.add}
      accessibilityRole="button"
      accessibilityLabel="Add a plant"
    >
      <Icon name="add" size={26} color={colors.onPrimary} />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => String(item.plant.id)}
        numColumns={2}
        columnWrapperStyle={{ gap: space.md, paddingHorizontal: space.lg }}
        contentContainerStyle={{ gap: space.md, paddingBottom: space.xxl }}
        ListHeaderComponent={
          <ScreenHeader
            title="My Garden"
            subtitle={data ? `${data.length} halaman` : undefined}
            right={addButton}
          />
        }
        ListEmptyComponent={
          data ? (
            <EmptyState
              icon="leaf-outline"
              title="Your garden is empty"
              body="Find your plant in the catalog, or add one even if you don't know its name yet."
              action={<Button label="Add your first plant" icon="add" onPress={() => router.push('/catalog')} />}
            />
          ) : undefined
        }
        renderItem={({ item }) => (
          <PlantTile
            plant={item.plant}
            mood={item.mood}
            width={tileWidth}
            onPress={() => router.push({ pathname: '/plant/[id]', params: { id: String(item.plant.id) } })}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  add: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tileBody: { padding: space.md, gap: 2 },
  mood: {
    position: 'absolute',
    top: space.sm,
    left: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  moodText: { fontSize: 12, fontWeight: '700' },
});
