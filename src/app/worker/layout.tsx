'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const link = (href: string, label: string) => (
    <Link
      href={href}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        pathname === href
          ? 'bg-blue-600 text-white'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <nav className="max-w-6xl mx-auto flex items-center gap-2 p-4">
          <span className="font-bold text-gray-800 ml-4">پنل کارگر</span>
          {link('/worker', 'ثبت ورود و خروج')}
          {link('/worker/password', 'تغییر رمز')}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="mr-auto px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            خروج
          </button>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
