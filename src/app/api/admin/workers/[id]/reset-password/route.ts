import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const worker = await db.orm.public.Worker
    .where({ id: Number(id) })
    .first();

  if (!worker) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const passwordHash = await bcrypt.hash(worker.phone, 10);
  await db.orm.public.Worker
    .where({ id: worker.id })
    .update({ passwordHash });

  return NextResponse.json({ ok: true });
}