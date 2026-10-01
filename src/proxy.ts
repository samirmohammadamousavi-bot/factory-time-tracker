import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isApi = pathname.startsWith('/api/');
  const isAuthApi = pathname.startsWith('/api/auth');

  if (isAuthApi) return NextResponse.next();

  if (pathname === '/login') {
    if (session) {
      return NextResponse.redirect(
        new URL(session.user?.role === 'ADMIN' ? '/admin' : '/worker', req.url),
      );
    }
    return NextResponse.next();
  }

  if (!session) {
    if (isApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (pathname.startsWith('/admin') && session.user?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/worker', req.url));
  }

  if (pathname.startsWith('/worker') && session.user?.role === 'ADMIN') {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
  ],
};