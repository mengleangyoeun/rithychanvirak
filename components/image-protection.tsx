'use client'

import { useEffect } from 'react'

/**
 * Disables right-click context menu on images and blocks drag-to-save.
 * Drop this anywhere inside a layout or page that contains photos.
 */
export function ImageProtection() {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'IMG' || target.closest('[data-protected]')) {
        e.preventDefault()
      }
    }

    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'IMG') {
        e.preventDefault()
      }
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('dragstart', handleDragStart)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('dragstart', handleDragStart)
    }
  }, [])

  return null
}
