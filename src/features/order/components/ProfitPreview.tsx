import { useState } from 'react'
import type { ProfitPreview as ProfitData } from '../types/completion'
import CostBindModal from '@/features/material/components/CostBindModal'

interface Props {
  data: ProfitData
  onRefresh?: () => void
}

function fmt(n: number): string {
  return '¥' + (n || 0).toFixed(2)
}

function BreakdownLine({ label, amount, color = 'text-gray-500' }: { label: string; amount: string; color?: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className={color}>{label}</span>
      <span className={color}>{amount}</span>
    </div>
  )
}

export function ProfitPreview({ data, onRefresh }: Props) {
  const isProfit = data.actualProfit >= 0
  const { breakdown } = data
  const [rebindTarget, setRebindTarget] = useState<string | null>(null)

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">利润预览</h3>

      {/* 1. 客户应收 */}
      <div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">客户应收</span>
          <span className="font-medium text-gray-800">{fmt(data.customerReceivable)}</span>
        </div>
        {breakdown.receivableItems.length > 0 && (
          <div className="mt-1 space-y-0.5 pl-4 border-l-2 border-gray-200">
            {breakdown.receivableItems.map((item, i) => (
              <BreakdownLine key={i} label={item.calc} amount={fmt(item.amount)} />
            ))}
            <div className="border-t border-dashed border-gray-200 pt-0.5">
              <BreakdownLine label="合计" amount={fmt(data.customerReceivable)} color="text-gray-700 font-medium" />
            </div>
          </div>
        )}
      </div>

      {/* 2. 平台扣点 */}
      <div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">平台扣点</span>
          <span className="font-medium text-red-500">-{fmt(data.platformFee)}</span>
        </div>
        <div className="mt-1 pl-4 border-l-2 border-gray-200">
          <BreakdownLine
            label={`客户应收 ${fmt(data.customerReceivable)} × ${(breakdown.platformRate * 100).toFixed(0)}%`}
            amount={'-' + fmt(data.platformFee)}
            color="text-red-400"
          />
        </div>
      </div>

      {/* 3. 服务费 */}
      <div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">服务费</span>
          <span className="font-medium text-blue-600">+{fmt(data.serviceFee)}</span>
        </div>
        <div className="mt-1 pl-4 border-l-2 border-gray-200">
          <BreakdownLine label={breakdown.serviceFeeLabel} amount={'+' + fmt(data.serviceFee)} color="text-blue-400" />
        </div>
      </div>

      {/* 4. 材料成本 */}
      <div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">材料成本</span>
          <span className="font-medium text-orange-500">-{fmt(data.materialCost)}</span>
        </div>
        {breakdown.materialItems.length > 0 && (
          <div className="mt-1 space-y-0.5 pl-4 border-l-2 border-gray-200">
            {breakdown.materialItems.map((item, i) => (
              <div key={i} className="flex items-center">
                <div className="flex-1"><BreakdownLine label={item.calc} amount={'-' + fmt(item.amount)} color="text-orange-400" /></div>
                {item.materialName && <button className="ml-2 text-xs text-blue-500" onClick={() => setRebindTarget(item.materialName ?? null)}>重新绑定</button>}
              </div>
            ))}
            <div className="border-t border-dashed border-gray-200 pt-0.5">
              <BreakdownLine label="合计" amount={'-' + fmt(data.materialCost)} color="text-orange-600 font-medium" />
            </div>
          </div>
        )}
      </div>

      {/* 5. 实际利润 */}
      <div className="border-t border-gray-100 pt-3">
        <div className="flex justify-between">
          <span className="font-semibold text-gray-800">实际利润</span>
          <span className={`font-bold text-lg ${isProfit ? 'text-green-600' : 'text-red-500'}`}>
            {fmt(data.actualProfit)}
          </span>
        </div>
        <div className="mt-1 space-y-0.5 pl-4 border-l-2 border-gray-200 text-xs">
          <BreakdownLine label="客户应收" amount={fmt(data.customerReceivable)} />
          <BreakdownLine label="平台扣点" amount={'-' + fmt(data.platformFee)} color="text-red-400" />
          <BreakdownLine label="服务费" amount={'+' + fmt(data.serviceFee)} color="text-blue-400" />
          <BreakdownLine label="材料成本" amount={'-' + fmt(data.materialCost)} color="text-orange-400" />
          <div className="border-t border-dashed border-gray-200 pt-0.5">
            <BreakdownLine label="=" amount={fmt(data.actualProfit)} color={isProfit ? 'text-green-600 font-medium' : 'text-red-500 font-medium'} />
          </div>
        </div>
      </div>

      {!isProfit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-600 text-center">
          当前订单亏损，请检查材料成本和客户应收
        </div>
      )}
      </div>
      {rebindTarget && <CostBindModal materialName={rebindTarget} onClose={() => setRebindTarget(null)} onBound={() => { setRebindTarget(null); onRefresh?.() }} />}
    </>
  )
}
