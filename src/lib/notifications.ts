import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

const CHANNEL_ID = 'daily-quests';
const REMINDER_ID = 'titanim-daily-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let channelReady: Promise<string | undefined> | null = null;

/**
 * Creates the Android channel once. Returns its id, or undefined to fall back to the
 * default channel: Expo Go on Android can reject channel creation with a native error,
 * and a missing custom channel must never block the reminder.
 */
function ensureChannel(): Promise<string | undefined> {
  if (Platform.OS !== 'android') return Promise.resolve(undefined);
  channelReady ??= Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Daily quests',
    // Re-exported via `export *`, which eslint-plugin-import cannot follow; tsc checks it.
    // eslint-disable-next-line import/namespace
    importance: Notifications.AndroidImportance.DEFAULT,
  }).then(
    () => CHANNEL_ID,
    () => undefined,
  );
  return channelReady;
}

/** Asks for permission if needed. Returns whether notifications are allowed. */
export async function ensureNotificationPermission(): Promise<boolean> {
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

/**
 * Schedules (or cancels) one local notification per day. Nothing is sent from a server:
 * the phone itself fires the reminder, so it costs nothing and works offline.
 */
export async function scheduleDailyReminder(enabled: boolean, hour: number, minute: number, name: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => undefined);
  if (!enabled) return;
  const channelId = await ensureChannel();
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: 'Oras na para sa halaman 🌱',
      body: name ? `${name}, may quests ang mga halaman mo ngayon.` : 'Your plants have quests waiting today.',
      data: { url: '/today' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      ...(channelId ? { channelId } : {}),
    },
  });
}

/** Opens the Today tab when the daily reminder is tapped. */
export function useReminderDeepLink(): void {
  const router = useRouter();
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    const url = response?.notification.request.content.data?.url;
    if (url === '/today') router.navigate('/today');
  }, [response, router]);
}
