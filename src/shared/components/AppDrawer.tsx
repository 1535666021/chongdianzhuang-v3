import { Home, Calendar, CheckCircle, Package, BarChart3, Settings, X } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ROUTES } from '@/routes/route'
import './AppDrawer.css'

const iconMap: Record<string, React.ReactNode> = {
  Home: <Home size={20} />,
  Calendar: <Calendar size={20} />,
  CheckCircle: <CheckCircle size={20} />,
  Package: <Package size={20} />,
  BarChart3: <BarChart3 size={20} />,
  Settings: <Settings size={20} />,
}

interface Props {
  open: boolean
  onClose: () => void
  /** 徽标数据源：与旧底部Tab徽标同源（status→count） */
  badgeMap: Record<string, number>
}

/** P0-148：左侧抽屉导航——6项齐备（首页/已预约/已完成/材料领用/统计/设置），当前页高亮 */
export default function AppDrawer({ open, onClose, badgeMap }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' || location.hash === '#/' : location.pathname.startsWith(path)

  return (
    <>
      {/* 半透明遮罩：点击关闭 */}
      <div
        className={`app-drawer__overlay ${open ? 'app-drawer__overlay--show' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      {/* 抽屉面板：滑入滑出 */}
      <aside className={`app-drawer ${open ? 'app-drawer--open' : ''}`} aria-hidden={!open}>
        <div className="app-drawer__header">
          <span className="app-drawer__title">充电桩订单助手</span>
          <button type="button" className="app-drawer__close" onClick={onClose} aria-label="关闭菜单">
            <X size={20} />
          </button>
        </div>
        <nav className="app-drawer__menu">
          {ROUTES.map((route) => (
            <button
              key={route.path}
              type="button"
              className={`app-drawer__item ${isActive(route.path) ? 'app-drawer__item--active' : ''}`}
              onClick={() => {
                onClose()
                navigate(route.path)
              }}
            >
              <span className="app-drawer__icon">
                {iconMap[route.icon]}
                {route.status && badgeMap[route.status] > 0 && (
                  <span className="app-drawer__badge">
                    {badgeMap[route.status] > 99 ? '99+' : badgeMap[route.status]}
                  </span>
                )}
              </span>
              <span className="app-drawer__label">{route.label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  )
}
