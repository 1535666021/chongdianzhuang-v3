import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

const MAX_TOASTS = 3

interface ToastContainerProps {
  toasts: ToastItem[]
  removeToast: (id: string) => void
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  const [exiting, setExiting] = useState<Set<string>>(new Set())

  const handleExit = useCallback((id: string) => {
    setExiting(prev => new Set(prev).add(id))
    setTimeout(() => {
      removeToast(id)
      setExiting(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 200)
  }, [removeToast])

  return createPortal(
    <div className="toast-container">
      {toasts.slice(0, MAX_TOASTS).map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type} ${exiting.has(toast.id) ? 'toast-exit' : 'toast-enter'}`}
          onAnimationEnd={() => exiting.has(toast.id) && removeToast(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </div>,
    document.body
  )
}
