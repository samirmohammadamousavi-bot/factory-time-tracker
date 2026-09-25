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

interface Profile {
  id: number;
  firstName: string;
  lastName: string;
  nationalId: string;
  role: string;
  gender: string;
  department: string;
}

const DEPT_LABELS: Record<string, string> = {
  PRODUCTION: 'تولید',
  PACKAGING: 'بسته‌بندی',
  MAINTENANCE: 'تعمیرات',
  QUALITY: 'کنترل کیفیت',
  WAREHOUSE: 'انبار',
  ADMIN: 'اداری',
};

/* ---------- 12-hour time helpers ---------- */

type Meridiem = 'AM' | 'PM';

interface Time12 {
  hour: number;
  minute: number;
  meridiem: Meridiem;
}

function toTime12(hhmm: string): Time12 {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) {
    return { hour: 8, minute: 0, meridiem: 'AM' };
  }
  const [h24, m] = hhmm.split(':').map(Number);
  const meridiem: Meridiem = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return { hour: h12, minute: m, meridiem };
}

function toHHMM(t: Time12): string {
  let h24: number;
  if (t.meridiem === 'AM') {
    h24 = t.hour === 12 ? 0 : t.hour;
  } else {
    h24 = t.hour === 12 ? 12 : t.hour + 12;
  }
  return `${String(h24).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;
}

function fmtHours(h: number): string {
  const hours = Math.floor(h);
  const minutes = Math.round((h - hours) * 60);
  if (hours === 0 && minutes === 0) return '۰';
  return `${hours} س ${minutes} د`;
}

function toTehranHHMM(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tehran',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

function statusBadge(status: DayRow['status']) {
  if (status === 'complete')
    return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-olive/15 text-olive">تکمیل شده</span>;
  if (status === 'open')
    return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal/15 text-teal">در حال کار</span>;
  return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-plum/10 text-plum/50">—</span>;
}

/* ---------- 12h time picker (dropdown AM/PM) ---------- */

function TimePicker12({
  value,
  onChange,
  disabled,
  label,
}: {
  value: Time12;
  onChange: (v: Time12) => void;
  disabled?: boolean;
  label: string;
}) {
  const fieldCls =
    'bg-white border border-cream-darker text-plum rounded-xl px-2 py-2.5 outline-none focus:ring-2 focus:ring-teal focus:border-teal text-center text-lg font-bold disabled:opacity-50';

  return (
    <div>
      {label && (
        <label className="block text-xs font-bold text-plum/60 mb-2">{label}</label>
      )}
      <div className="flex items-center gap-2">
        {/* Hour */}
        <select
          value={value.hour}
          onChange={(e) => onChange({ ...value, hour: Number(e.target.value) })}
          className={`${fieldCls} flex-1`}
          disabled={disabled}
          dir="ltr"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
            <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
          ))}
        </select>

        <span className="text-plum/40 font-bold text-lg">:</span>

        {/* Minute */}
        <select
          value={value.minute}
          onChange={(e) => onChange({ ...value, minute: Number(e.target.value) })}
          className={`${fieldCls} flex-1`}
          disabled={disabled}
          dir="ltr"
        >
          {Array.from({ length: 60 }, (_, i) => i).map((m) => (
            <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
          ))}
        </select>

        {/* AM / PM dropdown */}
        <select
          value={value.meridiem}
          onChange={(e) =>
            onChange({ ...value, meridiem: e.target.value as Meridiem })
          }
          className={`${fieldCls} flex-1`}
          disabled={disabled}
          dir="ltr"
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}

/* ---------- Main dashboard ---------- */

export default function WorkerDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mode, setMode] = useState<'quick' | 'manual'>('quick');
  const [entryTime12, setEntryTime12] = useState<Time12>({ hour: 8, minute: 0, meridiem: 'AM' });
  const [exitTime12, setExitTime12] = useState<Time12>({ hour: 5, minute: 0, meridiem: 'PM' });
  const [hasExit, setHasExit] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const load = async () => {
    try {
      const [s, p] = await Promise.all([
        fetch('/api/worker/summary').then((r) => r.json()),
        fetch('/api/worker/me').then((r) => r.json()),
      ]);
      setSummary(s);
      setProfile(p);
    } catch (error) {
      console.error('Failed to load:', error);
    }
  };

  useEffect(() => { load(); }, []);

  // Prefill manual form when today's log exists
  useEffect(() => {
    if (summary?.today) {
      if (summary.today.entryTime) setEntryTime12(toTime12(toTehranHHMM(summary.today.entryTime)));
      if (summary.today.exitTime) {
        setExitTime12(toTime12(toTehranHHMM(summary.today.exitTime)));
        setHasExit(true);
      } else {
        setHasExit(false);
      }
    } else {
      setEntryTime12({ hour: 8, minute: 0, meridiem: 'AM' });
      setExitTime12({ hour: 5, minute: 0, meridiem: 'PM' });
      setHasExit(false);
    }
  }, [summary]);

  const showToast = (type: 'ok' | 'err', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

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
        showToast('err', data.error || 'خطا در ثبت');
        return;
      }
      showToast('ok', data.message);
      await load();
    } catch {
      showToast('err', 'خطا در اتصال به سرور');
    } finally {
      setActionLoading(false);
    }
  };

  const today = summary?.today ?? null;
  const todayHours = today?.hours ?? 0;

  // ─── Manual mode state ───
  // 'none'       → no log today: entry + optional exit
  // 'entry-only' → entry exists, no exit: only exit
  // 'complete'   → both exist: allow editing both
  const manualState: 'none' | 'entry-only' | 'complete' =
    !today ? 'none'
    : today.entryTime && !today.exitTime ? 'entry-only'
    : 'complete';

  const saveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualLoading(true);
    try {
      let entry24: string;
      let exit24: string | null;

      if (manualState === 'entry-only') {
        // keep existing entry, only record exit
        entry24 = toHHMM(entryTime12);
        exit24 = toHHMM(exitTime12);
      } else if (manualState === 'complete') {
        // both editable
        entry24 = toHHMM(entryTime12);
        exit24 = toHHMM(exitTime12);
      } else {
        // none: entry + optional exit
        entry24 = toHHMM(entryTime12);
        exit24 = hasExit ? toHHMM(exitTime12) : null;
      }

      const res = await fetch('/api/worker/time/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryTime: entry24, exitTime: exit24 }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('err', data.error || 'خطا در ثبت');
        return;
      }
      showToast('ok', data.message);
      await load();
      setMode('quick');
    } catch {
      showToast('err', 'خطا در اتصال به سرور');
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div dir="rtl" className="p-4 pb-12">
      <div className="w-full max-w-2xl mx-auto space-y-5 pt-6">
        {/* Toast */}
        {toast && (
          <div className={`rounded-2xl px-4 py-3 text-sm font-medium text-center border ${
            toast.type === 'ok'
              ? 'bg-olive/15 text-olive border-olive/30'
              : 'bg-red-500/15 text-red-500 border-red-500/30'
          }`}>
            {toast.msg}
          </div>
        )}

        {/* Hero card */}
        <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-teal/20 bg-linear-to-br from-teal to-teal-dark p-7 text-white">
          <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-white/70 text-xs">خوش آمدی</p>
                <h1 className="text-2xl font-bold tracking-tight">
                  {profile ? `${profile.firstName} ${profile.lastName}` : '...'}
                </h1>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile && (
                  <>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm border border-white/20">
                      {profile.gender === 'FEMALE' ? 'خانم' : 'آقا'}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm border border-white/20">
                      {DEPT_LABELS[profile.department] ?? profile.department}
                    </span>
                  </>
                )}
              </div>
            </div>
            <p className="text-white/80 mt-3 text-sm">
              {toJalali(new Date(), { dateStyle: 'full' })}
            </p>
            <p className="mt-3 inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm border border-white/10">
              {today
                ? today.exitTime
                  ? '✓ ورود و خروج امروز ثبت شده'
                  : '● ورود ثبت شده — یادت نره خروج بزنی'
                : '○ امروز هنوز ورود ثبت نشده'}
            </p>
          </div>
        </div>

        {/* Clock card */}
        <div className="luxury-card rounded-3xl p-6 space-y-5">
          {/* Mode toggle */}
          <div className="flex gap-1 bg-plum/5 p-1 rounded-2xl border border-plum/10">
            <button
              type="button"
              onClick={() => setMode('quick')}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                mode === 'quick' ? 'bg-teal text-white shadow-md shadow-teal/30' : 'text-plum/60 hover:text-plum'
              }`}
            >
              ثبت سریع
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                mode === 'manual' ? 'bg-teal text-white shadow-md shadow-teal/30' : 'text-plum/60 hover:text-plum'
              }`}
            >
              ثبت دستی
            </button>
          </div>

          {mode === 'quick' && (
            <>
              <div className={`rounded-2xl p-5 border ${
                today
                  ? today.exitTime
                    ? 'bg-olive/8 border-olive/25'
                    : 'bg-teal/8 border-teal/25'
                  : 'bg-plum/5 border-cream-darker/50'
              }`}>
                {today ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-plum/60 text-sm font-medium">وضعیت امروز</span>
                      {statusBadge(today.status)}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white p-4 rounded-xl text-center shadow-sm">
                        <p className="text-xs text-plum/50">ورود</p>
                        <p className="text-lg font-bold text-plum">
                          {today.entryTime ? toJalali(new Date(today.entryTime), { timeStyle: 'short' }) : '—'}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-xl text-center shadow-sm">
                        <p className="text-xs text-plum/50">خروج</p>
                        <p className="text-lg font-bold text-plum">
                          {today.exitTime ? toJalali(new Date(today.exitTime), { timeStyle: 'short' }) : '—'}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-xl text-center shadow-sm">
                        <p className="text-xs text-plum/50">کارکرد امروز</p>
                        <p className="text-lg font-bold text-teal">{fmtHours(todayHours)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-plum/60 font-medium">امروز هنوز ثبت نشده</p>
                    <p className="text-xs text-plum/40 mt-1">برای شروع روز کاری، دکمه ورود را بزنید</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => clock('clock-in')}
                  disabled={actionLoading || !!today}
                  className="flex-1 bg-linear-to-br from-olive to-olive-dark text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-olive/30 hover:shadow-xl hover:shadow-olive/40 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
                >
                  {actionLoading ? 'در حال ثبت...' : 'ثبت ورود ✓'}
                </button>
                <button
                  onClick={() => clock('clock-out')}
                  disabled={actionLoading || !today || !!today.exitTime}
                  className="flex-1 bg-linear-to-br from-red-600 to-red-800 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-red-600/30 hover:shadow-xl hover:shadow-red-600/40 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
                >
                  {actionLoading ? 'در حال ثبت...' : 'ثبت خروج ✕'}
                </button>
              </div>
            </>
          )}

          {mode === 'manual' && (
            <form onSubmit={saveManual} className="space-y-5">
              {/* ── Contextual header ── */}
              {manualState === 'none' && (
                <div className="rounded-2xl p-4 bg-teal/8 border border-teal/25">
                  <p className="text-sm font-bold text-plum mb-1">امروز هنوز ثبت نشده</p>
                  <p className="text-xs text-plum/70">
                    زمان ورود و — اگر خروج زده‌ای — زمان خروج را وارد کن. اگر خروج را نمی‌دانی، فقط ورود را ثبت کن.
                  </p>
                </div>
              )}

              {manualState === 'entry-only' && (
                <div className="rounded-2xl p-4 bg-olive/10 border border-olive/25">
                  <p className="text-sm font-bold text-plum mb-1">ورودت ثبت شده — فقط خروج را وارد کن</p>
                  <p className="text-xs text-plum/70">
                    زمان ورود قفل شده. فقط زمان خروج را انتخاب کن و ثبت بزن.
                  </p>
                </div>
              )}

              {manualState === 'complete' && (
                <div className="rounded-2xl p-4 bg-plum/5 border border-cream-darker/60">
                  <p className="text-sm font-bold text-plum mb-1">امروز تکمیل شده</p>
                  <p className="text-xs text-plum/70">
                    می‌توانی زمان‌ها را اصلاح کنی. بعد از ذخیره، اطلاعات جدید جایگزین قبلی می‌شود.
                  </p>
                </div>
              )}

              {/* ── Fields ── */}
              {manualState === 'entry-only' ? (
                <>
                  {/* Entry — read-only card */}
                  <div className="rounded-2xl p-4 bg-white border border-cream-darker flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-olive/15 flex items-center justify-center">
                        <span className="text-olive text-lg">✓</span>
                      </div>
                      <div>
                        <p className="text-xs text-plum/50 font-medium">ورود ثبت شده</p>
                        <p className="text-lg font-bold text-plum" dir="ltr">
                          {today?.entryTime
                            ? toTehranHHMM(today.entryTime)
                            : '—'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-plum/40 font-bold px-2 py-1 rounded-full bg-plum/5">
                      قفل شده
                    </span>
                  </div>

                  {/* Exit picker */}
                  <TimePicker12
                    label="زمان خروج"
                    value={exitTime12}
                    onChange={setExitTime12}
                    disabled={manualLoading}
                  />
                </>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TimePicker12
                    label="زمان ورود"
                    value={entryTime12}
                    onChange={setEntryTime12}
                    disabled={manualLoading}
                  />

                  {manualState === 'none' ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-plum/60">زمان خروج</label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hasExit}
                            onChange={(e) => setHasExit(e.target.checked)}
                            className="accent-teal w-4 h-4"
                            disabled={manualLoading}
                          />
                          <span className="text-xs text-plum/60 font-medium">ثبت خروج</span>
                        </label>
                      </div>

                      {hasExit ? (
                        <TimePicker12
                          label=""
                          value={exitTime12}
                          onChange={setExitTime12}
                          disabled={manualLoading}
                        />
                      ) : (
                        <div className="rounded-xl border border-dashed border-cream-darker/70 bg-plum/[0.02] p-6 text-center text-sm text-plum/40">
                          خروج را الان نمی‌دانی؟ بعداً می‌توانی اضافه کنی
                        </div>
                      )}
                    </div>
                  ) : (
                    <TimePicker12
                      label="زمان خروج"
                      value={exitTime12}
                      onChange={setExitTime12}
                      disabled={manualLoading}
                    />
                  )}
                </div>
              )}

              {/* ── Buttons ── */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={manualLoading}
                  className="flex-1 bg-linear-to-br from-teal to-teal-dark text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-teal/30 hover:shadow-xl hover:shadow-teal/40 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {manualLoading
                    ? 'در حال ثبت...'
                    : manualState === 'entry-only'
                      ? 'ثبت خروج'
                      : manualState === 'complete'
                        ? 'ذخیره تغییرات'
                        : hasExit
                          ? 'ثبت ورود و خروج'
                          : 'ثبت ورود'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('quick')}
                  className="px-6 bg-cream-dark text-plum py-3.5 rounded-2xl font-bold hover:bg-cream-darker transition-all"
                >
                  لغو
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Period stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="luxury-card rounded-2xl p-4 text-center">
            <p className="text-xs font-semibold text-plum/50 tracking-wide">امروز</p>
            <p className="text-xl font-bold text-teal mt-1">{fmtHours(todayHours)}</p>
          </div>
          <div className="luxury-card rounded-2xl p-4 text-center">
            <p className="text-xs font-semibold text-plum/50 tracking-wide">۷ روز اخیر</p>
            <p className="text-xl font-bold text-teal mt-1">{fmtHours(summary?.weekHours ?? 0)}</p>
            <p className="text-[10px] text-plum/40 mt-0.5">{summary?.weekDays ?? 0} روز حضور</p>
          </div>
          <div className="luxury-card rounded-2xl p-4 text-center">
            <p className="text-xs font-semibold text-plum/50 tracking-wide">{summary?.monthLabel ?? 'این ماه'}</p>
            <p className="text-xl font-bold text-teal mt-1">{fmtHours(summary?.monthHours ?? 0)}</p>
            <p className="text-[10px] text-plum/40 mt-0.5">{summary?.monthDays ?? 0} روز حضور</p>
          </div>
        </div>

        {/* Recent history */}
        <div className="luxury-card rounded-3xl overflow-hidden">
          <div className="px-6 pt-5 pb-3 border-b border-cream-darker/60">
            <h2 className="text-lg font-bold text-plum tracking-tight">سوابق اخیر</h2>
          </div>
          {!summary ? (
            <p className="text-center text-plum/40 py-8">در حال بارگذاری...</p>
          ) : summary.recent.length === 0 ? (
            <p className="text-center text-plum/40 py-8">هنوز سابقه‌ای ثبت نشده</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-cream-dark/60">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-bold text-plum/70">تاریخ</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-plum/70">ورود</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-plum/70">خروج</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-plum/70">کارکرد</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-plum/70">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-darker/40">
                  {summary.recent.map((r) => (
                    <tr key={r.date} className="hover:bg-cream-dark/30 transition-colors">
                      <td className="px-4 py-3 text-plum font-medium">
                        {toJalali(new Date(`${r.date}T12:00:00Z`), { day: 'numeric', month: 'long', weekday: 'long' })}
                      </td>
                      <td className="px-4 py-3 text-plum/80">
                        {r.entryTime ? toJalali(new Date(r.entryTime), { timeStyle: 'short' }) : '—'}
                      </td>
                      <td className="px-4 py-3 text-plum/80">
                        {r.exitTime ? toJalali(new Date(r.exitTime), { timeStyle: 'short' }) : '—'}
                      </td>
                      <td className="px-4 py-3 font-bold text-teal">{fmtHours(r.hours)}</td>
                      <td className="px-4 py-3">{statusBadge(r.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-cream/30 pt-2">سیستم ثبت ساعت کار کارخانه</p>
      </div>
    </div>
  );
}