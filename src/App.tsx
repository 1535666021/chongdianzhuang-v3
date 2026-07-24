import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/routes/route'
import { Home, Calendar, CheckCircle, Settings } from 'lucide-react'

const iconMap: Record<string, React.ReactNode> = {
  Home: <Home size={20} />,
  Calendar: <Calendar size={20} />,
  CheckCircle: <CheckCircle size={20} />,
  Settings: <Settings size={20} />,
}

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/chongdianzhuang-v3/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
