import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { tehranDateString } from '@/lib/jalali';

export const runtime = 'nodejs';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TEHRAN_OFFSET = '+03:30';

function toIso(dateStr: string, timeStr: string): string {
  return `${dateStr}T${timeStr}:00${TEHRAN_OFFSET}`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workerId = Number(session.user.id);
  const { date, entryTime, exitTime } = await req.json();

  const todayStr = tehranDateString();
  const dateStr = typeof date === 'string' && DATE_RE.test(date) ? date : todayStr;

  if (dateStr !== todayStr) {
    return NextResponse.json({ error: 'فقط زمان امروز قابل ثبت دستی است' }, { status: 400 });
  }

  if (!entryTime || !TIME_RE.test(entryTime)) {
    return NextResponse.json({ error: 'زمان ورود نامعتبر است' }, { status: 400 });
  }

  let exitIso: string | null = null;
  if (exitTime) {
    if (!TIME_RE.test(exitTime)) {
      return NextResponse.json({ error: 'زمان خروج نامعتبر است' }, { status: 400 });
    }
    if (new Date(toIso(dateStr, exitTime)).getTime() <= new Date(toIso(dateStr, entryTime)).getTime()) {
      return NextResponse.json({ error: 'زمان خروج باید بعد از ورود باشد' }, { status: 400 });
    }
    exitIso = toIso(dateStr, exitTime);
  }

  // Remove today's logs and create one fresh entry
  const existing = await db.orm.public.TimeLog.where({ workerId, workDate: dateStr }).all();
  for (const log of existing) {
    await db.orm.public.TimeLog.where({ id: log.id }).delete();
  }

  await db.orm.public.TimeLog.create({
    workerId,
    workDate: dateStr,
    entryTime: toIso(dateStr, entryTime),
    exitTime: exitIso,
  });

  return NextResponse.json({ ok: true, message: 'ثبت دستی انجام شد' });
}