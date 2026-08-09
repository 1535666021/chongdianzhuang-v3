import { useState, useMemo } from 'react'
import { Package, ChevronDown, ChevronUp } from 'lucide-react'
import { useFinance } from '../hooks/useFinance'

function fmt(n: number): string {
  return `¥${(n || 0).toFixed(2)}`
}

function DetailRow({ label, value, formula, color = 'text-gray-600' }: { label: string; value: string; formula?: string; color?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1 text-sm">
      <div className="min-w-0">
        <div className="text-gray-700">{label}</div>
        {formula && <div className="text-xs text-gray-400">{formula}</div>}
      </div>
      <span className={`shrink-0 font-medium ${color}`}>{value}</span>
    </div>
  )
}

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
                <div className="text-xs text-gray-400">实际利润 {fmt(item.actualProfit)}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-500">-{fmt(item.materialCost)}</span>
                {expandedId === item.orderId ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </div>
            </button>

            {expandedId === item.orderId && (
              <div className="border-t border-gray-100 p-3 space-y-2">
                <div className="border border-blue-100 rounded-lg p-3 bg-blue-50/40">
                  <div className="flex justify-between items-center text-sm font-semibold text-blue-700">
                    <span>客户总付费</span><span>{fmt(item.customerPay)}</span>
                  </div>
                  <div className="mt-2 border-t border-blue-100 pt-2">
                    <DetailRow label="安装费 / 服务费" value={fmt(item.serviceFee)} color="text-blue-600" formula="车企服务费计入客户总付费" />
                    <DetailRow label="增项费用合计" value={fmt(item.customerPrice)} color="text-blue-600" formula="各增项费用明细小计" />
                    {item.materials.map((m, i) => (
                      <DetailRow key={i} label={`${m.name} ${m.spec || ''} × ${m.quantity}${m.unit}`} value={fmt(m.subtotal)} color="text-blue-600" formula={`${m.quantity}${m.unit} × ${fmt(m.unitPrice)}`} />
                    ))}
                    <div className="text-xs text-gray-400 pt-1">计算：{fmt(item.customerPrice)} + {fmt(item.serviceFee)} = {fmt(item.customerPay)}</div>
                  </div>
                </div>

                <div className="border border-red-100 rounded-lg p-3 bg-red-50/40">
                  <div className="flex justify-between items-center text-sm font-semibold text-red-600">
                    <span>材料成本合计</span><span>-{fmt(item.materialCost)}</span>
                  </div>
                  <div className="mt-2 border-t border-red-100 pt-2">
                    {item.materials.length > 0 ? item.materials.map((m, i) => (
                      <DetailRow key={i} label={`${m.name} ${m.spec || ''} × ${m.quantity}${m.unit}`} value={`-${fmt(m.costSubtotal)}`} color="text-red-500" formula={`${m.quantity}${m.unit} × ${fmt(m.costUnitPrice)}`} />
                    )) : <div className="text-xs text-gray-400 py-1">暂无材料行明细</div>}
                    <DetailRow label="其他辅材" value={`-${fmt(Math.max(0, item.materialCost - item.materials.reduce((sum, m) => sum + m.costSubtotal, 0)))}`} color="text-red-500" formula="材料成本合计 - 已列材料成本" />
                  </div>
                </div>

                <div className="border border-red-100 rounded-lg p-3 bg-red-50/40">
                  <DetailRow label="平台扣点" value={`-${fmt(item.platformDeduction)}`} color="text-red-500" formula={`${fmt(item.customerPrice)} × ${(item.platformRate * 100).toFixed(0)}% = ${fmt(item.platformDeduction)}`} />
                </div>

                <div className="border border-green-200 rounded-lg p-3 bg-green-50">
                  <DetailRow label="实际利润" value={fmt(item.actualProfit)} color={item.actualProfit >= 0 ? 'text-green-600' : 'text-red-500'} formula={`${fmt(item.customerPrice)} + ${fmt(item.serviceFee)} - ${fmt(item.materialCost)} - ${fmt(item.platformDeduction)} = ${fmt(item.actualProfit)}`} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
