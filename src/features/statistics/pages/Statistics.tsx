import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrderStore } from '@/stores/orderStore'
import PlatformBreakdown from '../components/PlatformBreakdown'
import ProfitDetailModal from '../components/ProfitDetailModal'
import { exportReconciliationCsv } from '@/shared/utils/exportExcel'
import { FileText } from 'lucide-react'

interface MonthStats {
  month: string
  orderCount: number
  materialCost: number
  laborCost: number
  platformFee: number
  actualProfit: number
}

function Metric({ label, value, color, onClick }: { label: string; value: string; color: string; onClick?: () => void }) {
  return <button type="button" onClick={onClick} disabled={!onClick} className={`text-center ${onClick ? 'cursor-pointer' : 'cursor-default'}`}><div className="mb-1 text-xs text-gray-500">{label}</div><div className={`text-2xl font-bold ${color}`}>{value}</div></button>
}

export default function Statistics() {
  const orders = useOrderStore((s) => s.orders)
  const navigate = useNavigate()
  const [detailType, setDetailType] = useState<'reconciliation' | 'actual' | null>(null)

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
  const dashboard = useMemo(() => {
    const customerPay = total.materialCost + total.laborCost + total.actualProfit + total.platformFee
    const netIncome = total.materialCost + total.laborCost + total.actualProfit
    const averageProfit = total.orderCount > 0 ? total.actualProfit / total.orderCount : 0
    const averageAddon = total.orderCount > 0 ? (total.materialCost + total.laborCost) / total.orderCount : 0
    return {
      customerPay,
      netIncome,
      averageProfit,
      averageAddon,
    }
  }, [total])
  const selectedMonth = monthlyStats[0]?.month || new Date().toISOString().slice(0, 7)
  const completedOrders = useMemo(() => orders.filter((order) => {
    const date = order.completeDate || new Date(order.createdAt).toISOString().slice(0, 10)
    return order.status === '已完成' && date.startsWith(selectedMonth)
  }), [orders, selectedMonth])

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <h1 className="text-xl font-bold px-4 pt-4 pb-2">数据统计</h1>
      <main className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm mx-4 p-4 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Metric label="当月完成" value={String(total.orderCount)} color="text-blue-600" />
            <Metric label="客户总付费" value={`¥${fmt(dashboard.customerPay)}`} color="text-purple-600" />
            <Metric label="扣点后收入" value={`¥${fmt(dashboard.netIncome)}`} color="text-purple-600" />
          </div>
          <div className="flex justify-between text-xs text-gray-400 px-2"><span>安装0/维修0</span><span>已扣平台点</span></div>
          <div className="grid grid-cols-2 gap-4">
            <Metric label="对账利润（点击查看）" value={`¥${fmt(total.actualProfit + total.platformFee)}`} color="text-green-600" onClick={() => setDetailType('reconciliation')} />
            <Metric label="实际利润（点击查看）" value={`¥${fmt(total.actualProfit)}`} color="text-green-600" onClick={() => setDetailType('actual')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Metric label="平均利润" value={`¥${fmt(dashboard.averageProfit)}`} color="text-green-600" />
            <Metric label="台均增项" value={`¥${fmt(dashboard.averageAddon)}`} color="text-blue-600" />
          </div>
          <div className="flex justify-between text-xs text-gray-400 px-2"><span>维修0台 ¥0.00</span><span>勘测0台 ¥0.00</span></div>
          <button type="button" onClick={() => exportReconciliationCsv(completedOrders, selectedMonth)} className="w-full rounded-xl bg-green-600 py-3 text-sm font-medium text-white">导出Excel对账单</button>
        </div>

        <div className="mx-4"><PlatformBreakdown orders={orders} /></div>

        <div className="mx-4">
          <button onClick={() => navigate('/finance')} className="w-full bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"><span className="flex items-center gap-2 text-sm font-medium text-gray-800"><FileText size={16} className="text-blue-600" />查看财务对账</span><span className="text-xs text-blue-600 font-medium">进入 →</span></button>
        </div>

        {/* 月度明细 */}
        <div className="space-y-3 mx-4">
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
                      <div className="font-medium text-gray-900">¥{fmt(m.materialCost)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500">人工</div>
                      <div className="font-medium text-gray-900">¥{fmt(m.laborCost)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500">扣点</div>
                      <div className="font-medium text-red-500">¥{fmt(m.platformFee)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500">利润</div>
                      <div className="font-medium text-green-600">¥{fmt(m.actualProfit)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
      {detailType && <ProfitDetailModal month={selectedMonth} orders={completedOrders} type={detailType} onClose={() => setDetailType(null)} />}
    </div>
  )
}
