import { useMemo } from 'react'
import { AlertTriangle, Package } from 'lucide-react'
import { useInventoryStore } from '@/stores/inventoryStore'
import { useMaterial } from '../hooks/useMaterial'
import { getStockStatus } from '../types/inventory'

/**
 * 补货提醒组件
 * - 在材料库页面顶部显示缺货/紧张材料卡片
 * - 一键标记"已补货"
 */
export default function RestockAlert() {
  const { allMaterials } = useMaterial()
  const inventory = useInventoryStore((s) => s.inventory)
  const stockIn = useInventoryStore((s) => s.stockIn)

  const alerts = useMemo(() => {
    return allMaterials
      .map((m) => {
        const inv = inventory[m.id]
        const current = inv?.currentStock ?? 0
        const min = inv?.minStock ?? (m.isFixed ? 20 : 5)
        const status = getStockStatus(current, min)
        if (status === '充足') return null
        return {
          materialId: m.id,
          name: m.name,
          current,
          min,
          diff: min - current,
          unit: m.unit,
          status,
        }
      })
      .filter(Boolean) as {
        materialId: string
        name: string
        current: number
        min: number
        diff: number
        unit: string
        status: '紧张' | '缺货'
      }[]
  }, [allMaterials, inventory])

  if (alerts.length === 0) return null

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={16} className="text-amber-500" />
        <span className="text-sm font-semibold text-gray-800">
          补货提醒（{alerts.length}项）
        </span>
      </div>
      <div className="space-y-2">
        {alerts.map((a) => (
          <div
            key={a.materialId}
            className={`flex items-center justify-between p-2 rounded-lg text-sm ${
              a.status === '缺货'
                ? 'bg-red-50 border border-red-100'
                : 'bg-amber-50 border border-amber-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Package size={14} className={a.status === '缺货' ? 'text-red-500' : 'text-amber-500'} />
              <span className="font-medium">{a.name}</span>
              <span className="text-xs text-gray-500">
                库存{a.current}{a.unit} / 最低{a.min}{a.unit}
              </span>
            </div>
            <button
              onClick={() => stockIn(a.materialId, a.name, a.diff, '补货入库')}
              className="px-2 py-1 bg-blue-600 text-white text-xs rounded active:bg-blue-700"
            >
              已补货+{a.diff}{a.unit}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
