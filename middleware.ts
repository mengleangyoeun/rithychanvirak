import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Handle Supabase auth
  const supabaseResponse = await updateSession(request)

  // Add performance headers
  supabaseResponse.headers.set('X-DNS-Prefetch-Control', 'on')

  // Enable early hints for link prefetching
  const pathname = request.nextUrl.pathname

  if (pathname === '/') {
    supabaseResponse.headers.set('Link', '</gallery>; rel=prefetch, </about>; rel=prefetch, </contact>; rel=prefetch')
  } else if (pathname === '/gallery') {
    supabaseResponse.headers.set('Link', '</collection>; rel=prefetch')
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)',
  ],
}
