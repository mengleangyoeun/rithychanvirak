import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add performance headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')

  // Enable early hints for link prefetching
  const pathname = request.nextUrl.pathname

  if (pathname === '/') {
    response.headers.set('Link', '</gallery>; rel=prefetch, </about>; rel=prefetch, </contact>; rel=prefetch')
  } else if (pathname === '/gallery') {
    response.headers.set('Link', '</collection>; rel=prefetch')
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)',
  ],
}
