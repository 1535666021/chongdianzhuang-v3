import { useState } from 'react'
import type { Material } from '@/types'
import { Edit2, Trash2, Check, X } from 'lucide-react'

interface MaterialCardProps {
  material: Material
  onUpdate: (id: string, updates: Partial<Material>) => void
  onDelete: (id: string) => void
}

export default function MaterialCard({ material, onUpdate, onDelete }: MaterialCardProps) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: material.name,
    unit: material.unit,
    settlementPrice: String(material.settlementPrice),
    costPrice: String(material.costPrice),
  })

  const isFixed = material.isFixed === true

  const handleSave = () => {
    onUpdate(material.id, {
      name: form.name,
      unit: form.unit,
      settlementPrice: parseFloat(form.settlementPrice) || 0,
      costPrice: parseFloat(form.costPrice) || 0,
    })
    setEditing(false)
  }

  const handleDelete = () => {
    if (window.confirm(`确定删除「${material.name}」吗？`)) {
      onDelete(material.id)
    }
  }

  if (editing) {
    return (
      <div className="bg-white rounded-lg border border-blue-200 p-3 mb-2 shadow-sm">
        <div className="space-y-2">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-400"
            placeholder="名称"
          />
          <input
            type="text"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-400"
            placeholder="单位"
          />
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.settlementPrice}
              onChange={(e) => setForm({ ...form, settlementPrice: e.target.value })}
              className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-400"
              placeholder="结算价（元）"
            />
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
              className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-400"
              placeholder="成本价（元）"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setEditing(false)}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
            >
              <X size={16} />
            </button>
            <button
              onClick={handleSave}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
            >
              <Check size={16} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 mb-2 shadow-sm flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{material.name}</span>
          {isFixed && (
            <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded shrink-0">
              固定
            </span>
          )}
          <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded shrink-0">
            {material.category}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          结算 ¥{material.settlementPrice.toFixed(2)} ·
          成本 ¥{material.costPrice !== null ? (material.costPrice !== null ? material.costPrice.toFixed(2) : "--") : "待补录"} · {material.unit}
        </div>
      </div>
      {!isFixed && (
        <div className="flex gap-1 ml-2 shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
