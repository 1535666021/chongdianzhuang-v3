import { useState, useMemo } from 'react'
import CostItemPicker from '@/shared/components/CostItemPicker'
import { formatCurrency } from '@/shared/utils/format'
import type { FullMaterialCostItem } from '@/shared/utils/orderCalc'
import { getAllCostMaterials } from '@/shared/utils/costMaterialsResolver'
import { setCostMapping, getCostMapping } from '@/shared/storage/costMappingStorage'

export interface CostItemsTableResult {
  total: number
  unmatched: string[]
  items?: FullMaterialCostItem[]
}

/** P0-191-R2/R3 建、P0-194 抽共享：成本逐项明细表+行内改绑/绑定。
 * 数据源=fullCostResult.items（金额读 amount 禁自算）；改绑走 onCostRebound 通知重算。
 * 勘测弹窗（SurveyProfitPreview）与完工详情页（OrderDetail）共用本唯一实现。
 */
export function CostItemsTable({
  fullCostResult,
  onCostRebound,
}: {
  fullCostResult?: CostItemsTableResult
  onCostRebound?: () => void
}) {
  const [pickerFor, setPickerFor] = useState<string | null>(null)
  const unitMeta = useMemo(() => getAllCostMaterials(), [])
  const unitOf = (name: string) => unitMeta.find((m) => m.name === name)?.unit || ''
  if (!fullCostResult) return <div className="text-xs text-gray-400 py-0.5">—（预估不可用）</div>
  return (
    <div className="mt-1 border-t border-dashed border-gray-200 pt-1">
      {(fullCostResult.items || []).map((item) => {
        const isUnmatched = fullCostResult!.unmatched.includes(item.name)
        const isFreeRow = item.amount === 0 && item.unitCost === 0
        return (
          <div key={item.name} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-2 items-center py-0.5 text-xs">
            <span className="text-gray-700 truncate">{item.name}</span>
            <span className="text-gray-500">{item.quantity}{unitOf(getCostMapping(item.name) || item.name)}</span>
            <span className="text-gray-500">¥{item.unitCost}</span>
            <span className="text-gray-700 text-right w-14">{formatCurrency(item.amount)}</span>
            <span className="w-12 text-right">
              {isUnmatched ? (
                <button type="button" className="text-orange-600 underline" onClick={() => setPickerFor(item.name)}>绑定</button>
              ) : isFreeRow ? (
                <span className="text-gray-300">—</span>
              ) : (
                <button type="button" className="text-blue-600 underline" onClick={() => setPickerFor(item.name)}>改绑</button>
              )}
            </span>
          </div>
        )
      })}
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-2 items-center py-0.5 text-xs font-medium border-t border-gray-100 mt-0.5">
        <span className="text-gray-700">合计</span><span /><span /><span className="text-right w-14">{formatCurrency(fullCostResult.total)}</span><span className="w-12" />
      </div>
      {fullCostResult.unmatched.length > 0 && (
        <div className="py-0.5 text-xs" style={{ color: '#ea580c' }}>
          <span>⚠ {fullCostResult.unmatched.join('、')}未绑定成本价，预估偏低</span>
        </div>
      )}
      {pickerFor && (
        <CostItemPicker
          materialName={pickerFor}
          selectedCostName={getCostMapping(pickerFor)}
          onSelect={(costName) => {
            setCostMapping(pickerFor, costName)
            setPickerFor(null)
            onCostRebound?.()
          }}
          onClose={() => setPickerFor(null)}
        />
      )}
    </div>
  )
}

export default CostItemsTable
