import { useState, useMemo } from 'react'
import { FileText } from 'lucide-react'
import { useFinance } from '../hooks/useFinance'

function fmt(n: number): string {
  return '¥' + (n || 0).toFixed(2)
}

function SummaryItem({ value, label, color = 'text-gray-800', full = false }: { value: string; label: string; color?: string; full?: boolean }) {
  return <div className={`bg-gray-50 rounded-lg p-3 text-center ${full ? 'col-span-2' : ''}`}><div className={`text-lg font-bold ${color}`}>{value}</div><div className="text-[10px] text-gray-400">{label}</div></div>
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
            <SummaryItem value={String(data.orderCount)} label="订单数" />
            <SummaryItem value={fmt(data.totalReceivable)} label="增项费用" color="text-green-600" />
            <SummaryItem value={`+${fmt(data.totalServiceFee)}`} label="服务费" color="text-green-600" />
            <SummaryItem value={fmt(data.totalCustomerPay)} label="客户应付总额" color="text-green-600" />
            <SummaryItem value={`-${fmt(data.totalDeduction)}`} label="平台扣点" color="text-red-500" />
            <SummaryItem value={fmt(data.totalActual)} label="实际到账" color="text-blue-600" />
            <SummaryItem value={`-${fmt(data.totalMaterial)}`} label="材料成本" color="text-red-500" />
            <SummaryItem value={fmt(data.totalProfit)} label="实际利润" color="text-green-600" full />
          </div>
        </div>
      )}
    </div>
  )
}
