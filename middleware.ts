import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some(
    c => c.name.includes('better-auth') && c.name.includes('session_token'),
  );
}

export function middleware(request: NextRequest) {
  if (process.env.E2E_SKIP_AUTH === '1') {
    return NextResponse.next();
  }

  if (
    process.env.NODE_ENV !== 'production' &&
    request.nextUrl.pathname.startsWith('/dev/')
  ) {
    return NextResponse.next();
  }

  if (hasSessionCookie(request)) {
    return NextResponse.next();
  }

  const login = new URL('/login', request.url);
  login.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ['/', '/case-practice/:path*', '/vocabulary/:path*', '/results/:path*', '/dev/:path*', '/admin/:path*'],
};
