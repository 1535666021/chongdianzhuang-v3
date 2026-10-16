/**
 * 老系统数据读取器（R7修复版）
 * 兼容 v32.1 快照数据格式 + 历史分桶格式
 */

export interface LegacyOrderData {
  id: string
  customerName: string
  phone: string
  address: string
  platform: string
  status: string
  region: string
  appointmentDate?: string
  appointmentTime?: string
  materialCost: number
  laborCost: number
  platformFee: number
  actualProfit: number
  notes: string
  meterStatus: string
  createdAt: number
}

/** 老系统订单存储键名（15个历史键） */
const LEGACY_ORDER_KEYS = [
  'orders',                // 主待办桶
  'appointmentOrders',     // 已预约主桶 ← R7新增
  'appointedOrders',       // 已预约备选
  'scheduledOrders',       // 已预约备选
  'completedOrders',       // 已完成主桶
  'trashOrders',           // 回收站主桶
  'cdz_orders',            // v3早期格式
  'cp_orders',             // v7当前格式
  'pendingOrders',         // 待办分桶
  'orderList',             // 列表分桶
  'completed',             // 已完成备选
  'doneOrders',            // 已完成备选
  'trash',                 // 回收站备选
  'deletedOrders',         // 回收站备选
  'recycleOrders',         // 回收站备选
]

export function readLegacyOrders(): LegacyOrderData[] {
  try {
    const allOrders: LegacyOrderData[] = []
    const seenIds = new Set<string>()

    for (const key of LEGACY_ORDER_KEYS) {
      const raw = localStorage.getItem(key)
      if (!raw) continue

      let data: unknown
      try {
        data = JSON.parse(raw)
      } catch {
        continue
      }

      const list = Array.isArray(data) ? data : (data as any)?.orders
      if (!Array.isArray(list)) continue

      for (const item of list) {
        if (!item || typeof item !== 'object') continue
        const id = String((item as any).id || '')
        if (!id || seenIds.has(id)) continue
        seenIds.add(id)
        allOrders.push(item as LegacyOrderData)
      }
    }

    return allOrders
  } catch {
    return []
  }
}
