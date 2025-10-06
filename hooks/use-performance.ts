'use client'

import { useEffect, useState } from 'react'

interface PerformanceMetrics {
  fcp?: number // First Contentful Paint
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  ttfb?: number // Time to First Byte
}

/**
 * Monitor Core Web Vitals and performance metrics
 */
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({})

  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return
    }

    // Monitor FCP (First Contentful Paint)
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          setMetrics(prev => ({ ...prev, fcp: entry.startTime }))
          console.log('FCP:', entry.startTime.toFixed(2), 'ms')
        }
      }
    })

    try {
      fcpObserver.observe({ entryTypes: ['paint'] })
    } catch {
      console.warn('Performance observer not supported')
    }

    // Monitor LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number }
      const lcp = lastEntry.renderTime || lastEntry.loadTime || 0
      setMetrics(prev => ({ ...prev, lcp }))
      console.log('LCP:', lcp.toFixed(2), 'ms')
    })

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch {
      console.warn('LCP observer not supported')
    }

    // Monitor CLS (Cumulative Layout Shift)
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
          clsValue += (entry as PerformanceEntry & { value?: number }).value || 0
          setMetrics(prev => ({ ...prev, cls: clsValue }))
          console.log('CLS:', clsValue.toFixed(4))
        }
      }
    })

    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] })
    } catch {
      console.warn('CLS observer not supported')
    }

    // Get TTFB (Time to First Byte)
    const navigationEntries = performance.getEntriesByType('navigation')
    if (navigationEntries.length > 0) {
      const navEntry = navigationEntries[0] as PerformanceNavigationTiming
      const ttfb = navEntry.responseStart - navEntry.requestStart
      setMetrics(prev => ({ ...prev, ttfb }))
      console.log('TTFB:', ttfb.toFixed(2), 'ms')
    }

    return () => {
      fcpObserver.disconnect()
      lcpObserver.disconnect()
      clsObserver.disconnect()
    }
  }, [])

  return metrics
}

/**
 * Check if user prefers reduced motion
 */
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

/**
 * Detect slow connections and adapt accordingly
 */
export function useNetworkStatus() {
  const [effectiveType, setEffectiveType] = useState<string>('4g')
  const [saveData, setSaveData] = useState(false)

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as Navigator & {
        connection?: {
          effectiveType: string
          saveData: boolean
          addEventListener?: (type: string, listener: () => void) => void
          removeEventListener?: (type: string, listener: () => void) => void
        }
      }).connection

      if (connection) {
        setEffectiveType(connection.effectiveType)
        setSaveData(connection.saveData)

        const handleChange = () => {
          if (connection) {
            setEffectiveType(connection.effectiveType)
            setSaveData(connection.saveData)
          }
        }

        if (connection.addEventListener) {
          connection.addEventListener('change', handleChange)
        }

        return () => {
          if (connection.removeEventListener) {
            connection.removeEventListener('change', handleChange)
          }
        }
      }
    }
  }, [])

  return {
    effectiveType,
    saveData,
    isSlowConnection: effectiveType === '2g' || effectiveType === 'slow-2g',
  }
}
