'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Save and restore scroll position on navigation
 */
export function useScrollRestoration() {
  const pathname = usePathname()
  const scrollPositions = useRef<{ [key: string]: number }>({})
  const isBack = useRef(false)

  useEffect(() => {
    // Detect if navigation is backwards
    const handlePopState = () => {
      isBack.current = true
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    // Save scroll position before leaving page
    const handleRouteChange = () => {
      if (pathname) {
        scrollPositions.current[pathname] = window.scrollY
      }
    }

    window.addEventListener('beforeunload', handleRouteChange)

    return () => {
      window.removeEventListener('beforeunload', handleRouteChange)
    }
  }, [pathname])

  useEffect(() => {
    // Restore scroll position if going back
    if (isBack.current && pathname) {
      const savedPosition = scrollPositions.current[pathname]
      if (savedPosition !== undefined) {
        window.scrollTo({
          top: savedPosition,
          behavior: 'instant'
        })
      }
      isBack.current = false
    } else {
      // Scroll to top on new page
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [pathname])
}

/**
 * Smooth scroll to element
 */
export function useSmoothScroll() {
  const scrollToElement = (elementId: string, offset = 0) => {
    const element = document.getElementById(elementId)
    if (element) {
      const top = element.offsetTop - offset
      window.scrollTo({
        top,
        behavior: 'smooth'
      })
    }
  }

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return { scrollToElement, scrollToTop }
}

/**
 * Show scroll progress indicator
 */
export function useScrollProgress() {
  const getScrollProgress = () => {
    const winScroll = document.documentElement.scrollTop
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight
    return height > 0 ? (winScroll / height) * 100 : 0
  }

  return { getScrollProgress }
}
