// Web preview: local notifications are not available in the browser.

export async function ensureNotificationPermission(): Promise<boolean> {
  return false;
}

export async function scheduleDailyReminder(
  _enabled: boolean,
  _hour: number,
  _minute: number,
  _name: string,
): Promise<void> {}

export function useReminderDeepLink(): void {}
