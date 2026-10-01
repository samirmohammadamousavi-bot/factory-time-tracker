import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';
import { getVacationStats } from '@/lib/vacation';
import { toJalaliParts } from '@/lib/jalali';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  let session;
  try {
    session = await requireAdmin();
  } catch (response) {
    return response as NextResponse;
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status'); // PENDING | APPROVED | REJECTED | CANCELLED | all
  const jy = Number(searchParams.get('jy')) || toJalaliParts(new Date()).jy;

  // Requests
  let requests = await db.orm.public.VacationRequest.all();
  if (status && status !== 'all') {
    requests = requests.filter((r) => r.status === status);
  }
  requests.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  // Attach worker names
  const workers = await db.orm.public.Worker.all();
  const byId = new Map(workers.map((w) => [w.id, w]));
  const enriched = requests.map((r) => {
    const w = byId.get(r.workerId);
    return {
      ...r,
      workerName: w ? `${w.firstName} ${w.lastName}` : `#${r.workerId}`,
      workerNationalId: w?.nationalId ?? null,
    };
  });

  // Balances for all active workers in the selected year
  const activeWorkers = workers.filter((w) => w.isActive);
  const balances = await Promise.all(
    activeWorkers.map(async (w) => {
      const stats = await getVacationStats(w.id, jy, false);
      return {
        workerId: w.id,
        workerName: `${w.firstName} ${w.lastName}`,
        nationalId: w.nationalId,
        department: w.department,
        ...stats,
      };
    }),
  );
  balances.sort((a, b) => a.workerName.localeCompare(b.workerName, 'fa'));

  return NextResponse.json({ jy, requests: enriched, balances });
}