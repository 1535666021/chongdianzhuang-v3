import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useMaterial } from '../hooks/useMaterial'
import { useInventoryStore } from '@/stores/inventoryStore'
import { getStockStatus, getStatusColor } from '../types/inventory'

type FilterType = 'all' | '紧张' | '缺货'

export default function InventoryPage() {
  const navigate = useNavigate()
  const { allMaterials } = useMaterial()
  const inventory = useInventoryStore((s) => s.inventory)
  const stockIn = useInventoryStore((s) => s.stockIn)
  const stockOut = useInventoryStore((s) => s.stockOut)
  const stockCheck = useInventoryStore((s) => s.stockCheck)
  const setMinStock = useInventoryStore((s) => s.setMinStock)

  const [filter, setFilter] = useState<FilterType>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState('')
  const [editMin, setEditMin] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editMode, setEditMode] = useState<'in' | 'out' | 'check'>('in')

  const items = useMemo(() => {
    return allMaterials.map((m) => {
      const inv = inventory[m.id]
      const current = inv?.currentStock ?? 0
      const min = inv?.minStock ?? (m.isFixed ? 20 : 5)
      const status = getStockStatus(current, min)
      return {
        materialId: m.id,
        name: m.name,
        category: m.category,
        unit: m.unit,
        currentStock: current,
        minStock: min,
        status,
        statusColor: getStatusColor(status),
      }
    }).filter((item) => {
      if (filter === 'all') return true
      return item.status === filter
    })
  }, [allMaterials, inventory, filter])

  const handleSubmit = () => {
    if (!editingId) return
    const qty = parseFloat(editQty)
    if (isNaN(qty) || qty < 0) return

    const material = allMaterials.find((m) => m.id === editingId)
    if (!material) return

    if (editMode === 'in') {
      stockIn(editingId, material.name, qty, editNotes)
    } else if (editMode === 'out') {
      stockOut(editingId, material.name, qty, editNotes)
    } else if (editMode === 'check') {
      stockCheck(editingId, material.name, qty, editNotes)
    }

    // 更新最低库存
    const min = parseFloat(editMin)
    if (!isNaN(min) && min >= 0) {
      setMinStock(editingId, min)
    }

    setEditingId(null)
    setEditQty('')
    setEditMin('')
    setEditNotes('')
  }

  const statusCounts = useMemo(() => {
    const all = allMaterials.map((m) => {
      const inv = inventory[m.id]
      const current = inv?.currentStock ?? 0
      const min = inv?.minStock ?? (m.isFixed ? 20 : 5)
      return getStockStatus(current, min)
    })
    return {
      充足: all.filter((s) => s === '充足').length,
      紧张: all.filter((s) => s === '紧张').length,
      缺货: all.filter((s) => s === '缺货').length,
    }
  }, [allMaterials, inventory])

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white p-4 border-b border-gray-200 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-semibold text-lg">库存管理</h1>
      </div>

      {/* 统计卡片 */}
      <div className="p-3 grid grid-cols-3 gap-2">
        {(['充足', '紧张', '缺货'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s === '充足' ? 'all' : s)}
            className={`p-2 rounded-xl text-center border ${
              filter === s || (filter === 'all' && s === '充足')
                ? 'bg-white border-gray-200'
                : 'bg-white border-gray-100 opacity-60'
            }`}
          >
            <div className="text-lg font-bold" style={{ color: getStatusColor(s) }}>
              {statusCounts[s]}
            </div>
            <div className="text-xs text-gray-500">{s}</div>
          </button>
        ))}
      </div>

      {/* 筛选 */}
      <div className="px-3 pb-2 flex gap-2">
        {(['all', '紧张', '缺货'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs border ${
              filter === f
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {f === 'all' ? '全部' : f}
          </button>
        ))}
      </div>

      {/* 库存列表 */}
      <div className="px-3 space-y-2">
        {items.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            暂无{filter === 'all' ? '' : filter}材料
          </div>
        )}
        {items.map((item) => (
          <div
            key={item.materialId}
            className="bg-white border border-gray-200 rounded-xl p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.statusColor }}
                />
                <span className="text-sm font-medium">{item.name}</span>
                <span className="text-xs text-gray-400">{item.category}</span>
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: item.statusColor }}
              >
                {item.status}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <div className="text-gray-600">
                库存: <span className="font-semibold">{item.currentStock}</span>{item.unit}
                <span className="text-gray-400 mx-1">/</span>
                最低: {item.minStock}{item.unit}
              </div>
              <button
                onClick={() => {
                  setEditingId(item.materialId)
                  setEditQty('')
                  setEditMin(String(item.minStock))
                  setEditNotes('')
                  setEditMode('in')
                }}
                className="text-blue-600 text-xs px-2 py-1 border border-blue-200 rounded active:bg-blue-50"
              >
                操作
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 编辑弹窗 */}
      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {allMaterials.find((m) => m.id === editingId)?.name}
              </h3>
              <button onClick={() => setEditingId(null)} className="p-1">
                <ArrowLeft size={20} className="rotate-90" />
              </button>
            </div>

            <div className="flex gap-2">
              {(['in', 'out', 'check'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setEditMode(mode)}
                  className={`flex-1 py-2 rounded-lg text-sm border ${
                    editMode === mode
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {mode === 'in' ? '入库' : mode === 'out' ? '出库' : '盘点'}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-600">
                {editMode === 'check' ? '实际库存' : '数量'} ({allMaterials.find((m) => m.id === editingId)?.unit})
              </label>
              <input
                type="number"
                value={editQty}
                onChange={(e) => setEditQty(e.target.value)}
                placeholder={editMode === 'check' ? '输入实际库存' : '输入数量'}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-600">最低库存</label>
              <input
                type="number"
                value={editMin}
                onChange={(e) => setEditMin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-600">备注</label>
              <input
                type="text"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="可选"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleSubmit}
              className="w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-medium active:bg-blue-700"
            >
              确认{editMode === 'in' ? '入库' : editMode === 'out' ? '出库' : '盘点'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
