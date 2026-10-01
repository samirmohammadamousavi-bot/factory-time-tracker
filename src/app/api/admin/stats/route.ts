import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { getMonthRows } from '@/lib/report';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  let session;
  try {
    session = await requireAdmin();
  } catch (response) {
    return response as NextResponse;
  }

  const { searchParams } = new URL(req.url);
  const jy = Number(searchParams.get('jy'));
  const jm = Number(searchParams.get('jm'));

  if (!jy || !jm) {
    return NextResponse.json({ error: 'Missing jy or jm parameters' }, { status: 400 });
  }

  return NextResponse.json(await getMonthRows(jy, jm));
}
