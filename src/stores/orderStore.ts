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
    const newOrders = get().orders.map((o: Order) => (o as any).id === id ? { ...o, ...updates, updatedAt: Date.now() } : o)
    storage.set('list', newOrders)
    set({ orders: newOrders })
  },
  deleteOrder: (id) => {
    const newOrders = get().orders.filter((o: Order) => (o as any).id !== id)
    storage.set('list', newOrders)
    set({ orders: newOrders })
  },
  setFilter: (filter) => set({ filter }),
  importFromLegacy: (legacyOrders) => {
    console.log('Import legacy orders:', legacyOrders.length)
  },
}))
