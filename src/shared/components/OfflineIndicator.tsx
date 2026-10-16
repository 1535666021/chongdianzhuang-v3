import { useState } from 'react'
import { X } from 'lucide-react'
import { useOfflineStatus } from '@/shared/hooks/useOfflineStatus'
import './OfflineIndicator.css'

/**
 * 离线状态指示器
 * - 监听 navigator.onLine
 * - 离线 3 秒后显示（防抖动）
 * - 黄底琥珀字，36px 高度
 * - 带关闭按钮，关闭后本次会话不再显示
 */
export function OfflineIndicator() {
  const isOffline = useOfflineStatus()
  const [dismissed, setDismissed] = useState(false)

  const handleClose = () => {
    setDismissed(true)
  }

  if (!isOffline || dismissed) return null

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
