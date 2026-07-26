import { create } from 'zustand'
import { LocalStorageAdapter } from '@/shared/storage'
import type { StockRecord } from '../features/material/types/inventory'

interface InventoryItem {
  materialId: string
  currentStock: number
  minStock: number
}

interface InventoryState {
  inventory: Record<string, InventoryItem>
  records: StockRecord[]
  getStock: (materialId: string) => number
  getMinStock: (materialId: string) => number
  setMinStock: (materialId: string, min: number) => void
  stockIn: (materialId: string, name: string, quantity: number, notes?: string) => void
  stockOut: (materialId: string, name: string, quantity: number, notes?: string) => void
  stockCheck: (materialId: string, name: string, actual: number, notes?: string) => void
  getAlerts: () => { materialId: string; name: string; current: number; min: number; diff: number; unit: string }[]
  getRecords: (materialId?: string) => StockRecord[]
}

const STORAGE_KEY = 'cdz_v3_inventory_'
const storage = new LocalStorageAdapter<{ inventory: Record<string, InventoryItem>; records: StockRecord[] }>(STORAGE_KEY)
const saved = storage.get('data')

const defaults = {
  inventory: {} as Record<string, InventoryItem>,
  records: [] as StockRecord[],
}

const initial = saved || defaults

function persist(state: { inventory: Record<string, InventoryItem>; records: StockRecord[] }) {
  storage.set('data', state)
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  ...initial,

  getStock: (materialId) => {
    return get().inventory[materialId]?.currentStock ?? 0
  },

  getMinStock: (materialId) => {
    return get().inventory[materialId]?.minStock ?? 0
  },

  setMinStock: (materialId, min) => {
    const inv = { ...get().inventory }
    inv[materialId] = { ...inv[materialId], materialId, minStock: min }
    const next = { ...get(), inventory: inv }
    set(next)
    persist(next)
  },

  stockIn: (materialId, name, quantity, notes = '') => {
    const inv = { ...get().inventory }
    const current = inv[materialId]?.currentStock ?? 0
    inv[materialId] = { ...inv[materialId], materialId, currentStock: current + quantity, minStock: inv[materialId]?.minStock ?? 20 }

    const record: StockRecord = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      materialId,
      materialName: name,
      date: new Date().toISOString().slice(0, 10),
      quantity,
      type: '入库',
      notes,
    }
    const records = [...get().records, record]
    const next = { ...get(), inventory: inv, records }
    set(next)
    persist(next)
  },

  stockOut: (materialId, name, quantity, notes = '') => {
    const inv = { ...get().inventory }
    const current = inv[materialId]?.currentStock ?? 0
    inv[materialId] = { ...inv[materialId], materialId, currentStock: current - quantity, minStock: inv[materialId]?.minStock ?? 20 }

    const record: StockRecord = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      materialId,
      materialName: name,
      date: new Date().toISOString().slice(0, 10),
      quantity: -quantity,
      type: '出库',
      notes,
    }
    const records = [...get().records, record]
    const next = { ...get(), inventory: inv, records }
    set(next)
    persist(next)
  },

  stockCheck: (materialId, name, actual, notes = '') => {
    const inv = { ...get().inventory }
    const oldStock = inv[materialId]?.currentStock ?? 0
    inv[materialId] = { ...inv[materialId], materialId, currentStock: actual, minStock: inv[materialId]?.minStock ?? 20 }

    const record: StockRecord = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      materialId,
      materialName: name,
      date: new Date().toISOString().slice(0, 10),
      quantity: actual - oldStock,
      type: '盘点',
      notes,
    }
    const records = [...get().records, record]
    const next = { ...get(), inventory: inv, records }
    set(next)
    persist(next)
  },

  getAlerts: () => {
    const alerts: { materialId: string; name: string; current: number; min: number; diff: number; unit: string }[] = []
    // 需要外部传入材料列表，这里返回空，由组件组装
    return alerts
  },

  getRecords: (materialId) => {
    if (materialId) {
      return get().records.filter((r) => r.materialId === materialId)
    }
    return get().records
  },
}))
