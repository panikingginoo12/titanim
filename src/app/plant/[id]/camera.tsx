import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCelebrate } from '@/components/Celebration';
import { Button, Chip, Icon } from '@/components/ui';
import { getPhotoForDay, getPreviousPhoto, type Milestone } from '@/db/photos';
import { getPlant } from '@/db/plants';
import { getSettings, saveSettings } from '@/db/settings';
import { today } from '@/lib/dates';
import { savePlantPhoto } from '@/lib/photos';
import { withRewards } from '@/lib/rewards';
import { colors, radius, space, type } from '@/theme';

const MILESTONES: { id: Milestone; label: string; icon: 'sparkles' | 'flower' | 'nutrition' }[] = [
  { id: 'new_leaf', label: 'Bagong dahon', icon: 'sparkles' },
  { id: 'flower', label: 'Bulaklak', icon: 'flower' },
  { id: 'fruit', label: 'Bunga', icon: 'nutrition' },
];

const GHOST_OPACITY = 0.3;

export default function CameraScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const plantId = Number(id);
  const db = useSQLiteContext();
  const router = useRouter();
  const celebrate = useCelebrate();
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [ready, setReady] = useState(false);
  const [ghostUri, setGhostUri] = useState<string | null>(null);
  const [ghostOn, setGhostOn] = useState(true);
  const [saveToGallery, setSaveToGallery] = useState(false);
  const [name, setName] = useState('');
  const [captured, setCaptured] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const day = today();
    (async () => {
      const [settings, previous, current, plant] = await Promise.all([
        getSettings(db),
        getPreviousPhoto(db, plantId, day),
        getPhotoForDay(db, plantId, day),
        getPlant(db, plantId),
      ]);
      setGhostOn(settings.ghostOverlay);
      setSaveToGallery(settings.saveToGallery);
      setGhostUri(previous?.uri ?? current?.uri ?? null);
      setName(plant?.nickname ?? '');
      if (current) {
        setNote(current.note ?? '');
        setMilestone(current.milestone);
      }
    })();
  }, [db, plantId]);

  async function toggleGhost() {
    const next = !ghostOn;
    setGhostOn(next);
    await saveSettings(db, { ghostOverlay: next });
  }

  async function capture() {
    if (!camera.current || !ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      const pic = await camera.current.takePictureAsync({ quality: 0.85 });
      setCaptured(pic.uri);
    } catch {
      setError('Could not take the photo. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!captured) return;
    setBusy(true);
    setError(null);
    try {
      const reward = await withRewards(db, () =>
        savePlantPhoto(db, {
          plantId,
          day: today(),
          captureUri: captured,
          note: note.trim() || null,
          milestone,
          saveToGallery,
        }),
      );
      celebrate(reward);
      router.back();
    } catch {
      setError('Could not save the photo. Check that your phone has free storage.');
      setBusy(false);
    }
  }

  if (!permission) return <View style={styles.black} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permission}>
        <Icon name="camera" size={48} color={colors.primary} />
        <Text style={[type.title, { textAlign: 'center' }]}>Camera access</Text>
        <Text style={[type.body, { textAlign: 'center', color: colors.textMuted }]}>
          Titanim needs the camera to take your plant&apos;s daily progress photo. Photos stay on this phone.
        </Text>
        <Button label="Allow camera" onPress={requestPermission} style={{ alignSelf: 'stretch' }} />
        <Button label="Not now" variant="ghost" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  if (captured) {
    return (
      <KeyboardAvoidingView style={styles.black} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Image source={{ uri: captured }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <SafeAreaView style={styles.reviewWrap} edges={['bottom']}>
          <View style={styles.reviewSheet}>
            <Text style={type.heading}>Looking good{name ? `, ${name}` : ''}!</Text>
            <View style={styles.milestones}>
              {MILESTONES.map((m) => (
                <Chip
                  key={m.id}
                  label={m.label}
                  icon={m.icon}
                  selected={milestone === m.id}
                  onPress={() => setMilestone(milestone === m.id ? null : m.id)}
                />
              ))}
            </View>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Note (optional): new leaf unfurling, repotted…"
              placeholderTextColor={colors.textFaint}
              style={styles.note}
              maxLength={200}
              accessibilityLabel="Photo note"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.reviewActions}>
              <Button label="Retake" variant="secondary" icon="camera-reverse-outline" onPress={() => setCaptured(null)} style={{ flex: 1 }} disabled={busy} />
              <Button label="Save" icon="checkmark" onPress={save} loading={busy} style={{ flex: 1 }} />
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.black}>
      <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" onCameraReady={() => setReady(true)} />
      {ghostOn && ghostUri ? (
        <Image
          source={{ uri: ghostUri }}
          style={[StyleSheet.absoluteFill, { opacity: GHOST_OPACITY }]}
          contentFit="cover"
          pointerEvents="none"
          accessible={false}
        />
      ) : null}
      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.roundBtn} accessibilityRole="button" accessibilityLabel="Close camera">
            <Icon name="close" size={24} color={colors.onPrimary} />
          </Pressable>
          <Text style={styles.topTitle} numberOfLines={1}>
            {name}
          </Text>
          <Pressable
            onPress={toggleGhost}
            disabled={!ghostUri}
            style={[styles.roundBtn, !ghostUri && { opacity: 0.4 }]}
            accessibilityRole="switch"
            accessibilityState={{ checked: ghostOn, disabled: !ghostUri }}
            accessibilityLabel="Ghost overlay of your last photo"
          >
            <Icon name={ghostOn ? 'layers' : 'layers-outline'} size={22} color={colors.onPrimary} />
          </Pressable>
        </View>
        <View style={styles.bottomBar}>
          {ghostUri ? (
            <Text style={styles.hint}>{ghostOn ? 'Line up with the faint photo for a steady glow-up' : 'Ghost overlay off'}</Text>
          ) : (
            <Text style={styles.hint}>Day 1! Pick a spot and angle you can repeat every day.</Text>
          )}
          {error ? <Text style={[styles.hint, { color: '#FFB4AB' }]}>{error}</Text> : null}
          <Pressable
            onPress={capture}
            disabled={!ready || busy}
            style={({ pressed }) => [styles.shutter, pressed && { transform: [{ scale: 0.94 }] }]}
            accessibilityRole="button"
            accessibilityLabel="Take photo"
          >
            {busy || !ready ? <ActivityIndicator color={colors.primary} /> : <View style={styles.shutterInner} />}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  black: { flex: 1, backgroundColor: '#000' },
  permission: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.md },
  overlay: { flex: 1, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: space.lg, gap: space.md },
  topTitle: { flex: 1, textAlign: 'center', color: colors.onPrimary, fontSize: 17, fontWeight: '700' },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: { alignItems: 'center', gap: space.lg, paddingBottom: space.xl },
  hint: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff' },
  reviewWrap: { flex: 1, justifyContent: 'flex-end' },
  reviewSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
  },
  milestones: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  note: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    minHeight: 46,
    fontSize: 15,
    color: colors.text,
  },
  error: { color: colors.danger, fontSize: 13 },
  reviewActions: { flexDirection: 'row', gap: space.sm },
});
