import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button, Card, Chip, Icon, ProgressBar, SectionLabel, type IconName } from '@/components/ui';
import { getStreak, ownedBadges, totalXp } from '@/db/game';
import { getSettings, saveSettings, type Settings } from '@/db/settings';
import { BADGES } from '@/lib/game/badges';
import { levelProgress, type Persona } from '@/lib/game/xp';
import { ensureNotificationPermission, scheduleDailyReminder } from '@/lib/notifications';
import { exportBackup } from '@/lib/backup';
import { pickAndRestore } from '@/lib/restoreFlow';
import { useFocusData } from '@/lib/useFocusData';
import { colors, radius, space, type } from '@/theme';

async function load(db: Parameters<typeof getSettings>[0]) {
  const [settings, xp, streak, owned] = await Promise.all([getSettings(db), totalXp(db), getStreak(db), ownedBadges(db)]);
  return { settings, level: levelProgress(xp, settings.persona), streak, owned: new Set(owned.map((b) => b.id)) };
}

function formatTime(hour: number, minute: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}

function Row({ icon, title, body, right }: { icon: IconName; title: string; body?: string; right: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Icon name={icon} size={22} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={type.body}>{title}</Text>
        {body ? <Text style={type.small}>{body}</Text> : null}
      </View>
      {right}
    </View>
  );
}

function Stepper({ label, onMinus, onPlus }: { label: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={onMinus} style={styles.stepBtn} accessibilityRole="button" accessibilityLabel="Earlier">
        <Icon name="remove" size={20} color={colors.primary} />
      </Pressable>
      <Text style={[type.heading, { minWidth: 96, textAlign: 'center' }]} accessibilityLiveRegion="polite">
        {label}
      </Text>
      <Pressable onPress={onPlus} style={styles.stepBtn} accessibilityRole="button" accessibilityLabel="Later">
        <Icon name="add" size={20} color={colors.primary} />
      </Pressable>
    </View>
  );
}

