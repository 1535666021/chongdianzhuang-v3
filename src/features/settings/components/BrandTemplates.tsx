import { useState } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { MessageSquare, Save, Plus } from 'lucide-react'

const DEFAULT_BRANDS = ['公牛', '普诺得', '挚达', '特来电', '星星充电', '其他']

export default function BrandTemplates() {
  const { brandTemplates, setBrandTemplate } = useSettingsStore()
  const [editingBrand, setEditingBrand] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [saved, setSaved] = useState(false)

  const brands = Array.from(new Set([...DEFAULT_BRANDS, ...Object.keys(brandTemplates)]))

  const startEdit = (brand: string) => {
    setEditingBrand(brand)
    setEditText(brandTemplates[brand] || '')
  }

  const saveEdit = (brand: string) => {
    setBrandTemplate(brand, editText)
    setEditingBrand(null)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const cancelEdit = () => {
    setEditingBrand(null)
    setEditText('')
  }

  return (
    <div className="p-4 space-y-3">
      <div className="text-xs text-gray-500 flex items-center gap-1">
        <MessageSquare size={12} />
        配置各品牌专用话术模板
      </div>
      {brands.map((brand) => {
        const isEditing = editingBrand === brand
        const hasTemplate = !!brandTemplates[brand]

        return (
          <div
            key={brand}
            className={`p-3 rounded-lg border ${
              hasTemplate ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{brand}</span>
              {!isEditing && (
                <button
                  onClick={() => startEdit(brand)}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus size={12} />
                  {hasTemplate ? '编辑' : '添加'}
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder={`输入${brand}品牌的话术模板...`}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={cancelEdit}
                    className="flex-1 py-1.5 text-xs border border-gray-200 rounded text-gray-600 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => saveEdit(brand)}
                    className="flex-1 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center gap-1"
                  >
                    <Save size={12} />
                    保存
                  </button>
                </div>
              </div>
            ) : hasTemplate ? (
              <p className="text-xs text-gray-600 whitespace-pre-wrap">{brandTemplates[brand]}</p>
            ) : (
              <p className="text-xs text-gray-400">暂无模板</p>
            )}
          </div>
        )
      })}
      {saved && (
        <p className="text-xs text-green-600 text-center">模板已保存</p>
      )}
    </div>
  )
}
