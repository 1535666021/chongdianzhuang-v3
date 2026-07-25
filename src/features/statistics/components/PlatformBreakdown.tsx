import { useMemo } from 'react'
import { useOrderStore } from '@/stores/orderStore'
import { BarChart3 } from 'lucide-react'

const PLATFORM_CONFIG: Record<string, { label: string; color: string; deduction: number }> = {
  JD: { label: '京东', color: '#E4393C', deduction: 0.1 },
  TB: { label: '淘宝', color: '#FF5000', deduction: 0.2 },
  DY: { label: '抖音', color: '#000000', deduction: 0.2 },
  OTHER: { label: '其他', color: '#999999', deduction: 0.2 },
}

export default function PlatformBreakdown() {
  const orders = useOrderStore((s) => s.orders)

  const stats = useMemo(() => {
    const result = Object.keys(PLATFORM_CONFIG).map((key) => {
      const platformOrders = orders.filter((o: any) => o.platform === key)
      const count = platformOrders.length
      const revenue = platformOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0)
      const cost = platformOrders.reduce((sum: number, o: any) => sum + (o.materialCost || 0), 0)
      const profit = revenue - cost
      const deduction = revenue * PLATFORM_CONFIG[key].deduction
      const actualProfit = profit - deduction
      return {
        key,
        ...PLATFORM_CONFIG[key],
        count,
        revenue,
        cost,
        profit,
        deduction,
        actualProfit,
      }
    })
    return result.filter((s) => s.count > 0)
  }, [orders])

  const totalCount = stats.reduce((sum, s) => sum + s.count, 0)

  if (stats.length === 0) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <BarChart3 size={16} />
          平台分布
        </h3>
        <div className="text-center text-gray-400 text-sm py-4">暂无数据</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
        <BarChart3 size={16} />
        平台分布
      </h3>
      <div className="space-y-3">
        {stats.map((s) => (
          <div key={s.key} className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: s.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">{s.label}</span>
                <span className="text-xs text-gray-500">{s.count}单</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${totalCount > 0 ? (s.count / totalCount) * 100 : 0}%`,
                    backgroundColor: s.color,
                  }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>收入 ¥{s.revenue.toFixed(2)}</span>
                <span>利润 ¥{s.actualProfit.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
