import { useLocation, useNavigate } from 'react-router-dom'
import { Home, CalendarCheck, CheckCircle2, BarChart3, User } from 'lucide-react'

interface BottomTabBarProps {
  /** 徽章计数：与抽屉时代同一计算段（App.tsx 传入），禁在此重算 */
  badgeMap: Record<string, number>
}

/** P0-173：底部 Tab 栏（抽屉退役）。5 项：首页/已预约(徽章)/已完成/统计/我的。
 * 常显不隐藏；触控≥44px；深链高亮与当前路由一致；z-index 低于弹窗遮罩(--z-modal)。
 */
export default function BottomTabBar({ badgeMap }: BottomTabBarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const tabs = [
    { path: '/', label: '首页', Icon: Home },
    { path: '/scheduled', label: '已预约', Icon: CalendarCheck, badge: badgeMap['已预约'] ?? 0 },
    { path: '/completed', label: '已完成', Icon: CheckCircle2 },
    { path: '/stats', label: '统计', Icon: BarChart3 },
    { path: '/mine', label: '我的', Icon: User },
  ]
  return (
    <nav className="app-tabbar" aria-label="主导航">
      {tabs.map(({ path, label, Icon, badge }) => {
        const active = location.pathname === path
        return (
          <button
            key={path}
            type="button"
            className={`app-tabbar__item${active ? ' is-active' : ''}`}
            onClick={() => navigate(path)}
            aria-current={active ? 'page' : undefined}
          >
            <span className="app-tabbar__icon">
              <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
              {!!badge && badge > 0 && <span className="app-tabbar__badge">{badge > 99 ? '99+' : badge}</span>}
            </span>
            <span className="app-tabbar__label">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
