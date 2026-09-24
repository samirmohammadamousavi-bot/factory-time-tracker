import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDailyReport } from '@/lib/report';
import { tehranDateString } from '@/lib/jalali';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || tehranDateString();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date, expected YYYY-MM-DD' }, { status: 400 });
  }

  return NextResponse.json(await getDailyReport(date));
}
