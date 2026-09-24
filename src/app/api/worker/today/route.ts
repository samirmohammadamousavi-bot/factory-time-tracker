import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { tehranDateString, dateOnlyUtc } from '@/lib/jalali';

export const runtime = 'nodejs';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(null);

  const today = dateOnlyUtc(tehranDateString());
  const log = await db.orm.public.TimeLog
    .where({ workerId: Number(session.user.id), workDate: today.toISOString().slice(0, 10) })
    .first();

  return NextResponse.json(log);
}