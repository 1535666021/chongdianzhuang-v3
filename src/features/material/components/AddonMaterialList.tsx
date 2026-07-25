import { useState, useMemo } from 'react'
import type { Material } from '@/types'
import AddonBrandFilter from './AddonBrandFilter'
import { Pencil, Check, X, AlertCircle } from 'lucide-react'

interface Props {
  materials: Material[]
  onUpdateCostPrice: (id: string, price: number) => void
  onUpdateFreeQuota: (id: string, quota: number) => void
}

export default function AddonMaterialList({
  materials,
  onUpdateCostPrice,
  onUpdateFreeQuota,
}: Props) {
  const [selectedBrand, setSelectedBrand] = useState<string>('全部')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editField, setEditField] = useState<'costPrice' | 'freeQuota' | null>(null)
  const [editValue, setEditValue] = useState('')

  const filtered = useMemo(() => {
    if (selectedBrand === '全部') return materials
    return materials.filter((m) => m.brand === selectedBrand)
  }, [materials, selectedBrand])

  const startEdit = (m: Material, field: 'costPrice' | 'freeQuota') => {
    setEditingId(m.id)
    setEditField(field)
    if (field === 'costPrice') {
      setEditValue(m.costPrice?.toString() ?? '')
    } else {
      setEditValue((m.freeQuota ?? 0).toString())
    }
  }

  const confirmEdit = (id: string) => {
    const val = parseFloat(editValue)
    if (isNaN(val) || val < 0) return
    if (editField === 'costPrice') {
      onUpdateCostPrice(id, val)
    } else {
      onUpdateFreeQuota(id, val)
    }
    setEditingId(null)
    setEditField(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditField(null)
  }

  return (
    <div className="space-y-3">
      <AddonBrandFilter selected={selectedBrand} onChange={setSelectedBrand} />

      <div className="text-xs text-gray-500 px-1">
        共 {filtered.length} 条增项
      </div>

      <div className="space-y-2">
        {filtered.map((m) => (
          <div
            key={m.id}
            className="bg-white rounded-lg border border-gray-200 p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{m.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {m.brand} · {m.category} · {m.unit}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  结算价：{m.settlementPrice.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">成本价：</span>
                {editingId === m.id && editField === 'costPrice' ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.1"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-16 px-1.5 py-0.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                    <button onClick={() => confirmEdit(m.id)} className="p-0.5 text-green-600">
                      <Check size={14} />
                    </button>
                    <button onClick={cancelEdit} className="p-0.5 text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(m, 'costPrice')}
                    className={`flex items-center gap-1 text-sm ${
                      m.costPrice == null ? 'text-red-500' : 'text-gray-700'
                    }`}
                  >
                    {m.costPrice == null ? (
                      <>
                        <AlertCircle size={14} />
                        <span>待补录</span>
                      </>
                    ) : (
                      <span>{m.costPrice.toFixed(2)}</span>
                    )}
                    <Pencil size={12} className="text-gray-400" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">免费额：</span>
                {editingId === m.id && editField === 'freeQuota' ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.1"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-16 px-1.5 py-0.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                    <button onClick={() => confirmEdit(m.id)} className="p-0.5 text-green-600">
                      <Check size={14} />
                    </button>
                    <button onClick={cancelEdit} className="p-0.5 text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(m, 'freeQuota')}
                    className="flex items-center gap-1 text-sm text-gray-700"
                  >
                    <span>{m.freeQuota ?? 0}</span>
                    <Pencil size={12} className="text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
