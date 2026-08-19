import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { FB_ADMIN_COOKIE, FB_SESSION_COOKIE } from './lib/authCookies';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPath = pathname.startsWith('/admin');
  const isAuthPage = pathname === '/admin/auth';

  if (!isAdminPath || isAuthPage) {
    return NextResponse.next();
  }

  const session = request.cookies.get(FB_SESSION_COOKIE)?.value;
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/auth';
    url.search = '';
    return NextResponse.redirect(url);
  }

  const adminFlag = request.cookies.get(FB_ADMIN_COOKIE)?.value;
  if (adminFlag === '0') {
    const url = request.nextUrl.clone();
    url.pathname = '/unauthorized';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
