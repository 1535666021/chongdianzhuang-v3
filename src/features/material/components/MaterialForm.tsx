import { useState } from 'react'
import type { Material, MaterialCategory } from '@/types'
import { Plus } from 'lucide-react'

interface MaterialFormProps {
  onAdd: (material: Material) => void
}

const CATEGORIES: MaterialCategory[] = ['线缆', '管材', '辅材', '工具', '其他']

export default function MaterialForm({ onAdd }: MaterialFormProps) {
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({
    name: '',
    unit: '',
    costPrice: '',
    category: '其他' as MaterialCategory,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.unit.trim() || !form.costPrice) return

    const now = Date.now()
    const material: Material = {
      id: 'mat_' + now,
      name: form.name.trim(),
      unit: form.unit.trim(),
      costPrice: parseFloat(form.costPrice) || 0,
      settlementPrice: parseFloat(form.costPrice) || 0,
      category: form.category,
      stock: 0,
      minStock: 0,
      createdAt: now,
      updatedAt: now,
    }

    onAdd(material)
    setForm({ name: '', unit: '', costPrice: '', category: '其他' })
    setShow(false)
  }

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-sm flex items-center justify-center gap-1.5 hover:border-blue-400 hover:text-blue-500 transition-colors"
      >
        <Plus size={16} />
        新增材料
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg border border-blue-200 p-3 mb-3 shadow-sm"
    >
      <div className="space-y-2">
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="材料名称"
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-400"
          required
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            placeholder="单位（如：米、个）"
            className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-400"
            required
          />
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.costPrice}
            onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
            placeholder="单价（元）"
            className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-400"
            required
          />
        </div>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value as MaterialCategory })}
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-400 bg-white"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="flex gap-2 justify-end pt-1">
          <button
            type="button"
            onClick={() => setShow(false)}
            className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="submit"
            className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      </div>
    </form>
  )
}
