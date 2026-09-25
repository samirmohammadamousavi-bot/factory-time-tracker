import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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