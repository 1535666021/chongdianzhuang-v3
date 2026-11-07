import { useState } from 'react'
import { Link2 } from 'lucide-react'
import { getAllAddonMaterials } from '@/shared/utils/addonMaterialsResolver'
import { getCostMapping, setCostMapping } from '@/shared/storage/costMappingStorage'
import { findCostPrice } from '@/shared/utils/orderCalc'
import { useToast } from '@/shared/hooks/useToast'
import { formatCurrency } from '@/shared/utils/format'
import CostItemPicker from '@/shared/components/CostItemPicker'

interface Row { name: string; state: 'unbound' | 'fuzzy' | 'stale'; hint: string }

/** P0-241件3b：设置页「绑定对账」——列出全部未绑定/模糊匹配/映射失效增项名，逐个选绑。
 *  判定=findCostPrice 匹配链出口：null=未绑定；无显式映射但命中=模糊；有映射但出口 null=映射失效。
 */
export default function BindReconcilePanel() {
  const toast = useToast()
  const [bindFor, setBindFor] = useState<string | null>(null)
  const [, forceRefresh] = useState(0)

  const names = [...new Set(getAllAddonMaterials().map((m) => m.name))]
  const rows: Row[] = []
  for (const name of names) {
    const mapped = getCostMapping(name)
    const price = findCostPrice(name)
    if (mapped && price === null) rows.push({ name, state: 'stale', hint: `映射到「${mapped}」但成本表无此条目` })
    else if (!mapped && price === null) rows.push({ name, state: 'unbound', hint: '未绑定（成本按 0 计）' })
    else if (!mapped && price !== null) rows.push({ name, state: 'fuzzy', hint: `自动命中 ${formatCurrency(price)}（同名/模糊，建议精确绑定）` })
  }
  const stateColor = { unbound: 'text-red-600', fuzzy: 'text-amber-600', stale: 'text-orange-600' } as const

  return (
    <div className="p-3 space-y-2 bg-white rounded-xl border border-gray-100">
      <p className="text-xs text-gray-400">全部未绑定 / 模糊匹配 / 映射失效的增项名（运行时合并口径，含自定义品牌）。逐个「选绑」后从此清单消失。</p>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400 py-2">全部增项均已精确绑定，无对账项 ✓</p>
      ) : (
        rows.map((r) => (
          <div key={r.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-b-0 gap-2">
            <span className="text-sm text-gray-700" style={{ wordBreak: 'break-all' }}>{r.name}</span>
            <span className={`text-[10px] ${stateColor[r.state]} shrink-0`}>{r.hint}</span>
            <button
              type="button"
              onClick={() => setBindFor(r.name)}
              className="text-xs text-blue-600 underline shrink-0 flex items-center gap-0.5"
            ><Link2 size={10} />选绑</button>
          </div>
        ))
      )}
      {bindFor && (
        <CostItemPicker
          materialName={bindFor}
          selectedCostName={getCostMapping(bindFor)}
          onSelect={(costName) => {
            setCostMapping(bindFor, costName)
            setBindFor(null)
            forceRefresh((v) => v + 1)
            toast.toast.success('已绑定')
          }}
          onClose={() => setBindFor(null)}
        />
      )}
    </div>
  )
}
