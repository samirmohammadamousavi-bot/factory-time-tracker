import '@/lib/temporal-setup';
import { toJalaali, toGregorian } from 'jalaali-js';

const TEHRAN_TZ = 'Asia/Tehran';
const TEHRAN_OFFSET = '+03:30'; // Iran abolished DST in 2022.

/** Anything with an epoch millisecond value — Date or Temporal.Instant. */
type DateLike = Date | { epochMilliseconds: number };

function toMs(d: DateLike): number {
  return d instanceof Date ? d.getTime() : d.epochMilliseconds;
}

function toJsDate(d: DateLike): Date {
  return d instanceof Date ? d : new Date(d.epochMilliseconds);
}

/** Returns YYYY-MM-DD in Tehran timezone (Gregorian). */
export function tehranDateString(date: DateLike = new Date()): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TEHRAN_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(toJsDate(date));
}

/** YYYY-MM-DD -> Tehran-midnight Temporal.Instant. */
export function tehranMidnightInstant(dateStr: string): Temporal.Instant {
  return Temporal.Instant.from(`${dateStr}T00:00:00${TEHRAN_OFFSET}`);
}

/** @deprecated Kept for legacy callers; prefer tehranMidnightInstant for DB writes. */
export function dateOnlyUtc(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/** Format any Date/Instant as Persian (Jalali) for display. */
export function toJalali(date: DateLike, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('fa-IR', {
    timeZone: TEHRAN_TZ,
    calendar: 'persian',
    ...opts,
  }).format(toJsDate(date));
}

/** Convert Gregorian Date/Instant -> Jalali { jy, jm, jd }. */
export function toJalaliParts(date: DateLike) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TEHRAN_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(toJsDate(date));
  const gy = Number(parts.find((p) => p.type === 'year')?.value);
  const gm = Number(parts.find((p) => p.type === 'month')?.value);
  const gd = Number(parts.find((p) => p.type === 'day')?.value);
  return toJalaali(gy, gm, gd);
}

/** Convert Jalali -> Gregorian Date at local midnight (legacy). */
export function fromJalali(jy: number, jm: number, jd: number): Date {
  const g = toGregorian(jy, jm, jd);
  return new Date(g.gy, g.gm - 1, g.gd);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Convert Jalali -> Gregorian YYYY-MM-DD string. */
export function jalaliToGregorianStr(jy: number, jm: number, jd: number): string {
  const g = toGregorian(jy, jm, jd);
  return `${g.gy}-${pad(g.gm)}-${pad(g.gd)}`;
}

/** Convert Gregorian YYYY-MM-DD string -> Jalali { jy, jm, jd }. */
export function gregorianStrToJalaliParts(dateStr: string) {
  const [gy, gm, gd] = dateStr.split('-').map(Number);
  return toJalaali(gy, gm, gd);
}

export function jalaliMonthRange(jy: number, jm: number): { start: Date; end: Date } {
  const start = fromJalali(jy, jm, 1);
  const end = jm === 12 ? fromJalali(jy + 1, 1, 1) : fromJalali(jy, jm + 1, 1);
  return { start, end };
}

export function jalaliYearRange(jy: number): { start: Date; end: Date } {
  const start = fromJalali(jy, 1, 1);
  const end = fromJalali(jy + 1, 1, 1);
  return { start, end };
}

export function jalaliMonthLength(jy: number, jm: number): number {
  const start = fromJalali(jy, jm, 1);
  const end = jm === 12 ? fromJalali(jy + 1, 1, 1) : fromJalali(jy, jm + 1, 1);
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

/** Shift a Gregorian YYYY-MM-DD string by n days. */
export function shiftDateStr(dateStr: string, n: number): string {
  const t = new Date(`${dateStr}T00:00:00.000Z`).getTime() + n * 86400000;
  return new Date(t).toISOString().slice(0, 10);
}