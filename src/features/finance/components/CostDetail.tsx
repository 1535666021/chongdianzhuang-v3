import { useState, useMemo } from 'react'
import { Package, ChevronDown, ChevronUp } from 'lucide-react'
import { useFinance } from '../hooks/useFinance'

export function CostDetail() {
  const { availableMonths, getCostBreakdown } = useFinance()
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0] || '')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const data = useMemo(
    () => (selectedMonth ? getCostBreakdown(selectedMonth) : []),
    [selectedMonth, getCostBreakdown]
  )

  if (availableMonths.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Package size={48} className="mb-4 opacity-30" />
        <p>暂无成本数据</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">选择月份</h3>
        <select
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
        >
          {availableMonths.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {data.map(item => (
          <div key={item.orderId} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              className="w-full flex justify-between items-center p-3 text-left"
              onClick={() => setExpandedId(expandedId === item.orderId ? null : item.orderId)}
            >
              <div>
                <div className="text-sm font-medium text-gray-800">{item.customerName}</div>
                <div className="text-xs text-gray-400">利润 ¥{item.actualProfit.toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">¥{item.materialCost.toFixed(2)}</span>
                {expandedId === item.orderId ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </div>
            </button>

            {expandedId === item.orderId && (
              <div className="border-t border-gray-100 p-3 space-y-2">
                {item.materials.length > 0 ? (
                  <div className="space-y-1">
                    <div className="text-sm text-gray-400 mb-2">材料清单</div>
                    {item.materials.map((m, i) => (
                      <div key={i} className="flex justify-between text-sm py-1 px-2 bg-gray-50 rounded">
                        <span className="text-gray-700">{m.name} {m.spec || ''} × {m.quantity}{m.unit}</span>
                        <span className="text-gray-500">¥{m.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">无材料明细（汇总成本）</div>
                )}

                <div className="border-t border-gray-100 pt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">材料成本合计</span>
                    <span className="text-gray-700 font-medium">¥{item.materialCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">人工成本</span>
                    <span className="text-gray-700 font-medium">¥{item.laborCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">平台扣点</span>
                    <span className="text-red-500 font-medium">-¥{item.platformDeduction.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1 border-t border-gray-100">
                    <span className="text-gray-700">实际利润</span>
                    <span className={item.actualProfit >= 0 ? 'text-green-600' : 'text-red-500'}>
                      ¥{item.actualProfit.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
