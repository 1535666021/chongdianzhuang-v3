import { create } from 'zustand'
import type { Order, OrderFilter } from '@/types'
import { LocalStorageAdapter } from '@/shared/storage'

interface OrderState {
  orders: Order[]
  filter: OrderFilter
  setOrders: (orders: Order[]) => void
  addOrder: (order: Order) => void
  updateOrder: (id: string, updates: Partial<Order>) => void
  deleteOrder: (id: string) => void
  setFilter: (filter: OrderFilter) => void
  importOrders: (orders: Order[]) => { added: number; skipped: number }
  importFromLegacy: (legacyOrders: any[]) => void
}

const storage = new LocalStorageAdapter<Order[]>('cdz_v3_orders_')

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: storage.get('list') || [],
  filter: {},
  setOrders: (orders) => {
    storage.set('list', orders)
    set({ orders })
  },
  addOrder: (order) => {
    const newOrders = [...get().orders, order]
    storage.set('list', newOrders)
    set({ orders: newOrders })
  },
  updateOrder: (id, updates) => {
    const newOrders = get().orders.map((o) => (o as any).id === id ? { ...o, ...updates, updatedAt: Date.now() } : o)
    storage.set('list', newOrders)
    set({ orders: newOrders })
  },
  deleteOrder: (id) => {
    const newOrders = get().orders.filter((o) => (o as any).id !== id)
    storage.set('list', newOrders)
    set({ orders: newOrders })
  },
  setFilter: (filter) => set({ filter }),
  importOrders: (incoming) => {
    const existing = get().orders
    const existingIds = new Set(existing.map((o) => (o as any).id))
    const merged = [...existing]
    let added = 0
    let skipped = 0
    for (const order of incoming) {
      if (existingIds.has((order as any).id)) {
        skipped++
      } else {
        merged.push(order)
        existingIds.add((order as any).id)
        added++
      }
    }
    storage.set('list', merged)
    set({ orders: merged })
    return { added, skipped }
  },
  importFromLegacy: (legacyOrders) => {
    console.log('Import legacy orders:', legacyOrders.length)
  },
}))
