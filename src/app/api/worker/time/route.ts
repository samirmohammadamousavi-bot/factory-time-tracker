import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { tehranDateString, dateOnlyUtc } from '@/lib/jalali';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workerId = Number(session.user.id);
  const { action } = await req.json(); // "clock-in" | "clock-out"
  const now = new Date();
  const todayStr = tehranDateString(now);
  const workDate = dateOnlyUtc(todayStr);

  const workDateStr = workDate.toISOString().slice(0, 10);
  const todaysLogs = await db.orm.public.TimeLog
    .where({ workerId, workDate: workDateStr })
    .all();
  const openLog = todaysLogs.find((l) => l.exitTime === null);

  if (action === 'clock-in') {
    if (openLog) {
      return NextResponse.json({ error: 'Already clocked in' }, { status: 400 });
    }

    await db.orm.public.TimeLog.create({
      workerId,
      entryTime: now.toISOString(),
      workDate: workDateStr,
    });
    return NextResponse.json({ ok: true, message: 'ورود ثبت شد' });
  }

  if (action === 'clock-out') {
    if (!openLog) {
      return NextResponse.json({ error: 'No open clock-in' }, { status: 400 });
    }

    await db.orm.public.TimeLog
      .where({ id: openLog.id })
      .update({ exitTime: now.toISOString() });
    return NextResponse.json({ ok: true, message: 'خروج ثبت شد' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}