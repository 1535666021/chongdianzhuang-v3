import { useState, useMemo, useEffect } from 'react'
import { X } from 'lucide-react'
import { useMaterial } from '../hooks/useMaterial'
import { useInventoryStore } from '@/stores/inventoryStore'
import type { MaterialUsageRecord } from '@/types'
import { formatCurrency } from '@/shared/utils/format'
import { getAllCostMaterials } from '@/shared/utils/costMaterialsResolver'
import { useSettingsStore } from '@/stores/settingsStore'
import { useToast } from '@/shared/hooks/useToast'

interface Props {
  record?: MaterialUsageRecord
  onClose: () => void
}

export function UsageForm({ record, onClose }: Props) {
  // P0-241-R2 FAIL-2：入库/领用选择源锁定成本表（costMaterials）——新入库禁选增项表材料；存量附加区=有库存记录的存量条目仍可选
  const { costMaterials, addonMaterials, addUsageRecord, updateUsageRecord } = useMaterial()
  const inventory = useInventoryStore((st) => st.inventory)

  const isEdit = !!record

  const [name, setName] = useState(record?.name || '')
  const [unit, setUnit] = useState(record?.unit || '')
  const [costPrice, setCostPrice] = useState(record?.costPrice || 0)
  const [quantity, setQuantity] = useState(record?.quantity || 1)
  const [date, setDate] = useState(record?.date || new Date().toISOString().slice(0, 10))
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    document.body.classList.add('modal-open')
    return () => { document.body.classList.remove('modal-open') }
  }, [])

  const total = useMemo(() => Math.round(costPrice * quantity * 100) / 100, [costPrice, quantity])

  const materialOptions = useMemo(() => {
    const seen = new Set<string>()
    const base = costMaterials.filter((m) => {
      if (seen.has(m.name)) return false
      seen.add(m.name)
      return true
    })
    // 存量附加区：有库存记录但不在成本表的存量条目仍可选（存量数据禁动；名称反查 addonMaterials）
    const baseIds = new Set(costMaterials.map((m) => m.id))
    const stockOnly = Object.entries(inventory)
      .filter(([id]) => !baseIds.has(id))
      .map(([id]) => {
        const found = addonMaterials.find((m) => m.id === id)
        return { id, name: found?.name ?? id, unit: found?.unit ?? '个', costPrice: 0, category: found?.category ?? '存量' }
      })
      .filter((m) => { if (seen.has(m.name)) return false; seen.add(m.name); return true })
    return [...base, ...stockOnly]
  }, [costMaterials, addonMaterials, inventory])

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

  // P0-241件4：入库改价联动——成本表条目当前价（出口口径，R-10.1 库存日志按当时价不动）
  const toast = useToast()
  const setCostPriceAction = useSettingsStore((s) => s.setCostPrice)
  const costEntry = useMemo(() => getAllCostMaterials().find((m) => m.name === name.trim()) || null, [name])
  const costSyncHint = useMemo(() => {
    if (!costEntry || !name.trim()) return ''
    const cur = costEntry.costPrice ?? 0
    if (Math.abs((costPrice || 0) - cur) < 0.005) return ''
    return `成本表当前 ${formatCurrency(cur)}，与本次入库价 ${formatCurrency(costPrice || 0)} 不一致`
  }, [costEntry, costPrice, name])
  const syncCostPrice = () => {
    if (!costEntry) return
    setCostPriceAction(costEntry.id, costPrice || 0)
    toast.toast.success('已同步成本表，以后所有单都按新价')
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
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-t-xl sm:rounded-xl w-full sm:max-w-md p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
              // P0-125：焦点落入下拉内部（点内部搜索框等）不关闭；否则150ms后关闭（兼容候选onMouseDown preventDefault点选路径）
              onBlur={(e) => {
                const rt = e.relatedTarget as HTMLElement | null
                if (rt && rt.closest('.usage-dropdown')) return
                setTimeout(() => setShowDropdown(false), 150)
              }}
              placeholder="搜索或输入材料名称"
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
            />
            {showDropdown && (
              <div className="usage-dropdown absolute z-10 w-full bg-white border border-gray-200 rounded mt-1 max-h-40 overflow-y-auto shadow-lg">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索..."
                  className="w-full px-2 py-1.5 text-xs border-b border-gray-100"
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
          {/* P0-241件4：非阻断提示，不点也能正常提交 */}
          {costSyncHint && (
            <div className="flex items-center justify-between gap-2 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 text-xs">
              <span className="text-amber-700">{costSyncHint}</span>
              <button type="button" onClick={syncCostPrice} className="text-amber-800 underline shrink-0">同步到成本表</button>
            </div>
          )}

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
            <span className="text-lg font-bold text-orange-600">{formatCurrency(total)}</span>
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
