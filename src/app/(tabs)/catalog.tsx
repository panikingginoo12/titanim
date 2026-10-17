import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Chip, Icon } from '@/components/ui';
import { CATEGORY_LABEL, LIGHT_LABEL, type Category } from '@/data/species';
import { searchGbif } from '@/lib/gbif';
import { mergeResults, searchBundled, type CatalogResult } from '@/lib/search';
import { colors, radius, space, type } from '@/theme';

type OnlineState = { status: 'idle' | 'loading' | 'done' | 'offline'; results: CatalogResult[] };

const IDLE: OnlineState = { status: 'idle', results: [] };
const LOADING: OnlineState = { status: 'loading', results: [] };

/** Debounced GBIF search for queries of 3+ letters. Falls back quietly when offline. */
function useGbif(query: string): OnlineState {
  const q = query.trim();
  const [settled, setSettled] = useState<OnlineState & { q: string }>({ ...IDLE, q: '' });
  useEffect(() => {
    if (q.length < 3) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchGbif(q, controller.signal)
        .then((results) => setSettled({ q, status: 'done', results }))
        .catch(() => {
          if (!controller.signal.aborted) setSettled({ q, status: 'offline', results: [] });
        });
    }, 450);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);
  if (q.length < 3) return IDLE;
  return settled.q === q ? settled : LOADING;
}

const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[];

export default function Catalog() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const online = useGbif(query);

  const results = useMemo(() => {
    const bundled = searchBundled(query).filter((r) => r.source !== 'bundled' || !category || r.species.category === category);
    return category ? bundled : mergeResults(bundled, online.results);
  }, [query, category, online.results]);

  function open(r: CatalogResult) {
    if (r.source === 'bundled') {
      router.push({ pathname: '/catalog/[id]', params: { id: r.id } });
    } else {
      router.push({
        pathname: '/catalog/[id]',
        params: { id: r.id, name: r.name, scientificName: r.scientificName, family: r.family ?? '' },
      });
    }
  }

  const footer = (
    <View style={styles.footer}>
      {online.status === 'loading' ? <Text style={type.small}>Searching more plants online…</Text> : null}
      {online.status === 'offline' ? (
        <View style={styles.offline}>
          <Icon name="cloud-offline-outline" size={16} color={colors.textMuted} />
          <Text style={type.small}>Offline. Showing built-in plants only.</Text>
        </View>
      ) : null}
      {online.results.length > 0 ? <Text style={type.small}>More results from GBIF (gbif.org), an open biodiversity database.</Text> : null}
      <Pressable
        onPress={() => router.push('/plant/new')}
        style={styles.unknown}
        accessibilityRole="button"
        accessibilityLabel="Add a plant without choosing a species"
      >
        <Icon name="help-circle-outline" size={22} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={type.heading}>Hindi mo alam ang pangalan?</Text>
          <Text style={type.small}>Add it anyway. You can set the species later.</Text>
        </View>
        <Icon name="chevron-forward" size={20} color={colors.textFaint} />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Catalog" subtitle="Find your plant" />
      <View style={styles.searchWrap}>
        <Icon name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search: monstera, sampaguita, sili…"
          placeholderTextColor={colors.textFaint}
          style={styles.search}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search plants"
          clearButtonMode="while-editing"
        />
      </View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="All" selected={category === null} onPress={() => setCategory(null)} />
          {CATEGORIES.map((c) => (
            <Chip key={c} label={CATEGORY_LABEL[c]} selected={category === c} onPress={() => setCategory(category === c ? null : c)} />
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={results}
        keyExtractor={(r) => r.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.xxl }}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          online.status !== 'loading' ? <Text style={[type.small, styles.none]}>No matches in the built-in list.</Text> : undefined
        }
        ListFooterComponent={footer}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => open(item)}
            style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.surfaceAlt }]}
            accessibilityRole="button"
            accessibilityLabel={`${item.name}, ${item.scientificName}`}
          >
            <View style={[styles.itemIcon, item.source === 'gbif' && { backgroundColor: colors.surfaceAlt }]}>
              <Icon name={item.source === 'bundled' ? 'leaf' : 'globe-outline'} size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={type.heading}>{item.name}</Text>
              <Text style={[type.small, { fontStyle: 'italic' }]}>{item.scientificName}</Text>
              {item.source === 'bundled' ? (
                <Text style={styles.tag}>{LIGHT_LABEL[item.species.care.light]}</Text>
              ) : (
                <Text style={[styles.tag, { color: colors.textMuted }]}>No care guide yet</Text>
              )}
            </View>
            <Icon name="chevron-forward" size={20} color={colors.textFaint} />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginHorizontal: space.lg,
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  search: { flex: 1, minHeight: 48, fontSize: 16, color: colors.text },
  chips: { gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.md },
  item: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, borderRadius: radius.md },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: { fontSize: 12, fontWeight: '600', color: colors.primary, marginTop: 2 },
  sep: { height: 1, backgroundColor: colors.border },
  none: { paddingVertical: space.lg },
  footer: { gap: space.md, paddingTop: space.lg },
  offline: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  unknown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
