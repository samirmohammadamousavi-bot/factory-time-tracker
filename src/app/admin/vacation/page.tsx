'use client';

import { useEffect, useState } from 'react';
import { toJalali, toJalaliParts } from '@/lib/jalali';

interface EnrichedRequest {
  id: number;
  workerId: number;
  workerName: string;
  workerNationalId: string | null;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

interface BalanceRow {
  workerId: number;
  workerName: string;
  nationalId: string;
  department: string;
  jalaliYear: number;
  entitled: number;
  carryIn: number;
  used: number;
  usedFromRequests: number;
  usedFromAbsence: number;
  adjustment: number;
  remaining: number;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'در انتظار',
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

const DEPT_LABELS: Record<string, string> = {
  PRODUCTION: 'تولید', PACKAGING: 'بسته‌بندی', MAINTENANCE: 'تعمیرات',
  QUALITY: 'کنترل کیفیت', WAREHOUSE: 'انبار', ADMIN: 'اداری',
};

export default function AdminVacationPage() {
  const [tab, setTab] = useState<'requests' | 'balances'>('requests');
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'all'>('PENDING');
  const [jy, setJy] = useState(toJalaliParts(new Date()).jy);
  const [requests, setRequests] = useState<EnrichedRequest[]>([]);
  const [balances, setBalances] = useState<BalanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [editWorker, setEditWorker] = useState<BalanceRow | null>(null);
  const [editAdjustment, setEditAdjustment] = useState(0);
  const [editCarry, setEditCarry] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/vacation?status=${filter}&jy=${jy}`);
      const data = await res.json();
      setRequests(data.requests ?? []);
      setBalances(data.balances ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter, jy]);

  const review = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    let note: string | null = null;
    if (status === 'REJECTED') {
      note = prompt('دلیل رد (اختیاری):');
    }
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/vacation/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNote: note }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || 'خطا');
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (b: BalanceRow) => {
    setEditWorker(b);
    setEditAdjustment(b.adjustment);
    setEditCarry(b.carryIn ? String(b.carryIn) : '');
  };

  const saveEdit = async () => {
    if (!editWorker) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        workerId: editWorker.workerId,
        jalaliYear: jy,
        adjustment: editAdjustment,
      };
      if (editCarry.trim() === '') {
        body.manualCarryIn = null;
      } else {
        const n = Number(editCarry);
        if (Number.isFinite(n)) body.manualCarryIn = n;
      }
      const res = await fetch('/api/admin/vacation/balance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || 'خطا');
        return;
      }
      setEditWorker(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const years = [toJalaliParts(new Date()).jy - 2, toJalaliParts(new Date()).jy - 1, toJalaliParts(new Date()).jy, toJalaliParts(new Date()).jy + 1];

  return (
    <div dir="rtl" className="p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-cream tracking-tight">مدیریت مرخصی‌ها</h1>
          <p className="text-sm text-cream/40 mt-1">بررسی درخواست‌ها و تنظیم موجودی</p>
        </div>
        <div className="flex gap-1 bg-cream/5 p-1 rounded-2xl border border-cream/10">
          {([
            ['requests', 'درخواست‌ها'],
            ['balances', 'موجودی‌ها'],
          ] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === k ? 'bg-teal text-white shadow-lg shadow-teal/30' : 'text-cream/60 hover:text-cream'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="luxury-card rounded-2xl p-4 flex flex-wrap items-center gap-3 mb-5">
        <select
          value={jy}
          onChange={(e) => setJy(Number(e.target.value))}
          className="bg-white/70 border border-cream-darker text-plum rounded-xl px-3 py-2 outline-none"
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        {tab === 'requests' && (
          <div className="flex gap-1 bg-plum/5 p-1 rounded-xl">
            {(['PENDING', 'APPROVED', 'REJECTED', 'all'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === s ? 'bg-teal text-white' : 'text-plum/60 hover:text-plum'
                }`}
              >
                {s === 'all' ? 'همه' : STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={load}
          className="mr-auto text-sm font-semibold text-plum/60 hover:text-plum"
        >
          ⟳ بازخوانی
        </button>
      </div>

      {loading ? (
        <p className="text-center text-cream/40 py-12">در حال بارگذاری...</p>
      ) : tab === 'requests' ? (
        <div className="luxury-card rounded-2xl overflow-hidden">
          {requests.length === 0 ? (
            <p className="text-center text-plum/40 py-8">درخواستی یافت نشد</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-cream-dark/60">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-bold text-plum/70">کارگر</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-plum/70">بازه</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-plum/70">روز</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-plum/70">دلیل</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-plum/70">وضعیت</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-plum/70">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-darker/40">
                  {requests.map((r) => (
                    <tr key={r.id} className="hover:bg-cream-dark/30">
                      <td className="px-4 py-3 font-semibold text-plum">
                        {r.workerName}
                        <div className="text-[10px] text-plum/40">{r.workerNationalId}</div>
                      </td>
                      <td className="px-4 py-3 text-plum/80 text-xs">
                        {toJalali(new Date(`${r.startDate.slice(0, 10)}T12:00:00Z`), { dateStyle: 'short' })}
                        {' — '}
                        {toJalali(new Date(`${r.endDate.slice(0, 10)}T12:00:00Z`), { dateStyle: 'short' })}
                      </td>
                      <td className="px-4 py-3 font-bold text-teal">{r.days}</td>
                      <td className="px-4 py-3 text-plum/60 text-xs max-w-xs truncate">{r.reason || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_CLS[r.status]}`}>
                          {STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.status === 'PENDING' && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => review(r.id, 'APPROVED')}
                              disabled={busyId === r.id}
                              className="text-white bg-olive hover:bg-olive-dark px-2.5 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
                            >
                              تایید
                            </button>
                            <button
                              onClick={() => review(r.id, 'REJECTED')}
                              disabled={busyId === r.id}
                              className="text-white bg-red-600 hover:bg-red-700 px-2.5 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
                            >
                              رد
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="luxury-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-dark/60">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-bold text-plum/70">کارگر</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-plum/70">دپارتمان</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-plum/70">سهمیه</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-plum/70">انتقالی</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-plum/70">استفاده</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-plum/70">اصلاح</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-plum/70">باقی‌مانده</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-plum/70"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-darker/40">
                {balances.map((b) => (
                  <tr key={b.workerId} className="hover:bg-cream-dark/30">
                    <td className="px-4 py-3 font-semibold text-plum">{b.workerName}</td>
                    <td className="px-4 py-3 text-plum/60 text-xs">{DEPT_LABELS[b.department] ?? b.department}</td>
                    <td className="px-4 py-3 text-center font-bold text-plum">{b.entitled}</td>
                    <td className="px-4 py-3 text-center text-plum/70">{b.carryIn}</td>
                    <td className="px-4 py-3 text-center text-plum/70">
                      {b.usedFromRequests + b.usedFromAbsence}
                      <div className="text-[10px] text-plum/40">
                        {b.usedFromRequests} + {b.usedFromAbsence}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={b.adjustment === 0 ? 'text-plum/40' : 'text-amber-700 font-bold'}>
                        {b.adjustment > 0 ? `+${b.adjustment}` : b.adjustment}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-teal">{b.remaining}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openEdit(b)}
                        className="text-teal hover:bg-teal hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all"
                      >
                        ویرایش
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {balances.length === 0 && (
            <p className="text-center text-plum/40 py-8">کارگری یافت نشد</p>
          )}
        </div>
      )}

      {/* Balance edit modal */}
      {editWorker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="luxury-card rounded-3xl p-6 w-full max-w-md space-y-4" dir="rtl">
            <h2 className="text-lg font-bold text-plum">ویرایش موجودی — {editWorker.workerName}</h2>
            <p className="text-xs text-plum/50">سال {jy}</p>

            <label className="block">
              <span className="text-xs font-bold text-plum/60">اصلاح دستی (روز؛ + یا −)</span>
              <input
                type="number"
                value={editAdjustment}
                onChange={(e) => setEditAdjustment(Number(e.target.value))}
                className="w-full bg-white border border-cream-darker text-plum rounded-xl px-3 py-2 mt-1 outline-none focus:ring-2 focus:ring-teal"
              />
              <span className="text-[10px] text-plum/40">
                مثلاً ۳- یعنی ۳ روز بخشیده شده. مقدار مثبت = مرخصی بیشتری مصرف شده.
              </span>
            </label>

            <label className="block">
              <span className="text-xs font-bold text-plum/60">انتقالی از سال قبل (۰ تا ۹ — خالی = خودکار)</span>
              <input
                type="number"
                min={0}
                max={9}
                value={editCarry}
                onChange={(e) => setEditCarry(e.target.value)}
                className="w-full bg-white border border-cream-darker text-plum rounded-xl px-3 py-2 mt-1 outline-none focus:ring-2 focus:ring-teal"
              />
            </label>

            <div className="rounded-xl bg-teal/10 border border-teal/25 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-plum/70">باقی‌مانده فعلی:</span>
                <b className="text-teal">{editWorker.remaining} روز</b>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setEditWorker(null)}
                className="px-4 py-2 rounded-xl bg-cream-dark text-plum font-bold hover:bg-cream-darker transition-all"
              >
                لغو
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-teal text-white font-bold hover:bg-teal-dark transition-all disabled:opacity-50"
              >
                {saving ? 'در حال ذخیره...' : 'ذخیره'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}