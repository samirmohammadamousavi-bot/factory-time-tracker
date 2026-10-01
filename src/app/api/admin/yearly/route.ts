import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { getYearMatrix } from '@/lib/report';
import { toJalaliParts } from '@/lib/jalali';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  let session;
  try {
    session = await requireAdmin();
  } catch (response) {
    return response as NextResponse;
  }

  const { searchParams } = new URL(req.url);
  const jy = Number(searchParams.get('jy')) || toJalaliParts(new Date()).jy;

  return NextResponse.json({ jy, ...(await getYearMatrix(jy)) });
}
