import { beforeEach, describe, expect, it, vi } from 'vitest';

const N = vi.hoisted(() => ({
  setNotificationHandler: vi.fn(),
  setNotificationChannelAsync: vi.fn(),
  getPermissionsAsync: vi.fn(),
  requestPermissionsAsync: vi.fn(),
  cancelScheduledNotificationAsync: vi.fn(),
  scheduleNotificationAsync: vi.fn(),
  useLastNotificationResponse: vi.fn(),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
}));

vi.mock('expo-notifications', () => N);
vi.mock('expo-router', () => ({ useRouter: vi.fn() }));
vi.mock('react-native', () => ({ Platform: { OS: 'android' } }));

async function load() {
  vi.resetModules();
  return import('./notifications');
}

describe('notifications on Android', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    N.cancelScheduledNotificationAsync.mockResolvedValue(undefined);
    N.scheduleNotificationAsync.mockResolvedValue('id');
    N.getPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true });
  });

  it('schedules on the custom channel when it can be created', async () => {
    N.setNotificationChannelAsync.mockResolvedValue({});
    const { scheduleDailyReminder } = await load();
    await scheduleDailyReminder(true, 7, 30, 'Tuper');
    expect(N.scheduleNotificationAsync.mock.calls[0][0].trigger).toEqual({
      type: 'daily',
      hour: 7,
      minute: 30,
      channelId: 'daily-quests',
    });
  });

  it('falls back to the default channel when channel creation fails (Expo Go)', async () => {
    N.setNotificationChannelAsync.mockRejectedValue(new Error('NullPointerException'));
    const { ensureNotificationPermission, scheduleDailyReminder } = await load();
    await expect(ensureNotificationPermission()).resolves.toBe(true);
    await scheduleDailyReminder(true, 7, 0, '');
    expect(N.scheduleNotificationAsync.mock.calls[0][0].trigger).toEqual({ type: 'daily', hour: 7, minute: 0 });
    expect(N.setNotificationChannelAsync).toHaveBeenCalledTimes(1);
  });

  it('only cancels when turned off', async () => {
    const { scheduleDailyReminder } = await load();
    await scheduleDailyReminder(false, 7, 0, '');
    expect(N.cancelScheduledNotificationAsync).toHaveBeenCalledWith('titanim-daily-reminder');
    expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
