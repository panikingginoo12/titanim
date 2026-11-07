import { useRouter } from 'expo-router';
import { Fragment } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCelebrate } from '@/components/Celebration';
import { PlantAvatar } from '@/components/PlantAvatar';
import { QuestItem } from '@/components/QuestItem';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StatsRow } from '@/components/StatsRow';
import { WeatherCard } from '@/components/WeatherCard';
import { Button, Card, EmptyState, ProgressBar } from '@/components/ui';
import { getStreak, totalXp } from '@/db/game';
import { listPlants } from '@/db/plants';
import { completeQuest, generateQuests, listQuests, setQuestStatus, type Quest } from '@/db/quests';
import { getSettings } from '@/db/settings';
import { todayForecast } from '@/db/weather';
import { formatDay, today } from '@/lib/dates';
import { levelProgress } from '@/lib/game/xp';
import { withRewards } from '@/lib/rewards';
import { useFocusData } from '@/lib/useFocusData';
import { colors, space, type } from '@/theme';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Magandang umaga';
  if (h < 18) return 'Magandang hapon';
  return 'Magandang gabi';
}

async function load(db: Parameters<typeof generateQuests>[0]) {
  const day = today();
  // Fetch (or reuse) today's forecast first so weather can shape the day's quests.
  const forecast = await todayForecast(db, true);
  await generateQuests(db, day);
  const [quests, settings, xp, streak, plants] = await Promise.all([
    listQuests(db, day),
    getSettings(db),
    totalXp(db),
    getStreak(db),
    listPlants(db),
  ]);
  return { day, quests, settings, forecast, level: levelProgress(xp, settings.persona), streak, plantCount: plants.length };
}

function groupByPlant(quests: Quest[]) {
  const groups = new Map<number, Quest[]>();
  for (const q of quests) groups.set(q.plantId, [...(groups.get(q.plantId) ?? []), q]);
  return [...groups.values()];
}

export default function Today() {
  const router = useRouter();
  const celebrate = useCelebrate();
  const { data, reload, db } = useFocusData(load);

  if (!data) return <SafeAreaView style={styles.safe} />;

  const { quests, settings, level, streak, plantCount } = data;
  const done = quests.filter((q) => q.status === 'done').length;
  const open = quests.filter((q) => q.status === 'pending').length;
  const name = settings.name ? `, ${settings.name}` : '';

  async function complete(q: Quest) {
    if (q.type === 'photo') {
      router.push({ pathname: '/plant/[id]/camera', params: { id: String(q.plantId) } });
      return;
    }
    const reward = await withRewards(db, () => completeQuest(db, q.id));
    celebrate(reward);
    await reload();
  }

  async function setStatus(q: Quest, status: 'pending' | 'skipped') {
    await setQuestStatus(db, q.id, status);
    await reload();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }}>
        <ScreenHeader title={`${greeting()}${name}!`} subtitle={formatDay(data.day)} />
        <StatsRow level={level} streak={streak} />
        {plantCount > 0 ? (
          <WeatherCard place={settings.location} forecast={data.forecast} onSetPlace={() => router.push('/location')} />
        ) : null}

        {plantCount === 0 ? (
          <EmptyState
            icon="leaf"
            title="Wala pang halaman"
            body="Add your first plant and you'll get daily quests to help it grow."
            action={<Button label="Add a plant" icon="add" onPress={() => router.push('/catalog')} />}
          />
        ) : (
          <View style={styles.section}>
            <View style={styles.progressHead}>
              <Text style={type.heading}>Today&apos;s quests</Text>
              <Text style={type.small}>
                {done}/{quests.length} done
              </Text>
            </View>
            {quests.length > 0 ? <ProgressBar value={quests.length ? done / quests.length : 0} color={colors.primary} track={colors.primarySoft} /> : null}

            {quests.length > 0 && open === 0 ? (
              <Card style={styles.allDone}>
                <Text style={styles.allDoneEmoji}>🌿</Text>
                <Text style={type.heading}>Tapos na lahat!</Text>
                <Text style={[type.small, { textAlign: 'center' }]}>Your plants are happy. See you tomorrow.</Text>
              </Card>
            ) : null}

            {quests.length === 0 ? (
              <Card style={styles.allDone}>
                <Text style={styles.allDoneEmoji}>☀️</Text>
                <Text style={type.heading}>Walang quest ngayon</Text>
                <Text style={[type.small, { textAlign: 'center' }]}>Your plants are all set for today.</Text>
              </Card>
            ) : null}

            {groupByPlant(quests).map((group) => (
              <Card key={group[0].plantId} style={styles.plantCard}>
                <Pressable
                  style={styles.plantHead}
                  onPress={() => router.push({ pathname: '/plant/[id]', params: { id: String(group[0].plantId) } })}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${group[0].plantName}`}
                >
                  <PlantAvatar uri={group[0].plantCover} size={36} />
                  <Text style={type.heading}>{group[0].plantName}</Text>
                </Pressable>
                {group.map((q, i) => (
                  <Fragment key={q.id}>
                    {i > 0 ? <View style={styles.divider} /> : null}
                    <QuestItem
                      quest={q}
                      onComplete={() => complete(q)}
                      onSkip={() => setStatus(q, 'skipped')}
                      onUndoSkip={() => setStatus(q, 'pending')}
                    />
                  </Fragment>
                ))}
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  section: { paddingHorizontal: space.lg, gap: space.md, marginTop: space.xl },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  plantCard: { paddingVertical: space.sm },
  plantHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm },
  divider: { height: 1, backgroundColor: colors.border },
  allDone: { alignItems: 'center', gap: space.xs },
  allDoneEmoji: { fontSize: 36 },
});
