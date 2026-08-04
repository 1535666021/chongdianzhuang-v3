import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import './OfflineIndicator.css'

/**
 * 离线状态指示器
 * - 监听 navigator.onLine
 * - 离线 3 秒后显示（防抖动）
 * - 黄底琥珀字，36px 高度
 * - 带关闭按钮，关闭后本次会话不再显示
 */
export function OfflineIndicator() {
  const [showPending, setShowPending] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setShowPending(false)
    }
    const handleOffline = () => {
      // 3 秒延迟显示
      const timer = setTimeout(() => {
        if (!dismissed) setShowPending(true)
      }, 3000)
      return () => clearTimeout(timer)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 初始化检查
    if (!navigator.onLine && !dismissed) {
      const timer = setTimeout(() => setShowPending(true), 3000)
      return () => clearTimeout(timer)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [dismissed])

  const handleClose = () => {
    setDismissed(true)
    setShowPending(false)
  }

  if (!showPending) return null

  return (
    <div className="offline-indicator">
      <div className="offline-indicator__icon">!</div>
      <span className="offline-indicator__text">当前处于离线模式，数据将在联网后同步</span>
      <button className="offline-indicator__close" onClick={handleClose}>
        <X size={16} />
      </button>
    </div>
  )
}
