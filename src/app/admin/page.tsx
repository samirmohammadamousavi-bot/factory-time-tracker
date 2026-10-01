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

async function downloadExcel(url: string, filename: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      alert('خطا در تهیه فایل اکسل');
      return;
    }
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (error) {
    console.error('Failed to download Excel:', error);
    alert('خطا در دانلود فایل');
  }
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<'day' | 'month' | 'year'>('day');

  return (
    <div dir="rtl" className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#f5ede6] tracking-tight">داشبورد مدیریت</h1>
          <p className="text-sm text-[#f5ede6]/40 mt-1">نمای کلی عملکرد کارگران</p>
        </div>
        <div className="flex gap-1 bg-[#f5ede6]/5 p-1 rounded-2xl border border-[#f5ede6]/10 backdrop-blur">
          {([
            ['day', 'روزانه'],
            ['month', 'ماهانه'],
            ['year', 'سالانه'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                tab === key
                  ? 'bg-[#29a9a0] text-white shadow-lg shadow-[#29a9a0]/30'
                  : 'text-[#f5ede6]/60 hover:text-[#f5ede6] hover:bg-[#f5ede6]/5'
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

  const daysInMonth = jalaliMonthLength(jy, jm);
  const safeJd = Math.min(jd, daysInMonth);
  const dateStr = jalaliToGregorianStr(jy, jm, safeJd);
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
    const base = jalaliToGregorianStr(jy, jm, safeJd);
    const p = gregorianStrToJalaliParts(shiftDateStr(base, n));
    setJy(p.jy); setJm(p.jm); setJd(p.jd);
  };

  const goToday = () => {
    const p = toJalaliParts(new Date());
    setJy(p.jy); setJm(p.jm); setJd(p.jd);
  };

  const present = data?.rows.length ?? 0;
  const absentCount = data?.absent.length ?? 0;

  return (
    <div className="space-y-5">
      {/* Day navigator */}
      <div className="luxury-card rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="group">
            <button
              onClick={() => shiftDay(1)}
              className="group-hover:animate-bounce-slow text-[#2d1a1f] px-3.5 py-2 border border-[#d9c8b8] rounded-xl bg-[#f5ede6] cursor-pointer group-hover:bg-[#29a9a0] group-hover:text-white group-hover:border-[#29a9a0] transition-all font-bold"
              title="روز قبل"
            >
              →
            </button>
          </div>
          <div className="group">
            <button
              onClick={goToday}
              className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer group-hover:animate-bounce-slow transition-all ${
                isToday
                  ? 'bg-olive text-white shadow-md shadow-olive/30'
                  : 'border border-[#d9c8b8] text-[#2d1a1f] hover:bg-[#e8dcd0]'
              }`}
            >
              امروز
            </button>
          </div>
          <div className="group">
            <button
              onClick={() => shiftDay(-1)}
              className="group-hover:animate-bounce-slow text-[#2d1a1f] px-3.5 py-2 border border-[#d9c8b8] rounded-xl bg-[#f5ede6] cursor-pointer group-hover:bg-[#29a9a0] group-hover:text-white group-hover:border-[#29a9a0] transition-all font-bold"
              title="روز بعد"
            >
              ←
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={safeJd}
            onChange={(e) => setJd(Number(e.target.value))}
            className="bg-white/70 border border-[#d9c8b8] text-[#2d1a1f] rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#29a9a0] focus:border-[#29a9a0] transition-all"
          >
            {Array.from({ length: daysInMonth }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
          <select
            value={jm}
            onChange={(e) => setJm(Number(e.target.value))}
            className="bg-white/70 border border-[#d9c8b8] text-[#2d1a1f] rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#29a9a0] focus:border-[#29a9a0] transition-all"
          >
            {MONTH_NAMES.map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
          </select>
          <select
            value={jy}
            onChange={(e) => setJy(Number(e.target.value))}
            className="bg-white/70 border border-[#d9c8b8] text-[#2d1a1f] rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#29a9a0] focus:border-[#29a9a0] transition-all"
          >
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <span className="mr-auto text-[#2d1a1f] font-semibold tracking-tight">
          {toJalali(new Date(`${dateStr}T12:00:00Z`), { dateStyle: 'full' })}
        </span>

        <button
          onClick={() => downloadExcel(`/api/admin/export?type=daily&date=${dateStr}`, `gozaresh-daily-${dateStr}.xlsx`)}
          className="border border-[#d9c8b8] rounded-xl px-4 py-2 text-sm font-semibold text-[#2d1a1f] hover:bg-[#e8dcd0] transition-colors"
        >
          خروجی اکسل
        </button>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-3 gap-3">
        <div className="luxury-card rounded-2xl p-5 text-center">
          <p className="text-xs font-semibold text-[#2d1a1f]/50 tracking-wide">حاضرین</p>
          <p className="text-3xl font-bold text-olive mt-1">{present}</p>
        </div>
        <div className="luxury-card rounded-2xl p-5 text-center">
          <p className="text-xs font-semibold text-[#2d1a1f]/50 tracking-wide">غایبین</p>
          <p className="text-3xl font-bold text-[#c0392b] mt-1">{absentCount}</p>
        </div>
        <div className="luxury-card rounded-2xl p-5 text-center">
          <p className="text-xs font-semibold text-[#2d1a1f]/50 tracking-wide">مجموع ساعت</p>
          <p className="text-3xl font-bold text-[#29a9a0] mt-1">{fmt(data?.totalHours ?? 0)}</p>
        </div>
      </div>

      {/* Present table */}
      <div className="luxury-card rounded-2xl overflow-hidden">
        <div className="px-6 pt-5 pb-3 border-b border-[#d9c8b8]/60">
          <h2 className="text-lg font-bold text-[#2d1a1f] tracking-tight">حضور روز</h2>
        </div>
        {!data ? (
          <p className="text-center text-[#2d1a1f]/40 py-8">در حال بارگذاری...</p>
        ) : data.rows.length === 0 ? (
          <p className="text-center text-[#2d1a1f]/40 py-8">برای این روز هیچ حضوری ثبت نشده</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#e8dcd0]/60">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-bold text-[#2d1a1f]/70 tracking-wide">کارگر</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-[#2d1a1f]/70 tracking-wide">ورود</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-[#2d1a1f]/70 tracking-wide">خروج</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-[#2d1a1f]/70 tracking-wide">کارکرد (ساعت)</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-[#2d1a1f]/70 tracking-wide">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d9c8b8]/40">
                {data.rows.map((r) => (
                  <tr key={r.workerId} className="hover:bg-[#e8dcd0]/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#2d1a1f]">{r.workerName}</td>
                    <td className="px-4 py-3 text-[#2d1a1f]/80">{timeShort(r.entryTime)}</td>
                    <td className="px-4 py-3 text-[#2d1a1f]/80">{timeShort(r.exitTime)}</td>
                    <td className="px-4 py-3 font-semibold text-[#29a9a0]">{fmt(r.hours)}</td>
                    <td className="px-4 py-3">
                      {r.status === 'complete'
                        ? <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-olive/15 text-olive">تکمیل شده</span>
                        : <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#29a9a0]/15 text-[#29a9a0]">در حال کار</span>}
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
        <div className="luxury-card rounded-2xl p-5">
          <h2 className="text-lg font-bold text-[#2d1a1f] mb-3 tracking-tight">غایبین ({data.absent.length})</h2>
          <div className="flex flex-wrap gap-2">
            {data.absent.map((a) => (
              <span
                key={a.workerId}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-[#c0392b]/10 text-[#c0392b] border border-[#c0392b]/20"
              >
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

  const exportExcel = () =>
    downloadExcel(
      `/api/admin/export?type=monthly&jy=${jy}&jm=${jm}`,
      `gozaresh-monthly-${jy}-${jm}.xlsx`
    );

  return (
    <div className="space-y-5">
      <div className="luxury-card rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <select
          value={jy}
          onChange={(e) => setJy(Number(e.target.value))}
          className="bg-white/70 border border-[#d9c8b8] text-[#2d1a1f] rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-[#29a9a0]"
        >
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          value={jm}
          onChange={(e) => setJm(Number(e.target.value))}
          className="bg-white/70 border border-[#d9c8b8] text-[#2d1a1f] rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-[#29a9a0]"
        >
          {MONTH_NAMES.map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
        </select>
        <span className="font-bold text-[#2d1a1f] tracking-tight">{MONTH_NAMES[jm - 1]} {jy}</span>
        <button
          onClick={exportExcel}
          className="mr-auto border border-[#d9c8b8] rounded-xl px-4 py-2 text-sm font-semibold text-[#2d1a1f] hover:bg-[#e8dcd0] transition-colors"
        >
          خروجی اکسل
        </button>
      </div>

      <div className="luxury-card rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4 text-[#2d1a1f] tracking-tight">مجموع ساعات هر کارگر</h2>
        {chartData.length === 0 ? (
          <p className="text-center text-[#2d1a1f]/40 py-8">هیچ داده‌ای برای این ماه موجود نیست</p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9c8b8" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#2d1a1f' }} tickLine={false} axisLine={{ stroke: '#d9c8b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#2d1a1f' }} tickLine={false} axisLine={{ stroke: '#d9c8b8' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#f5ede6',
                  border: '1px solid #d9c8b8',
                  borderRadius: '12px',
                  color: '#2d1a1f',
                  boxShadow: '0 20px 45px -25px rgba(0,0,0,0.5)',
                }}
                formatter={(value) => [typeof value === 'number' ? value.toFixed(1) : '0', 'ساعت'] as [string, string]}
              />
              <Legend />
              <Bar dataKey="hours" fill="#29a9a0" name="ساعت کار" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="luxury-card rounded-2xl overflow-hidden">
        <div className="px-6 pt-5 pb-3 border-b border-[#d9c8b8]/60">
          <h2 className="text-lg font-bold text-[#2d1a1f] tracking-tight">کارکرد ماهانه کارگران</h2>
        </div>
        {chartData.length === 0 ? (
          <p className="text-center text-[#2d1a1f]/40 py-8">داده‌ای نیست</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#e8dcd0]/60">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-bold text-[#2d1a1f]/70">کارگر</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-[#2d1a1f]/70">روزهای حضور</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-[#2d1a1f]/70">مجموع ساعت</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-[#2d1a1f]/70">میانگین روزانه</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d9c8b8]/40">
                {chartData.map((w) => (
                  <tr key={w.name} className="hover:bg-[#e8dcd0]/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#2d1a1f]">{w.name}</td>
                    <td className="px-4 py-3 text-[#2d1a1f]/80">{w.days}</td>
                    <td className="px-4 py-3 font-semibold text-[#29a9a0]">{fmt(w.hours)}</td>
                    <td className="px-4 py-3 text-[#2d1a1f]/60">{w.days ? fmt(w.hours / w.days) : '—'}</td>
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
      <div className="luxury-card rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <select
          value={jy}
          onChange={(e) => setJy(Number(e.target.value))}
          className="bg-white/70 border border-[#d9c8b8] text-[#2d1a1f] rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-[#29a9a0]"
        >
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <span className="font-bold text-[#2d1a1f] tracking-tight">سال {jy}</span>
        <span className="mr-auto text-sm text-[#2d1a1f]/60">
          مجموع سال: <span className="font-bold text-[#29a9a0]">{fmt(data?.workers.reduce((s, w) => s + w.total, 0) ?? 0)}</span> ساعت
        </span>
        <button
          onClick={() => downloadExcel(`/api/admin/export?type=yearly&jy=${jy}`, `gozaresh-yearly-${jy}.xlsx`)}
          className="border border-[#d9c8b8] rounded-xl px-4 py-2 text-sm font-semibold text-[#2d1a1f] hover:bg-[#e8dcd0] transition-colors"
        >
          خروجی اکسل
        </button>
      </div>

      <div className="luxury-card rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4 text-[#2d1a1f] tracking-tight">ساعت کار هر ماه (همه کارگران)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthTotals} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d9c8b8" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#2d1a1f' }} tickLine={false} axisLine={{ stroke: '#d9c8b8' }} />
            <YAxis tick={{ fontSize: 12, fill: '#2d1a1f' }} tickLine={false} axisLine={{ stroke: '#d9c8b8' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#f5ede6',
                border: '1px solid #d9c8b8',
                borderRadius: '12px',
                color: '#2d1a1f',
              }}
              formatter={(value) => [typeof value === 'number' ? value.toFixed(1) : '0', 'ساعت'] as [string, string]}
            />
            <Bar dataKey="hours" fill="#5ca124" name="ساعت کار" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="luxury-card rounded-2xl overflow-hidden">
        <div className="px-6 pt-5 pb-3 border-b border-[#d9c8b8]/60">
          <h2 className="text-lg font-bold text-[#2d1a1f] tracking-tight">کارکرد سالانه کارگران</h2>
        </div>
        {!data ? (
          <p className="text-center text-[#2d1a1f]/40 py-8">در حال بارگذاری...</p>
        ) : data.workers.length === 0 ? (
          <p className="text-center text-[#2d1a1f]/40 py-8">برای این سال داده‌ای نیست</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#e8dcd0]/60">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-bold text-[#2d1a1f]/70 sticky right-0 bg-[#e8dcd0]/60">کارگر</th>
                  {MONTH_NAMES.map((n) => (
                    <th key={n} className="px-3 py-3 text-center text-xs font-bold text-[#2d1a1f]/70">{n}</th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-bold text-[#2d1a1f]/70">جمع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d9c8b8]/40">
                {data.workers.map((w) => (
                  <tr key={w.workerId} className="hover:bg-[#e8dcd0]/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#2d1a1f] whitespace-nowrap sticky right-0 bg-[#f5ede6]">{w.workerName}</td>
                    {w.months.map((h, i) => (
                      <td key={i} className="px-3 py-3 text-center text-[#2d1a1f]/70">{h > 0 ? fmt(h) : '—'}</td>
                    ))}
                    <td className="px-4 py-3 text-center font-bold text-[#29a9a0]">{fmt(w.total)}</td>
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