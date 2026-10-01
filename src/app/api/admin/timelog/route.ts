import '@/lib/temporal-setup';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

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
    session = await requireAdmin();
  } catch (response) {
    return response as NextResponse;
  }

  const { workerId, date, entryTime, exitTime } = await req.json();

  if (!workerId || !DATE_RE.test(date)) {
    return NextResponse.json({ error: 'Invalid workerId or date' }, { status: 400 });
  }

  if (!entryTime || !TIME_RE.test(entryTime)) {
    return NextResponse.json({ error: 'زمان ورود نامعتبر' }, { status: 400 });
  }
  const entryInstant = toInstant(date, entryTime);

  let exitInstant: Temporal.Instant | null = null;
  if (exitTime) {
    if (!TIME_RE.test(exitTime)) {
      return NextResponse.json({ error: 'زمان خروج نامعتبر' }, { status: 400 });
    }
    const candidate = toInstant(date, exitTime);
    if (candidate.epochMilliseconds <= entryInstant.epochMilliseconds) {
      return NextResponse.json({ error: 'خروج باید بعد از ورود باشد' }, { status: 400 });
    }
    exitInstant = candidate;
  }

  const existing = await db.orm.public.TimeLog
    .where({ workerId: Number(workerId), workDate: date })
    .first();

  let id: number;
  if (existing) {
    await db.orm.public.TimeLog
      .where({ id: existing.id })
      .update({ entryTime: entryInstant, exitTime: exitInstant });
    id = existing.id;
  } else {
    const created = await db.orm.public.TimeLog.create({
      workerId: Number(workerId),
      workDate: date,
      entryTime: entryInstant,
      exitTime: exitInstant,
    });
    id = created.id;
  }

  return NextResponse.json({ ok: true, id });
}

export async function DELETE(req: NextRequest) {
  let session;
  try {
    session = await requireAdmin();
  } catch (response) {
    return response as NextResponse;
  }

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const log = await db.orm.public.TimeLog.where({ id }).first();
  if (!log) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.orm.public.TimeLog.where({ id }).delete();
  return NextResponse.json({ ok: true });
}