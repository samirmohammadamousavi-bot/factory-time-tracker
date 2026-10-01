'use client';

import { useEffect, useState } from 'react';
import { toJalali, toJalaliParts, jalaliToGregorianStr, jalaliMonthLength } from '@/lib/jalali';

interface Stats {
  jalaliYear: number;
  entitled: number;
  carryIn: number;
  used: number;
  usedFromRequests: number;
  usedFromAbsence: number;
  adjustment: number;
  remaining: number;
}

interface Req {
  id: number;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

const MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'در انتظار تایید',
  APPROVED: 'تایید شده',
  REJECTED: 'رد شده',
  CANCELLED: 'لغو شده',
};

const STATUS_CLS: Record<string, string> = {
  PENDING: 'bg-amber-500/15 text-amber-700',
  APPROVED: 'bg-olive/15 text-olive',
  REJECTED: 'bg-red-500/15 text-red-600',
  CANCELLED: 'bg-plum/10 text-plum/50',
};

export default function VacationPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [requests, setRequests] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);

  const now = toJalaliParts(new Date());
  const [jy, setJy] = useState(now.jy);
  const [jm, setJm] = useState(now.jm);
  const [jd, setJd] = useState(now.jd);
  const [endJy, setEndJy] = useState(now.jy);
  const [endJm, setEndJm] = useState(now.jm);
  const [endJd, setEndJd] = useState(now.jd);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/worker/vacation');
      const data = await res.json();
      setStats(data.stats);
      setRequests(data.requests ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const showToast = (type: 'ok' | 'err', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const startDate = jalaliToGregorianStr(jy, jm, Math.min(jd, jalaliMonthLength(jy, jm)));
      const endDate = jalaliToGregorianStr(endJy, endJm, Math.min(endJd, jalaliMonthLength(endJy, endJm)));
      const res = await fetch('/api/worker/vacation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('err', data.error || 'خطا در ثبت درخواست');
        return;
      }
      showToast('ok', `درخواست ${data.days} روزه ثبت شد`);
      setReason('');
      await load();
    } catch {
      showToast('err', 'خطا در اتصال به سرور');
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async (id: number) => {
    if (!confirm('این درخواست لغو شود؟')) return;
    const res = await fetch(`/api/worker/vacation/${id}/cancel`, { method: 'POST' });
    if (!res.ok) {
      const d = await res.json();
      showToast('err', d.error || 'خطا');
      return;
    }
    showToast('ok', 'لغو شد');
    load();
  };

  const yearOptions = [now.jy - 2, now.jy - 1, now.jy, now.jy + 1];

  const inputCls =
    'bg-white/70 border border-cream-darker text-plum rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-teal focus:border-teal';

  if (loading && !stats) {
    return <p className="text-center text-plum/50 py-12">در حال بارگذاری...</p>;
  }

  return (
    <div dir="rtl" className="p-4 pb-12">
      <div className="max-w-3xl mx-auto space-y-5 pt-6">
        {toast && (
          <div className={`rounded-2xl px-4 py-3 text-sm font-medium text-center border ${
            toast.type === 'ok'
              ? 'bg-olive/15 text-olive border-olive/30'
              : 'bg-red-500/15 text-red-500 border-red-500/30'
          }`}>
            {toast.msg}
          </div>
        )}

        {/* Balance card */}
        <div className="luxury-card rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-plum">مرخصی‌های من</h1>
            <span className="text-xs text-plum/50 font-semibold">سال {stats?.jalaliYear}</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-teal/10 border border-teal/25 p-4 text-center">
              <p className="text-xs text-plum/60 font-semibold">باقی‌مانده</p>
              <p className="text-3xl font-bold text-teal mt-1">{stats?.remaining ?? 0}</p>
              <p className="text-[10px] text-plum/50 mt-0.5">روز</p>
            </div>
            <div className="rounded-2xl bg-plum/5 border border-cream-darker/60 p-4 text-center">
              <p className="text-xs text-plum/60 font-semibold">کل سال</p>
              <p className="text-3xl font-bold text-plum mt-1">{stats?.entitled ?? 30}</p>
              <p className="text-[10px] text-plum/50 mt-0.5">
                {stats?.carryIn ? `۳۰ + ${stats.carryIn} انتقالی` : 'روز'}
              </p>
            </div>
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/25 p-4 text-center">
              <p className="text-xs text-plum/60 font-semibold">استفاده‌شده</p>
              <p className="text-3xl font-bold text-amber-700 mt-1">{stats?.used ?? 0}</p>
              <p className="text-[10px] text-plum/50 mt-0.5">
                {stats?.usedFromRequests ?? 0} درخواست + {stats?.usedFromAbsence ?? 0} غیبت
                {stats?.adjustment ? ` ${stats.adjustment > 0 ? '+' : ''}${stats.adjustment}` : ''}
              </p>
            </div>
          </div>

          <p className="text-xs text-plum/50 leading-relaxed">
            سهمیه سالانه <b>۳۰ روز</b>. روزهای استفاده‌نشده (حداکثر <b>۹ روز</b>) به سال بعد منتقل می‌شوند.
            روزهایی که ورود/خروج ثبت نشود، به‌عنوان مرخصی محاسبه می‌شود. جمعه‌ها تعطیل رسمی هستند.
          </p>
        </div>

        {/* Request form */}
        <div className="luxury-card rounded-3xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-plum">درخواست مرخصی جدید</h2>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <select value={jy} onChange={(e) => setJy(Number(e.target.value))} className={inputCls}>
                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
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
            <p className="text-xs text-plum/50 -mt-2">از تاریخ</p>

            <div className="grid grid-cols-3 gap-2">
              <select value={endJy} onChange={(e) => setEndJy(Number(e.target.value))} className={inputCls}>
                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={endJm} onChange={(e) => setEndJm(Number(e.target.value))} className={inputCls}>
                {MONTH_NAMES.map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
              </select>
              <select value={endJd} onChange={(e) => setEndJd(Number(e.target.value))} className={inputCls}>
                {Array.from({ length: jalaliMonthLength(endJy, endJm) }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-plum/50 -mt-2">تا تاریخ</p>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="دلیل (اختیاری)"
              maxLength={500}
              rows={3}
              className={`${inputCls} w-full resize-none`}
            />

            <button
              type="submit"
              disabled={submitting || (stats?.remaining ?? 0) <= 0}
              className="w-full bg-linear-to-br from-teal to-teal-dark text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-teal/30 hover:shadow-xl transition-all disabled:opacity-40"
            >
              {submitting ? 'در حال ثبت...' : 'ثبت درخواست'}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="luxury-card rounded-3xl overflow-hidden">
          <div className="px-6 pt-5 pb-3 border-b border-cream-darker/60">
            <h2 className="text-lg font-bold text-plum">تاریخچه درخواست‌ها</h2>
          </div>
          {requests.length === 0 ? (
            <p className="text-center text-plum/40 py-8">هنوز درخواستی ثبت نشده</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-cream-dark/60">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-bold text-plum/70">بازه</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-plum/70">روز</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-plum/70">وضعیت</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-plum/70">یادداشت مدیر</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-plum/70"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-darker/40">
                  {requests.map((r) => (
                    <tr key={r.id} className="hover:bg-cream-dark/30">
                      <td className="px-4 py-3 text-plum">
                        {toJalali(new Date(`${r.startDate.slice(0, 10)}T12:00:00Z`), { dateStyle: 'short' })}
                        {' — '}
                        {toJalali(new Date(`${r.endDate.slice(0, 10)}T12:00:00Z`), { dateStyle: 'short' })}
                      </td>
                      <td className="px-4 py-3 font-bold text-teal">{r.days}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_CLS[r.status]}`}>
                          {STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-plum/60 text-xs">{r.adminNote ?? '—'}</td>
                      <td className="px-4 py-3">
                        {r.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => cancel(r.id)}
                            className="text-red-600 hover:bg-red-600 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all"
                          >
                            لغو
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}