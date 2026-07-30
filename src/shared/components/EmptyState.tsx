import { ReactNode } from 'react'
import { Package, FileX, BarChart3, Settings, Search } from 'lucide-react'
import './EmptyState.css'

type EmptyStateType = 'orders' | 'materials' | 'statistics' | 'settings' | 'search'

interface EmptyStateProps {
  type?: EmptyStateType
  title?: string
  description?: string
  action?: ReactNode
}

const ICON_MAP: Record<EmptyStateType, ReactNode> = {
  orders: <Package size={120} />,
  materials: <Package size={120} />,
  statistics: <BarChart3 size={120} />,
  settings: <Settings size={120} />,
  search: <Search size={120} />,
}

const TITLE_MAP: Record<EmptyStateType, string> = {
  orders: '还没有订单',
  materials: '暂无材料',
  statistics: '暂无数据',
  settings: '暂无设置项',
  search: '未找到结果',
}

export function EmptyState({
  type = 'orders',
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{ICON_MAP[type]}</div>
      <h3 className="empty-state__title">{title || TITLE_MAP[type]}</h3>
      {description && (
        <p className="empty-state__description">{description}</p>
      )}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  )
}
