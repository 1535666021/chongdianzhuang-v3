import { useEffect, useState, useCallback } from 'react'
import { ToastContainer } from '../components/Toast'

export { ToastContainer }

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

const TOAST_DURATION: Record<ToastType, number> = {
  success: 3000,
  error: 3000,
  warning: 2500,
  info: 2000,
}

// 全局 toast 引用
let globalSetToasts: ((fn: (prev: ToastItem[]) => ToastItem[]) => void) | null = null
const listeners = new Set<(toasts: ToastItem[]) => void>()

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    globalSetToasts = setToasts
    const notify = () => listeners.forEach(fn => fn(toasts))
    notify()
    return () => {
      globalSetToasts = null
    }
  }, [toasts])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2)
    const toast: ToastItem = { id, type, message }
    setToasts(prev => [...prev, toast])

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, TOAST_DURATION[type])
  }, [])

  const toast = useCallback(() => ({
    success: (message: string) => addToast('success', message),
    error: (message: string) => addToast('error', message),
    warning: (message: string) => addToast('warning', message),
    info: (message: string) => addToast('info', message),
  }), [addToast])()

  return { toast, toasts, removeToast }
}

// 全局 toast API
export const toast = {
  success: (msg: string) => globalSetToasts?.(prev => [...prev, { id: Math.random().toString(36).slice(2), type: 'success' as ToastType, message: msg }]),
  error: (msg: string) => globalSetToasts?.(prev => [...prev, { id: Math.random().toString(36).slice(2), type: 'error' as ToastType, message: msg }]),
  warning: (msg: string) => globalSetToasts?.(prev => [...prev, { id: Math.random().toString(36).slice(2), type: 'warning' as ToastType, message: msg }]),
  info: (msg: string) => globalSetToasts?.(prev => [...prev, { id: Math.random().toString(36).slice(2), type: 'info' as ToastType, message: msg }]),
} as const
