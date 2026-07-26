import { useState } from 'react'
import { useSettingsStore, type LingpaoItem } from '@/stores/settingsStore'
import { List, Plus, Trash2, Save } from 'lucide-react'

const DEFAULT_ITEMS: LingpaoItem[] = [
  { name: '勘测费', price: 0, unit: '次' },
  { name: '安装费', price: 0, unit: '次' },
  { name: '电缆（超出部分）', price: 35, unit: '米' },
  { name: 'PVC管（超出部分）', price: 8, unit: '米' },
  { name: '桥架（超出部分）', price: 15, unit: '米' },
  { name: '接地线', price: 50, unit: '根' },
  { name: '空开', price: 80, unit: '个' },
  { name: '漏保', price: 120, unit: '个' },
]

export default function LingpaoTemplate() {
  const { lingpaoTemplate, setLingpaoTemplate } = useSettingsStore()
  const [items, setItems] = useState<LingpaoItem[]>(
    lingpaoTemplate.length > 0 ? lingpaoTemplate : DEFAULT_ITEMS
  )
  const [saved, setSaved] = useState(false)

  const handleChange = (index: number, field: keyof LingpaoItem, value: string | number) => {
    const next = [...items]
    if (field === 'price') {
      next[index] = { ...next[index], [field]: parseFloat(value as string) || 0 }
    } else {
      next[index] = { ...next[index], [field]: value }
    }
    setItems(next)
  }

  const handleAdd = () => {
    setItems([...items, { name: '', price: 0, unit: '个' }])
  }

  const handleRemove = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    setLingpaoTemplate(items.filter((item) => item.name.trim()))
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="p-4 space-y-3">
      <div className="text-xs text-gray-500 flex items-center gap-1">
        <List size={12} />
        零跑品牌专用增项模板
      </div>

      {items.map((item, index) => (
        <div
          key={index}
          className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 bg-white"
        >
          <input
            type="text"
            value={item.name}
            onChange={(e) => handleChange(index, 'name', e.target.value)}
            placeholder="项目名称"
            className="flex-1 min-w-0 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            value={item.price}
            onChange={(e) => handleChange(index, 'price', e.target.value)}
            placeholder="价格"
            className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={item.unit}
            onChange={(e) => handleChange(index, 'unit', e.target.value)}
            placeholder="单位"
            className="w-14 px-2 py-1.5 text-sm border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => handleRemove(index)}
            className="p-1.5 text-red-400 hover:text-red-600"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      <button
        onClick={handleAdd}
        className="w-full py-2 text-xs border border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-1"
      >
        <Plus size={14} />
        添加项目
      </button>

      <button
        onClick={handleSave}
        className="w-full py-2.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-1.5"
      >
        <Save size={14} />
        保存模板
      </button>
      {saved && (
        <p className="text-xs text-green-600 text-center">模板已保存</p>
      )}
    </div>
  )
}
