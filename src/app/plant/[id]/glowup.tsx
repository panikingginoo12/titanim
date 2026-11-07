import * as Sharing from 'expo-sharing';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { BeforeAfter } from '@/components/BeforeAfter';
import { Button, EmptyState, Icon, ProgressBar, SectionLabel } from '@/components/ui';
import { listPhotos } from '@/db/photos';
import { getPlant } from '@/db/plants';
import { daysBetween, formatDay } from '@/lib/dates';
import { useFocusData } from '@/lib/useFocusData';
import { colors, radius, space, type } from '@/theme';

const FRAME_MS = 700;

export default function GlowUp() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const plantId = Number(id);
  const { data } = useFocusData(async (db) => {
    const [plant, photos] = await Promise.all([getPlant(db, plantId), listPhotos(db, plantId)]);
    return { plant, photos: [...photos].reverse() }; // oldest first
  }, plantId);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [sharing, setSharing] = useState(false);
  const card = useRef<ComponentRef<typeof View>>(null);

  const count = data?.photos.length ?? 0;

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      const next = frame + 1;
      setFrame(next);
      if (next >= count - 1) setPlaying(false);
    }, FRAME_MS);
    return () => clearTimeout(timer);
  }, [playing, frame, count]);

  if (!data) return <View style={styles.screen} />;
  const { plant, photos } = data;
  if (!plant || photos.length < 2) {
    return (
      <View style={styles.screen}>
        <EmptyState icon="images-outline" title="Kulang pa ang litrato" body="Take at least two daily photos to see the glow-up." />
      </View>
    );
  }

  const first = photos[0];
  const last = photos[photos.length - 1];
  const dayOf = (day: string) => daysBetween(first.day, day) + 1;
  const current = photos[Math.min(frame, photos.length - 1)];

  function togglePlay() {
    if (!playing && frame >= photos.length - 1) setFrame(0);
    setPlaying((p) => !p);
  }

  async function share() {
    setSharing(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Sharing is not available on this device.');
        return;
      }
      const uri = await captureRef(card, { format: 'jpg', quality: 0.9 });
      await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: `${plant!.nickname}'s glow-up` });
    } catch {
      Alert.alert('Could not create the image', 'Please try again.');
    } finally {
      setSharing(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: `${plant.nickname}'s glow-up` }} />

      <SectionLabel>Before and after</SectionLabel>
      <BeforeAfter
        beforeUri={first.uri}
        afterUri={last.uri}
        beforeLabel="Day 1"
        afterLabel={`Day ${dayOf(last.day)}`}
      />
      <Text style={[type.small, styles.hint]}>Drag across the photo to compare.</Text>

      <SectionLabel>Growth slideshow</SectionLabel>
      <View style={styles.slide}>
        <Image source={{ uri: current.uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
        <View style={styles.slideTag}>
          <Text style={styles.slideDay}>Day {dayOf(current.day)}</Text>
          <Text style={styles.slideDate}>{formatDay(current.day)}</Text>
        </View>
      </View>
      <View style={styles.controls}>
        <Pressable
          onPress={togglePlay}
          style={styles.play}
          accessibilityRole="button"
          accessibilityLabel={playing ? 'Pause slideshow' : 'Play slideshow'}
        >
          <Icon name={playing ? 'pause' : 'play'} size={22} color={colors.onPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <ProgressBar value={(frame + 1) / photos.length} color={colors.primary} track={colors.primarySoft} />
          <Text style={[type.small, { marginTop: 4 }]}>
            {Math.min(frame, photos.length - 1) + 1} of {photos.length} photos
          </Text>
        </View>
      </View>

      <SectionLabel>Share</SectionLabel>
      <View ref={card} collapsable={false} style={styles.card}>
        <Text style={styles.cardTitle}>{plant.nickname}&apos;s glow-up 🌱</Text>
        <View style={styles.cardRow}>
          {[first, last].map((p) => (
            <View key={p.id} style={styles.cardCol}>
              <Image source={{ uri: p.uri }} style={styles.cardImg} contentFit="cover" />
              <Text style={styles.cardDay}>Day {dayOf(p.day)}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.cardFoot}>Titanim · para sa mga Plantito at Plantita</Text>
      </View>
      <Button label="Share glow-up" icon="share-outline" onPress={share} loading={sharing} style={{ marginTop: space.md }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, paddingBottom: space.xxl },
  hint: { marginTop: space.xs },
  slide: { width: '100%', aspectRatio: 1, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  slideTag: {
    position: 'absolute',
    left: space.md,
    bottom: space.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
  },
  slideDay: { color: '#fff', fontSize: 18, fontWeight: '800' },
  slideDate: { color: '#E6E6E6', fontSize: 12 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.md },
  play: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: space.lg, gap: space.md },
  cardTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  cardRow: { flexDirection: 'row', gap: space.sm },
  cardCol: { flex: 1, gap: 6 },
  cardImg: { width: '100%', aspectRatio: 1, borderRadius: radius.md, backgroundColor: colors.primaryDark },
  cardDay: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  cardFoot: { color: colors.primarySoft, fontSize: 12, textAlign: 'center' },
});
