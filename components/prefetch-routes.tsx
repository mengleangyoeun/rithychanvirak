'use client'

import { useEffect } from 'react'
import { usePrefetchCriticalRoutes } from '@/hooks/use-prefetch'

/**
 * Client component to prefetch critical routes on mount
 * Use this in layouts or pages to improve navigation performance
 */
export function PrefetchRoutes() {
  usePrefetchCriticalRoutes()

  useEffect(() => {
    // Log prefetch status in development
    if (process.env.NODE_ENV === 'development') {
      console.log('✓ Critical routes prefetched for faster navigation')
    }
  }, [])

  return null
}
