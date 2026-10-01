import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { requireWorker } from '@/lib/api-auth';

export const runtime = 'nodejs';

export async function GET() {
  let session;
  try {
    session = await requireWorker();
  } catch (response) {
    return response as NextResponse;
  }

  const worker = await db.orm.public.Worker
    .where({ id: Number(session.user.id) })
    .first();

  if (!worker) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: worker.id,
    firstName: worker.firstName,
    lastName: worker.lastName,
    nationalId: worker.nationalId,
    role: worker.role,
    gender: worker.gender,
    department: worker.department,
  });
}