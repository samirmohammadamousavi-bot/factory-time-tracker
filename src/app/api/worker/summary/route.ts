import { NextResponse } from 'next/server';
import { requireWorker } from '@/lib/api-auth';
import { getWorkerSummary } from '@/lib/report';

export const runtime = 'nodejs';

export async function GET() {
  let session;
  try {
    session = await requireWorker();
  } catch (response) {
    return response as NextResponse;
  }

  return NextResponse.json(await getWorkerSummary(Number(session.user.id)));
}
