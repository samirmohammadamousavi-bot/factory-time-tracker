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
    setLoading(true);
    try {
      const res = await fetch('/api/admin/workers');
      const data = await res.json();
      setWorkers(data);
    } catch (error) {
      console.error('Failed to load workers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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

  const toggleActive = async (worker: Worker) => {
    // For now, just show alert - can be implemented later
    alert('تغییر وضعیت فعال/غیرفعال در نسخه آینده اضافه خواهد شد');
  };

  return (
    <div dir="rtl" className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">مدیریت کارگران</h1>
      </div>

      {/* Add Worker Form */}
      <div className=" bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">افزودن کارگر جدید</h2>
        <form onSubmit={addWorker} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            placeholder="کد ملی (۱۰ رقم)"
            value={form.nationalId}
            onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
            className="text-black border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            required
            maxLength={10}
            disabled={submitLoading}
          />
          <input
            placeholder="شماره تلفن (۰۹xxxxxxxxx)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            required
            maxLength={11}
            disabled={submitLoading}
          />
          <input
            placeholder="نام"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            required
            disabled={submitLoading}
          />
          <input
            placeholder="نام خانوادگی"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            required
            disabled={submitLoading}
          />
          <button
            type="submit"
            className="col-span-1 md:col-span-2 lg:col-span-4 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitLoading}
          >
            {submitLoading ? 'در حال افزودن...' : 'افزودن کارگر'}
          </button>
        </form>
      </div>

      {/* Workers Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">کد ملی</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">نام کامل</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">تلفن</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">نقش</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">وضعیت</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">تاریخ ثبت</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {workers.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{w.nationalId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{w.firstName} {w.lastName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{w.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        w.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {w.role === 'ADMIN' ? 'مدیر' : 'کارگر'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        w.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {w.isActive ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(w.createdAt).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => resetPassword(w.id)}
                        className="text-red-600 hover:text-red-900 text-sm"
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
          <div className="p-8 text-center text-gray-500">
            <p>هنوز کارگری ثبت نشده است</p>
          </div>
        )}
      </div>
    </div>
  );
}