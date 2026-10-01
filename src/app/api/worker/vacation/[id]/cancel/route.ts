import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { requireWorker } from '@/lib/api-auth';

export const runtime = 'nodejs';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let session;
  try {
    session = await requireWorker();
  } catch (response) {
    return response as NextResponse;
  }
  const { id } = await params;
  const reqId = Number(id);
  const workerId = Number(session.user.id);

  const r = await db.orm.public.VacationRequest.where({ id: reqId, workerId }).first();
  if (!r) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (r.status !== 'PENDING') {
    return NextResponse.json({ error: 'فقط درخواست‌های در انتظار قابل لغو هستند' }, { status: 400 });
  }

  await db.orm.public.VacationRequest.where({ id: reqId }).update({ status: 'CANCELLED' });
  return NextResponse.json({ ok: true });
}