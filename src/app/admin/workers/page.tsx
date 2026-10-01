'use client';

import { useEffect, useState } from 'react';

interface Worker {
  id: number;
  nationalId: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
  gender: string;
  department: string;
  theme: string;
  isActive: boolean;
  createdAt: string;
}

const DEPARTMENTS = [
  { value: 'PRODUCTION',  label: 'تولید' },
  { value: 'PACKAGING',   label: 'بسته‌بندی' },
  { value: 'MAINTENANCE', label: 'تعمیرات' },
  { value: 'QUALITY',     label: 'کنترل کیفیت' },
  { value: 'WAREHOUSE',   label: 'انبار' },
  { value: 'ADMIN',       label: 'اداری' },
];

type EditDraft = {
  nationalId: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
  gender: string;
  department: string;
  isActive: boolean;
};

const emptyForm = {
  nationalId: '',
  phone: '',
  firstName: '',
  lastName: '',
  role: 'WORKER',
  gender: 'MALE',
  department: 'PRODUCTION',
};

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/workers');
      if (!res.ok) return;
      setWorkers(await res.json());
    } catch (error) {
      console.error('Failed to load workers:', error);
    } finally {
      setLoading(false);
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
        alert(error.error || 'خطا در افزودن کاربر');
        return;
      }
      setForm(emptyForm);
      load();
    } catch (error) {
      console.error('Failed to add worker:', error);
      alert('خطا در افزودن کاربر');
    } finally {
      setSubmitLoading(false);
    }
  };

  const startEdit = (w: Worker) => {
    setEditingId(w.id);
    setDraft({
      nationalId: w.nationalId,
      phone: w.phone,
      firstName: w.firstName,
      lastName: w.lastName,
      role: w.role,
      gender: w.gender,
      department: w.department,
      isActive: w.isActive,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveEdit = async (id: number) => {
    if (!draft) return;
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/workers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'خطا در ویرایش');
        return;
      }
      setEditingId(null);
      setDraft(null);
      load();
    } catch (error) {
      console.error('Failed to save edit:', error);
      alert('خطا در ویرایش');
    } finally {
      setSavingId(null);
    }
  };

  const deleteWorker = async (w: Worker) => {
    const ok = confirm(
      `کاربر «${w.firstName} ${w.lastName}» حذف شود؟\n\nتمام سوابق زمانی این کاربر هم پاک می‌شود. این عمل قابل بازگشت نیست.`
    );
    if (!ok) return;

    setDeletingId(w.id);
    try {
      const res = await fetch(`/api/admin/workers/${w.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'خطا در حذف کاربر');
        return;
      }
      load();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('خطا در حذف کاربر');
    } finally {
      setDeletingId(null);
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
    'bg-white/70 border border-cream-darker text-plum placeholder:text-plum/30 rounded-xl p-3 outline-none transition-all focus:ring-2 focus:ring-teal focus:border-teal focus:bg-white';

  const editInputCls =
    'bg-white border border-cream-darker text-plum rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-teal w-full';

  const deptLabel = (v: string) => DEPARTMENTS.find((d) => d.value === v)?.label ?? v;

  return (
    <div dir="rtl" className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-cream tracking-tight">مدیریت کارگران</h1>
          <p className="text-sm text-cream/40 mt-1">افزودن، ویرایش، حذف و مدیریت کاربران سیستم</p>
        </div>
      </div>

      {/* Add form */}
      <div className="luxury-card rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-bold mb-4 text-plum tracking-tight">افزودن کاربر جدید</h2>
        <form onSubmit={addWorker} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input placeholder="کد ملی (۱۰ رقم)" value={form.nationalId}
            onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
            className={inputCls} required maxLength={10} disabled={submitLoading} />
          <input placeholder="شماره تلفن (۰۹xxxxxxxxx)" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={inputCls} required maxLength={11} disabled={submitLoading} />
          <input placeholder="نام" value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            className={inputCls} required disabled={submitLoading} />
          <input placeholder="نام خانوادگی" value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            className={inputCls} required disabled={submitLoading} />

          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
            className={inputCls} disabled={submitLoading}>
            <option value="WORKER">کارگر</option>
            <option value="ADMIN">مدیر</option>
          </select>
          <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className={inputCls} disabled={submitLoading}>
            <option value="MALE">آقا</option>
            <option value="FEMALE">خانم</option>
          </select>
          <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
            className={inputCls} disabled={submitLoading}>
            {DEPARTMENTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
          <button type="submit"
            className="bg-linear-to-br from-teal to-teal-dark text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-teal/30 hover:shadow-xl hover:shadow-teal/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            disabled={submitLoading}>
            {submitLoading ? 'در حال افزودن...' : 'افزودن کاربر'}
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="luxury-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-plum/40">در حال بارگذاری...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-dark/60">
                <tr>
                  <th className="px-4 py-4 text-right text-xs font-bold text-plum/70 uppercase tracking-wider">کد ملی</th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-plum/70 uppercase tracking-wider">نام کامل</th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-plum/70 uppercase tracking-wider">تلفن</th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-plum/70 uppercase tracking-wider">جنسیت</th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-plum/70 uppercase tracking-wider">دپارتمان</th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-plum/70 uppercase tracking-wider">نقش</th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-plum/70 uppercase tracking-wider">وضعیت</th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-plum/70 uppercase tracking-wider">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-darker/40">
                {workers.map((w) => {
                  const isEditing = editingId === w.id && draft;
                  const isDeleting = deletingId === w.id;
                  return (
                    <tr key={w.id} className={
                      isEditing ? 'bg-teal/10'
                        : isDeleting ? 'bg-red-500/10 opacity-60'
                        : 'hover:bg-cream-dark/30 transition-colors'
                    }>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-plum">
                        {isEditing ? (
                          <input value={draft.nationalId} onChange={(e) => setDraft({ ...draft, nationalId: e.target.value })}
                            className={editInputCls} maxLength={10} />
                        ) : w.nationalId}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-plum/80">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <input value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
                              className={editInputCls} placeholder="نام" />
                            <input value={draft.lastName} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })}
                              className={editInputCls} placeholder="خانوادگی" />
                          </div>
                        ) : `${w.firstName} ${w.lastName}`}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-plum/80">
                        {isEditing ? (
                          <input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                            className={editInputCls} maxLength={11} />
                        ) : w.phone}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-plum/70">
                        {isEditing ? (
                          <select value={draft.gender} onChange={(e) => setDraft({ ...draft, gender: e.target.value })}
                            className={editInputCls}>
                            <option value="MALE">آقا</option>
                            <option value="FEMALE">خانم</option>
                          </select>
                        ) : (w.gender === 'FEMALE' ? 'خانم' : 'آقا')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-plum/70">
                        {isEditing ? (
                          <select value={draft.department} onChange={(e) => setDraft({ ...draft, department: e.target.value })}
                            className={editInputCls}>
                            {DEPARTMENTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                          </select>
                        ) : deptLabel(w.department)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {isEditing ? (
                          <select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                            className={editInputCls}>
                            <option value="WORKER">کارگر</option>
                            <option value="ADMIN">مدیر</option>
                          </select>
                        ) : (
                          <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full ${
                            w.role === 'ADMIN' ? 'bg-olive/15 text-olive' : 'bg-teal/15 text-teal'
                          }`}>
                            {w.role === 'ADMIN' ? 'مدیر' : 'کارگر'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {isEditing ? (
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={draft.isActive}
                              onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                              className="accent-teal w-4 h-4" />
                            <span className="text-xs text-plum">فعال</span>
                          </label>
                        ) : (
                          <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full ${
                            w.isActive ? 'bg-olive/15 text-olive' : 'bg-red-500/15 text-red-600'
                          }`}>
                            {w.isActive ? 'فعال' : 'غیرفعال'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button onClick={() => saveEdit(w.id)} disabled={savingId === w.id}
                              className="text-white bg-olive hover:bg-olive-dark px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50">
                              {savingId === w.id ? '...' : 'ذخیره'}
                            </button>
                            <button onClick={cancelEdit}
                              className="text-plum bg-cream-dark hover:bg-cream-darker px-3 py-1.5 rounded-lg text-xs font-bold transition-all">
                              لغو
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1.5">
                            <button onClick={() => startEdit(w)}
                              disabled={isDeleting}
                              className="text-teal hover:text-white hover:bg-teal px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                              title="ویرایش">
                              ویرایش
                            </button>
                            <button onClick={() => resetPassword(w.id)}
                              disabled={isDeleting}
                              className="text-amber-600 hover:text-white hover:bg-amber-600 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                              title="بازنشانی رمز">
                              رمز
                            </button>
                            <button onClick={() => deleteWorker(w)}
                              disabled={isDeleting}
                              className="text-red-600 hover:text-white hover:bg-red-600 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                              title="حذف">
                              {isDeleting ? '...' : 'حذف'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {workers.length === 0 && !loading && (
          <div className="p-8 text-center text-plum/40">
            <p>هنوز کاربری ثبت نشده است</p>
          </div>
        )}
      </div>
    </div>
  );
}