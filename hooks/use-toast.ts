'use client'

import { useState, useCallback } from 'react'

type ToastType = 'default' | 'destructive'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: ToastType
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(
    ({
      title,
      description,
      variant = 'default',
    }: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newToast: Toast = {
        id,
        title,
        description,
        variant,
      }

      setToasts((currentToasts) => [...currentToasts, newToast])

      // Auto remove toast after 5 seconds
      setTimeout(() => {
        setToasts((currentToasts) =>
          currentToasts.filter((toast) => toast.id !== id)
        )
      }, 5000)

      return id
    },
    []
  )

  const dismiss = useCallback((toastId: string) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== toastId)
    )
  }, [])

  return {
    toast,
    dismiss,
    toasts,
  }
}