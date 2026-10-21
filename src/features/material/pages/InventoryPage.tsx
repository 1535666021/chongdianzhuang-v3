import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useMaterial } from '../hooks/useMaterial'
import { useInventoryStore } from '@/stores/inventoryStore'
import { getStockStatus, getStatusColor } from '../types/inventory'
import { adjustStock } from '@/shared/utils/stockCalc'
import { stockLogStorage } from '@/shared/storage/stockLogStorage'

type FilterType = 'all' | '紧张' | '缺货'

export default function InventoryPage() {
  const navigate = useNavigate()
  const { allMaterials } = useMaterial()
  const inventory = useInventoryStore((s) => s.inventory)
  const setMinStock = useInventoryStore((s) => s.setMinStock)

  const [filter, setFilter] = useState<FilterType>('all')
  // P0-206-M：本月现金支出按月翻页（R-11.3：当月入库金额合计，import来源除外）
  const [monthOffset, setMonthOffset] = useState(0)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const cashMonth = useMemo(() => {
    const d = new Date()
    const t = new Date(d.getFullYear(), d.getMonth() + monthOffset, 1)
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`
  }, [monthOffset])
  const cashOut = useMemo(
    () => stockLogStorage.sumMonthAmount(cashMonth, ['import']),
    // inventory 为依赖：任何出入库后按最新日志重算
    [cashMonth, inventory]
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState('')
  const [editMin, setEditMin] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editMode, setEditMode] = useState<'in' | 'out' | 'check'>('in')

  // P0-202-R2 G6a：弹窗打开期间锁 body 滚动（编辑/批量导入任一弹窗开着即锁，全关还原）
  // P0-202-R4 G2：同步挂/摘 modal-open——index.css:230 既有规范 body.modal-open .app-tabbar 自动隐藏，
  // 面板贴视口底，确认键完整露出；关闭/卸载即恢复（禁改 index.css/BottomTabBar/面板内部）
  useEffect(() => {
    const open = editingId !== null || showImport
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) document.body.classList.add('modal-open')
    else document.body.classList.remove('modal-open')
    return () => {
      document.body.style.overflow = ''
      document.body.classList.remove('modal-open')
    }
  }, [editingId, showImport])

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

    // P0-206-M：一切变动走 adjustStock 唯一出口（R-11.11）；盘点=设值换算为增量
    const current = inventory[editingId]?.currentStock ?? 0
    if (editMode === 'in') {
      adjustStock(material.name, qty, 'manual', '', { reason: editNotes })
    } else if (editMode === 'out') {
      adjustStock(material.name, -qty, 'manual', '', { reason: editNotes })
    } else if (editMode === 'check') {
      adjustStock(material.name, qty - current, 'manual', '', { reason: editNotes })
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

      {/* P0-206-M：本月现金支出大字一行（R-11.3；不进统计页） */}
      <div className="px-3 pt-3">
        <div className="bg-white border border-orange-200 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button onClick={() => setMonthOffset((v) => v - 1)} className="px-2 py-1 text-gray-500 border border-gray-200 rounded text-xs">‹</button>
            <span className="text-sm text-gray-600">{cashMonth.replace('-', '年')}月</span>
            <button onClick={() => setMonthOffset((v) => Math.min(0, v + 1))} disabled={monthOffset >= 0} className="px-2 py-1 text-gray-500 border border-gray-200 rounded text-xs disabled:opacity-30">›</button>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-400">现金支出 </span>
            <span className="text-xl font-bold text-gray-800">¥{cashOut}</span>
          </div>
        </div>
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
        <button
          onClick={() => setShowImport(true)}
          className="ml-auto px-3 py-1 rounded-full text-xs border bg-white text-gray-600 border-gray-200"
        >
          批量导入
        </button>
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
        // P0-202-R2 G6c：蒙层 touch 拦截（滚动权不再落到背后列表）
        <div className="fixed inset-0 bg-black/50 flex items-end z-[9999]" onTouchMove={(e) => e.preventDefault()}>
          {/* P0-202-R2 G6b：面板独立滚动容器（限高+内部滚动+链式拦截不外溢） */}
          <div className="bg-white w-full rounded-t-2xl p-4 space-y-3 max-h-[80vh] overflow-y-auto overscroll-contain">
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
      {/* P0-206-M：批量导入（R-11.2③ 期初建账不计现金 R-11.3；逐行"名称 数量 [成本价]"） */}
      {showImport && (
        // P0-202-R2 G6c：蒙层 touch 拦截（同编辑弹窗三件套）
        <div className="fixed inset-0 bg-black/50 flex items-end z-[9999]" onTouchMove={(e) => e.preventDefault()}>
          {/* P0-202-R2 G6b：面板独立滚动容器 */}
          <div className="bg-white w-full rounded-t-2xl p-4 space-y-3 max-h-[80vh] overflow-y-auto overscroll-contain">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">批量导入（期初建账）</h3>
              <button onClick={() => setShowImport(false)} className="p-1">
                <ArrowLeft size={20} className="rotate-90" />
              </button>
            </div>
            <p className="text-xs text-gray-400">每行一条：名称 数量 [成本价]。导入不计入本月现金支出。</p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={6}
              placeholder={'电缆3*6 10 45\n漏保盒 5'}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => {
                importText.split('\n').forEach((line, idx) => {
                  const parts = line.trim().split(/\s+/)
                  if (parts.length < 2) return
                  const qty = parseFloat(parts[1])
                  if (!parts[0] || isNaN(qty) || qty <= 0) return
                  const price = parts[2] !== undefined ? parseFloat(parts[2]) : undefined
                  // R-11.8 手动天然幂等：refId=行号；同名重复行按行号各记一笔
                  adjustStock(parts[0], qty, 'import', `import-L${idx + 1}`, {
                    unitCostOverride: price !== undefined && !isNaN(price) ? price : undefined,
                  })
                })
                setImportText('')
                setShowImport(false)
              }}
              className="w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-medium active:bg-blue-700"
            >
              确认导入
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
