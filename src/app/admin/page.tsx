'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Legend,
} from 'recharts';
import {
  toJalali, toJalaliParts, jalaliMonthLength, tehranDateString,
  jalaliToGregorianStr, gregorianStrToJalaliParts, shiftDateStr,
} from '@/lib/jalali';

const MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

const YEARS = [1402, 1403, 1404, 1405, 1406];

interface MonthRow {
  workerId: number;
  workerName: string;
  date: string;
  entryTime: string | null;
  exitTime: string | null;
  hours: number;
}

interface DailyData {
  date: string;
  rows: Array<MonthRow & { status: string }>;
  absent: Array<{ workerId: number; workerName: string }>;
  totalHours: number;
}

interface YearData {
  jy: number;
  workers: Array<{ workerId: number; workerName: string; months: number[]; total: number }>;
}

function fmt(n: number): string {
  return n.toFixed(1);
}

function timeShort(iso: string | null): string {
  if (!iso) return '—';
  return toJalali(new Date(iso), { timeStyle: 'short' });
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<'day' | 'month' | 'year'>('day');

  return (
    <div dir="rtl" className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">داشبورد مدیریت</h1>
        <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm">
          {([
            ['day', 'روزانه'],
            ['month', 'ماهانه'],
            ['year', 'سالانه'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'day' && <DayView />}
      {tab === 'month' && <MonthView />}
      {tab === 'year' && <YearView />}
    </div>
  );
}

/* ------------------------------- DAY VIEW ------------------------------- */

function DayView() {
  const now = toJalaliParts(new Date());
  const [jy, setJy] = useState(now.jy);
  const [jm, setJm] = useState(now.jm);
  const [jd, setJd] = useState(now.jd);
  const [data, setData] = useState<DailyData | null>(null);

  const dateStr = jalaliToGregorianStr(jy, jm, jd);
  const isToday = dateStr === tehranDateString();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/daily?date=${dateStr}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { cancelled = true; };
  }, [dateStr]);

  const shiftDay = (n: number) => {
    const p = gregorianStrToJalaliParts(shiftDateStr(dateStr, n));
    setJy(p.jy); setJm(p.jm); setJd(p.jd);
  };

  const goToday = () => {
    const p = toJalaliParts(new Date());
    setJy(p.jy); setJm(p.jm); setJd(p.jd);
  };

  const daysInMonth = jalaliMonthLength(jy, jm);
  useEffect(() => {
    if (jd > daysInMonth) setJd(daysInMonth);
  }, [jy, jm]); // eslint-disable-line react-hooks/exhaustive-deps

  const present = data?.rows.length ?? 0;
  const absentCount = data?.absent.length ?? 0;

  return (
    <div className="space-y-5">
      {/* Day navigator */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => shiftDay(1)} className="px-3 py-2 rounded-lg border hover:bg-gray-50" title="روز قبل">→</button>
          <button
            onClick={goToday}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${isToday ? 'bg-green-100 text-green-800' : 'border hover:bg-gray-50'}`}
          >
            امروز
          </button>
          <button onClick={() => shiftDay(-1)} className="px-3 py-2 rounded-lg border hover:bg-gray-50" title="روز بعد">←</button>
        </div>
        <div className="flex items-center gap-2">
          <select value={jd} onChange={(e) => setJd(Number(e.target.value))} className="border rounded-lg px-3 py-2 outline-none">
            {Array.from({ length: daysInMonth }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
          <select value={jm} onChange={(e) => setJm(Number(e.target.value))} className="border rounded-lg px-3 py-2 outline-none">
            {MONTH_NAMES.map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
          </select>
          <select value={jy} onChange={(e) => setJy(Number(e.target.value))} className="border rounded-lg px-3 py-2 outline-none">
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <span className="mr-auto text-gray-700 font-medium">
          {toJalali(new Date(`${dateStr}T12:00:00Z`), { dateStyle: 'full' })}
        </span>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl shadow-sm text-center">
          <p className="text-xs text-gray-500">حاضرین</p>
          <p className="text-2xl font-bold text-green-700">{present}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm text-center">
          <p className="text-xs text-gray-500">غایبین</p>
          <p className="text-2xl font-bold text-red-600">{absentCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm text-center">
          <p className="text-xs text-gray-500">مجموع ساعت</p>
          <p className="text-2xl font-bold text-blue-800">{fmt(data?.totalHours ?? 0)}</p>
        </div>
      </div>

      {/* Present table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-800 p-5 pb-3">حضور روز</h2>
        {!data ? (
          <p className="text-center text-gray-400 pb-6">در حال بارگذاری...</p>
        ) : data.rows.length === 0 ? (
          <p className="text-center text-gray-400 pb-6">برای این روز هیچ حضوری ثبت نشده</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">کارگر</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">ورود</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">خروج</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">کارکرد (ساعت)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.rows.map((r) => (
                  <tr key={r.workerId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{r.workerName}</td>
                    <td className="px-4 py-3 text-gray-700">{timeShort(r.entryTime)}</td>
                    <td className="px-4 py-3 text-gray-700">{timeShort(r.exitTime)}</td>
                    <td className="px-4 py-3 font-medium">{fmt(r.hours)}</td>
                    <td className="px-4 py-3">
                      {r.status === 'complete'
                        ? <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">تکمیل شده</span>
                        : <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">در حال کار</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Absent */}
      {data && data.absent.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">غایبین ({data.absent.length})</h2>
          <div className="flex flex-wrap gap-2">
            {data.absent.map((a) => (
              <span key={a.workerId} className="px-3 py-1 rounded-full text-sm bg-red-50 text-red-700 border border-red-100">
                {a.workerName}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ MONTH VIEW ------------------------------ */

function MonthView() {
  const now = toJalaliParts(new Date());
  const [jy, setJy] = useState(now.jy);
  const [jm, setJm] = useState(now.jm);
  const [rows, setRows] = useState<MonthRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/stats?jy=${jy}&jm=${jm}`);
        const json = await res.json();
        if (!cancelled) setRows(json);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { cancelled = true; };
  }, [jy, jm]);

  const byWorker = new Map<string, { name: string; hours: number; days: number }>();
  for (const r of rows) {
    if (!byWorker.has(r.workerName)) byWorker.set(r.workerName, { name: r.workerName, hours: 0, days: 0 });
    const w = byWorker.get(r.workerName)!;
    w.hours += r.hours;
    w.days += 1;
  }
  const chartData = Array.from(byWorker.values()).sort((a, b) => b.hours - a.hours);

  const exportCsv = () => {
    const header = 'workerId,workerName,date,entryTime,exitTime,hours\n';
    const lines = rows.map((r) =>
      [r.workerId, `"${r.workerName}"`, r.date, r.entryTime ?? '', r.exitTime ?? '', Number(r.hours).toFixed(2)].join(',')
    );
    const blob = new Blob([header + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${jy}-${jm}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-3">
        <select value={jy} onChange={(e) => setJy(Number(e.target.value))} className="border rounded-lg px-4 py-2 outline-none">
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={jm} onChange={(e) => setJm(Number(e.target.value))} className="border rounded-lg px-4 py-2 outline-none">
          {MONTH_NAMES.map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
        </select>
        <span className="font-semibold text-gray-800">{MONTH_NAMES[jm - 1]} {jy}</span>
        <button onClick={exportCsv} className="mr-auto border rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
          خروجی CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">مجموع ساعات هر کارگر</h2>
        {chartData.length === 0 ? (
          <p className="text-center text-gray-400 py-8">هیچ داده‌ای برای این ماه موجود نیست</p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value) => [typeof value === 'number' ? value.toFixed(1) : '0', 'ساعت'] as [string, string]}
              />
              <Legend />
              <Bar dataKey="hours" fill="#3b82f6" name="ساعت کار" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-800 p-5 pb-3">کارکرد ماهانه کارگران</h2>
        {chartData.length === 0 ? (
          <p className="text-center text-gray-400 pb-6">داده‌ای نیست</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">کارگر</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">روزهای حضور</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">مجموع ساعت</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">میانگین روزانه</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {chartData.map((w) => (
                  <tr key={w.name} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{w.name}</td>
                    <td className="px-4 py-3">{w.days}</td>
                    <td className="px-4 py-3 font-medium">{fmt(w.hours)}</td>
                    <td className="px-4 py-3 text-gray-600">{w.days ? fmt(w.hours / w.days) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- YEAR VIEW ------------------------------ */

function YearView() {
  const [jy, setJy] = useState(toJalaliParts(new Date()).jy);
  const [data, setData] = useState<YearData | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/yearly?jy=${jy}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { cancelled = true; };
  }, [jy]);

  const monthTotals = MONTH_NAMES.map((name, i) => ({
    name,
    hours: data?.workers.reduce((s, w) => s + w.months[i], 0) ?? 0,
  }));

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-3">
        <select value={jy} onChange={(e) => setJy(Number(e.target.value))} className="border rounded-lg px-4 py-2 outline-none">
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <span className="font-semibold text-gray-800">سال {jy}</span>
        <span className="mr-auto text-sm text-gray-500">
          مجموع سال: {fmt(data?.workers.reduce((s, w) => s + w.total, 0) ?? 0)} ساعت
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">ساعت کار هر ماه (همه کارگران)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthTotals} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
            <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              formatter={(value) => [typeof value === 'number' ? value.toFixed(1) : '0', 'ساعت'] as [string, string]}
            />
            <Bar dataKey="hours" fill="#10b981" name="ساعت کار" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-800 p-5 pb-3">کارکرد سالانه کارگران</h2>
        {!data ? (
          <p className="text-center text-gray-400 pb-6">در حال بارگذاری...</p>
        ) : data.workers.length === 0 ? (
          <p className="text-center text-gray-400 pb-6">برای این سال داده‌ای نیست</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 sticky right-0 bg-gray-50">کارگر</th>
                  {MONTH_NAMES.map((n) => (
                    <th key={n} className="px-3 py-3 text-center text-xs font-semibold text-gray-600">{n}</th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">جمع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.workers.map((w) => (
                  <tr key={w.workerId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap sticky right-0 bg-white">{w.workerName}</td>
                    {w.months.map((h, i) => (
                      <td key={i} className="px-3 py-3 text-center text-gray-600">{h > 0 ? fmt(h) : '—'}</td>
                    ))}
                    <td className="px-4 py-3 text-center font-bold text-blue-800">{fmt(w.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
