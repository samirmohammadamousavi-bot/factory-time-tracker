import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { auth } from '@/lib/auth';
import { getDailyReport, getMonthRows, getYearMatrix } from '@/lib/report';
import { tehranDateString, toJalali } from '@/lib/jalali';

export const runtime = 'nodejs';

const MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

function rtlWorkbook(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  wb.Workbook = { Views: [{ RTL: true }] };
  return wb;
}

function autosize(ws: XLSX.WorkSheet, widths: number[]) {
  ws['!cols'] = widths.map((wch) => ({ wch }));
}

function timeCell(iso: string | null): string {
  if (!iso) return '—';
  return toJalali(new Date(iso), { hour: '2-digit', minute: '2-digit' });
}

function dateCell(dateStr: string): string {
  return toJalali(new Date(`${dateStr}T12:00:00Z`), { dateStyle: 'medium' });
}

function statusCell(status: string): string {
  return status === 'complete' ? 'تکمیل شده' : 'در حال کار';
}

function toDownload(wb: XLSX.WorkBook, filename: string): NextResponse {
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'daily';

  if (type === 'daily') {
    const date = searchParams.get('date') || tehranDateString();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
    }
    const data = await getDailyReport(date);
    const wb = rtlWorkbook();

    const head = ['کارگر', 'تاریخ', 'ورود', 'خروج', 'کارکرد (ساعت)', 'وضعیت'];
    const body = data.rows.map((r) => [
      r.workerName,
      dateCell(r.date),
      timeCell(r.entryTime),
      timeCell(r.exitTime),
      Math.round(r.hours * 100) / 100,
      statusCell(r.status),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([head, ...body]);
    autosize(ws, [22, 16, 10, 10, 14, 12]);
    XLSX.utils.book_append_sheet(wb, ws, 'حضور');

    const wsAbsent = XLSX.utils.aoa_to_sheet([
      ['کارگر (غایب)'],
      ...data.absent.map((a) => [a.workerName]),
    ]);
    autosize(wsAbsent, [22]);
    XLSX.utils.book_append_sheet(wb, wsAbsent, 'غایبین');

    return toDownload(wb, `gozaresh-daily-${date}.xlsx`);
  }

  if (type === 'monthly') {
    const jy = Number(searchParams.get('jy'));
    const jm = Number(searchParams.get('jm'));
    if (!jy || !jm) {
      return NextResponse.json({ error: 'Missing jy or jm' }, { status: 400 });
    }
    const rows = await getMonthRows(jy, jm);
    const wb = rtlWorkbook();

    const head = ['کارگر', 'تاریخ', 'ورود', 'خروج', 'کارکرد (ساعت)', 'وضعیت'];
    const body = rows.map((r) => [
      r.workerName,
      dateCell(r.date),
      timeCell(r.entryTime),
      timeCell(r.exitTime),
      Math.round(r.hours * 100) / 100,
      statusCell(r.status),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([
      [`گزارش ${MONTH_NAMES[jm - 1]} ${jy}`],
      head,
      ...body,
    ]);
    autosize(ws, [22, 16, 10, 10, 14, 12]);
    XLSX.utils.book_append_sheet(wb, ws, `${MONTH_NAMES[jm - 1]} ${jy}`);

    return toDownload(wb, `gozaresh-monthly-${jy}-${jm}.xlsx`);
  }

  if (type === 'yearly') {
    const { toJalaliParts } = await import('@/lib/jalali');
    const jy = Number(searchParams.get('jy')) || toJalaliParts(new Date()).jy;
    const { workers } = await getYearMatrix(jy);
    const wb = rtlWorkbook();

    const head = ['کارگر', ...MONTH_NAMES, 'جمع سال'];
    const body = workers.map((w) => [
      w.workerName,
      ...w.months.map((h) => Math.round(h * 100) / 100),
      Math.round(w.total * 100) / 100,
    ]);
    const ws = XLSX.utils.aoa_to_sheet([[`گزارش سال ${jy}`], head, ...body]);
    autosize(ws, [22, ...MONTH_NAMES.map(() => 10), 12]);
    XLSX.utils.book_append_sheet(wb, ws, `سال ${jy}`);

    return toDownload(wb, `gozaresh-yearly-${jy}.xlsx`);
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
