import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect patient/user routes with patient_session
  if (pathname.startsWith('/patient') || pathname === '/user-dashboard') {
    const patientSession = request.cookies.get('patient_session')?.value;
    if (!patientSession) {
      const url = request.nextUrl.clone();
      url.pathname = '/register';
      return NextResponse.redirect(url);
    }
  }

  // Protect admin dashboard with app_session
  if (pathname.startsWith('/dashboard')) {
    const adminSession = request.cookies.get('app_session')?.value;
    if (!adminSession) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/patient/:path*', '/user-dashboard', '/dashboard/:path*'],
};


