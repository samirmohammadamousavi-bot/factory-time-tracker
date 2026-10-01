import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

export const runtime = 'nodejs';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let session;
  try {
    session = await requireAdmin();
  } catch (response) {
    return response as NextResponse;
  }

  const { id } = await params;
  const workerId = Number(id);
  if (!workerId) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const existing = await db.orm.public.Worker.where({ id: workerId }).first();
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const passwordHash = await bcrypt.hash(existing.phone, 10);
  await db.orm.public.Worker.where({ id: workerId }).update({ passwordHash });

  return NextResponse.json({
    ok: true,
    message: 'رمز عبور به شماره تلفن بازنشانی شد',
  });
}