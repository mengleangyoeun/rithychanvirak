'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Prefetch routes on hover or mount for faster navigation
 */
export function usePrefetch(routes: string[], mode: 'mount' | 'hover' = 'mount') {
  const router = useRouter()

  useEffect(() => {
    if (mode === 'mount') {
      routes.forEach(route => {
        router.prefetch(route)
      })
    }
  }, [routes, mode, router])

  const prefetchOnHover = (route: string) => {
    if (mode === 'hover') {
      router.prefetch(route)
    }
  }

  return { prefetchOnHover }
}

/**
 * Prefetch critical routes on homepage
 */
export function usePrefetchCriticalRoutes() {
  usePrefetch([
    '/gallery',
    '/about',
    '/contact',
    '/videos',
  ], 'mount')
}
