import { NextRequest, NextResponse } from 'next/server';
import { getSession } from './lib/auth';

// Force the middleware to run on the Node.js runtime.
// This is required because the 'mongodb' package uses Node.js APIs that are not available in the Edge runtime.
export const runtime = 'nodejs';

const protectedRoutes = ['/dashboard'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));

  if (isProtectedRoute) {
    const session = await getSession();
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.nextUrl));
    }
  }

  return NextResponse.next();
}
