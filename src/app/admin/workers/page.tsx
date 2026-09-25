'use client';

import { useEffect, useState } from 'react';

interface Worker {
  id: number;
  nationalId: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [form, setForm] = useState({
    nationalId: '',
    phone: '',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/admin/workers');
      setWorkers(await res.json());
    } catch (error) {
      console.error('Failed to load workers:', error);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/workers');
        const data = await res.json();
        if (!cancelled) setWorkers(data);
      } catch (error) {
        console.error('Failed to load workers:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const addWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const res = await fetch('/api/admin/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'خطا در افزودن کارگر');
        return;
      }
      setForm({ nationalId: '', phone: '', firstName: '', lastName: '' });
      load();
    } catch (error) {
      console.error('Failed to add worker:', error);
      alert('خطا در افزودن کارگر');
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetPassword = async (id: number) => {
    if (!confirm('رمز عبور به شماره تلفن بازنشانی شود؟')) return;
    try {
      const res = await fetch(`/api/admin/workers/${id}/reset-password`, { method: 'POST' });
      if (!res.ok) {
        alert('خطا در بازنشانی رمز');
        return;
      }
      alert('رمز عبور با موفقیت به شماره تلفن بازنشانی شد');
    } catch (error) {
      console.error('Failed to reset password:', error);
      alert('خطا در بازنشانی رمز');
    }
  };

  const inputCls =
    'bg-white/70 border border-[#d9c8b8] text-[#2d1a1f] placeholder:text-[#2d1a1f]/30 rounded-xl p-3 outline-none transition-all focus:ring-2 focus:ring-[#29a9a0] focus:border-[#29a9a0] focus:bg-white';

  return (
    <div dir="rtl" className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#f5ede6] tracking-tight">مدیریت کارگران</h1>
          <p className="text-sm text-[#f5ede6]/40 mt-1">افزودن، مشاهده و مدیریت کاربران سیستم</p>
        </div>
      </div>

      {/* Add Worker Form */}
      <div className="luxury-card rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-bold mb-4 text-[#2d1a1f] tracking-tight">افزودن کارگر جدید</h2>
        <form onSubmit={addWorker} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            placeholder="کد ملی (۱۰ رقم)"
            value={form.nationalId}
            onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
            className={inputCls}
            required
            maxLength={10}
            disabled={submitLoading}
          />
          <input
            placeholder="شماره تلفن (۰۹xxxxxxxxx)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={inputCls}
            required
            maxLength={11}
            disabled={submitLoading}
          />
          <input
            placeholder="نام"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            className={inputCls}
            required
            disabled={submitLoading}
          />
          <input
            placeholder="نام خانوادگی"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            className={inputCls}
            required
            disabled={submitLoading}
          />
          <button
            type="submit"
            className="col-span-1 md:col-span-2 lg:col-span-4 bg-gradient-to-br from-[#29a9a0] to-[#1f8a83] text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-[#29a9a0]/30 hover:shadow-xl hover:shadow-[#29a9a0]/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            disabled={submitLoading}
          >
            {submitLoading ? 'در حال افزودن...' : 'افزودن کارگر'}
          </button>
        </form>
      </div>

      {/* Workers Table */}
      <div className="luxury-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#2d1a1f]/40">در حال بارگذاری...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#e8dcd0]/60">
                <tr>
                  <th className="px-6 py-4 text-right text-xs font-bold text-[#2d1a1f]/70 uppercase tracking-wider">کد ملی</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-[#2d1a1f]/70 uppercase tracking-wider">نام کامل</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-[#2d1a1f]/70 uppercase tracking-wider">تلفن</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-[#2d1a1f]/70 uppercase tracking-wider">نقش</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-[#2d1a1f]/70 uppercase tracking-wider">وضعیت</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-[#2d1a1f]/70 uppercase tracking-wider">تاریخ ثبت</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-[#2d1a1f]/70 uppercase tracking-wider">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d9c8b8]/40">
                {workers.map((w) => (
                  <tr key={w.id} className="hover:bg-[#e8dcd0]/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#2d1a1f]">{w.nationalId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2d1a1f]/80">{w.firstName} {w.lastName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2d1a1f]/80">{w.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full ${
                        w.role === 'ADMIN'
                          ? 'bg-[#5ca124]/15 text-[#5ca124]'
                          : 'bg-[#29a9a0]/15 text-[#29a9a0]'
                      }`}>
                        {w.role === 'ADMIN' ? 'مدیر' : 'کارگر'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full ${
                        w.isActive
                          ? 'bg-[#5ca124]/15 text-[#5ca124]'
                          : 'bg-[#c0392b]/15 text-[#c0392b]'
                      }`}>
                        {w.isActive ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2d1a1f]/60">
                      {new Date(w.createdAt).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => resetPassword(w.id)}
                        className="text-[#c0392b] hover:text-white hover:bg-[#c0392b] px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      >
                        بازنشانی رمز
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {workers.length === 0 && !loading && (
          <div className="p-8 text-center text-[#2d1a1f]/40">
            <p>هنوز کارگری ثبت نشده است</p>
          </div>
        )}
      </div>
    </div>
  );
}