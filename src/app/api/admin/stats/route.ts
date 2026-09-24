import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getMonthRows } from '@/lib/report';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const jy = Number(searchParams.get('jy'));
  const jm = Number(searchParams.get('jm'));

  if (!jy || !jm) {
    return NextResponse.json({ error: 'Missing jy or jm parameters' }, { status: 400 });
  }

  return NextResponse.json(await getMonthRows(jy, jm));
}
