'use client'

import { usePrefetchCriticalRoutes } from '@/hooks/use-prefetch'

/**
 * Client component to prefetch critical routes on mount
 * Use this in layouts or pages to improve navigation performance
 */
export function PrefetchRoutes() {
  usePrefetchCriticalRoutes()

  return null
}
