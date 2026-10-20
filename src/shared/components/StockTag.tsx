import { useInventoryStore } from '@/stores/inventoryStore'
import { resolveStockEntry } from '@/shared/utils/stockCalc'

/**
 * P0-206-M：余量只读展示（R-11.10）。
 * 材料行后缀"余M"；选中量>stock 红字"库存不足"。只读，不改任何交互。
 */
export default function StockTag({ name, quantity }: { name: string; quantity: number }) {
  const inventory = useInventoryStore((s) => s.inventory)
  if (!name) return null
  const entry = resolveStockEntry(name, { create: false })
  if (!entry) return null
  const stock = inventory[entry.id]?.currentStock ?? 0
  if (quantity > stock) {
    return (
      <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 600, whiteSpace: 'nowrap' }}>
        库存不足(余{stock})
      </span>
    )
  }
  return (
    <span style={{ fontSize: '10px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
      余{stock}
    </span>
  )
}
