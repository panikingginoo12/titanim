/** A calendar day in the phone's local time zone, formatted `YYYY-MM-DD`. */
export type Day = string;

const pad = (n: number) => String(n).padStart(2, '0');

export function toDay(date: Date): Day {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function today(): Day {
  return toDay(new Date());
}

/** Noon avoids DST edge cases when doing day arithmetic. */
function fromDay(day: Day): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(day: Day, n: number): Day {
  const date = fromDay(day);
  date.setDate(date.getDate() + n);
  return toDay(date);
}

/** Whole days from `a` to `b` (positive when `b` is later). */
export function daysBetween(a: Day, b: Day): number {
  return Math.round((fromDay(b).getTime() - fromDay(a).getTime()) / 86_400_000);
}

/** Monday of the week containing `day`, used as a week key. */
export function weekStart(day: Day): Day {
  const weekday = fromDay(day).getDay(); // 0 = Sunday
  return addDays(day, weekday === 0 ? -6 : 1 - weekday);
}

export function formatDay(day: Day): string {
  return fromDay(day).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}
