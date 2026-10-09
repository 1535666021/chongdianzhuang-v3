/**
 * P0-139-R1：回收站统一判定与工具（业务流排除的唯一入口，禁各处散落 if）。
 * 兼容存量：老单无 deletedAt 但 status==='回收站' 也算回收单（既有语义）。
 */
import type { Order } from '@/types'
import { useOrderStore } from '@/stores/orderStore'

/** 回收单保留期（天），集中常量禁散落魔法数 */
export const RECYCLE_RETENTION_DAYS = 30

/** 统一判定：是否回收站单 */
export function isDeletedOrder(order: Order): boolean {
  return !!order.deletedAt || order.status === '回收站'
}

/** 正常业务流订单（全部列表/统计/材料/补桩/话术统一走此过滤） */
export function activeOrders(orders: Order[]): Order[] {
  return orders.filter((o) => !isDeletedOrder(o))
}

/** 回收站订单列表（新→旧） */
export function recycleOrders(orders: Order[]): Order[] {
  return orders.filter(isDeletedOrder).sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0))
}

export interface PurgeReport { scanned: number; purged: number; kept: number }

/** 到期回收单自动彻底删除（启动时执行一次；now 可注入便于测试） */
export function purgeExpiredRecycleBin(now: number = Date.now()): PurgeReport {
  const report: PurgeReport = { scanned: 0, purged: 0, kept: 0 }
  const store = useOrderStore.getState()
  const retentionMs = RECYCLE_RETENTION_DAYS * 24 * 60 * 60 * 1000
  for (const order of store.orders) {
    if (!isDeletedOrder(order)) continue
    report.scanned++
    if (order.deletedAt && now - order.deletedAt > retentionMs) {
      store.purgeOrder(order.id)
      report.purged++
    } else {
      report.kept++
    }
  }
  if (report.scanned > 0) {
    console.log(`[P0-139回收站] 扫描${report.scanned} 到期清理${report.purged} 保留${report.kept}`)
  }
  return report
}
