import type { Material } from '@/types'

export interface InventoryItem {
  materialId: string
  name: string
  currentStock: number
  minStock: number
  unit: string
  category: string
}

export interface StockRecord {
  id: string
  materialId: string
  materialName: string
  date: string
  quantity: number
  type: '入库' | '出库' | '盘点'
  notes: string
}

export interface RestockAlert {
  materialId: string
  name: string
  current: number
  min: number
  diff: number
  unit: string
}

export type StockStatus = '充足' | '紧张' | '缺货'

export function getStockStatus(current: number, min: number): StockStatus {
  if (current <= 0) return '缺货'
  if (current < min) return '紧张'
  return '充足'
}

export function getStatusColor(status: StockStatus): string {
  switch (status) {
    case '充足': return '#22c55e'
    case '紧张': return '#f59e0b'
    case '缺货': return '#ef4444'
  }
}
