import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { markRead } from '@/lib/notifications';

export const runtime = 'nodejs';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let session;
  try {
    session = await requireAuth();
  } catch (response) {
    return response as NextResponse;
  }
  const { id } = await params;
  await markRead(Number(session.user.id), Number(id));
  return NextResponse.json({ ok: true });
}