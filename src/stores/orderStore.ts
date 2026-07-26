import { create } from 'zustand'
import type { Order, OrderFilter } from '@/types'
import { LocalStorageAdapter } from '@/shared/storage'

/** 金额字段清单：补全更新时只动这些字段，其他字段一律不覆盖 */
const MONEY_KEYS = ['materialCost', 'laborCost', 'platformFee', 'actualProfit', 'customerPrice'] as const

interface OrderState {
  orders: Order[]
  filter: OrderFilter
  setOrders: (orders: Order[]) => void
  addOrder: (order: Order) => void
  updateOrder: (id: string, updates: Partial<Order>) => void
  deleteOrder: (id: string) => void
  setFilter: (filter: OrderFilter) => void
  importOrders: (orders: Order[]) => { added: number; skipped: number; updated: number }
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
  /**
   * 导入（含金额对齐更新 + 状态单方向放行）：
   * - 新id → 直接追加（added）
   * - 已存在id 且新数据金额有值 → 5个金额字段以老备份快照为准直接覆盖
   *   + completeDate缺失时补齐（updated）；
   * - 状态单方向放行：仅 待办→已预约 允许导入翻正，其他状态一律不动；
   *   姓名/备注/回款标记等其他字段一律不动，保护用户在v3里的后续操作
   * - 其余已存在 → 跳过（skipped）
   */
  importOrders: (incoming) => {
    const existing = get().orders
    const existingIds = new Set(existing.map((o) => (o as any).id))
    const merged = [...existing]
    let added = 0
    let skipped = 0
    let updated = 0
    for (const order of incoming) {
      const oid = (order as any).id
      if (!existingIds.has(oid)) {
        merged.push(order)
        existingIds.add(oid)
        added++
        continue
      }
      const idx = merged.findIndex((o) => (o as any).id === oid)
      const oldOrder = merged[idx] as any
      const newHasValue = MONEY_KEYS.some((k) => Number((order as any)[k]))
      if (newHasValue) {
        merged[idx] = {
          ...oldOrder,
          materialCost: (order as any).materialCost,
          laborCost: (order as any).laborCost,
          platformFee: (order as any).platformFee,
          actualProfit: (order as any).actualProfit,
          customerPrice: (order as any).customerPrice ?? oldOrder.customerPrice,
          completeDate: oldOrder.completeDate ?? (order as any).completeDate,
          // 状态单方向放行：待办→已预约（导入翻正），其他状态一律不动
          status: (oldOrder.status === '待办' && (order as any).status === '已预约') ? '已预约' : oldOrder.status,
          appointmentDate: oldOrder.appointmentDate ?? (order as any).appointmentDate,
          appointmentTime: oldOrder.appointmentTime ?? (order as any).appointmentTime,
          updatedAt: Date.now(),
        }
        updated++
      } else {
        skipped++
      }
    }
    storage.set('list', merged)
    set({ orders: merged })
    return { added, skipped, updated }
  },
  importFromLegacy: (legacyOrders) => {
    console.log('Import legacy orders:', legacyOrders.length)
  },
}))
