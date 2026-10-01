'use client';

import { useEffect, useState } from 'react';
import { toJalali, toJalaliParts, jalaliToGregorianStr, jalaliMonthLength } from '@/lib/jalali';

interface Worker { id: number; firstName: string; lastName: string; nationalId: string }

const MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

export default function AdminTimelogsPage() {
  const now = toJalaliParts(new Date());
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workerId, setWorkerId] = useState<number | ''>('');
  const [jy, setJy] = useState(now.jy);
  const [jm, setJm] = useState(now.jm);
  const [jd, setJd] = useState(now.jd);
  const [entry, setEntry] = useState('08:00');
  const [exit, setExit] = useState('17:00');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/workers');
      if (res.ok) setWorkers(await res.json());
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerId) return;
    setLoading(true);
    setMsg(null);
    try {
      const date = jalaliToGregorianStr(jy, jm, Math.min(jd, jalaliMonthLength(jy, jm)));
      const res = await fetch('/api/admin/timelog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId, date, entryTime: entry, exitTime: exit || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: 'err', text: data.error || 'خطا' });
        return;
      }
      setMsg({ type: 'ok', text: 'ثبت شد' });
    } finally {
      setLoading(false);
    }
  };

  const years = [now.jy - 1, now.jy, now.jy + 1];
  const inputCls = 'bg-white/70 border border-cream-darker text-plum rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-teal';

  return (
    <div dir="rtl" className="p-4 md:p-8 max-w-2xl mx-auto space-y-5 pt-6">
      <h1 className="text-3xl font-bold text-cream">ویرایش دستی ورود/خروج</h1>
      <p className="text-sm text-cream/40">
        با ثبت مجدد، سوابق آن روز جایگزین می‌شود. برای حذف کامل روز، خروج را خالی بگذارید و بعد حذف کنید.
      </p>

      <form onSubmit={submit} className="luxury-card rounded-3xl p-6 space-y-4">
        <label className="block">
          <span className="text-xs font-bold text-plum/60">کارگر</span>
          <select
            value={workerId}
            onChange={(e) => setWorkerId(e.target.value ? Number(e.target.value) : '')}
            className={`${inputCls} w-full mt-1`}
            required
          >
            <option value="">انتخاب کنید...</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>{w.firstName} {w.lastName} — {w.nationalId}</option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-3 gap-2">
          <select value={jy} onChange={(e) => setJy(Number(e.target.value))} className={inputCls}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={jm} onChange={(e) => setJm(Number(e.target.value))} className={inputCls}>
            {MONTH_NAMES.map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
          </select>
          <select value={jd} onChange={(e) => setJd(Number(e.target.value))} className={inputCls}>
            {Array.from({ length: jalaliMonthLength(jy, jm) }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-bold text-plum/60">ساعت ورود</span>
            <input
              type="time"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              className={`${inputCls} w-full mt-1`}
              required
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-plum/60">ساعت خروج (اختیاری)</span>
            <input
              type="time"
              value={exit}
              onChange={(e) => setExit(e.target.value)}
              className={`${inputCls} w-full mt-1`}
            />
          </label>
        </div>

        {msg && (
          <p className={`text-sm font-medium rounded-xl py-2 px-3 text-center border ${
            msg.type === 'ok'
              ? 'bg-olive/15 text-olive border-olive/30'
              : 'bg-red-500/15 text-red-600 border-red-500/30'
          }`}>
            {msg.text}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !workerId}
          className="w-full bg-linear-to-br from-teal to-teal-dark text-white py-3.5 rounded-2xl font-bold shadow-lg disabled:opacity-40"
        >
          {loading ? 'در حال ثبت...' : 'ثبت / جایگزینی'}
        </button>
      </form>
    </div>
  );
}