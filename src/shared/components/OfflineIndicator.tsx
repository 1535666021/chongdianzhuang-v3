import { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'

/**
 * 离线状态指示器
 * - 监听 navigator.onLine
 * - 离线时顶部显示黄色提示条
 */
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-sm py-2 px-4 flex items-center justify-center gap-2 z-50">
      <WifiOff size={14} />
      当前离线，数据可能不是最新
    </div>
  )
}
