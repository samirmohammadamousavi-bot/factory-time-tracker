import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { requireWorker } from '@/lib/api-auth';
import {
  getCurrentVacationStats,
  getVacationStats,
  countVacationDays,
} from '@/lib/vacation';
import { notifyAdmins } from '@/lib/notifications';
import { tehranDateString } from '@/lib/jalali';

export const runtime = 'nodejs';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET() {
  let session;
  try {
    session = await requireWorker();
  } catch (response) {
    return response as NextResponse;
  }
  const workerId = Number(session.user.id);
  const stats = await getCurrentVacationStats(workerId);

  // Include previous year for context
  const prevStats = await getVacationStats(workerId, stats.jalaliYear - 1, false);

  const requests = await db.orm.public.VacationRequest.where({ workerId }).all();
  const sorted = requests.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return NextResponse.json({
    stats,
    prev: { year: prevStats.jalaliYear, remaining: prevStats.remaining },
    requests: sorted.slice(0, 30),
  });
}

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireWorker();
  } catch (response) {
    return response as NextResponse;
  }
  const workerId = Number(session.user.id);
  const { startDate, endDate, reason } = await req.json();

  if (typeof startDate !== 'string' || !DATE_RE.test(startDate)) {
    return NextResponse.json({ error: 'تاریخ شروع نامعتبر است' }, { status: 400 });
  }
  if (typeof endDate !== 'string' || !DATE_RE.test(endDate)) {
    return NextResponse.json({ error: 'تاریخ پایان نامعتبر است' }, { status: 400 });
  }
  if (endDate < startDate) {
    return NextResponse.json({ error: 'تاریخ پایان باید بعد از شروع باشد' }, { status: 400 });
  }

  const today = tehranDateString();
  if (startDate < today) {
    return NextResponse.json({ error: 'نمی‌توانید برای گذشته درخواست ثبت کنید' }, { status: 400 });
  }

  const days = countVacationDays(startDate, endDate);
  if (days <= 0) {
    return NextResponse.json({ error: 'بازه انتخابی شامل روز کاری نیست' }, { status: 400 });
  }

  // Check remaining balance
  const stats = await getCurrentVacationStats(workerId);
  if (days > stats.remaining) {
    return NextResponse.json(
      { error: `روزهای باقی‌مانده کافی نیست (موجودی: ${stats.remaining} روز)` },
      { status: 400 },
    );
  }

  // Check overlap with existing pending/approved requests
  const existing = await db.orm.public.VacationRequest.where({ workerId }).all();
  for (const r of existing) {
    if (r.status === 'REJECTED' || r.status === 'CANCELLED') continue;
    const rs = r.startDate.slice(0, 10);
    const re = r.endDate.slice(0, 10);
    if (startDate <= re && endDate >= rs) {
      return NextResponse.json(
        { error: 'این بازه با یک درخواست دیگر هم‌پوشانی دارد' },
        { status: 400 },
      );
    }
  }

  const created = await db.orm.public.VacationRequest.create({
    workerId,
    startDate,
    endDate,
    days,
    reason: typeof reason === 'string' ? reason.slice(0, 500) : null,
    status: 'PENDING',
  });

  // Notify admins
  const worker = await db.orm.public.Worker.where({ id: workerId }).first();
  const name = worker ? `${worker.firstName} ${worker.lastName}` : `#${workerId}`;
  await notifyAdmins(
    'VACATION_REQUEST',
    `درخواست مرخصی جدید از ${name}`,
    `${days} روز — از ${startDate} تا ${endDate}`,
    '/admin/vacation',
  );

  return NextResponse.json({ ok: true, id: created.id, days }, { status: 201 });
}