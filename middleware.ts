import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  console.log('Middleware: Processing URL:', url.toString());

  // If the request is for /reset-password, allow it to proceed
  if (url.pathname === '/reset-password') {
    console.log('Middleware: Allowing /reset-password route');
    return NextResponse.next();
  }

  // Otherwise, proceed with other routes
  return NextResponse.next();
}

export const config = {
  matcher: ['/reset-password', '/dashboard'],
};