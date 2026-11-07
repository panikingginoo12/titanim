import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Icon, ProgressBar } from '@/components/ui';
import { getSettings, saveSettings } from '@/db/settings';
import { today } from '@/lib/dates';
import { DAILY_IDENTIFY_LIMIT, IdentifyError, identifyPlant, identifyRemaining, plantNetKey, type Match } from '@/lib/plantnet';
import { colors, radius, space, type } from '@/theme';

const MAX_SIDE = 1280;

type State =
  | { step: 'idle' }
  | { step: 'working'; uri: string }
  | { step: 'done'; uri: string; matches: Match[] }
  | { step: 'error'; uri: string | null; message: string };

/** Resize big photos before upload; Pl@ntNet downsizes to 1280 px anyway. */
async function prepare(asset: ImagePicker.ImagePickerAsset): Promise<string> {
  const ctx = ImageManipulator.manipulate(asset.uri);
  if (asset.width > MAX_SIDE) ctx.resize({ width: MAX_SIDE });
  const image = await ctx.renderAsync();
  const saved = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
  return saved.uri;
}

export default function Identify() {
  const db = useSQLiteContext();
  const router = useRouter();
  const apiKey = plantNetKey();
  const [remaining, setRemaining] = useState<number | null>(null);
  const [state, setState] = useState<State>({ step: 'idle' });

  useEffect(() => {
    getSettings(db).then((s) => setRemaining(identifyRemaining(s.identifyDay, s.identifyCount, today())));
  }, [db]);

  async function spendIdentify(count: number) {
    const day = today();
    const s = await getSettings(db);
    const used = (s.identifyDay === day ? s.identifyCount : 0) + count;
    await saveSettings(db, { identifyDay: day, identifyCount: used });
    setRemaining(Math.max(0, DAILY_IDENTIFY_LIMIT - used));
  }

  async function pick(source: 'camera' | 'library') {
    if (!apiKey || !remaining) return;
    try {
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          setState({ step: 'error', uri: null, message: 'Camera permission is needed to take a photo. You can choose one from your gallery instead.' });
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.9 };
      const result =
        source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled || !result.assets[0]) return;

      const uri = await prepare(result.assets[0]);
      setState({ step: 'working', uri });
      try {
        const matches = await identifyPlant(uri, apiKey);
        await spendIdentify(1);
        setState({ step: 'done', uri, matches });
      } catch (e) {
        if (e instanceof IdentifyError && e.kind === 'no-plant') await spendIdentify(1);
        setState({ step: 'error', uri, message: e instanceof IdentifyError ? e.message : 'Something went wrong. Please try again.' });
      }
    } catch {
      setState({ step: 'error', uri: null, message: 'Could not open the photo. Please try again.' });
    }
  }

  function open(m: Match) {
    if (m.species) {
      router.push({ pathname: '/catalog/[id]', params: { id: m.species.id } });
    } else {
      router.push({
        pathname: '/catalog/[id]',
        params: { id: `plantnet:${m.scientificName}`, name: m.commonName ?? m.scientificName, scientificName: m.scientificName, family: m.family ?? '' },
      });
    }
  }

  if (!apiKey) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Card style={{ gap: space.sm }}>
          <Icon name="scan-outline" size={28} color={colors.primary} />
          <Text style={type.heading}>Plant ID is not set up in this build</Text>
          <Text style={type.small}>
            Add a free Pl@ntNet API key as EXPO_PUBLIC_PLANTNET_API_KEY in .env.local, then restart the app. Get one at
            my.plantnet.org.
          </Text>
        </Card>
      </ScrollView>
    );
  }

  const busy = state.step === 'working';
  const out = remaining === 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={[type.body, { color: colors.textMuted }]}>
        Take a clear photo of one leaf or flower. Hindi mo alam ang pangalan? Kami na ang bahala.
      </Text>

      {'uri' in state && state.uri ? (
        <View style={styles.preview}>
          <Image source={{ uri: state.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          {busy ? (
            <View style={styles.scrim}>
              <ActivityIndicator color="#fff" size="large" />
              <Text style={styles.scrimText}>Kinikilala ang halaman…</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {state.step === 'error' ? (
        <Card style={styles.errorCard}>
          <Icon name="alert-circle-outline" size={20} color={colors.terracotta} />
          <Text style={[type.small, { flex: 1, color: colors.text }]}>{state.message}</Text>
        </Card>
      ) : null}

      {state.step === 'done' ? (
        state.matches.length === 0 ? (
          <Text style={type.small}>No matches. Try another angle or a closer photo.</Text>
        ) : (
          <View style={{ gap: space.sm }}>
            <Text style={type.heading}>Baka ito ang halaman mo:</Text>
            {state.matches.map((m) => (
              <Pressable
                key={m.scientificName}
                onPress={() => open(m)}
                style={({ pressed }) => [styles.match, pressed && { opacity: 0.85 }]}
                accessibilityRole="button"
                accessibilityLabel={`${m.commonName ?? m.scientificName}, ${Math.round(m.score * 100)} percent match`}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={type.heading}>{m.commonName ?? m.scientificName}</Text>
                  <Text style={[type.small, { fontStyle: 'italic' }]}>
                    {m.scientificName}
                    {m.family ? ` · ${m.family}` : ''}
                  </Text>
                  <View style={styles.scoreRow}>
                    <View style={{ flex: 1 }}>
                      <ProgressBar value={m.score} color={colors.primary} track={colors.primarySoft} />
                    </View>
                    <Text style={styles.score}>{Math.round(m.score * 100)}%</Text>
                  </View>
                  {m.species ? <Text style={styles.tag}>Care guide available</Text> : null}
                </View>
                <Icon name="chevron-forward" size={20} color={colors.textFaint} />
              </Pressable>
            ))}
          </View>
        )
      ) : null}

      <View style={styles.actions}>
        <Button label="Take photo" icon="camera" onPress={() => pick('camera')} disabled={busy || out || remaining === null} style={{ flex: 1 }} />
        <Button
          label="Gallery"
          icon="image-outline"
          variant="secondary"
          onPress={() => pick('library')}
          disabled={busy || out || remaining === null}
          style={{ flex: 1 }}
        />
      </View>
      <Text style={[type.small, { textAlign: 'center' }]}>
        {out
          ? 'Ubos na ang plant IDs mo ngayong araw. Balik bukas!'
          : remaining === null
            ? ' '
            : `${remaining} of ${DAILY_IDENTIFY_LIMIT} plant IDs left today`}
      </Text>
      <Text style={styles.credit}>Plant identification by Pl@ntNet (plantnet.org)</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  preview: { width: '100%', aspectRatio: 1, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', gap: space.sm },
  scrimText: { color: '#fff', fontWeight: '700' },
  errorCard: { flexDirection: 'row', gap: space.sm, backgroundColor: colors.terracottaSoft, borderColor: colors.terracottaSoft },
  match: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 4 },
  score: { fontSize: 13, fontWeight: '700', color: colors.primary, minWidth: 40, textAlign: 'right' },
  tag: { fontSize: 12, fontWeight: '600', color: colors.primary, marginTop: 2 },
  actions: { flexDirection: 'row', gap: space.sm },
  credit: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
});
