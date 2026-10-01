import '@/lib/temporal-setup';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { requireWorker } from '@/lib/api-auth';
import { tehranDateString } from '@/lib/jalali';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireWorker();
  } catch (response) {
    return response as NextResponse;
  }

  const workerId = Number(session.user.id);
  const { action } = await req.json();
  const now = Temporal.Now.instant();
  const workDateStr = tehranDateString(now);

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
      entryTime: now,
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
      .update({ exitTime: Temporal.Now.instant() });
    return NextResponse.json({ ok: true, message: 'خروج ثبت شد' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}