export default function Profile() {
  const router = useRouter();
  const { data, reload, db } = useFocusData(load);
  const [busy, setBusy] = useState<'backup' | 'restore' | null>(null);
  if (!data) return <SafeAreaView style={styles.safe} />;
  const { settings, level, streak, owned } = data;

  async function update(patch: Partial<Settings>) {
    await saveSettings(db, patch);
    await reload();
  }

  /** Saves reminder settings only after the phone accepted the schedule, so the switch never lies. */
  async function updateReminder(patch: Pick<Partial<Settings>, 'reminderEnabled' | 'reminderHour' | 'reminderMinute'>) {
    const next = { ...settings, ...patch };
    try {
      await scheduleDailyReminder(next.reminderEnabled, next.reminderHour, next.reminderMinute, next.name);
    } catch {
      Alert.alert('Hindi ma-set ang reminder', 'Your phone did not accept the daily reminder. Please try again.');
      return;
    }
    await update(patch);
  }

  async function backUp() {
    setBusy('backup');
    try {
      await exportBackup(db);
      await update({ lastBackupAt: new Date().toISOString() });
    } catch {
      Alert.alert('Hindi ma-backup', 'Could not create the backup. Check that your phone has free storage.');
    } finally {
      setBusy(null);
    }
  }

  async function restore() {
    setBusy('restore');
    const restored = await pickAndRestore(db);
    setBusy(null);
    if (restored) {
      Alert.alert('Restored!', 'Your garden is back.');
      router.navigate('/today');
    }
  }

  async function toggleReminder(on: boolean) {
    if (on) {
      let allowed = false;
      try {
        allowed = await ensureNotificationPermission();
      } catch {
        allowed = false;
      }
      if (!allowed) {
        Alert.alert('Notifications are off', 'Allow notifications for Titanim in your phone settings to get daily reminders.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open settings', onPress: () => Linking.openSettings() },
        ]);
        return;
      }
    }
    await updateReminder({ reminderEnabled: on });
  }

  function shiftTime(minutes: number) {
    const total = (settings.reminderHour * 60 + settings.reminderMinute + minutes + 24 * 60) % (24 * 60);
    void updateReminder({ reminderHour: Math.floor(total / 60), reminderMinute: total % 60 });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }}>
        <ScreenHeader title={settings.name || 'Profile'} subtitle={level.title} />
        <View style={{ paddingHorizontal: space.lg }}>
          <Card style={{ gap: space.sm }}>
            <View style={styles.levelHead}>
              <Text style={type.title}>Level {level.level}</Text>
              <Text style={type.small}>{level.xp} XP total</Text>
            </View>
            <ProgressBar value={level.into / level.span} />
            <Text style={type.small}>
              {level.span - level.into} XP more to level {level.level + 1}
            </Text>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={type.title}>{streak.current}</Text>
                <Text style={type.small}>current streak</Text>
              </View>
              <View style={styles.stat}>
                <Text style={type.title}>{streak.best}</Text>
                <Text style={type.small}>best streak</Text>
              </View>
              <View style={styles.stat}>
                <Text style={type.title}>{owned.size}</Text>
                <Text style={type.small}>badges</Text>
              </View>
            </View>
          </Card>

          <SectionLabel>Badges</SectionLabel>
          <View style={styles.badges}>
            {BADGES.map((b) => {
              const have = owned.has(b.id);
              return (
                <View
                  key={b.id}
                  style={[styles.badge, !have && styles.badgeLocked]}
                  accessible
                  accessibilityLabel={`${b.name}. ${b.description}. ${have ? 'Earned' : 'Locked'}`}
                >
                  <View style={[styles.badgeIcon, !have && { backgroundColor: colors.surfaceAlt }]}>
                    <Icon name={(have ? b.icon : 'lock-closed') as IconName} size={22} color={have ? colors.terracotta : colors.textFaint} />
                  </View>
                  <Text style={styles.badgeName} numberOfLines={1}>
                    {b.name}
                  </Text>
                  <Text style={styles.badgeDesc} numberOfLines={2}>
                    {b.description}
                  </Text>
                </View>
              );
            })}
          </View>

          <SectionLabel>I am a…</SectionLabel>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            {(['plantita', 'plantito'] as Persona[]).map((p) => (
              <Chip key={p} label={p === 'plantita' ? 'Plantita' : 'Plantito'} selected={settings.persona === p} onPress={() => update({ persona: p })} />
            ))}
          </View>

          <SectionLabel>Settings</SectionLabel>
          <Card style={{ gap: space.lg }}>
            <Row
              icon="notifications-outline"
              title="Daily reminder"
              body="A local notification from your phone. No internet needed."
              right={<Switch value={settings.reminderEnabled} onValueChange={toggleReminder} trackColor={{ true: colors.primary }} accessibilityLabel="Daily reminder" />}
            />
            {settings.reminderEnabled ? (
              <Stepper label={formatTime(settings.reminderHour, settings.reminderMinute)} onMinus={() => shiftTime(-15)} onPlus={() => shiftTime(15)} />
            ) : null}
            <Pressable onPress={() => router.push('/location')} accessibilityRole="button" accessibilityLabel="Weather location">
              <Row
                icon="partly-sunny-outline"
                title="Weather location"
                body={settings.location ? settings.location.name : 'Not set. Add it for rain and heat tips.'}
                right={<Icon name="chevron-forward" size={20} color={colors.textFaint} />}
              />
            </Pressable>
            <Row
              icon="layers-outline"
              title="Ghost overlay"
              body="Show your last photo faintly in the camera so shots line up."
              right={<Switch value={settings.ghostOverlay} onValueChange={(v) => update({ ghostOverlay: v })} trackColor={{ true: colors.primary }} accessibilityLabel="Ghost overlay" />}
            />
            <Row
              icon="images-outline"
              title="Save a copy to Gallery"
              body="Keeps your plant photos even if the app is uninstalled."
              right={<Switch value={settings.saveToGallery} onValueChange={(v) => update({ saveToGallery: v })} trackColor={{ true: colors.primary }} accessibilityLabel="Save a copy to Gallery" />}
            />
          </Card>

          <SectionLabel>Backup</SectionLabel>
          <Card style={{ gap: space.md }}>
            <Text style={type.small}>
              {settings.lastBackupAt
                ? `Last backup: ${new Date(settings.lastBackupAt).toLocaleDateString('en-PH', { dateStyle: 'medium' })}.`
                : 'No backup yet.'}{' '}
              Save a backup to Google Drive or Files so you can restore your garden on a new phone.
            </Text>
            <Button label="Back up now" icon="cloud-upload-outline" onPress={backUp} loading={busy === 'backup'} disabled={busy !== null} />
            <Button
              label="Restore from backup"
              icon="cloud-download-outline"
              variant="secondary"
              onPress={restore}
              loading={busy === 'restore'}
              disabled={busy !== null}
            />
          </Card>

          <SectionLabel>About</SectionLabel>
          <Text style={type.small}>
            Titanim keeps everything on this phone. Care tips are general guidance, not guarantees. Extra species search
            uses GBIF (gbif.org), an open biodiversity database. Weather data by Open-Meteo.com.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  levelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  statRow: { flexDirection: 'row', marginTop: space.sm },
  stat: { flex: 1, alignItems: 'center' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  badge: {
    width: '31.5%',
    alignItems: 'center',
    gap: 4,
    padding: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeLocked: { opacity: 0.6 },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.terracottaSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeName: { fontSize: 13, fontWeight: '700', color: colors.text, textAlign: 'center' },
  badgeDesc: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space.md, alignSelf: 'center' },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
