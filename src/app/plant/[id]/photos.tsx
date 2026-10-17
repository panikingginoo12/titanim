import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui';
import { listPhotos } from '@/db/photos';
import { daysBetween, formatDay } from '@/lib/dates';
import { deletePlantPhoto } from '@/lib/photos';
import { useFocusData } from '@/lib/useFocusData';
import { colors, radius, space } from '@/theme';

const MILESTONE_LABEL = { new_leaf: '✨ Bagong dahon', flower: '🌸 Bulaklak', fruit: '🍅 Bunga' } as const;

export default function Photos() {
  const params = useLocalSearchParams<{ id: string; index?: string }>();
  const plantId = Number(params.id);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(Number(params.index ?? 0));
  const { data: photos, reload, db } = useFocusData((d) => listPhotos(d, plantId), plantId);

  if (!photos) return <View style={styles.black} />;

  const firstDay = photos.length ? photos[photos.length - 1].day : undefined;
  const current = photos[Math.min(index, photos.length - 1)];

  function confirmDelete() {
    if (!current) return;
    Alert.alert('Delete this photo?', `The photo from ${formatDay(current.day)} will be removed from this phone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deletePlantPhoto(db, current.id);
          if (photos!.length <= 1) {
            router.back();
            return;
          }
          setIndex((i) => Math.max(0, Math.min(i, photos!.length - 2)));
          await reload();
        },
      },
    ]);
  }

  return (
    <View style={styles.black}>
      <FlatList
        data={photos}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(p) => String(p.id)}
        initialScrollIndex={Math.min(index, Math.max(0, photos.length - 1))}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <Image source={{ uri: item.uri }} style={{ width, height: '100%' }} contentFit="contain" accessibilityLabel={`Photo from ${formatDay(item.day)}`} />
        )}
      />
      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']} pointerEvents="box-none">
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.roundBtn} accessibilityRole="button" accessibilityLabel="Close">
            <Icon name="close" size={24} color={colors.onPrimary} />
          </Pressable>
          <Text style={styles.counter}>
            {Math.min(index, photos.length - 1) + 1} / {photos.length}
          </Text>
          <Pressable onPress={confirmDelete} style={styles.roundBtn} accessibilityRole="button" accessibilityLabel="Delete photo">
            <Icon name="trash-outline" size={22} color={colors.onPrimary} />
          </Pressable>
        </View>
        {current && firstDay ? (
          <View style={styles.caption} pointerEvents="none">
            <Text style={styles.day}>Day {daysBetween(firstDay, current.day) + 1}</Text>
            <Text style={styles.date}>{formatDay(current.day)}</Text>
            {current.milestone ? <Text style={styles.date}>{MILESTONE_LABEL[current.milestone]}</Text> : null}
            {current.note ? <Text style={styles.note}>{current.note}</Text> : null}
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  black: { flex: 1, backgroundColor: '#000' },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: space.lg },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: { color: colors.onPrimary, fontWeight: '700' },
  caption: {
    margin: space.lg,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
    gap: 2,
  },
  day: { color: colors.onPrimary, fontSize: 20, fontWeight: '800' },
  date: { color: '#E6E6E6', fontSize: 14 },
  note: { color: colors.onPrimary, fontSize: 15, marginTop: space.xs },
});
