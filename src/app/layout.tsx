import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { db } from '@/lib/prisma';
import './globals.css';

export const metadata: Metadata = {
  title: 'سیستم ثبت ساعت کار',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let theme = 'a';

  try {
    const session = await auth();
    if (session?.user?.id) {
      const user = await db.orm.public.Worker
        .where({ id: Number(session.user.id) })
        .first();
      if (user?.theme) theme = user.theme;
    }
  } catch {
    // ignore — fall back to default theme
  }

  return (
    <html lang="fa" dir="rtl" data-theme={theme}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
