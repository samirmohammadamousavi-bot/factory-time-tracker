'use client';

import { useEffect, useState } from 'react';
import { toJalali } from '@/lib/jalali';

interface DayRow {
  workerId: number;
  workerName: string;
  date: string;
  entryTime: string | null;
  exitTime: string | null;
  hours: number;
  status: 'complete' | 'open' | 'absent';
}

interface Summary {
  today: DayRow | null;
  todayStr: string;
  weekHours: number;
  weekDays: number;
  monthHours: number;
  monthDays: number;
  monthLabel: string;
  recent: DayRow[];
}

function fmtHours(h: number): string {
  const hours = Math.floor(h);
  const minutes = Math.round((h - hours) * 60);
  if (hours === 0 && minutes === 0) return '۰';
  return `${hours} س ${minutes} د`;
}

function statusBadge(status: DayRow['status']) {
  if (status === 'complete')
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">تکمیل شده</span>;
  if (status === 'open')
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">در حال کار</span>;
  return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">—</span>;
}

export default function WorkerDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/worker/summary');
      setSummary(await res.json());
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/worker/summary');
        setSummary(await res.json());
      } catch (error) {
        console.error('Failed to load summary:', error);
      }
    })();
  }, []);

  const clock = async (action: 'clock-in' | 'clock-out') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/worker/time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'خطا در ثبت');
        return;
      }
      alert(data.message);
      await load();
    } catch (error) {
      console.error('Failed to clock:', error);
      alert('خطا در اتصال به سرور');
    } finally {
      setActionLoading(false);
    }
  };

  const today = summary?.today ?? null;
  const todayHours = today?.hours ?? 0;

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-4 pb-12">
      <div className="w-full max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-6 text-white text-center">
          <h1 className="text-2xl font-bold">ثبت ورود و خروج</h1>
          <p className="text-blue-100 mt-1">
            {toJalali(new Date(), { dateStyle: 'full' })}
          </p>
          <p className="mt-2 inline-block px-3 py-1 rounded-full text-sm font-medium bg-white/20">
            {today
              ? today.exitTime
                ? '✓ ورود و خروج امروز ثبت شده'
                : '● ورود ثبت شده — یادت نره خروج بزنی'
              : '○ امروز هنوز ورود ثبت نشده'}
          </p>
        </div>

        {/* Clock card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-5">
          <div className={`rounded-xl p-5 ${
            today
              ? (today.exitTime ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200')
              : 'bg-gray-50 border border-gray-200'
          }`}>
            {today ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">وضعیت امروز</span>
                  {statusBadge(today.status)}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white p-4 rounded-lg text-center">
                    <p className="text-xs text-gray-500">ورود</p>
                    <p className="text-xl font-bold text-gray-800">
                      {today.entryTime ? toJalali(new Date(today.entryTime), { timeStyle: 'short' }) : '—'}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg text-center">
                    <p className="text-xs text-gray-500">خروج</p>
                    <p className="text-xl font-bold text-gray-800">
                      {today.exitTime ? toJalali(new Date(today.exitTime), { timeStyle: 'short' }) : '—'}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg text-center">
                    <p className="text-xs text-gray-500">کارکرد امروز</p>
                    <p className="text-xl font-bold text-gray-800">{fmtHours(todayHours)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-500">امروز هنوز ثبت نشده</p>
                <p className="text-xs text-gray-400 mt-1">برای شروع روز کاری، دکمه ورود را بزنید</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => clock('clock-in')}
              disabled={actionLoading || !!today}
              className="flex-1 bg-green-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'در حال ثبت...' : 'ثبت ورود ✓'}
            </button>
            <button
              onClick={() => clock('clock-out')}
              disabled={actionLoading || !today || !!today.exitTime}
              className="flex-1 bg-red-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'در حال ثبت...' : 'ثبت خروج ✕'}
            </button>
          </div>
        </div>

        {/* Period stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <p className="text-xs text-gray-500">امروز</p>
            <p className="text-xl font-bold text-blue-800">{fmtHours(todayHours)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <p className="text-xs text-gray-500">۷ روز اخیر</p>
            <p className="text-xl font-bold text-blue-800">{fmtHours(summary?.weekHours ?? 0)}</p>
            <p className="text-xs text-gray-400">{summary?.weekDays ?? 0} روز حضور</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <p className="text-xs text-gray-500">{summary?.monthLabel ?? 'این ماه'}</p>
            <p className="text-xl font-bold text-blue-800">{fmtHours(summary?.monthHours ?? 0)}</p>
            <p className="text-xs text-gray-400">{summary?.monthDays ?? 0} روز حضور</p>
          </div>
        </div>

        {/* Recent history */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-800 p-5 pb-3">سوابق اخیر</h2>
          {!summary ? (
            <p className="text-center text-gray-400 pb-6">در حال بارگذاری...</p>
          ) : summary.recent.length === 0 ? (
            <p className="text-center text-gray-400 pb-6">هنوز سابقه‌ای ثبت نشده</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">تاریخ</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">ورود</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">خروج</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">کارکرد</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summary.recent.map((r) => (
                    <tr key={r.date} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-800">
                        {toJalali(new Date(`${r.date}T12:00:00Z`), { day: 'numeric', month: 'long', weekday: 'long' })}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {r.entryTime ? toJalali(new Date(r.entryTime), { timeStyle: 'short' }) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {r.exitTime ? toJalali(new Date(r.exitTime), { timeStyle: 'short' }) : '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{fmtHours(r.hours)}</td>
                      <td className="px-4 py-3">{statusBadge(r.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-400">سیستم ثبت ساعت کار کارخانه</p>
      </div>
    </div>
  );
}
