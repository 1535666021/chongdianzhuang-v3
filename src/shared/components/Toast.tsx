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

function ToastMessage({ toast, exiting, onClose }: { toast: ToastItem; exiting: boolean; onClose: () => void }) {
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused) return
    const timer = window.setTimeout(onClose, 3000)
    return () => window.clearTimeout(timer)
  }, [paused, onClose])
  return (
    <div className={`toast toast-${toast.type} ${exiting ? 'toast-exit' : 'toast-enter'}`} onAnimationEnd={() => exiting && onClose()} onClick={onClose} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {toast.message}
    </div>
  )
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
          <ToastMessage key={toast.id} toast={toast} exiting={exiting.has(toast.id)} onClose={() => handleExit(toast.id)} />
        ))}
    </div>,
    document.body
  )
}
