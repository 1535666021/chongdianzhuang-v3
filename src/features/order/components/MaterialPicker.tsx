import { useState, useMemo } from 'react'
import { addonMaterialsData, costMaterials } from '@/constants/materialData'
import { isFreeQuotaMaterial } from '@/constants/package'
import { Plus, Trash2, Search } from 'lucide-react'
import type { MaterialInput, FixedAuxInput } from '../types/completion'

interface Props {
  materials: MaterialInput[]
  fixedAux: FixedAuxInput
  onAdd: () => void
  onUpdate: (index: number, updates: Partial<MaterialInput>) => void
  onRemove: (index: number) => void
  onUpdateFixedAux: (updates: Partial<FixedAuxInput>) => void
}

export function MaterialPicker({ materials, fixedAux, onAdd, onUpdate, onRemove, onUpdateFixedAux }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showPicker, setShowPicker] = useState<number | null>(null)

  const filtered = searchQuery
    ? addonMaterialsData.filter((m) => m.name.includes(searchQuery)).slice(0, 30)
    : addonMaterialsData.slice(0, 20)

  const selectMaterial = (index: number, material: typeof addonMaterialsData[0]) => {
    onUpdate(index, {
      name: material.name,
      unit: material.unit,
      settlementPrice: material.settlementPrice || 0,
      costPrice: material.costPrice || material.settlementPrice || 0,
      spec: material.brand || '',
    })
    setShowPicker(null)
    setSearchQuery('')
  }

  // 固定辅材
  const cable = costMaterials.find((m) => m.name === '电缆')
  const pvc = costMaterials.find((m) => m.name === 'PVC')
  const breaker = costMaterials.find((m) => m.name === '漏保盒')

  return (
    <div className="space-y-4">
      {/* 增项材料 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">增项材料</h3>
          <button
            onClick={onAdd}
            className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg"
          >
            <Plus size={14} /> 添加
          </button>
        </div>

        {materials.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-4">暂无材料</div>
        )}

        {materials.map((m, index) => (
          <div key={m.id} className="bg-gray-50 rounded-lg p-3 space-y-2 mb-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={m.name}
                onClick={() => setShowPicker(index)}
                onChange={(e) => onUpdate(index, { name: e.target.value })}
                placeholder="点击选择材料"
                className="flex-1 text-sm border border-gray-200 rounded px-2 py-1.5 bg-white"
              />
              <button onClick={() => onRemove(index)} className="p-1.5 text-red-400 hover:text-red-600">
                <Trash2 size={14} />
              </button>
            </div>

            {showPicker === index && (
              <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索材料..."
                    className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded"
                    autoFocus
                  />
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {filtered.map((mat) => (
                    <button
                      key={mat.id}
                      onClick={() => selectMaterial(index, mat)}
                      className="w-full text-left text-xs px-2 py-1.5 hover:bg-gray-50 rounded flex justify-between"
                    >
                      <span>{mat.name} {mat.brand || ''}</span>
                      <span className="text-gray-400">¥{mat.settlementPrice}/{mat.unit}</span>
                    </button>
                  ))}
                  {filtered.length === 0 && <div className="text-xs text-gray-400 text-center py-2">无匹配</div>}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">客户价: ¥{m.settlementPrice.toFixed(2)}</span>
              <span className="text-gray-500">成本: ¥{m.costPrice.toFixed(2)}</span>
              <input
                type="number"
                value={m.quantity}
                onChange={(e) => onUpdate(index, { quantity: parseFloat(e.target.value) || 0 })}
                className="w-14 text-right border border-gray-200 rounded px-1 py-0.5"
              />
              <span className="text-gray-400">{m.unit}</span>
              {isFreeQuotaMaterial(m.name) && m.quantity > 0 ? (
                <span className="ml-auto font-medium text-green-600">
                  免费额内 / 应收¥{Math.max(0, m.quantity - 30) * m.settlementPrice > 0 ? `¥${(Math.max(0, m.quantity - 30) * m.settlementPrice).toFixed(2)}` : '¥0'}
                </span>
              ) : (
                <span className="ml-auto font-medium text-gray-700">
                  应收¥{m.customerSubtotal.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 固定辅材 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">固定辅材</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">电缆(米)</label>
            <input
              type="number"
              value={Number(fixedAux.cableMeters) || ''}
              onChange={(e) => onUpdateFixedAux({ cableMeters: parseFloat(e.target.value) || 0 })}
              className="w-full text-sm border border-gray-200 rounded px-2 py-1.5"
            />
            <span className="text-[10px] text-gray-400">成本¥{cable?.costPrice || 16}/米</span>
          </div>
          <div>
            <label className="text-xs text-gray-500">PVC(米)</label>
            <input
              type="number"
              value={Number(fixedAux.pvcMeters) || ''}
              onChange={(e) => onUpdateFixedAux({ pvcMeters: parseFloat(e.target.value) || 0 })}
              className="w-full text-sm border border-gray-200 rounded px-2 py-1.5"
            />
            <span className="text-[10px] text-gray-400">成本¥{pvc?.costPrice || 1}/米</span>
          </div>
          <div>
            <label className="text-xs text-gray-500">漏保盒</label>
            <div className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 bg-gray-50 text-gray-700">
              1个
            </div>
            <span className="text-[10px] text-gray-400">成本¥{breaker?.costPrice || 5}/个</span>
          </div>
          <div>
            <label className="text-xs text-gray-500">漏保</label>
            <select
              value={fixedAux.breakerType}
              onChange={(e) => onUpdateFixedAux({ breakerType: e.target.value as 'C25' | 'C40' | 'C40A' | '' })}
              className="w-full text-sm border border-gray-200 rounded px-2 py-1.5"
            >
              <option value="">无</option>
              <option value="C25">C25 (¥26.8)</option>
              <option value="C40">C40 (¥26.8)</option>
              <option value="C40A">C40A (¥46.5)</option>
            </select>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">辅材成本合计</span>
            <span className="font-medium text-orange-600">
              ¥{(fixedAux.cableMeters * (cable?.costPrice || 16) + fixedAux.pvcMeters * (pvc?.costPrice || 1) + (breaker?.costPrice || 5) + ({ C25: 26.8, C40: 26.8, C40A: 46.5 } as Record<string,number>)[fixedAux.breakerType] || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
