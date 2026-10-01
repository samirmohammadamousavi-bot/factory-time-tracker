'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import NotificationBell from '@/components/NotificationBell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const link = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
          active
            ? 'bg-teal text-white shadow-lg shadow-teal/30'
            : 'text-cream/70 hover:text-cream hover:bg-cream/5'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div dir="rtl" className="min-h-screen">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-plum/70 border-b border-cream/8">
        <nav className="max-w-6xl mx-auto flex items-center gap-2 p-4 flex-wrap">
          <div className="flex items-center gap-2 ml-6">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-teal to-teal-dark flex items-center justify-center shadow-md shadow-teal/30">
              <span className="text-sm">⏱</span>
            </div>
            <span className="font-bold text-cream tracking-tight">پنل مدیریت</span>
          </div>
          {link('/admin', 'داشبورد')}
          {link('/admin/workers', 'کارگران')}
          {link('/admin/vacation', 'مرخصی‌ها')}
          {link('/admin/timelogs', 'ویرایش ساعات')}
          <div className="mr-auto flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="px-4 py-2 rounded-xl text-sm font-medium text-cream/60 hover:text-red-400 hover:bg-red-400/10 transition-all"
            >
              خروج
            </button>
          </div>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto">{children}</main>
    </div>
  );
}