import '@/lib/temporal-setup';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';
import { createNotification } from '@/lib/notifications';

export const runtime = 'nodejs';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let session;
  try {
    session = await requireAdmin();
  } catch (response) {
    return response as NextResponse;
  }

  const { id } = await params;
  const reqId = Number(id);

  const body = await req.json();
  const { status, adminNote } = body;

  if (status !== 'APPROVED' && status !== 'REJECTED') {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const r = await db.orm.public.VacationRequest.where({ id: reqId }).first();
  if (!r) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (r.status !== 'PENDING') {
    return NextResponse.json(
      { error: 'این درخواست قبلاً بررسی شده است' },
      { status: 400 },
    );
  }

  await db.orm.public.VacationRequest.where({ id: reqId }).update({
    status,
    adminNote: typeof adminNote === 'string' ? adminNote.slice(0, 500) : null,
    reviewedAt: Temporal.Now.instant(),
  });

  const approved = status === 'APPROVED';
  await createNotification(
    r.workerId,
    approved ? 'VACATION_APPROVED' : 'VACATION_REJECTED',
    approved ? 'درخواست مرخصی تایید شد' : 'درخواست مرخصی رد شد',
    approved
      ? `${r.days} روز — از ${r.startDate} تا ${r.endDate}`
      : adminNote
        ? `دلیل: ${adminNote}`
        : 'با درخواست شما موافقت نشد',
    '/worker/vacation',
  );

  return NextResponse.json({ ok: true });
}