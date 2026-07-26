import type { MonthlyReconciliation } from '../types/finance'

interface Props {
  data: MonthlyReconciliation[]
  total: { orderCount: number; totalRevenue: number; totalPlatformFee: number; totalActualIncome: number; totalMaterialCost: number; totalLaborCost: number; totalActualProfit: number }
}

function fmt(n: number): string { return n.toFixed(2) }

export default function ReconciliationTable({ data, total }: Props) {
  const rows = data.filter((d) => d.orderCount > 0)
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-700">月度对账表</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="bg-gray-50 text-gray-500">
            <th className="px-3 py-2 text-left font-medium">月份</th>
            <th className="px-3 py-2 text-right font-medium">单数</th>
            <th className="px-3 py-2 text-right font-medium">应收</th>
            <th className="px-3 py-2 text-right font-medium">平台扣点</th>
            <th className="px-3 py-2 text-right font-medium">实际到账</th>
            <th className="px-3 py-2 text-right font-medium">材料成本</th>
            <th className="px-3 py-2 text-right font-medium">人工成本</th>
            <th className="px-3 py-2 text-right font-medium">实际利润</th>
          </tr></thead>
          <tbody>
            {rows.map((row) => {
              const isCurrent = row.year === 2026 && row.month === 7
              return (
                <tr key={row.label} className={`border-t border-gray-50 ${isCurrent ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                  <td className="px-3 py-2.5 font-medium text-gray-700">{row.label}{isCurrent && <span className="ml-1 inline-block px-1 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded">当前</span>}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600">{row.orderCount}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600">{fmt(row.totalRevenue)}</td>
                  <td className="px-3 py-2.5 text-right text-orange-500">{fmt(row.totalPlatformFee)}</td>
                  <td className="px-3 py-2.5 text-right font-medium text-gray-700">{fmt(row.totalActualIncome)}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600">{fmt(row.totalMaterialCost)}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600">{fmt(row.totalLaborCost)}</td>
                  <td className={`px-3 py-2.5 text-right font-semibold ${row.totalActualProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(row.totalActualProfit)}</td>
                </tr>
              )
            })}
            {rows.length > 0 && (
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                <td className="px-3 py-2.5 text-gray-700">合计</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{total.orderCount}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{fmt(total.totalRevenue)}</td>
                <td className="px-3 py-2.5 text-right text-orange-600">{fmt(total.totalPlatformFee)}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{fmt(total.totalActualIncome)}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{fmt(total.totalMaterialCost)}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{fmt(total.totalLaborCost)}</td>
                <td className={`px-3 py-2.5 text-right ${total.totalActualProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(total.totalActualProfit)}</td>
              </tr>
            )}
            {rows.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400">暂无已完成订单数据</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
