import type { MonthlyStats } from '../hooks/useStatistics'

interface Props {
  data: MonthlyStats[]
}

export default function MonthlyChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">月度趋势</h3>
        <div className="text-center text-gray-400 py-8 text-sm">暂无数据</div>
      </div>
    )
  }

  const maxCount = Math.max(...data.map((d) => d.orderCount), 1)
  const maxProfit = Math.max(...data.map((d) => d.actualProfit), 1)
  const minProfit = Math.min(...data.map((d) => d.actualProfit), 0)
  const profitRange = maxProfit - minProfit || 1

  const barWidth = 28
  const gap = 16
  const chartHeight = 160
  const totalWidth = data.length * (barWidth + gap) + gap

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">月度趋势（近6个月）</h3>
      <div className="overflow-x-auto">
        <svg width={totalWidth} height={chartHeight + 60} className="mx-auto">
          {/* 网格线 */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1={gap}
              y1={chartHeight * (1 - ratio) + 10}
              x2={totalWidth - gap}
              y2={chartHeight * (1 - ratio) + 10}
              stroke="#e5e7eb"
              strokeDasharray="4 2"
            />
          ))}

          {data.map((item, i) => {
            const x = gap + i * (barWidth + gap)
            const countHeight = (item.orderCount / maxCount) * (chartHeight * 0.5)
            const profitRatio = (item.actualProfit - minProfit) / profitRange
            const profitHeight = profitRatio * (chartHeight * 0.4)
            const profitY = chartHeight * 0.55 + (chartHeight * 0.4 - profitHeight)

            return (
              <g key={item.label}>
                {/* 单数条形（蓝色） */}
                <rect
                  x={x}
                  y={chartHeight * 0.5 - countHeight + 10}
                  width={barWidth}
                  height={countHeight}
                  rx={4}
                  fill="#3b82f6"
                  opacity={0.85}
                />
                {/* 单数数值 */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight * 0.5 - countHeight + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#3b82f6"
                  fontWeight="600"
                >
                  {item.orderCount}
                </text>

                {/* 利润条形（绿色/红色） */}
                <rect
                  x={x}
                  y={profitY + 10}
                  width={barWidth}
                  height={Math.max(profitHeight, 2)}
                  rx={4}
                  fill={item.actualProfit >= 0 ? '#10b981' : '#ef4444'}
                  opacity={0.85}
                />
                {/* 利润数值 */}
                <text
                  x={x + barWidth / 2}
                  y={profitY + (item.actualProfit >= 0 ? -4 : profitHeight + 14) + 10}
                  textAnchor="middle"
                  fontSize="9"
                  fill={item.actualProfit >= 0 ? '#10b981' : '#ef4444'}
                  fontWeight="600"
                >
                  {item.actualProfit.toFixed(0)}
                </text>

                {/* 月份标签 */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 28}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6b7280"
                >
                  {item.month}月
                </text>
              </g>
            )
          })}

          {/* 图例 */}
          <g transform={`translate(${totalWidth / 2 - 70}, ${chartHeight + 42})`}>
            <rect x={0} y={0} width={10} height={10} rx={2} fill="#3b82f6" opacity={0.85} />
            <text x={14} y={9} fontSize="10" fill="#6b7280">单数</text>
            <rect x={60} y={0} width={10} height={10} rx={2} fill="#10b981" opacity={0.85} />
            <text x={74} y={9} fontSize="10" fill="#6b7280">实际利润</text>
          </g>
        </svg>
      </div>
    </div>
  )
}
