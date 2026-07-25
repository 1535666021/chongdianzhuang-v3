import { useState } from 'react'
import type { Material } from '@/types'
import { Pencil, Check, X } from 'lucide-react'

interface Props {
  materials: Material[]
  onUpdateCostPrice: (id: string, price: number) => void
}

export default function CostMaterialList({ materials, onUpdateCostPrice }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const startEdit = (m: Material) => {
    setEditingId(m.id)
    setEditValue(m.costPrice?.toString() ?? '')
  }

  const confirmEdit = (id: string) => {
    const val = parseFloat(editValue)
    if (!isNaN(val) && val >= 0) {
      onUpdateCostPrice(id, val)
    }
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  return (
    <div className="space-y-2">
      {materials.map((m) => (
        <div
          key={m.id}
          className="bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between"
        >
          <div className="flex-1">
            <div className="font-medium text-gray-900">{m.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {m.category} · {m.unit}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {editingId === m.id ? (
              <>
                <input
                  type="number"
                  step="0.1"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-20 px-2 py-1 text-right text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={() => confirmEdit(m.id)}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={cancelEdit}
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <button
                onClick={() => startEdit(m)}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 rounded-md text-sm text-gray-700 hover:bg-gray-100"
              >
                <span>成本价：{m.costPrice?.toFixed(2) ?? '-'}</span>
                <Pencil size={14} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
