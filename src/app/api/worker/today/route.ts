import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { requireWorker } from '@/lib/api-auth';
import { tehranDateString } from '@/lib/jalali';

export const runtime = 'nodejs';

export async function GET() {
  let session;
  try {
    session = await requireWorker();
  } catch (response) {
    return response as NextResponse;
  }

  const workDateStr = tehranDateString();
  const log = await db.orm.public.TimeLog
    .where({ workerId: Number(session.user.id), workDate: workDateStr })
    .first();

  return NextResponse.json(log);
}