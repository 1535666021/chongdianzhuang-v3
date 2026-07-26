import { useState } from 'react'
import { useFinance } from '../hooks/useFinance'
import { Package, ChevronDown, ChevronRight } from 'lucide-react'

function fmt(n: number): string { return n.toFixed(2) }

export default function CostDetail() {
  const { monthOptions, getCostBreakdown } = useFinance()
  const [selectedMonth, setSelectedMonth] = useState('2026-07')
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [year, month] = selectedMonth.split('-').map(Number)
  const breakdowns = getCostBreakdown(year, month)

  const toggleExpand = (orderId: string) => {
    const next = new Set(expandedOrders)
    if (next.has(orderId)) next.delete(orderId)
    else next.add(orderId)
    setExpandedOrders(next)
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl p-3 shadow-sm">
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500">
          {monthOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>
      </div>
      {breakdowns.length === 0 && <div className="text-center text-gray-400 py-8 text-sm">该月暂无已完成订单</div>}
      {breakdowns.map((b) => {
        const isExpanded = expandedOrders.has(b.orderId)
        return (
          <div key={b.orderId} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button onClick={() => toggleExpand(b.orderId)} className="w-full flex items-center justify-between p-3 text-left">
              <div className="flex items-center gap-2">
                {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                <div><div className="text-sm font-medium text-gray-800">{b.customerName}</div><div className="text-xs text-gray-400">{b.platform}</div></div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-semibold ${b.actualProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>¥{fmt(b.actualProfit)}</div>
                <div className="text-[10px] text-gray-400">实际利润</div>
              </div>
            </button>
            {isExpanded && (
              <div className="px-3 pb-3 space-y-2 border-t border-gray-100 pt-2">
                {b.materials.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-1.5"><Package size={12} />材料清单</div>
                    <div className="space-y-1">
                      {b.materials.map((m, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1 px-2 bg-gray-50 rounded">
                          <span className="text-gray-700">{m.name}</span>
                          <span className="text-gray-500">{m.quantity} × ¥{fmt(m.unitPrice)} = ¥{fmt(m.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-1 pt-1 border-t border-gray-100">
                  <div className="flex justify-between text-xs"><span className="text-gray-500">材料成本合计</span><span className="text-gray-700 font-medium">¥{fmt(b.materialTotal)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-gray-500">人工成本</span><span className="text-gray-700 font-medium">¥{fmt(b.laborCost)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-gray-500">平台扣点</span><span className="text-orange-500 font-medium">¥{fmt(b.platformFee)}</span></div>
                  <div className="flex justify-between text-sm font-semibold pt-1 border-t border-gray-100">
                    <span className="text-gray-700">实际利润</span>
                    <span className={b.actualProfit >= 0 ? 'text-green-600' : 'text-red-500'}>¥{fmt(b.actualProfit)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
