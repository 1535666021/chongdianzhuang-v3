import { useMemo } from 'react'
import type { Order } from '@/types'
import { getPlatformLabel } from '@/constants/platforms'

interface PlatformStats {
  platform: string
  orderCount: number
  materialCost: number
  laborCost: number
  platformFee: number
  actualProfit: number
}

interface Props {
  orders: Order[]
}

export default function PlatformBreakdown({ orders }: Props) {
  const stats = useMemo(() => {
    const map = new Map<string, PlatformStats>()
    orders.forEach((o) => {
      const platform = getPlatformLabel(o.platformName || o.platform)
      const s = map.get(platform) || { platform, orderCount: 0, materialCost: 0, laborCost: 0, platformFee: 0, actualProfit: 0 }
      s.orderCount += 1
      s.materialCost += o.materialCost || 0
      s.laborCost += o.laborCost || 0
      s.platformFee += o.platformFee || 0
      s.actualProfit += o.actualProfit || 0
      map.set(platform, s)
    })
    return Array.from(map.values()).filter((s) => s.orderCount > 0)
  }, [orders])

  const topEarners = stats.filter((stat) => stat.actualProfit > 0).sort((a, b) => b.actualProfit - a.actualProfit).slice(0, 3)
  const topLosses = stats.filter((stat) => stat.actualProfit < 0).sort((a, b) => a.actualProfit - b.actualProfit).slice(0, 3)

  return (
    <div className="grid grid-cols-2 gap-3">
      <Ranking title="赚前3区域" stats={topEarners} tone="green" emptyText="暂无数据" />
      <Ranking title="亏前3区域" stats={topLosses} tone="red" emptyText="暂无亏损订单" />
    </div>
  )
}

function Ranking({ title, stats, tone, emptyText }: { title: string; stats: PlatformStats[]; tone: 'green' | 'red'; emptyText: string }) {
  const color = tone === 'green' ? 'text-green-600' : 'text-red-500'
  return <section className="rounded-2xl bg-white p-4 shadow-sm"><h2 className={`mb-2 text-sm font-semibold ${color}`}>{title}</h2>{stats.length ? stats.map((stat) => <div key={stat.platform} className="flex justify-between py-1 text-xs"><span className="truncate text-gray-700">{stat.platform}</span><span className={color}>¥{stat.actualProfit.toFixed(2)}</span></div>) : <p className="text-xs text-gray-400">{emptyText}</p>}</section>
}
