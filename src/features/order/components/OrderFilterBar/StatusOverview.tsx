import type { OrderStatus } from '@/types'

export interface OrderStats {
  total: number
  pending: number
  scheduled: number
  completed: number
}

interface StatusOverviewProps {
  stats: OrderStats
  value: OrderStatus | 'all'
  onChange: (status: OrderStatus | 'all') => void
}

const ITEMS: { key: OrderStatus | 'all'; label: string; countKey: keyof OrderStats }[] = [
  { key: '待办', label: '待办', countKey: 'pending' },
  { key: '已预约', label: '已预约', countKey: 'scheduled' },
  { key: '已完成', label: '已完成', countKey: 'completed' },
  { key: 'all', label: '全部', countKey: 'total' },
]

export default function StatusOverview({ stats, value, onChange }: StatusOverviewProps) {
  return (
    <div className="ofb-status" role="group" aria-label="状态概览">
      {ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`ofb-status__item ${value === item.key ? 'ofb-status__item--active' : ''}`}
          aria-pressed={value === item.key}
          onClick={() => onChange(item.key)}
        >
          <span className="ofb-status__value">{stats[item.countKey]}</span>
          <span className="ofb-status__label">{item.label}</span>
        </button>
      ))}
    </div>
  )
}
