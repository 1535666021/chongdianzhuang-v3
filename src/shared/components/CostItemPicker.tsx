import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { getAllCostMaterials } from '@/shared/utils/costMaterialsResolver'

interface CostItemPickerProps {
  /** 待绑定/改绑的材料名（查询名） */
  materialName: string
  /** 当前已绑定的成本条目名（高亮） */
  selectedCostName?: string | null
  /** 点选条目即确认（写入映射由调用方处理） */
  onSelect: (costName: string) => void
  onClose: () => void
}

/** P0-191-R2：通用成本条目选择器（shared，勘测行内改绑与设置页绑定管理共用）。
 * 列出全部成本条目（底表+自定义），当前绑定高亮；点选即确认。
 */
export default function CostItemPicker({ materialName, selectedCostName, onSelect, onClose }: CostItemPickerProps) {
  const [search, setSearch] = useState('')
  const items = getAllCostMaterials()
  const filtered = search ? items.filter((i) => i.name.includes(search)) : items

  useEffect(() => {
    document.body.classList.add('modal-open')
    return () => { document.body.classList.remove('modal-open') }
  }, [])

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-sm text-gray-900">{selectedCostName ? '改绑成本项' : '绑定成本项'}</h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[220px]">{materialName}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="px-4 py-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索成本项..."
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-1">
          {filtered.map((item) => {
            const isCurrent = item.name === selectedCostName
            return (
              <button
                key={item.name}
                onClick={() => onSelect(item.name)}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between ${isCurrent ? 'bg-blue-100 border border-blue-300' : 'hover:bg-blue-50'}`}
              >
                <span className="text-gray-700">{item.name}{isCurrent && <span className="ml-2 text-xs text-blue-600">当前</span>}</span>
                <span className="text-gray-400 text-xs">¥{item.costPrice}</span>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-4">无匹配成本项</p>
          )}
        </div>
      </div>
    </div>
  )
}
