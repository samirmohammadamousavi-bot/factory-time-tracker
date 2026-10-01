import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';
import { getVacationStats } from '@/lib/vacation';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest) {
  let session;
  try {
    session = await requireAdmin();
  } catch (response) {
    return response as NextResponse;
  }

  const body = await req.json();
  const { workerId, jalaliYear, adjustment, manualCarryIn } = body;

  if (!workerId || !jalaliYear) {
    return NextResponse.json({ error: 'Missing workerId or jalaliYear' }, { status: 400 });
  }

  // Ensure row exists
  await getVacationStats(Number(workerId), Number(jalaliYear), true);

  const updates: Record<string, unknown> = {};
  if (typeof adjustment === 'number' && Number.isFinite(adjustment)) {
    updates.adjustment = Math.trunc(adjustment);
  }
  if (manualCarryIn === null) {
    updates.manualCarryIn = null;
  } else if (typeof manualCarryIn === 'number' && Number.isFinite(manualCarryIn)) {
    updates.manualCarryIn = Math.max(0, Math.min(9, Math.trunc(manualCarryIn)));
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const row = await db.orm.public.VacationBalance
    .where({ workerId: Number(workerId), jalaliYear: Number(jalaliYear) })
    .first();
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.orm.public.VacationBalance.where({ id: row.id }).update(updates);

  const stats = await getVacationStats(Number(workerId), Number(jalaliYear), false);
  return NextResponse.json({ ok: true, stats });
}