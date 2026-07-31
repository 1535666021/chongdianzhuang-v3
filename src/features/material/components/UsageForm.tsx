import { useState, useMemo } from 'react'
import { X } from 'lucide-react'
import { useMaterial } from '../hooks/useMaterial'
import type { MaterialUsageRecord } from '@/types'

interface Props {
  record?: MaterialUsageRecord
  onClose: () => void
}

export function UsageForm({ record, onClose }: Props) {
  const { allMaterials, addUsageRecord, updateUsageRecord } = useMaterial()

  const isEdit = !!record

  const [name, setName] = useState(record?.name || '')
  const [unit, setUnit] = useState(record?.unit || '')
  const [costPrice, setCostPrice] = useState(record?.costPrice || 0)
  const [quantity, setQuantity] = useState(record?.quantity || 1)
  const [date, setDate] = useState(record?.date || new Date().toISOString().slice(0, 10))
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const total = useMemo(() => Math.round(costPrice * quantity * 100) / 100, [costPrice, quantity])

  const materialOptions = useMemo(() => {
    const seen = new Set<string>()
    return allMaterials.filter((m) => {
      if (seen.has(m.name)) return false
      seen.add(m.name)
      return true
    })
  }, [allMaterials])

  const filteredMaterials = searchQuery
    ? materialOptions.filter((m) => m.name.includes(searchQuery)).slice(0, 20)
    : materialOptions.slice(0, 20)

  const selectMaterial = (mat: typeof materialOptions[0]) => {
    setName(mat.name)
    setUnit(mat.unit)
    setCostPrice(mat.costPrice || 0)
    setShowDropdown(false)
    setSearchQuery('')
  }

  const handleSubmit = () => {
    if (!name.trim()) return
    if (isEdit) {
      updateUsageRecord(record.id, { name, unit, costPrice, quantity, date })
    } else {
      addUsageRecord({ name, unit, costPrice, quantity, date })
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
      onClick={onClose}
      onTouchMove={(e) => e.stopPropagation()}
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
    >
      <div
        className="bg-white rounded-t-xl sm:rounded-xl w-full sm:max-w-md p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ overscrollBehavior: 'contain' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">{isEdit ? '编辑领用' : '新增领用'}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <label className="text-xs text-gray-500">材料名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setShowDropdown(true) }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder="搜索或输入材料名称"
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
            />
            {showDropdown && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded mt-1 max-h-40 overflow-y-auto shadow-lg">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索..."
                  className="w-full px-2 py-1.5 text-xs border-b border-gray-100"
                  autoFocus
                />
                {filteredMaterials.map((mat) => (
                  <button
                    key={mat.id}
                    onMouseDown={(e) => { e.preventDefault(); selectMaterial(mat) }}
                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-50 flex justify-between"
                  >
                    <span>{mat.name}</span>
                    <span className="text-gray-400">¥{mat.costPrice}/{mat.unit}</span>
                  </button>
                ))}
                {filteredMaterials.length === 0 && (
                  <div className="text-xs text-gray-400 text-center py-2">无匹配，可手动输入</div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">单位</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="个/米/卷"
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">数量</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                min={0}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500">成本单价</label>
            <input
              type="number"
              value={costPrice || ''}
              onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
              min={0}
              step="0.01"
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
            />
          </div>

          <div className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
            <span className="text-sm text-gray-500">合计</span>
            <span className="text-lg font-bold text-orange-600">¥{total.toFixed(2)}</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!name.trim() || quantity <= 0}
            className="w-full bg-blue-500 text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-50"
          >
            {isEdit ? '保存修改' : '确认领用'}
          </button>
        </div>
      </div>
    </div>
  )
}
