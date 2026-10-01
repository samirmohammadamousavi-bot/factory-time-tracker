import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/prisma';
import { requireWorker } from '@/lib/api-auth';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest) {
  let session;
  try {
    session = await requireWorker();
  } catch (response) {
    return response as NextResponse;
  }

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: 'رمز فعلی و رمز جدید الزامی است' },
      { status: 400 }
    );
  }

  if (newPassword.length < 4) {
    return NextResponse.json(
      { error: 'رمز جدید باید حداقل ۴ کاراکتر باشد' },
      { status: 400 }
    );
  }

  const worker = await db.orm.public.Worker
    .where({ id: Number(session.user.id) })
    .first();

  if (!worker) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, worker.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'رمز فعلی اشتباه است' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.orm.public.Worker
    .where({ id: worker.id })
    .update({ passwordHash });

  return NextResponse.json({ ok: true, message: 'رمز عبور با موفقیت تغییر کرد' });
}
