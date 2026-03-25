'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function NavigationProgress() {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Start progress on route change
    setVisible(true)
    setProgress(20)

    const t1 = setTimeout(() => setProgress(60), 100)
    const t2 = setTimeout(() => setProgress(85), 400)
    const t3 = setTimeout(() => {
      setProgress(100)
      const t4 = setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 300)
      return () => clearTimeout(t4)
    }, 700)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [pathname])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[2px] pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 transition-all duration-300 ease-out"
        style={{ width: `${progress}%`, opacity: progress === 100 ? 0 : 1, transition: 'width 300ms ease-out, opacity 300ms ease-in 100ms' }}
      />
    </div>
  )
}
