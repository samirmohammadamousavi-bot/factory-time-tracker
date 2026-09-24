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

    const res = await signIn('credentials', {
      nationalId,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError('کد ملی یا رمز عبور اشتباه است');
      setLoading(false);
      return;
    }

    // Redirect based on role (fetch session)
    const sessionRes = await fetch('/api/auth/session');
    const session = await sessionRes.json();
    router.push(session?.user?.role === 'ADMIN' ? '/admin' : '/worker');
    router.refresh();
  };

  return (
    <div dir="rtl" className="flex items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center text-gray-800">ورود به سیستم</h1>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <div className="space-y-4">
          <div>
            <label htmlFor="nationalId" className="block text-sm font-medium text-gray-700 mb-1">
              کد ملی
            </label>
            <input
              id="nationalId"
              type="text"
              placeholder="کد ملی (نام کاربری)"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              className="text-black w-full border border-green-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
              autoComplete="username"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              رمز عبور
            </label>
            <input
              id="password"
              type="password"
              placeholder="رمز عبور (شماره تلفن)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-black w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'در حال ورود...' : 'ورود'}
        </button>

        <p className="text-center text-sm text-gray-500">
          نام کاربری: کد ملی | رمز اولیه: شماره تلفن
        </p>
      </form>
    </div>
  );
}