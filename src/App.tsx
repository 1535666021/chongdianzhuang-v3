import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useUIStore } from '@/stores/uiStore'
import { ROUTES } from '@/routes/route'
import { Home, ClipboardList, Package, BarChart3, Settings } from 'lucide-react'

const iconMap: Record<string, React.ReactNode> = {
  Home: <Home size={20} />,
  ClipboardList: <ClipboardList size={20} />,
  Package: <Package size={20} />,
  BarChart3: <BarChart3 size={20} />,
  Settings: <Settings size={20} />,
}

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const { activeTab, setActiveTab } = useUIStore()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 overflow-auto p-4">
        <Outlet />
      </main>
      <nav className="bg-white border-t border-gray-200 px-2 py-1">
        <div className="flex justify-around">
          {ROUTES.map((route) => (
            <button
              key={route.path}
              onClick={() => {
                setActiveTab(route.path)
                navigate(route.path)
              }}
              className={`flex flex-col items-center py-2 px-3 rounded-lg text-xs ${
                location.pathname === route.path || (route.path === '/' && location.pathname === '/chongdianzhuang-v3/')
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
