import { useState } from 'react'
import { costMaterials } from '@/constants/costMaterialData'
import { useSettingsStore } from '@/stores/settingsStore'
import { Pencil, Check, X } from 'lucide-react'

export default function CostSheetManager() {
  const { costPriceOverrides, setCostPrice, getCostPrice } = useSettingsStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const startEdit = (material: (typeof costMaterials)[0]) => {
    const currentPrice = getCostPrice(material.id, material.costPrice ?? 0)
    setEditingId(material.id)
    setEditValue(String(currentPrice))
  }

  const saveEdit = (id: string) => {
    const price = parseFloat(editValue)
    if (!isNaN(price) && price >= 0) {
      setCostPrice(id, price)
    }
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  return (
    <div>
      <div className="text-xs text-gray-500 mb-3">
        共 {costMaterials.length} 项辅材，点击价格可直接编辑
      </div>
      <div className="space-y-2">
        {costMaterials.map((material) => {
          const currentPrice = getCostPrice(material.id, material.costPrice ?? 0)
          const isEditing = editingId === material.id
          const hasOverride = costPriceOverrides[material.id] !== undefined

          return (
            <div
              key={material.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                hasOverride ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{material.name}</div>
                <div className="text-xs text-gray-500">
                  {material.category} · {material.unit}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                {isEditing ? (
                  <>
                    <input
                      type="number"
                      step="0.1"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(material.id)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={() => saveEdit(material.id)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => startEdit(material)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <span className={hasOverride ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                      ¥{currentPrice.toFixed(1)}
                    </span>
                    <Pencil size={12} className="text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
