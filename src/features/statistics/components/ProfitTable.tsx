import type { MonthlyStats } from '../hooks/useStatistics'

interface Props {
  data: MonthlyStats[]
}

function formatMoney(n: number): string {
  return n.toFixed(2)
}

export default function ProfitTable({ data }: Props) {
  // 只显示有数据的月份 + 合计
  const rows = data.filter((d) => d.orderCount > 0)

  const totals = rows.reduce(
    (acc, r) => ({
      orderCount: acc.orderCount + r.orderCount,
      revenue: acc.revenue + r.revenue,
      cost: acc.cost + r.cost,
      receivableProfit: acc.receivableProfit + r.receivableProfit,
      actualProfit: acc.actualProfit + r.actualProfit,
      platformFee: acc.platformFee + r.platformFee,
    }),
    { orderCount: 0, revenue: 0, cost: 0, receivableProfit: 0, actualProfit: 0, platformFee: 0 }
  )

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">利润明细表</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-500">
              <th className="px-3 py-2 text-left font-medium">月份</th>
              <th className="px-3 py-2 text-right font-medium">单数</th>
              <th className="px-3 py-2 text-right font-medium">收入</th>
              <th className="px-3 py-2 text-right font-medium">成本</th>
              <th className="px-3 py-2 text-right font-medium">应收利润</th>
              <th className="px-3 py-2 text-right font-medium">平台扣点</th>
              <th className="px-3 py-2 text-right font-medium">实际利润</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isJuly2026 = row.year === 2026 && row.month === 7
              return (
                <tr
                  key={row.label}
                  className={`border-t border-gray-50 ${
                    isJuly2026 ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-3 py-2.5 font-medium text-gray-700">
                    {row.label}
                    {isJuly2026 && (
                      <span className="ml-1.5 inline-block px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded">
                        当前
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-600">{row.orderCount}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600">{formatMoney(row.revenue)}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600">{formatMoney(row.cost)}</td>
                  <td className="px-3 py-2.5 text-right font-medium text-gray-700">
                    {formatMoney(row.receivableProfit)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-orange-500">
                    {formatMoney(row.platformFee)}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right font-semibold ${
                      row.actualProfit >= 0 ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {formatMoney(row.actualProfit)}
                  </td>
                </tr>
              )
            })}
            {/* 合计行 */}
            {rows.length > 0 && (
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                <td className="px-3 py-2.5 text-gray-700">合计</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{totals.orderCount}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{formatMoney(totals.revenue)}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{formatMoney(totals.cost)}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">
                  {formatMoney(totals.receivableProfit)}
                </td>
                <td className="px-3 py-2.5 text-right text-orange-600">
                  {formatMoney(totals.platformFee)}
                </td>
                <td
                  className={`px-3 py-2.5 text-right ${
                    totals.actualProfit >= 0 ? 'text-green-700' : 'text-red-600'
                  }`}
                >
                  {formatMoney(totals.actualProfit)}
                </td>
              </tr>
            )}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-400">
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
