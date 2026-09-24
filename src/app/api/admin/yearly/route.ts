import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getYearMatrix } from '@/lib/report';
import { toJalaliParts } from '@/lib/jalali';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const jy = Number(searchParams.get('jy')) || toJalaliParts(new Date()).jy;

  return NextResponse.json({ jy, ...(await getYearMatrix(jy)) });
}
