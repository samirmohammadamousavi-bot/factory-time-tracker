import '@/lib/temporal-setup';
import { db } from './prisma';
import {
  jalaliToGregorianStr,
  tehranDateString,
  tehranMidnightInstant,
  shiftDateStr,
  toJalaliParts,
} from './jalali';

export const BASE_DAYS = 30;
export const CARRYOVER_CAP = 9;
export const MAX_TOTAL = BASE_DAYS + CARRYOVER_CAP;

function isFriday(dateStr: string): boolean {
  return new Date(`${dateStr}T12:00:00Z`).getUTCDay() === 5;
}

function countWorkingDays(startStr: string, endStr: string): number {
  if (startStr > endStr) return 0;
  let n = 0;
  let cur = startStr;
  let safety = 0;
  while (cur <= endStr && safety < 800) {
    if (!isFriday(cur)) n++;
    cur = shiftDateStr(cur, 1);
    safety++;
  }
  return n;
}

function* iterWorkingDays(startStr: string, endStr: string): Generator<string> {
  let cur = startStr;
  let safety = 0;
  while (cur <= endStr && safety < 800) {
    if (!isFriday(cur)) yield cur;
    cur = shiftDateStr(cur, 1);
    safety++;
  }
}

export function jalaliYearBounds(jy: number): { start: string; end: string } {
  return {
    start: jalaliToGregorianStr(jy, 1, 1),
    end: jalaliToGregorianStr(jy + 1, 1, 1),
  };
}

export interface VacationStats {
  jalaliYear: number;
  entitled: number;
  carryIn: number;
  used: number;
  usedFromRequests: number;
  usedFromAbsence: number;
  adjustment: number;
  remaining: number;
  balanceId: number;
}

interface BalanceRow {
  id: number;
  adjustment: number;
  manualCarryIn: number | null;
  trackingStartDate: Temporal.Instant;
}

async function ensureBalance(workerId: number, jy: number): Promise<BalanceRow> {
  const existing = await db.orm.public.VacationBalance
    .where({ workerId, jalaliYear: jy })
    .first();
  if (existing) return existing as BalanceRow;

  const worker = await db.orm.public.Worker.where({ id: workerId }).first();
  const yearStart = jalaliToGregorianStr(jy, 1, 1);
  const workerCreated = worker ? tehranDateString(worker.createdAt) : yearStart;
  const trackDate = workerCreated > yearStart ? workerCreated : yearStart;

  const created = await db.orm.public.VacationBalance.create({
    workerId,
    jalaliYear: jy,
    adjustment: 0,
    trackingStartDate: tehranMidnightInstant(trackDate),
  });
  return created as BalanceRow;
}

async function computeUsed(
  workerId: number,
  jy: number,
): Promise<{ fromRequests: number; fromAbsence: number }> {
  const { start, end } = jalaliYearBounds(jy);
  const today = tehranDateString();

  const reqs = await db.orm.public.VacationRequest.where({ workerId }).all();
  const approved = reqs.filter((r) => r.status === 'APPROVED');

  let fromRequests = 0;
  const approvedDates = new Set<string>();
  for (const r of approved) {
    const rStart = r.startDate;
    const rEnd = r.endDate;
    const s = rStart < start ? start : rStart;
    const e = rEnd >= end ? shiftDateStr(end, -1) : rEnd;
    for (const d of iterWorkingDays(s, e)) {
      approvedDates.add(d);
      fromRequests++;
    }
  }

  const bal = await ensureBalance(workerId, jy);
  const trackStart = tehranDateString(bal.trackingStartDate);
  const yearEndMinus1 = shiftDateStr(end, -1);
  const yesterday = shiftDateStr(today, -1);

  const absStart = trackStart > start ? trackStart : start;
  const absEnd = yesterday < yearEndMinus1 ? yesterday : yearEndMinus1;

  if (absStart > absEnd) return { fromRequests, fromAbsence: 0 };

  const logs = await db.orm.public.TimeLog.where({ workerId }).all();
  const loggedDates = new Set(
    logs
      .filter((l) => l.workDate >= absStart && l.workDate <= absEnd)
      .map((l) => l.workDate),
  );

  let fromAbsence = 0;
  for (const d of iterWorkingDays(absStart, absEnd)) {
    if (!loggedDates.has(d) && !approvedDates.has(d)) fromAbsence++;
  }

  return { fromRequests, fromAbsence };
}

async function computeCarryIn(
  workerId: number,
  jy: number,
  bal: { manualCarryIn: number | null },
): Promise<number> {
  if (bal.manualCarryIn != null) {
    return Math.max(0, Math.min(CARRYOVER_CAP, bal.manualCarryIn));
  }
  const prev = await getVacationStats(workerId, jy - 1, true);
  if (prev.remaining <= 0) return 0;
  return Math.min(CARRYOVER_CAP, prev.remaining);
}

export async function getVacationStats(
  workerId: number,
  jy: number,
  skipCarry = false,
): Promise<VacationStats> {
  const bal = await ensureBalance(workerId, jy);
  const { fromRequests, fromAbsence } = await computeUsed(workerId, jy);

  const carryIn = skipCarry ? 0 : await computeCarryIn(workerId, jy, bal);
  const adjustment = bal.adjustment ?? 0;
  const entitled = Math.min(MAX_TOTAL, BASE_DAYS + carryIn);
  const used = fromRequests + fromAbsence + adjustment;

  return {
    jalaliYear: jy,
    entitled,
    carryIn,
    used,
    usedFromRequests: fromRequests,
    usedFromAbsence: fromAbsence,
    adjustment,
    remaining: entitled - used,
    balanceId: bal.id,
  };
}

export async function getCurrentVacationStats(workerId: number): Promise<VacationStats> {
  const { jy } = toJalaliParts(new Date());
  return getVacationStats(workerId, jy);
}

export function countVacationDays(startStr: string, endStr: string): number {
  return countWorkingDays(startStr, endStr);
}