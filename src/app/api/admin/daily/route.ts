import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { getDailyReport } from '@/lib/report';
import { tehranDateString } from '@/lib/jalali';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  let session;
  try {
    session = await requireAdmin();
  } catch (response) {
    return response as NextResponse;
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || tehranDateString();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date, expected YYYY-MM-DD' }, { status: 400 });
  }

  return NextResponse.json(await getDailyReport(date));
}
