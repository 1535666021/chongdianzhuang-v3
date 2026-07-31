import { useState } from 'react'
import { X } from 'lucide-react'
import { getCostMaterialList } from '../hooks/useCostMatcher'
import { setCostMapping } from '@/shared/storage/costMappingStorage'

interface Props {
  materialName: string
  onClose: () => void
  onBound: () => void
}

export default function CostBindModal({ materialName, onClose, onBound }: Props) {
  const [search, setSearch] = useState('')
  const items = getCostMaterialList()
  const filtered = search
    ? items.filter((i) => i.name.includes(search))
    : items

  const handleBind = (costName: string) => {
    setCostMapping(materialName, costName)
    onBound()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onTouchMove={(e) => e.stopPropagation()}
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ overscrollBehavior: 'contain' }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-sm text-gray-900">绑定成本项</h3>
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
          {filtered.map((item) => (
            <button
              key={item.name}
              onClick={() => handleBind(item.name)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded-lg flex items-center justify-between"
            >
              <span className="text-gray-700">{item.name}</span>
              <span className="text-gray-400 text-xs">¥{item.costPrice}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-4">无匹配成本项</p>
          )}
        </div>
      </div>
    </div>
  )
}
