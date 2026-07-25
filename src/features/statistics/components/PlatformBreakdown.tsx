import { useMemo } from 'react'
import type { Order } from '@/types'
import { PLATFORMS } from '@/constants/order'

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
    PLATFORMS.forEach((p) => map.set(p, { platform: p, orderCount: 0, materialCost: 0, laborCost: 0, platformFee: 0, actualProfit: 0 }))
    orders.forEach((o) => {
      const s = map.get(o.platform)
      if (s) {
        s.orderCount += 1
        s.materialCost += o.materialCost
        s.laborCost += o.laborCost
        s.platformFee += o.platformFee
        s.actualProfit += o.actualProfit
      }
    })
    return Array.from(map.values()).filter((s) => s.orderCount > 0)
  }, [orders])

  const total = useMemo(() => {
    return stats.reduce(
      (acc, s) => ({
        orderCount: acc.orderCount + s.orderCount,
        materialCost: acc.materialCost + s.materialCost,
        laborCost: acc.laborCost + s.laborCost,
        platformFee: acc.platformFee + s.platformFee,
        actualProfit: acc.actualProfit + s.actualProfit,
      }),
      { orderCount: 0, materialCost: 0, laborCost: 0, platformFee: 0, actualProfit: 0 }
    )
  }, [stats])

  const fmt = (n: number) => n.toFixed(2)

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-700 px-1">平台收入明细</h2>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-6 gap-2 px-3 py-2 bg-gray-50 text-xs text-gray-500 font-medium">
          <div>平台</div>
          <div className="text-right">订单</div>
          <div className="text-right">材料</div>
          <div className="text-right">人工</div>
          <div className="text-right">扣点</div>
          <div className="text-right">利润</div>
        </div>
        {stats.map((s) => (
          <div
            key={s.platform}
            className="grid grid-cols-6 gap-2 px-3 py-2.5 border-t border-gray-100 text-sm"
          >
            <div className="font-medium text-gray-900">{s.platform}</div>
            <div className="text-right text-gray-700">{s.orderCount}</div>
            <div className="text-right text-gray-700">{fmt(s.materialCost)}</div>
            <div className="text-right text-gray-700">{fmt(s.laborCost)}</div>
            <div className="text-right text-red-500">{fmt(s.platformFee)}</div>
            <div className="text-right font-medium text-green-600">{fmt(s.actualProfit)}</div>
          </div>
        ))}
        <div className="grid grid-cols-6 gap-2 px-3 py-2.5 border-t border-gray-200 bg-gray-50 text-sm font-semibold">
          <div>合计</div>
          <div className="text-right">{total.orderCount}</div>
          <div className="text-right">{fmt(total.materialCost)}</div>
          <div className="text-right">{fmt(total.laborCost)}</div>
          <div className="text-right text-red-600">{fmt(total.platformFee)}</div>
          <div className="text-right text-green-700">{fmt(total.actualProfit)}</div>
        </div>
      </div>
    </div>
  )
}
