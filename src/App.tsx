import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useOrderStore } from '@/stores/orderStore'
import { ROUTES } from '@/routes/route'
import { Home, Calendar, CheckCircle, Package, BarChart3, Settings, RefreshCw } from 'lucide-react'
import { useVersionCheck } from '@/shared/hooks/useVersionCheck'
import { OfflineIndicator } from '@/shared/components/OfflineIndicator'
import { useToast, ToastContainer, toast } from '@/shared/hooks/useToast'
import { addKnownPlatform, getKnownPlatforms } from '@/shared/storage/platformStorage'

// 导出全局 toast
export { toast }

const iconMap: Record<string, React.ReactNode> = {
  Home: <Home size={20} />,
  Calendar: <Calendar size={20} />,
  CheckCircle: <CheckCircle size={20} />,
  Package: <Package size={20} />,
  BarChart3: <BarChart3 size={20} />,
  Settings: <Settings size={20} />,
}

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const { hasUpdate, handleUpdate, checkNow } = useVersionCheck()
  const orders = useOrderStore((s) => s.orders)
  const { toast: appToast, toasts, removeToast } = useToast()

  useEffect(() => {
    const known = getKnownPlatforms()
    orders
      .filter((order) => order.status === '已完成')
      .map((order) => {
        const platformName = order.platformName?.trim()
        return platformName && platformName !== '其他' ? platformName : (order.platform !== '其他' ? order.platform : order.brandName)
      })
      .filter((platform): platform is string => typeof platform === 'string' && platform.length > 0 && !known.includes(platform))
      .forEach(addKnownPlatform)
  }, [orders])

  // 底部气泡：首页=待办数，已预约=已预约数（老系统同款红点提示）
  const badgeMap: Record<string, number> = {
    '待办': orders.filter((o) => o.status === '待办').length,
    '已预约': orders.filter((o) => o.status === '已预约').length,
  }

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.hash === '#/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 离线状态提示 */}
      <OfflineIndicator />

      {/* 版本更新提示 */}
      {hasUpdate && (
        <button
          type="button"
          onClick={handleUpdate}
          style={{ background: 'var(--color-success)', borderRadius: 'var(--radius-md)', bottom: 'calc(64px + env(safe-area-inset-bottom))', color: 'white', left: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)', position: 'fixed', right: 'var(--space-md)', zIndex: 'var(--z-modal)' }}
        >
          <RefreshCw size={14} />
          <span>发现新版本，点击更新</span>
        </button>
      )}

      {/* Toast 通知 */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <main className="flex-1 overflow-auto">
        <Outlet context={{ checkNow, toast: appToast }} />
      </main>
      <nav className="bg-white border-t border-gray-200 px-2 py-1 fixed bottom-0 left-0 right-0">
        <div className="flex justify-around">
          {ROUTES.map((route) => (
            <button
              key={route.path}
              onClick={() => {
                navigate(route.path)
              }}
              className={`flex flex-col items-center py-2 px-3 rounded-lg text-xs ${
                isActive(route.path)
                  ? 'text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              <span className="relative">
                {iconMap[route.icon]}
                {route.status && badgeMap[route.status] > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] leading-4 text-center rounded-full">
                    {badgeMap[route.status] > 99 ? '99+' : badgeMap[route.status]}
                  </span>
                )}
              </span>
              <span className="mt-1">{route.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
