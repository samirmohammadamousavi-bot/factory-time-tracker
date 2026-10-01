import '@/lib/temporal-setup';
import { db } from './prisma';
import { jalaliToGregorianStr, tehranDateString, toJalaliParts } from './jalali';

export interface DayRow {
  workerId: number;
  workerName: string;
  date: string;
  entryTime: Temporal.Instant | null;
  exitTime: Temporal.Instant | null;
  hours: number;
  status: 'complete' | 'open' | 'absent';
}

export interface AbsentWorker {
  workerId: number;
  workerName: string;
}

function hoursBetween(entry: Temporal.Instant, exit: Temporal.Instant): number {
  return (exit.epochMilliseconds - entry.epochMilliseconds) / 3_600_000;
}

export function aggregateByDay(
  logs: Array<{
    workerId: number;
    workDate: string;
    entryTime: Temporal.Instant;
    exitTime: Temporal.Instant | null;
    worker: { firstName: string; lastName: string };
  }>,
): DayRow[] {
  const map = new Map<string, DayRow>();
  for (const log of logs) {
    const key = `${log.workerId}-${log.workDate}`;
    if (!map.has(key)) {
      map.set(key, {
        workerId: log.workerId,
        workerName: `${log.worker.firstName} ${log.worker.lastName}`,
        date: log.workDate,
        entryTime: log.entryTime,
        exitTime: log.exitTime,
        hours: 0,
        status: 'open',
      });
    }
    const row = map.get(key)!;
    if (log.exitTime) {
      row.hours += hoursBetween(log.entryTime, log.exitTime);
    }
    if (!row.entryTime || log.entryTime.epochMilliseconds < row.entryTime.epochMilliseconds) {
      row.entryTime = log.entryTime;
    }
    if (
      log.exitTime &&
      (!row.exitTime || log.exitTime.epochMilliseconds > row.exitTime.epochMilliseconds)
    ) {
      row.exitTime = log.exitTime;
    }
  }
  for (const row of map.values()) {
    row.status = row.exitTime ? 'complete' : 'open';
  }
  return Array.from(map.values());
}

async function allLogsWithWorker() {
  return db.orm.public.TimeLog.include('worker').orderBy((m) => m.workDate.asc()).all();
}

async function allWorkers() {
  return db.orm.public.Worker.orderBy((m) => m.id.asc()).all();
}

export async function getDailyReport(dateStr: string): Promise<{
  date: string;
  rows: DayRow[];
  absent: AbsentWorker[];
  totalHours: number;
}> {
  const [logs, workers] = await Promise.all([allLogsWithWorker(), allWorkers()]);
  const dayLogs = logs.filter((l) => l.workDate === dateStr);
  const rows = aggregateByDay(dayLogs).sort((a, b) =>
    a.workerName.localeCompare(b.workerName, 'fa'),
  );
  const present = new Set(rows.map((r) => r.workerId));
  const absent = workers
    .filter((w) => !present.has(w.id))
    .map((w) => ({ workerId: w.id, workerName: `${w.firstName} ${w.lastName}` }));
  const totalHours = rows.reduce((s, r) => s + r.hours, 0);
  return { date: dateStr, rows, absent, totalHours };
}

export async function getMonthRows(jy: number, jm: number): Promise<DayRow[]> {
  const startStr = jalaliToGregorianStr(jy, jm, 1);
  const endStr =
    jm === 12
      ? jalaliToGregorianStr(jy + 1, 1, 1)
      : jalaliToGregorianStr(jy, jm + 1, 1);
  const logs = await allLogsWithWorker();
  return aggregateByDay(
    logs.filter((l) => l.workDate >= startStr && l.workDate < endStr),
  );
}

export async function getYearMatrix(jy: number): Promise<{
  workers: Array<{
    workerId: number;
    workerName: string;
    months: number[];
    total: number;
  }>;
}> {
  const startStr = jalaliToGregorianStr(jy, 1, 1);
  const endStr = jalaliToGregorianStr(jy + 1, 1, 1);
  const logs = await allLogsWithWorker();
  const inYear = logs.filter((l) => l.workDate >= startStr && l.workDate < endStr);

  const boundaries: string[] = [];
  for (let m = 1; m <= 12; m++) boundaries.push(jalaliToGregorianStr(jy, m, 1));
  boundaries.push(endStr);

  const byWorker = new Map<number, { workerName: string; months: number[] }>();
  for (const log of inYear) {
    if (!log.exitTime) continue;
    let jm = 11;
    for (let m = 0; m < 12; m++) {
      if (log.workDate >= boundaries[m] && log.workDate < boundaries[m + 1]) {
        jm = m;
        break;
      }
    }
    if (!byWorker.has(log.workerId)) {
      byWorker.set(log.workerId, {
        workerName: `${log.worker.firstName} ${log.worker.lastName}`,
        months: new Array(12).fill(0),
      });
    }
    byWorker.get(log.workerId)!.months[jm] += hoursBetween(log.entryTime, log.exitTime);
  }

  const workers = Array.from(byWorker.entries()).map(([workerId, v]) => ({
    workerId,
    workerName: v.workerName,
    months: v.months,
    total: v.months.reduce((s, h) => s + h, 0),
  }));
  workers.sort((a, b) => b.total - a.total);
  return { workers };
}

export async function getWorkerSummary(workerId: number): Promise<{
  today: DayRow | null;
  todayStr: string;
  weekHours: number;
  weekDays: number;
  monthHours: number;
  monthDays: number;
  monthLabel: string;
  recent: DayRow[];
}> {
  const todayStr = tehranDateString();
  const logs = await db.orm.public.TimeLog.where({ workerId }).all();
  const rows = aggregateByDay(
    logs.map((l) => ({
      workerId: l.workerId,
      workDate: l.workDate,
      entryTime: l.entryTime,
      exitTime: l.exitTime,
      worker: { firstName: '', lastName: '' },
    })),
  ).sort((a, b) => (a.date < b.date ? 1 : -1));

  const today = rows.find((r) => r.date === todayStr) ?? null;

  const weekCutoff =
    new Date(`${todayStr}T00:00:00.000Z`).getTime() - 6 * 86_400_000;
  const weekRows = rows.filter(
    (r) => new Date(`${r.date}T00:00:00.000Z`).getTime() >= weekCutoff,
  );

  const { jy, jm } = toJalaliParts(new Date());
  const mStart = jalaliToGregorianStr(jy, jm, 1);
  const mEnd =
    jm === 12 ? jalaliToGregorianStr(jy + 1, 1, 1) : jalaliToGregorianStr(jy, jm + 1, 1);
  const monthRows = rows.filter((r) => r.date >= mStart && r.date < mEnd);

  const sum = (rs: DayRow[]) => rs.reduce((s, r) => s + r.hours, 0);
  const monthNames = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
  ];

  return {
    today,
    todayStr,
    weekHours: sum(weekRows),
    weekDays: weekRows.length,
    monthHours: sum(monthRows),
    monthDays: monthRows.length,
    monthLabel: `${monthNames[jm - 1]} ${jy}`,
    recent: rows.slice(0, 14),
  };
}