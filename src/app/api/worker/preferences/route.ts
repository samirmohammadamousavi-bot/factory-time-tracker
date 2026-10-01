import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { requireWorker } from '@/lib/api-auth';

export const runtime = 'nodejs';

const THEMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'] as const;

export async function PATCH(req: NextRequest) {
  let session;
  try {
    session = await requireWorker();
  } catch (response) {
    return response as NextResponse;
  }

  const { theme } = await req.json();

  if (!theme || !(THEMES as readonly string[]).includes(theme)) {
    return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
  }

  await db.orm.public.Worker
    .where({ id: Number(session.user.id) })
    .update({ theme });

  return NextResponse.json({ ok: true, message: 'ظاهر ذخیره شد' });
}