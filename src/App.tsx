import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/routes/route'
import { Home, Calendar, CheckCircle, Package, BarChart3, Settings, RefreshCw } from 'lucide-react'
import { useVersionCheck } from '@/hooks/useVersionCheck'

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
  const { hasUpdate, handleUpdate } = useVersionCheck()

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/chongdianzhuang-v3/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 版本更新提示 */}
      {hasUpdate && (
        <div className="bg-blue-600 text-white px-4 py-2 text-center text-sm flex items-center justify-center gap-2 sticky top-0 z-50">
          <RefreshCw size={14} />
          <span>发现新版本，点击刷新</span>
          <button
            onClick={handleUpdate}
            className="ml-2 px-3 py-0.5 bg-white text-blue-600 rounded text-xs font-medium"
          >
            刷新
          </button>
        </div>
      )}

      <main className="flex-1 overflow-auto">
        <Outlet />
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
              {iconMap[route.icon]}
              <span className="mt-1">{route.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
