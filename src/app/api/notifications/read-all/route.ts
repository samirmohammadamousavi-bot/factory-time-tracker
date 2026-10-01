import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { markAllRead } from '@/lib/notifications';

export const runtime = 'nodejs';

export async function POST() {
  let session;
  try {
    session = await requireAuth();
  } catch (response) {
    return response as NextResponse;
  }
  await markAllRead(Number(session.user.id));
  return NextResponse.json({ ok: true });
}