import { useMemo, useState } from 'react'
import { ArrowLeft, ChevronDown, ChevronUp, Pencil, Trash2, Plus } from 'lucide-react'
import type { Material } from '@/types'
import { useMaterialStore } from '@/stores/materialStore'
import { toast } from '@/shared/hooks/useToast'
import { getAllAddonMaterials, isCustomAddonMaterial, CUSTOM_ADDON_PREFIX } from '@/shared/utils/addonMaterialsResolver'
import { BRAND_NAMES } from '@/constants/brands'
import { addDeletedAddonId } from '@/shared/storage/addonDeleteListStorage'

/**
 * 增项表管理（P0-129交互重做）：
 * · 新增入口=各品牌组展开区底部"＋增加材料"（归属=当前组，仅名称/单位/客户价）
 * · 全员改价：每行铅笔入口；底表走覆盖制，新增项走materialStore.updateMaterial
 * · 全员可删：custom_addon_真删；底表项走删除名单（常量零改动，resolver过滤）
 * · 搜索/品牌筛选/分组折叠/CSS变量视觉规范（P0-128）保留
 */
export default function ExtraItemManager() {
  useMaterialStore((st) => st.materials)
  const materials = getAllAddonMaterials()
  const addMaterial = useMaterialStore((s) => s.addMaterial)
  const deleteMaterial = useMaterialStore((s) => s.deleteMaterial)
  const updateMaterial = useMaterialStore((s) => s.updateMaterial)

  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('全部')
  const [collapsedBrands, setCollapsedBrands] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState('')

  const [addingBrand, setAddingBrand] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<Material | null>(null)

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

  const handleAdd = (brand: string) => {
    const name = newName.trim()
    const unit = newUnit.trim()
    const price = Number(newPrice)
    if (!name) { toast.error('材料名称必填'); return }
    if (!unit) { toast.error('单位必填'); return }
    if (newPrice.trim() === '' || !Number.isFinite(price) || price < 0) { toast.error('客户价必填且≥0'); return }
    if (getAllAddonMaterials().some((m) => m.name === name && (m.brand || '未分类') === brand)) {
      toast.error(`组"${brand}"内已存在同名"${name}"`); return
    }
    addMaterial({
      id: `${CUSTOM_ADDON_PREFIX}${Date.now()}`,
      name,
      category: '其他',
      categoryCode: 'OTHER',
      unit,
      costPrice: 0,
      settlementPrice: price,
      customerPrice: price,
      brand,
      freeQuota: 0,
      source: 'addon',
      stock: 0,
      minStock: 0,
      isFixed: false,
    } as Material)
    toast.success(`已在"${brand}"组新增"${name}"，已参与计算`)
    setNewName(''); setNewUnit(''); setNewPrice(''); setAddingBrand(null)
  }

  const handleDeleteConfirm = (m: Material) => {
    if (isCustomAddonMaterial(m.id)) {
      deleteMaterial(m.id)
    } else {
      addDeletedAddonId(m.id)
    }
    toast.success(`已删除"${m.name}"`)
    setConfirmDelete(null)
  }

  const startEdit = (m: Material) => { setEditingId(m.id); setEditPrice(m.customerPrice?.toString() || '0') }
  const saveEdit = (m: Material) => {
    const p = Number(editPrice)
    if (!Number.isFinite(p) || p < 0) { toast.error('价格必须≥0'); return }
    updateMaterial(m.id, { customerPrice: p, settlementPrice: p })
    setEditingId(null)
    toast.success(`"${m.name}"已改价为¥${p}，勘测/完工按新价计算`)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-secondary, #f5f5f5)' }}>
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b p-4" style={{ backgroundColor: 'var(--color-bg-primary, #fff)', borderColor: 'var(--color-border, #e5e5e5)' }}>
        <button onClick={() => history.back()} className="p-1" style={{ minHeight: 44, minWidth: 44 }}><ArrowLeft size={20} /></button>
        <h1 className="text-lg font-semibold">增项表管理</h1>
      </div>
      <div className="p-4">
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
            {!collapsedBrands.has(brand) && (
              <>
                {items.map((m) => (
                  <div key={m.id}>
                    {editingId === m.id ? (
                      <div className="mx-3 my-2 rounded-lg border p-3" style={{ borderColor: 'var(--color-primary, #1677ff)', backgroundColor: 'var(--color-bg-secondary, #fafafa)' }}>
                        <div className="mb-2 text-sm">{m.name}</div>
                        <div className="flex items-center gap-2">
                          <input type="number" step="0.01" autoFocus className="w-24 rounded px-2 py-1 text-sm" style={{ border: '1px solid var(--color-border, #ddd)' }} value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                          <button onClick={() => saveEdit(m)} className="rounded px-2 py-1 text-xs text-white" style={{ backgroundColor: 'var(--color-primary, #1677ff)', minHeight: 32 }}>保存</button>
                          <button onClick={() => setEditingId(null)} className="rounded px-2 py-1 text-xs" style={{ minHeight: 32 }}>取消</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between px-4 py-2.5" style={{ minHeight: 44, borderBottom: '1px solid var(--color-border, #f0f0f0)' }}>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{m.name}</div>
                          <div className="text-xs" style={{ color: 'var(--color-text-tertiary, #999)' }}>{m.unit}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEdit(m)} className="flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--color-primary, #1677ff)', minHeight: 44 }}>
                            <Pencil size={12} />¥{m.customerPrice?.toFixed(2) ?? '-'}
                          </button>
                          <button onClick={() => setConfirmDelete(m)} className="p-1.5" style={{ color: 'var(--color-danger, #ef4444)', minHeight: 44, minWidth: 44 }} aria-label={`删除${m.name}`}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {addingBrand === brand ? (
                  <div className="mx-3 my-2 rounded-lg border p-3" style={{ borderColor: 'var(--color-primary, #1677ff)', backgroundColor: 'var(--color-bg-secondary, #fafafa)' }}>
                    <div className="mb-2 text-xs" style={{ color: 'var(--color-text-tertiary, #999)' }}>新增到组：{brand}</div>
                    <input className="mb-2 w-full rounded px-2 py-1.5 text-sm" placeholder="材料名称（必填）" value={newName} onChange={(e) => setNewName(e.target.value)} />
                    <div className="mb-2 flex gap-2">
                      <input className="w-24 rounded px-2 py-1.5 text-sm" placeholder="单位（必填）" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} />
                      <input className="flex-1 rounded px-2 py-1.5 text-sm" placeholder="客户价（必填，≥0）" type="number" min={0} value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAdd(brand)} className="rounded px-3 py-1.5 text-sm text-white" style={{ backgroundColor: 'var(--color-success, #16a34a)', minHeight: 36 }}>确认新增</button>
                      <button onClick={() => setAddingBrand(null)} className="rounded px-3 py-1.5 text-sm" style={{ minHeight: 36 }}>取消</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setAddingBrand(brand); setNewName(''); setNewUnit(''); setNewPrice('') }} className="flex w-full items-center justify-center gap-1 py-2.5 text-sm" style={{ color: 'var(--color-primary, #1677ff)', minHeight: 44, borderTop: '1px dashed var(--color-border, #eee)' }}>
                    <Plus size={14} /> 增加材料
                  </button>
                )}
              </>
            )}
          </div>
        ))}

        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={() => setConfirmDelete(null)}>
            <div className="w-full max-w-sm rounded-xl p-4 shadow-lg" style={{ backgroundColor: 'var(--color-bg-primary, #fff)' }} onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 text-sm font-medium">确认删除"{confirmDelete.name}"？</div>
              <div className="mb-4 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary, #666)' }}>
                删除后新计算将找不到该增项价，涉及该材料的旧单重算会缺价格；历史已产生金额不受影响。
                {isCustomAddonMaterial(confirmDelete.id) ? '' : '（底表项：从列表隐藏，原始价表数据不变）'}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDeleteConfirm(confirmDelete)} className="flex-1 rounded-lg py-2 text-sm text-white" style={{ backgroundColor: 'var(--color-danger, #dc2626)', minHeight: 44 }}>确认删除</button>
                <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-lg py-2 text-sm" style={{ backgroundColor: 'var(--color-bg-secondary, #f0f0f0)', minHeight: 44 }}>取消</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
