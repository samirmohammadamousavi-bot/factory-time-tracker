import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getWorkerSummary } from '@/lib/report';

export const runtime = 'nodejs';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(await getWorkerSummary(Number(session.user.id)));
}
