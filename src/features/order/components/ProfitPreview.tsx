import type { ProfitPreview as ProfitData } from '../types/completion'

interface Props {
  data: ProfitData
}

function fmt(n: number): string {
  return '¥' + (n || 0).toFixed(2)
}

export function ProfitPreview({ data }: Props) {
  const isProfit = data.actualProfit >= 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">利润预览</h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">客户应收</span>
          <span className="font-medium text-gray-800">{fmt(data.customerReceivable)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">平台扣点</span>
          <span className="font-medium text-red-500">-{fmt(data.platformFee)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">服务费</span>
          <span className="font-medium text-blue-600">+{fmt(data.serviceFee)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">材料成本</span>
          <span className="font-medium text-orange-500">-{fmt(data.materialCost)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">人工成本</span>
          <span className="font-medium text-orange-500">-{fmt(data.laborCost)}</span>
        </div>
        <div className="border-t border-gray-100 pt-2 flex justify-between">
          <span className="font-semibold text-gray-800">实际利润</span>
          <span className={`font-bold text-lg ${isProfit ? 'text-green-600' : 'text-red-500'}`}>
            {fmt(data.actualProfit)}
          </span>
        </div>
      </div>

      {!isProfit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-600 text-center">
          ⚠️ 当前订单亏损，请检查材料成本和客户应收
        </div>
      )}
    </div>
  )
}
