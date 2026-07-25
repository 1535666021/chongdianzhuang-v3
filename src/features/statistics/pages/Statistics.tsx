import { useState, useMemo } from 'react'
import { useOrderStore } from '@/stores/orderStore'
import { CalendarDays, TrendingUp, DollarSign, Package, Wrench } from 'lucide-react'
import MonthlyChart from './components/MonthlyChart'
import ProfitTable from './components/ProfitTable'
import PlatformBreakdown from './components/PlatformBreakdown'

const MONTH_OPTIONS = [
  '2024-05', '2024-06', '2024-07', '2024-08', '2024-09', '2024-10',
  '2024-11', '2024-12', '2025-01', '2025-02', '2025-03', '2025-04',
  '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10',
  '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04',
  '2026-05', '2026-06', '2026-07',
]

export default function Statistics() {
  const [selectedMonth, setSelectedMonth] = useState('2026-07')
  const orders = useOrderStore((s) => s.orders)

  const monthStats = useMemo(() => {
    const monthOrders = orders.filter((o: any) => {
      const orderMonth = (o.date || o.createdAt || '').slice(0, 7)
      return orderMonth === selectedMonth
    })

    const count = monthOrders.length
    const revenue = monthOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0)
    const cost = monthOrders.reduce((sum: number, o: any) => sum + (o.materialCost || 0), 0)
    const profit = revenue - cost

    const deduction = monthOrders.reduce((sum: number, o: any) => {
      const rate = o.platform === 'JD' ? 0.1 : 0.2
      return sum + (o.totalAmount || 0) * rate
    }, 0)

    const actualProfit = profit - deduction

    return { count, revenue, cost, profit, deduction, actualProfit }
  }, [orders, selectedMonth])

  const cards = [
    {
      label: '总单数',
      value: monthStats.count,
      icon: <Package size={20} className="text-blue-500" />,
      color: 'bg-blue-50',
    },
    {
      label: '客户应收',
      value: `¥${monthStats.revenue.toFixed(2)}`,
      icon: <DollarSign size={20} className="text-green-500" />,
      color: 'bg-green-50',
    },
    {
      label: '材料成本',
      value: `¥${monthStats.cost.toFixed(2)}`,
      icon: <Wrench size={20} className="text-orange-500" />,
      color: 'bg-orange-50',
    },
    {
      label: '应收利润',
      value: `¥${monthStats.profit.toFixed(2)}`,
      icon: <TrendingUp size={20} className="text-purple-500" />,
      color: 'bg-purple-50',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 头部 */}
      <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800">统计报表</h1>
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-gray-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 数据概览卡片 */}
      <div className="p-4 grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <div key={card.label} className={`${card.color} rounded-lg p-3`}>
            <div className="flex items-center gap-2 mb-1">
              {card.icon}
              <span className="text-xs text-gray-500">{card.label}</span>
            </div>
            <div className="text-lg font-bold text-gray-800">{card.value}</div>
          </div>
        ))}
      </div>

      {/* 实际利润大卡片 */}
      <div className="px-4 mb-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="text-sm opacity-80 mb-1">实际利润（扣点后）</div>
          <div className="text-2xl font-bold">¥{monthStats.actualProfit.toFixed(2)}</div>
          <div className="text-xs opacity-60 mt-1">
            平台扣点 ¥{monthStats.deduction.toFixed(2)}
          </div>
        </div>
      </div>

      {/* 月度趋势图表 */}
      <div className="px-4 mb-4">
        <MonthlyChart />
      </div>

      {/* 利润明细表 */}
      <div className="px-4 mb-4">
        <ProfitTable />
      </div>

      {/* 平台分布 */}
      <div className="px-4 mb-4">
        <PlatformBreakdown />
      </div>
    </div>
  )
}
