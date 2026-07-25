import { useMemo } from 'react'
import { useOrderStore } from '@/stores/orderStore'
import PlatformBreakdown from '../components/PlatformBreakdown'
import { BarChart3, TrendingUp, Package, Wrench, Receipt, Wallet } from 'lucide-react'

interface MonthStats {
  month: string
  orderCount: number
  materialCost: number
  laborCost: number
  platformFee: number
  actualProfit: number
}

export default function Statistics() {
  const orders = useOrderStore((s) => s.orders)

  const monthlyStats = useMemo(() => {
    const map = new Map<string, MonthStats>()
    orders.forEach((o) => {
      const date = new Date(o.createdAt)
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const existing = map.get(month)
      if (existing) {
        existing.orderCount += 1
        existing.materialCost += o.materialCost
        existing.laborCost += o.laborCost
        existing.platformFee += o.platformFee
        existing.actualProfit += o.actualProfit
      } else {
        map.set(month, {
          month,
          orderCount: 1,
          materialCost: o.materialCost,
          laborCost: o.laborCost,
          platformFee: o.platformFee,
          actualProfit: o.actualProfit,
        })
      }
    })
    return Array.from(map.values()).sort((a, b) => b.month.localeCompare(a.month))
  }, [orders])

  const total = useMemo(() => {
    return monthlyStats.reduce(
      (acc, m) => ({
        orderCount: acc.orderCount + m.orderCount,
        materialCost: acc.materialCost + m.materialCost,
        laborCost: acc.laborCost + m.laborCost,
        platformFee: acc.platformFee + m.platformFee,
        actualProfit: acc.actualProfit + m.actualProfit,
      }),
      { orderCount: 0, materialCost: 0, laborCost: 0, platformFee: 0, actualProfit: 0 }
    )
  }, [monthlyStats])

  const fmt = (n: number) => n.toFixed(2)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-blue-600" />
          <h1 className="text-lg font-semibold">统计报表</h1>
        </div>
      </header>

      <main className="p-3 space-y-4">
        {/* 总计卡片 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <TrendingUp size={14} />
              <span>累计订单</span>
            </div>
            <div className="text-xl font-bold text-gray-900">{total.orderCount}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <Wallet size={14} />
              <span>累计利润</span>
            </div>
            <div className="text-xl font-bold text-green-600">{fmt(total.actualProfit)}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <Package size={14} />
              <span>累计材料</span>
            </div>
            <div className="text-xl font-bold text-gray-900">{fmt(total.materialCost)}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <Wrench size={14} />
              <span>累计人工</span>
            </div>
            <div className="text-xl font-bold text-gray-900">{fmt(total.laborCost)}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 col-span-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <Receipt size={14} />
              <span>累计平台扣点</span>
            </div>
            <div className="text-xl font-bold text-red-500">{fmt(total.platformFee)}</div>
          </div>
        </div>

        {/* 月度明细 */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 px-1">月度汇总</h2>
          {monthlyStats.length === 0 ? (
            <div className="text-center text-gray-400 py-8 text-sm">暂无订单数据</div>
          ) : (
            <div className="space-y-2">
              {monthlyStats.map((m) => (
                <div
                  key={m.month}
                  className="bg-white rounded-lg border border-gray-200 p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-gray-900">{m.month}</div>
                    <div className="text-xs text-gray-500">{m.orderCount} 单</div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="text-center">
                      <div className="text-gray-500">材料</div>
                      <div className="font-medium text-gray-900">{fmt(m.materialCost)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500">人工</div>
                      <div className="font-medium text-gray-900">{fmt(m.laborCost)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500">扣点</div>
                      <div className="font-medium text-red-500">{fmt(m.platformFee)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500">利润</div>
                      <div className="font-medium text-green-600">{fmt(m.actualProfit)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 平台分析 */}
        <PlatformBreakdown orders={orders} />
      </main>
    </div>
  )
}
