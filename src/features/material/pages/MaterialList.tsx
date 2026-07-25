import { useState, useMemo } from 'react'
import { useMaterial } from '../hooks/useMaterial'
import MaterialCard from '../components/MaterialCard'
import MaterialForm from '../components/MaterialForm'
import { Package, Search } from 'lucide-react'
import type { MaterialCategory } from '@/types'

const FILTER_CATEGORIES: (MaterialCategory | '全部')[] = [
  '全部', '线缆', '管材', '辅材', '工具', '其他',
]

export default function MaterialList() {
  const {
    customMaterials,
    fixedMaterials,
    addMaterial,
    updateMaterial,
    deleteMaterial,
  } = useMaterial()

  const [keyword, setKeyword] = useState('')
  const [activeCategory, setActiveCategory] = useState<MaterialCategory | '全部'>('全部')

  const filterByKeywordAndCategory = (list: typeof fixedMaterials) => {
    return list.filter((m) => {
      const matchKeyword = keyword.trim() === '' ||
        m.name.toLowerCase().includes(keyword.trim().toLowerCase())
      const matchCategory = activeCategory === '全部' || m.category === activeCategory
      return matchKeyword && matchCategory
    })
  }

  const filteredFixed = useMemo(
    () => filterByKeywordAndCategory(fixedMaterials),
    [fixedMaterials, keyword, activeCategory]
  )
  const filteredCustom = useMemo(
    () => filterByKeywordAndCategory(customMaterials),
    [customMaterials, keyword, activeCategory]
  )

  const hasResult = filteredFixed.length > 0 || filteredCustom.length > 0

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Package size={20} className="text-blue-600" />
          <h1 className="text-lg font-semibold">材料库</h1>
        </div>
      </header>

      <main className="p-3 space-y-4">
        {/* R1 搜索框 */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索材料名称..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white"
          />
        </div>

        {/* R2 分类筛选 chip */}
        <div className="flex flex-wrap gap-2">
          {FILTER_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 无结果提示 */}
        {!hasResult && keyword.trim() !== '' && (
          <div className="text-center text-gray-400 text-sm py-6">
            未找到匹配材料
          </div>
        )}

        {/* 固定辅材 */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-2 px-1">
            固定辅材
            <span className="text-xs text-gray-400 font-normal ml-1">
              ({filteredFixed.length} 项)
            </span>
          </h2>
          <div>
            {filteredFixed.map((m) => (
              <MaterialCard
                key={m.id}
                material={m}
                onUpdate={updateMaterial}
                onDelete={deleteMaterial}
              />
            ))}
            {filteredFixed.length === 0 && keyword.trim() === '' && activeCategory === '全部' && (
              <div className="text-center text-gray-400 text-xs py-2">暂无固定辅材</div>
            )}
          </div>
        </section>

        {/* 自定义辅材 */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-sm font-medium text-gray-500">
              自定义辅材
              <span className="text-xs text-gray-400 font-normal ml-1">
                ({filteredCustom.length} 项)
              </span>
            </h2>
          </div>

          <MaterialForm onAdd={addMaterial} />

          <div>
            {filteredCustom.map((m) => (
              <MaterialCard
                key={m.id}
                material={m}
                onUpdate={updateMaterial}
                onDelete={deleteMaterial}
              />
            ))}
            {filteredCustom.length === 0 && keyword.trim() === '' && activeCategory === '全部' && (
              <div className="text-center text-gray-400 text-sm py-8 bg-white rounded-lg border border-dashed border-gray-200">
                暂无自定义材料，点击上方"新增材料"添加
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
