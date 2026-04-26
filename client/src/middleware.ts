import { NextResponse, NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('authToken')?.value;
    const { pathname } = request.nextUrl;

    // Protect /dashboard routes
    if (pathname.startsWith('/dashboard')) {
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // Protect /admin routes (except /admin/login)
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
        if (!token) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: ['/dashboard/:path*', '/admin/:path*', '/login'],
};
