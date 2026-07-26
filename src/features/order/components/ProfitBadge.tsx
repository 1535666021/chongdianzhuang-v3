interface Props {
  profit: number
}

export default function ProfitBadge({ profit }: Props) {
  if (profit > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded font-medium">
        ¥{profit.toFixed(0)} 赚
      </span>
    )
  }
  if (profit < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded font-medium">
        ¥{Math.abs(profit).toFixed(0)} 亏
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-gray-50 text-gray-400 px-2 py-0.5 rounded font-medium">
      ¥0 平
    </span>
  )
}
