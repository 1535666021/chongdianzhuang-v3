import { useMemo, useState } from 'react'
import { ArrowLeft, ChevronDown, ChevronUp, Pencil } from 'lucide-react'
import type { Material } from '@/types'
import { useMaterialStore } from '@/stores/materialStore'
import { toast } from '@/shared/hooks/useToast'
import { getAllAddonMaterials, isCustomAddonMaterial, CUSTOM_ADDON_PREFIX } from '@/shared/utils/addonMaterialsResolver'
import { BRAND_NAMES } from '@/constants/brands'

/**
 * 增项表管理（P0-128补增删+视觉规范）：搜索/品牌筛选/分组折叠/改价覆盖制全部保留；
 * 新增项存materialStore(id=custom_addon_前缀)，仅新增行可删除（572项底表保护）；
 * 颜色一律CSS变量（与成本表管理同套），触控热区≥44px，编辑态独立卡片。
 */
export default function ExtraItemManager() {
  useMaterialStore((st) => st.materials) // 订阅：增删即时重渲染
  const materials = getAllAddonMaterials()
  const addMaterial = useMaterialStore((s) => s.addMaterial)
  const deleteMaterial = useMaterialStore((s) => s.deleteMaterial)
  const updateMaterial = useMaterialStore((s) => s.updateMaterial)

  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('全部')
  const [collapsedBrands, setCollapsedBrands] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState('')

  // P0-128：新增表单
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('其他')
  const [newUnit, setNewUnit] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newBrand, setNewBrand] = useState('未分类')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const CATEGORY_OPTIONS = ['其他', '电缆', '辅材', '桥架', '保护箱', '立柱', '开孔', '开挖', '基础', '接地', '服务']

  const brandGroups = useMemo(() => {
    const filtered = materials.filter(
      (m) =>
        (brandFilter === '全部' || m.brand === brandFilter) &&
        (search === '' || m.name.toLowerCase().includes(search.toLowerCase()))
    )
    const groups: Record<string, Material[]> = {}
    for (const m of filtered) {
      const b = m.brand || '未分类'
      if (!groups[b]) groups[b] = []
      groups[b].push(m)
    }
    return groups
  }, [materials, search, brandFilter])

  const handleAdd = () => {
    const name = newName.trim()
    const unit = newUnit.trim()
    const price = Number(newPrice)
    if (!name) { toast.error('材料名称必填'); return }
    if (!unit) { toast.error('单位必填'); return }
    if (newPrice.trim() === '' || !Number.isFinite(price) || price < 0) { toast.error('客户价必填且≥0'); return }
    // 同品牌组内重名拒绝（跨品牌既有重名不受影响）
    if (getAllAddonMaterials().some((m) => m.name === name && (m.brand || '未分类') === newBrand)) {
      toast.error(`品牌组"${newBrand}"内已存在同名"${name}"`); return
    }
    addMaterial({
      id: `${CUSTOM_ADDON_PREFIX}${Date.now()}`,
      name,
      category: newCategory as Material['category'],
      categoryCode: 'OTHER',
      unit,
      costPrice: null as unknown as number,
      settlementPrice: price,
      customerPrice: price,
      brand: newBrand,
      freeQuota: 0,
      source: 'addon',
      stock: 0,
      minStock: 0,
      isFixed: false,
    } as Material)
    toast.success(`已新增"${name}"到"${newBrand}"组`)
    setNewName(''); setNewUnit(''); setNewPrice(''); setShowAddForm(false)
  }

  const handleDeleteConfirm = (m: Material) => {
    deleteMaterial(m.id)
    toast.success(`已删除"${m.name}"`)
    setConfirmDeleteId(null)
  }

  const startEdit = (m: Material) => { setEditingId(m.id); setEditPrice(m.customerPrice?.toString() || '0') }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-secondary, #f5f5f5)' }}>
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b p-4" style={{ backgroundColor: 'var(--color-bg-primary, #fff)', borderColor: 'var(--color-border, #e5e5e5)' }}>
        <button onClick={() => history.back()} className="p-1" style={{ minHeight: 44, minWidth: 44 }}><ArrowLeft size={20} /></button>
        <h1 className="text-lg font-semibold">增项表管理</h1>
      </div>
      <div className="p-4">
        {/* P0-128：新增入口 */}
        <button onClick={() => setShowAddForm(!showAddForm)} className="mb-3 w-full rounded-lg py-2 text-sm text-white" style={{ backgroundColor: 'var(--color-primary, #1677ff)', minHeight: 44 }}>
          {showAddForm ? '收起新增表单' : '＋ 新增增项材料'}
        </button>
        {showAddForm && (
          <div className="mb-3 space-y-2 rounded-xl p-4 shadow-sm" style={{ backgroundColor: 'var(--color-bg-primary, #fff)' }}>
            <input className="w-full rounded-lg bg-gray-100 px-3 py-2 text-sm" placeholder="材料名称（必填）" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <div className="flex gap-2">
              <select className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-sm" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input className="w-24 rounded-lg bg-gray-100 px-3 py-2 text-sm" placeholder="单位（必填）" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <input className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-sm" placeholder="客户价（必填，≥0）" type="number" min={0} value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
              <select className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-sm" value={newBrand} onChange={(e) => setNewBrand(e.target.value)}>
                {[...BRAND_NAMES, '未分类'].map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <button onClick={handleAdd} className="w-full rounded-lg py-2 text-sm text-white" style={{ backgroundColor: 'var(--color-success, #16a34a)', minHeight: 44 }}>确认新增</button>
          </div>
        )}

        {/* 搜索+品牌筛选（既有功能保留） */}
        <div className="mb-3 flex gap-2">
          <input className="flex-1 rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: 'var(--color-bg-primary, #fff)' }} placeholder="搜索材料名" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="rounded-lg px-2 py-2 text-sm" style={{ backgroundColor: 'var(--color-bg-primary, #fff)' }} value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
            <option value="全部">全部</option>
            {[...BRAND_NAMES, '未分类'].map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {Object.entries(brandGroups).map(([brand, items]) => (
          <div key={brand} className="mb-3 overflow-hidden rounded-xl shadow-sm" style={{ backgroundColor: 'var(--color-bg-primary, #fff)' }}>
            <button className="flex w-full items-center justify-between px-4 py-3 text-left font-medium" style={{ minHeight: 44, borderBottom: collapsedBrands.has(brand) ? 'none' : '1px solid var(--color-border, #eee)' }} onClick={() => { const next = new Set(collapsedBrands); next.has(brand) ? next.delete(brand) : next.add(brand); setCollapsedBrands(next) }}>
              <span>{brand}（{items.length}）</span>
              {collapsedBrands.has(brand) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {!collapsedBrands.has(brand) && items.map((m) => (
              <div key={m.id}>
                {/* 编辑态：独立卡片不挤行 */}
                {editingId === m.id ? (
                  <div className="mx-3 my-2 rounded-lg border p-3" style={{ borderColor: 'var(--color-primary, #1677ff)', backgroundColor: 'var(--color-bg-secondary, #fafafa)' }}>
                    <div className="mb-2 text-sm">{m.name}</div>
                    <div className="flex items-center gap-2">
                      <input type="number" step="0.01" autoFocus className="w-24 rounded px-2 py-1 text-sm" style={{ border: '1px solid var(--color-border, #ddd)' }} value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                      <button onClick={() => { const p = Number(editPrice); if (!Number.isFinite(p) || p < 0) { toast.error('价格必须≥0'); return } updateMaterial(m.id, { customerPrice: p }); setEditingId(null) }} className="rounded px-2 py-1 text-xs text-white" style={{ backgroundColor: 'var(--color-primary, #1677ff)', minHeight: 32 }}>保存</button>
                      <button onClick={() => setEditingId(null)} className="rounded px-2 py-1 text-xs" style={{ minHeight: 32 }}>取消</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-4 py-2.5" style={{ minHeight: 44, borderBottom: '1px solid var(--color-border, #f0f0f0)' }}>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{m.name}</div>
                      <div className="text-xs" style={{ color: 'var(--color-text-tertiary, #999)' }}>{m.category} · {m.unit}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* 铅笔暗示可编辑 */}
                      <button onClick={() => startEdit(m)} className="flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--color-primary, #1677ff)', minHeight: 44 }}>
                        <Pencil size={12} />¥{m.customerPrice?.toFixed(2) ?? '-'}
                      </button>
                      {isCustomAddonMaterial(m.id) && (
                        <button onClick={() => setConfirmDeleteId(m.id)} className="rounded px-2 py-1 text-xs" style={{ color: 'var(--color-danger, #ef4444)', border: '1px solid var(--color-danger, #fca5a5)', minHeight: 32 }}>删除</button>
                      )}
                    </div>
                  </div>
                )}
                {/* 删除二次确认（知情文案） */}
                {confirmDeleteId === m.id && (
                  <div className="mx-3 my-2 rounded-lg border p-3" style={{ borderColor: 'var(--color-danger, #fca5a5)', backgroundColor: '#fef2f2' }}>
                    <div className="text-sm leading-relaxed" style={{ color: 'var(--color-danger, #b91c1c)' }}>
                      确认删除"{m.name}"？删除后新计算将找不到该增项价格；已产生的历史金额不受影响（利润为实时计算，涉及该增项的旧单重算会缺该项价格）。
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => handleDeleteConfirm(m)} className="rounded px-3 py-1.5 text-sm text-white" style={{ backgroundColor: 'var(--color-danger, #dc2626)', minHeight: 36 }}>确认删除</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="rounded px-3 py-1.5 text-sm" style={{ minHeight: 36 }}>取消</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
