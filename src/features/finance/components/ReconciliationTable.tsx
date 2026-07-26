import { useState, useMemo } from 'react'
import { FileText } from 'lucide-react'
import { useFinance } from '../hooks/useFinance'

function fmt(n: number): string {
  return '¥' + (n || 0).toFixed(2)
}

export function ReconciliationTable() {
  const { availableMonths, getMonthReconciliation } = useFinance()
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0] || '')

  const data = useMemo(
    () => (selectedMonth ? getMonthReconciliation(selectedMonth) : null),
    [selectedMonth, getMonthReconciliation]
  )

  if (availableMonths.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <FileText size={48} className="mb-4 opacity-30" />
        <p>暂无已完成订单</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">月份选择</h3>
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

      {data && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{data.month} 对账汇总</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-gray-800">{data.orderCount}</div>
              <div className="text-[10px] text-gray-400">订单数</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-green-600">{fmt(data.totalReceivable)}</div>
              <div className="text-[10px] text-gray-400">应收总额</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-red-500">{fmt(data.totalDeduction)}</div>
              <div className="text-[10px] text-gray-400">平台扣点</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-600">{fmt(data.totalActual)}</div>
              <div className="text-[10px] text-gray-400">实际到账</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-gray-800">{fmt(data.totalMaterial)}</div>
              <div className="text-[10px] text-gray-400">材料成本</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-gray-800">{fmt(data.totalLabor)}</div>
              <div className="text-[10px] text-gray-400">人工成本</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center col-span-2">
              <div className="text-lg font-bold text-green-600">{fmt(data.totalProfit)}</div>
              <div className="text-[10px] text-gray-400">实际利润</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
