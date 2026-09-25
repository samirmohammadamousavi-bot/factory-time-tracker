'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const link = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
          active
            ? 'bg-[#29a9a0] text-white shadow-lg shadow-[#29a9a0]/30'
            : 'text-[#f5ede6]/70 hover:text-[#f5ede6] hover:bg-[#f5ede6]/5'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div dir="rtl" className="min-h-screen">
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-[#2d1a1f]/70 border-b border-[#f5ede6]/8">
        <nav className="max-w-6xl mx-auto flex items-center gap-2 p-4">
          <div className="flex items-center gap-2 ml-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#29a9a0] to-[#1f8a83] flex items-center justify-center shadow-md shadow-[#29a9a0]/30">
              <span className="text-sm">⏱</span>
            </div>
            <span className="font-bold text-[#f5ede6] tracking-tight">پنل کارگر</span>
          </div>
          {link('/worker', 'ثبت ورود و خروج')}
          {link('/worker/password', 'تغییر رمز')}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="mr-auto px-4 py-2 rounded-xl text-sm font-medium text-[#f5ede6]/60 hover:text-[#e0776a] hover:bg-[#e0776a]/10 transition-all"
          >
            خروج
          </button>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto">{children}</main>
    </div>
  );
}