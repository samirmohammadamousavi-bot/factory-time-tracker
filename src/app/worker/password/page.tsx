'use client';

import { useState } from 'react';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/worker/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'خطا در تغییر رمز');
        return;
      }
      setMessage(data.message || 'انجام شد');
      setCurrentPassword('');
      setNewPassword('');
    } catch {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full bg-white/70 border border-cream-darker text-plum placeholder:text-plum/30 rounded-xl p-3.5 outline-none transition-all focus:ring-2 focus:ring-teal focus:border-teal focus:bg-white';

  return (
    <div dir="rtl" className="flex items-center justify-center p-4 pt-8 pb-12">
      <form
        onSubmit={handleSubmit}
        className="luxury-card p-8 rounded-3xl w-full max-w-md space-y-5"
      >
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-linear-to-br from-teal to-teal-dark flex items-center justify-center shadow-lg shadow-teal/30 mb-3">
            <span className="text-xl">🔒</span>
          </div>
          <h1 className="text-xl font-bold text-plum tracking-tight">تغییر رمز عبور</h1>
          <p className="text-xs text-plum/40 mt-1">رمز جدید باید حداقل ۴ کاراکتر باشد</p>
        </div>

        <div className="h-px bg-linear-to-r from-transparent via-cream-darker to-transparent" />

        {message && (
          <p className="text-olive text-sm text-center bg-olive/10 border border-olive/25 rounded-xl py-2 font-medium">
            {message}
          </p>
        )}
        {error && (
          <p className="text-red-500 text-sm text-center bg-red-500/10 border border-red-500/25 rounded-xl py-2 font-medium">
            {error}
          </p>
        )}

        <input type="password" placeholder="رمز فعلی" value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={inputCls} required disabled={loading} />
        <input type="password" placeholder="رمز جدید (حداقل ۴ کاراکتر)" value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={inputCls} required minLength={4} disabled={loading} />

        <button type="submit" disabled={loading}
          className="w-full bg-linear-to-br from-teal to-teal-dark text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-teal/30 hover:shadow-xl hover:shadow-teal/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0">
          {loading ? 'در حال ثبت...' : 'تغییر رمز'}
        </button>
      </form>
    </div>
  );
}