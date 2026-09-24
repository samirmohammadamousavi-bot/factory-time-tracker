import { toJalaali, toGregorian } from 'jalaali-js';

const TEHRAN_TZ = 'Asia/Tehran';

/** Returns YYYY-MM-DD in Tehran timezone (Gregorian). */
export function tehranDateString(date: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TEHRAN_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(date);
}

/** Returns a Date object at 00:00:00 UTC for the given Gregorian YYYY-MM-DD. */
export function dateOnlyUtc(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/** Format a Date as Persian (Jalali) string for display. */
export function toJalali(date: Date, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('fa-IR', {
    timeZone: TEHRAN_TZ,
    calendar: 'persian',
    ...opts,
  }).format(date);
}

/** Convert Gregorian Date → Jalali { jy, jm, jd }. */
export function toJalaliParts(date: Date) {
  const d = new Date(date.toLocaleString('en-US', { timeZone: TEHRAN_TZ }));
  return toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/** Convert Jalali → Gregorian Date.
 * NOTE: the resulting Date is local-midnight; do NOT derive a YYYY-MM-DD
 * string from it via toISOString() (breaks in timezones ahead of UTC).
 * Use jalaliToGregorianStr() for date strings. */
export function fromJalali(jy: number, jm: number, jd: number): Date {
  const g = toGregorian(jy, jm, jd);
  return new Date(g.gy, g.gm - 1, g.gd);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Convert Jalali → Gregorian YYYY-MM-DD string. Timezone-safe (no Date involved). */
export function jalaliToGregorianStr(jy: number, jm: number, jd: number): string {
  const g = toGregorian(jy, jm, jd);
  return `${g.gy}-${pad(g.gm)}-${pad(g.gd)}`;
}

/** Convert Gregorian YYYY-MM-DD string → Jalali { jy, jm, jd }. Timezone-safe. */
export function gregorianStrToJalaliParts(dateStr: string) {
  const [gy, gm, gd] = dateStr.split('-').map(Number);
  return toJalaali(gy, gm, gd);
}

/** Get start and end of Jalali month in Gregorian dates */
export function jalaliMonthRange(jy: number, jm: number): { start: Date; end: Date } {
  const start = fromJalali(jy, jm, 1);
  const end = jm === 12 ? fromJalali(jy + 1, 1, 1) : fromJalali(jy, jm + 1, 1);
  return { start, end };
}

/** Get start and end of Jalali year in Gregorian dates */
export function jalaliYearRange(jy: number): { start: Date; end: Date } {
  const start = fromJalali(jy, 1, 1);
  const end = fromJalali(jy + 1, 1, 1);
  return { start, end };
}

/** Number of days in a Jalali month. */
export function jalaliMonthLength(jy: number, jm: number): number {
  const start = fromJalali(jy, jm, 1);
  const end = jm === 12 ? fromJalali(jy + 1, 1, 1) : fromJalali(jy, jm + 1, 1);
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

/** Shift a Gregorian YYYY-MM-DD date string by n days. */
export function shiftDateStr(dateStr: string, n: number): string {
  const t = new Date(`${dateStr}T00:00:00.000Z`).getTime() + n * 86400000;
  return new Date(t).toISOString().slice(0, 10);
}