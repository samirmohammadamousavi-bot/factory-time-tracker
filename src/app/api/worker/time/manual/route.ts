import '@/lib/temporal-setup';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { requireWorker } from '@/lib/api-auth';
import { tehranDateString } from '@/lib/jalali';

export const runtime = 'nodejs';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TEHRAN_OFFSET = '+03:30';

function toInstant(dateStr: string, timeStr: string): Temporal.Instant {
  return Temporal.Instant.from(`${dateStr}T${timeStr}:00${TEHRAN_OFFSET}`);
}

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireWorker();
  } catch (response) {
    return response as NextResponse;
  }

  const workerId = Number(session.user.id);
  const { date, entryTime, exitTime } = await req.json();

  const todayStr = tehranDateString();
  const dateStr = typeof date === 'string' && DATE_RE.test(date) ? date : todayStr;

  if (dateStr !== todayStr) {
    return NextResponse.json(
      { error: 'فقط زمان امروز قابل ثبت دستی است' },
      { status: 400 },
    );
  }

  if (!entryTime || !TIME_RE.test(entryTime)) {
    return NextResponse.json({ error: 'زمان ورود نامعتبر است' }, { status: 400 });
  }

  const entryInstant = toInstant(dateStr, entryTime);
  let exitInstant: Temporal.Instant | null = null;

  if (exitTime) {
    if (!TIME_RE.test(exitTime)) {
      return NextResponse.json({ error: 'زمان خروج نامعتبر است' }, { status: 400 });
    }
    const candidate = toInstant(dateStr, exitTime);
    if (candidate.epochMilliseconds <= entryInstant.epochMilliseconds) {
      return NextResponse.json(
        { error: 'زمان خروج باید بعد از ورود باشد' },
        { status: 400 },
      );
    }
    exitInstant = candidate;
  }

  const existing = await db.orm.public.TimeLog
    .where({ workerId, workDate: dateStr })
    .first();

  if (existing) {
    await db.orm.public.TimeLog
      .where({ id: existing.id })
      .update({ entryTime: entryInstant, exitTime: exitInstant });
  } else {
    await db.orm.public.TimeLog.create({
      workerId,
      workDate: dateStr,
      entryTime: entryInstant,
      exitTime: exitInstant,
    });
  }

  return NextResponse.json({ ok: true, message: 'ثبت دستی انجام شد' });
}