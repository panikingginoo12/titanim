import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Icon } from '@/components/ui';
import { getSettings, saveSettings } from '@/db/settings';
import { roundCoord, searchPlaces, type Place } from '@/lib/weather';
import { colors, radius, space, type } from '@/theme';

type Search = { q: string; status: 'done' | 'error'; results: Place[] };

export default function LocationScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [current, setCurrent] = useState<Place | null>(null);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState<Search>({ q: '', status: 'done', results: [] });
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSettings(db).then((s) => setCurrent(s.location));
  }, [db]);

  const q = query.trim();
  useEffect(() => {
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchPlaces(q, controller.signal)
        .then((results) => setSearch({ q, status: 'done', results }))
        .catch(() => {
          if (!controller.signal.aborted) setSearch({ q, status: 'error', results: [] });
        });
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  const loading = q.length >= 2 && search.q !== q;
  const results = q.length >= 2 && search.q === q ? search.results : [];

  async function choose(place: Place | null) {
    // A new place invalidates the cached forecast.
    await saveSettings(db, { location: place, forecast: null });
    router.back();
  }

  async function useMyLocation() {
    setLocating(true);
    setError(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setError('Location permission was not given. You can search for your city instead.');
        return;
      }
      const pos =
        (await Location.getLastKnownPositionAsync({ maxAge: 6 * 60 * 60 * 1000 })) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
      const lat = roundCoord(pos.coords.latitude);
      const lon = roundCoord(pos.coords.longitude);
      let name = 'My location';
      try {
        const [addr] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        name = [addr?.city ?? addr?.subregion, addr?.region].filter(Boolean).join(', ') || name;
      } catch {
        // The place name is cosmetic; coordinates are what weather needs.
      }
      await choose({ name, lat, lon });
    } catch {
      setError('Could not get your location. Try searching for your city instead.');
    } finally {
      setLocating(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={[type.body, { color: colors.textMuted }]}>
        Titanim uses your city to check for rain, strong wind and heat, then adjusts quests for your outdoor plants.
        Only an approximate location (about 1 km) is saved, on this phone.
      </Text>
      {current ? (
        <View style={styles.current}>
          <Icon name="location-outline" size={18} color={colors.primary} />
          <Text style={[type.body, { flex: 1 }]}>{current.name}</Text>
          <Pressable onPress={() => choose(null)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Remove location">
            <Text style={styles.remove}>Remove</Text>
          </Pressable>
        </View>
      ) : null}

      <Button label="Use my location" icon="navigate-outline" variant="secondary" onPress={useMyLocation} loading={locating} />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={[type.label, { marginTop: space.md }]}>Or search your city</Text>
      <View style={styles.searchWrap}>
        <Icon name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="e.g. Quezon City, Cebu, Davao"
          placeholderTextColor={colors.textFaint}
          style={styles.search}
          autoCorrect={false}
          accessibilityLabel="Search city"
        />
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
      </View>
      {q.length >= 2 && search.q === q && search.status === 'error' ? (
        <Text style={type.small}>Can&apos;t search right now. Check your internet connection.</Text>
      ) : null}
      {q.length >= 2 && search.q === q && search.status === 'done' && results.length === 0 ? (
        <Text style={type.small}>No places found.</Text>
      ) : null}
      <FlatList
        data={results}
        keyExtractor={(p) => `${p.lat},${p.lon},${p.name}`}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item }) => (
          <Pressable onPress={() => choose(item)} style={styles.item} accessibilityRole="button" accessibilityLabel={item.name}>
            <Icon name="location-outline" size={18} color={colors.primary} />
            <Text style={[type.body, { flex: 1 }]}>{item.name}</Text>
          </Pressable>
        )}
      />
      <Text style={styles.credit}>Places and weather by Open-Meteo.com</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: space.lg, gap: space.md },
  current: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  remove: { color: colors.danger, fontWeight: '700' },
  error: { color: colors.danger, fontSize: 13 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  search: { flex: 1, minHeight: 48, fontSize: 16, color: colors.text },
  item: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.md },
  sep: { height: 1, backgroundColor: colors.border },
  credit: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
});
