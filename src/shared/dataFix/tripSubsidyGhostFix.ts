/**
 * P0-239：幽灵补助存量修正器（一次性工具，RULES §9 模板：plan/run 分离+执行前备份+幂等+留痕+设置页入口）
 * 范围：已完成未删除单中 胶囊未标出差（isBusinessTrip !== true）但 tripSubsidy 存值 > 0 的幽灵单
 *   → tripSubsidy 归 0 + actualProfit/reconciliationProfit 新口径重算回写
 *   → platformFee 只列核对报告不动手（新判定下不出差单应=付费×10%；付费 0 单本就 0）
 * 幂等：重跑即空（归 0 后不再命中范围）
 */
import type { Order } from '@/types'
import { calcActualProfitByPolicy, calcReconciliationProfit, calcTripSubsidy } from '@/shared/utils/orderCalc'
import { useOrderStore } from '@/stores/orderStore'

export const GHOST_TRIP_BACKUP_PREFIX = 'cdz_v3_ghost_trip_backup_'
export const GHOST_TRIP_RUN_AT_KEY = 'cdz_ghost_trip_p0239_run_at'

export interface GhostTripPlanItem {
  order: Order
  summary: string
}
export interface GhostTripPlan {
  items: GhostTripPlanItem[]
  total: number
}
export interface GhostTripReport {
  total: number
  fixed: number
  feeMismatches: Array<{ orderId: string; customerName: string; stored: number; expected: number }>
  backedUp: boolean
  backupKey: string
  runAt: number
}

/** 范围：已完成未删除 + 胶囊未标出差 + 补助存值 > 0（幂等：修过的单不再命中） */
export function isInGhostTripScope(order: Order): boolean {
  return order.status === '已完成' && !order.deletedAt && order.isBusinessTrip !== true && (order.tripSubsidy || 0) > 0
}

/** plan（纯函数，不写库）：列明细=姓名/单号/原补助值 */
export function planGhostTripFix(orders: Order[]): GhostTripPlan {
  const items = orders.filter(isInGhostTripScope).map((order) => ({
    order,
    summary: `${order.customerName || '（未命名）'}｜单号 ${order.id.slice(0, 8)}…｜原补助 ${order.tripSubsidy}`,
  }))
  return { items, total: items.length }
}

/** platformFee 核对（只列不动）：不出差单存值应=round(付费×10%)（付费0单=0） */
export function checkPlatformFeeConsistency(orders: Order[]): GhostTripReport['feeMismatches'] {
  const out: GhostTripReport['feeMismatches'] = []
  for (const order of orders) {
    if (order.status !== '已完成' || order.deletedAt || order.isBusinessTrip === true) continue
    const expected = Math.round(((order.customerPrice || 0) * 0.1) * 100) / 100
    if (Math.abs(Math.abs(order.platformFee || 0) - expected) > 0.011) {
      out.push({ orderId: order.id, customerName: order.customerName || '（未命名）', stored: order.platformFee || 0, expected })
    }
  }
  return out
}

/** run：备份 → 逐单归 0+重算 → 留痕（幂等可重复执行） */
export function runGhostTripFix(): GhostTripReport {
  const orders = useOrderStore.getState().orders
  const plan = planGhostTripFix(orders)
  const feeMismatches = checkPlatformFeeConsistency(orders)
  let backupKey = ''
  if (plan.total > 0) {
    backupKey = `${GHOST_TRIP_BACKUP_PREFIX}${Date.now()}`
    localStorage.setItem(backupKey, JSON.stringify(plan.items.map((i) => i.order)))
  }
  let fixed = 0
  for (const { order } of plan.items) {
    const tripSubsidy = calcTripSubsidy(false)
    const actualProfit = calcActualProfitByPolicy({
      customerPrice: order.customerPrice, platformFee: order.platformFee, serviceFee: order.serviceFee,
      materialCost: order.materialCost, laborCost: order.laborCost, isBusinessTrip: false,
    })
    const reconciliationProfit = calcReconciliationProfit({
      platformFee: order.platformFee, serviceFee: order.serviceFee, isBusinessTrip: false,
    })
    useOrderStore.getState().updateOrder(order.id, { tripSubsidy, actualProfit, reconciliationProfit })
    fixed++
  }
  const runAt = Date.now()
  localStorage.setItem(GHOST_TRIP_RUN_AT_KEY, String(runAt))
  return { total: plan.total, fixed, feeMismatches, backedUp: plan.total > 0, backupKey, runAt }
}
