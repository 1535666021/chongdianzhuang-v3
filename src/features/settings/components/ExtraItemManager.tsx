import { useState, useMemo } from 'react'
import { addonMaterialsData, brandList } from '@/constants/materialData'
import { useSettingsStore } from '@/stores/settingsStore'
import { Search, Pencil, Check, X, ChevronDown, ChevronRight } from 'lucide-react'

export default function ExtraItemManager() {
  const { addonPriceOverrides, setAddonPrice, getAddonPrice } = useSettingsStore()
  const [search, setSearch] = useState('')
  const [selectedBrand, setSelectedBrand] = useState<string>('全部')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set())

  const grouped = useMemo(() => {
    const map = new Map<string, typeof addonMaterialsData>()
    for (const m of addonMaterialsData) {
      const brand = m.brand || '未分类'
      if (!map.has(brand)) map.set(brand, [])
      map.get(brand)!.push(m)
    }
    return map
  }, [])

  const filteredBrands = useMemo(() => {
    const brands: string[] = []
    for (const [brand, items] of grouped) {
      const filtered = items.filter((m) => {
        const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase())
        const matchBrand = selectedBrand === '全部' || brand === selectedBrand
        return matchSearch && matchBrand
      })
      if (filtered.length > 0) brands.push(brand)
    }
    return brands.sort()
  }, [grouped, search, selectedBrand])

  const getFilteredItems = (brand: string) => {
    const items = grouped.get(brand) || []
    return items.filter((m) => {
      const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase())
      const matchBrand = selectedBrand === '全部' || (m.brand || '未分类') === selectedBrand
      return matchSearch && matchBrand
    })
  }

  const toggleBrand = (brand: string) => {
    setExpandedBrands((prev) => {
      const next = new Set(prev)
      if (next.has(brand)) next.delete(brand)
      else next.add(brand)
      return next
    })
  }

  const startEdit = (material: (typeof addonMaterialsData)[0]) => {
    const currentPrice = getAddonPrice(material.id, material.settlementPrice)
    setEditingId(material.id)
    setEditValue(String(currentPrice))
  }

  const saveEdit = (id: string) => {
    const price = parseFloat(editValue)
    if (!isNaN(price) && price >= 0) {
      setAddonPrice(id, price)
    }
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  const overrideCount = Object.keys(addonPriceOverrides).length

  return (
    <div>
      <div className="space-y-2 mb-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索材料名称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="全部">全部品牌</option>
          {brandList.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        {overrideCount > 0 && (
          <div className="text-xs text-blue-600">已自定义 {overrideCount} 项价格</div>
        )}
      </div>

      <div className="space-y-1 max-h-[60vh] overflow-y-auto">
        {filteredBrands.map((brand) => {
          const items = getFilteredItems(brand)
          const isExpanded = expandedBrands.has(brand)
          return (
            <div key={brand} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleBrand(brand)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 text-left"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown size={16} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-500" />
                  )}
                  <span className="text-sm font-medium text-gray-900">{brand}</span>
                  <span className="text-xs text-gray-500">({items.length})</span>
                </div>
              </button>
              {isExpanded && (
                <div className="divide-y divide-gray-100">
                  {items.map((material) => {
                    const currentPrice = getAddonPrice(material.id, material.settlementPrice)
                    const isEditing = editingId === material.id
                    const hasOverride = addonPriceOverrides[material.id] !== undefined

                    return (
                      <div
                        key={material.id}
                        className={`flex items-center justify-between p-3 ${
                          hasOverride ? 'bg-blue-50' : 'bg-white'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-900 truncate">{material.name}</div>
                          <div className="text-xs text-gray-500">
                            {material.category} · {material.unit}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          {isEditing ? (
                            <>
                              <input
                                type="number"
                                step="0.1"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit(material.id)
                                  if (e.key === 'Escape') cancelEdit()
                                }}
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              />
                              <button
                                onClick={() => saveEdit(material.id)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => startEdit(material)}
                              className="flex items-center gap-1 px-2 py-1 text-sm rounded border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                            >
                              <span
                                className={hasOverride ? 'text-blue-700 font-medium' : 'text-gray-700'}
                              >
                                ¥{currentPrice.toFixed(1)}
                              </span>
                              <Pencil size={12} className="text-gray-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
        {filteredBrands.length === 0 && (
          <div className="text-center text-sm text-gray-500 py-8">未找到匹配的材料</div>
        )}
      </div>
    </div>
  )
}
