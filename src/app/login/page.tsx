'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [nationalId, setNationalId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await signIn('credentials', { nationalId, password, redirect: false });
    if (res?.error) {
      setError('کد ملی یا رمز عبور اشتباه است');
      setLoading(false);
      return;
    }
    const sessionRes = await fetch('/api/auth/session');
    const session = await sessionRes.json();
    router.push(session?.user?.role === 'ADMIN' ? '/admin' : '/worker');
    router.refresh();
  };

  return (
    <div dir="rtl" className="flex items-center justify-center min-h-screen p-4">
      <form onSubmit={handleSubmit} className="luxury-card w-full max-w-md rounded-3xl p-8 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-teal to-teal-dark flex items-center justify-center shadow-lg shadow-teal/30">
            <span className="text-2xl">⏱</span>
          </div>
          <h1 className="text-2xl font-bold text-plum tracking-tight">ورود به سیستم</h1>
          <p className="text-sm text-plum/50">سیستم ثبت ساعت کار کارخانه</p>
        </div>

        <div className="h-px bg-linear-to-r from-transparent via-cream-darker to-transparent" />

        {error && (
          <p className="text-red-600 text-sm text-center bg-red-500/10 border border-red-500/30 rounded-lg py-2 font-medium">
            {error}
          </p>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="nationalId" className="block text-xs font-semibold text-plum/70 mb-2 tracking-wide">کد ملی</label>
            <input id="nationalId" type="text" placeholder="کد ملی (نام کاربری)"
              value={nationalId} onChange={(e) => setNationalId(e.target.value)}
              className="w-full bg-white/70 border border-cream-darker text-plum placeholder:text-plum/30 rounded-xl p-3.5 outline-none transition-all focus:ring-2 focus:ring-teal focus:border-teal focus:bg-white"
              required autoComplete="username" disabled={loading} />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-plum/70 mb-2 tracking-wide">رمز عبور</label>
            <input id="password" type="password" placeholder="رمز عبور (شماره تلفن)"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/70 border border-cream-darker text-plum placeholder:text-plum/30 rounded-xl p-3.5 outline-none transition-all focus:ring-2 focus:ring-teal focus:border-teal focus:bg-white"
              required autoComplete="current-password" disabled={loading} />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-linear-to-br from-teal to-teal-dark text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-teal/30 hover:shadow-xl hover:shadow-teal/40 hover:-translate-y-0.5 focus:ring-2 focus:ring-teal focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0">
          {loading ? 'در حال ورود...' : 'ورود'}
        </button>

        <p className="text-center text-xs text-plum/40 pt-2 border-t border-cream-darker/60">
          نام کاربری: کد ملی &nbsp;|&nbsp; رمز اولیه: شماره تلفن
        </p>
      </form>
    </div>
  );
}