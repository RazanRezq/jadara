import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

const publicPaths = ['/login', '/register', '/forgot-password']
const authPaths = ['/login', '/register']

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const token = request.cookies.get('session')?.value

    // Check if path is public
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
    const isAuthPath = authPaths.some(path => pathname.startsWith(path))

    // Verify token if exists
    const session = token ? await verifyToken(token) : null

    // If user is logged in and trying to access auth pages, redirect to dashboard
    if (session && isAuthPath) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // If user is not logged in and trying to access protected pages
    if (!session && !isPublicPath && pathname !== '/') {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - api routes
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
    ],
}
