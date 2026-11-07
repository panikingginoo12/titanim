import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useCelebrate } from '@/components/Celebration';
import { PlantAvatar } from '@/components/PlantAvatar';
import { Button, Card, EmptyState, Icon, SectionLabel } from '@/components/ui';
import { listPhotos } from '@/db/photos';
import { displaySpecies, getPlant, lastCareDays } from '@/db/plants';
import { logCareAction } from '@/db/quests';
import { addDays, daysBetween, formatDay, today, type Day } from '@/lib/dates';
import { MOOD_LABEL, plantMood } from '@/lib/plantMood';
import { GENERIC_CARE, type CareType } from '@/lib/quests/engine';
import { withRewards } from '@/lib/rewards';
import { useFocusData } from '@/lib/useFocusData';
import { colors, radius, space, type } from '@/theme';

const MILESTONE_ICON = { new_leaf: 'sparkles', flower: 'flower', fruit: 'nutrition' } as const;

function ago(day: Day | undefined): string {
  if (!day) return 'Not logged yet';
  const n = daysBetween(day, today());
  if (n === 0) return 'Today';
  if (n === 1) return 'Yesterday';
  return `${n} days ago`;
}

export default function PlantDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const plantId = Number(id);
  const router = useRouter();
  const celebrate = useCelebrate();
  const { width } = useWindowDimensions();
  const { data, reload, db } = useFocusData(
    async (d) => {
      const [plant, photos, last] = await Promise.all([getPlant(d, plantId), listPhotos(d, plantId), lastCareDays(d)]);
      return { plant, photos, last: last.get(plantId) ?? {} };
    },
    plantId,
  );

  if (!data) return <View style={styles.screen} />;
  const { plant, photos, last } = data;
  if (!plant) {
    return (
      <View style={styles.screen}>
        <EmptyState icon="leaf-outline" title="Plant not found" body="It may have been deleted." />
      </View>
    );
  }

  const day = today();
  const waterEvery = plant.waterEveryDays ?? plant.species?.care.waterEveryDays ?? GENERIC_CARE.waterEveryDays;
  const mood = MOOD_LABEL[plantMood(last.water, waterEvery, day)];
  const nextWater = last.water ? addDays(last.water, waterEvery) : day;
  const hasToday = photos[0]?.day === day;
  const ageDays = daysBetween(plant.acquiredDay, day) + 1;
  const firstDay = photos.length ? photos[photos.length - 1].day : plant.acquiredDay;
  const thumb = (width - space.lg * 2 - space.sm * 2) / 3;

  async function logAction(type: CareType) {
    const reward = await withRewards(db, () => logCareAction(db, plantId, type, day));
    celebrate(reward);
    await reload();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          title: plant.nickname,
          headerRight: () => (
            <Pressable
              onPress={() => router.push({ pathname: '/plant/[id]/edit', params: { id: String(plantId) } })}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Edit plant"
            >
              <Icon name="create-outline" size={24} color={colors.primary} />
            </Pressable>
          ),
        }}
      />

      <View style={styles.hero}>
        {photos[0] ? (
          <Pressable
            onPress={() => router.push({ pathname: '/plant/[id]/photos', params: { id: String(plantId), index: '0' } })}
            accessibilityRole="imagebutton"
            accessibilityLabel={`Latest photo from ${formatDay(photos[0].day)}`}
          >
            <Image source={{ uri: photos[0].uri }} style={[styles.heroImg, { height: width - space.lg * 2 }]} contentFit="cover" />
          </Pressable>
        ) : (
          <View style={[styles.heroImg, styles.heroEmpty, { height: (width - space.lg * 2) * 0.75 }]}>
            <PlantAvatar uri={null} size={88} />
            <Text style={type.small}>No photos yet. Take the first one for Day 1!</Text>
          </View>
        )}
      </View>

      <Text style={type.display}>{plant.nickname}</Text>
      <Text style={type.small}>
        {displaySpecies(plant) ?? 'Unknown species'} · {plant.location === 'indoor' ? 'Indoor' : 'Outdoor'} · Day {ageDays}
      </Text>
      <View style={styles.moodRow}>
        <Icon name={mood.icon} size={18} color={colors.primary} />
        <Text style={[type.body, { fontWeight: '600' }]}>{mood.label}</Text>
      </View>

      <Button
        label={hasToday ? 'Retake today\'s photo' : 'Take today\'s photo'}
        icon="camera"
        onPress={() => router.push({ pathname: '/plant/[id]/camera', params: { id: String(plantId) } })}
        style={{ marginTop: space.lg }}
      />
      {photos.length >= 2 ? (
        <Button
          label="See the glow-up"
          icon="sparkles-outline"
          variant="secondary"
          onPress={() => router.push({ pathname: '/plant/[id]/glowup', params: { id: String(plantId) } })}
          style={{ marginTop: space.sm }}
        />
      ) : null}

      <SectionLabel>Care</SectionLabel>
      <Card style={{ gap: space.md }}>
        <View style={styles.careRow}>
          <Icon name="water" size={20} color={colors.water} />
          <View style={{ flex: 1 }}>
            <Text style={type.body}>Last watered: {ago(last.water)}</Text>
            <Text style={type.small}>
              Every ~{waterEvery} days · next check {nextWater <= day ? 'today' : formatDay(nextWater)}
            </Text>
          </View>
        </View>
        <View style={styles.careRow}>
          <Icon name="nutrition" size={20} color={colors.primary} />
          <Text style={[type.body, { flex: 1 }]}>Last fed: {ago(last.fertilize)}</Text>
        </View>
        <View style={styles.actions}>
          <Button label="Nadiligan ko" icon="water" variant="secondary" onPress={() => logAction('water')} style={{ flex: 1 }} />
          <Button label="Napakain ko" icon="nutrition" variant="secondary" onPress={() => logAction('fertilize')} style={{ flex: 1 }} />
        </View>
        {plant.species ? (
          <Pressable
            onPress={() => router.push({ pathname: '/catalog/[id]', params: { id: plant.species!.id } })}
            style={styles.guide}
            accessibilityRole="link"
          >
            <Text style={[type.body, { color: colors.primary, fontWeight: '600' }]}>Open care guide</Text>
            <Icon name="chevron-forward" size={18} color={colors.primary} />
          </Pressable>
        ) : null}
      </Card>

      <SectionLabel>Glow-up timeline · {photos.length} {photos.length === 1 ? 'photo' : 'photos'}</SectionLabel>
      {photos.length === 0 ? (
        <Text style={type.small}>Your daily photos will show up here.</Text>
      ) : (
        <View style={styles.grid}>
          {photos.map((p, i) => (
            <Pressable
              key={p.id}
              onPress={() => router.push({ pathname: '/plant/[id]/photos', params: { id: String(plantId), index: String(i) } })}
              accessibilityRole="imagebutton"
              accessibilityLabel={`Day ${daysBetween(firstDay, p.day) + 1}, ${formatDay(p.day)}`}
            >
              <Image source={{ uri: p.thumbUri }} style={{ width: thumb, height: thumb, borderRadius: radius.sm }} contentFit="cover" />
              <View style={styles.dayTag}>
                <Text style={styles.dayText}>Day {daysBetween(firstDay, p.day) + 1}</Text>
              </View>
              {p.milestone ? (
                <View style={styles.milestone}>
                  <Icon name={MILESTONE_ICON[p.milestone]} size={14} color={colors.onPrimary} />
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, paddingBottom: space.xxl, gap: space.xs },
  hero: { marginBottom: space.md },
  heroImg: { width: '100%', borderRadius: radius.lg, backgroundColor: colors.surfaceAlt },
  heroEmpty: { alignItems: 'center', justifyContent: 'center', gap: space.md, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  moodRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.xs },
  careRow: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  actions: { flexDirection: 'row', gap: space.sm },
  guide: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  dayTag: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    backgroundColor: colors.overlay,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dayText: { color: colors.onPrimary, fontSize: 11, fontWeight: '700' },
  milestone: {
    position: 'absolute',
    right: 4,
    top: 4,
    backgroundColor: colors.terracotta,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
