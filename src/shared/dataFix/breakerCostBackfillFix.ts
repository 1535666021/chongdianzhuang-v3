/**
 * P0-197-R1：漏保成本回填修正器（语义反转后存量纠正）
 * plan+run分离；执行前 localStorage 全量备份（固定前缀+时间戳）；幂等（需自购且已含漏保器行/免配且无行的单跳过）
 */
import { useOrderStore } from '@/stores/orderStore'
import { needBreakerCost, isBreakerDeviceRow, resolveBreakerUnitCost } from '@/shared/utils/orderCalc'
import type { Order } from '@/types'

export const BREAKER_COST_BACKUP_PREFIX = 'cdz_v3_breaker_cost_backfill_backup'

export interface BreakerCostPlanItem {
  order: Order
  updates: Partial<Order>
  summary: string
}

export interface BreakerCostReport {
  total: number
  fixed: number
  backedUp: boolean
  backupKey: string
  runAt: number
}

/** 纯函数 plan（不写库）：已完成单；需自购却无漏保器行→补计差额；免配却有漏保器行→移除差额；重跑即空=幂等 */
export function planBreakerCostBackfillFix(orders: Order[]): { items: BreakerCostPlanItem[] } {
  const items: BreakerCostPlanItem[] = []
  for (const order of orders) {
    if (order.status !== '已完成') continue
    const need = needBreakerCost(order.brandName || '', order.powerKw)
    const hasDevice = (order.materials || []).some((m) => isBreakerDeviceRow(m.name))
    if (need === hasDevice) continue // 幂等：口径一致跳过
    const unit = resolveBreakerUnitCost(order) // P0-210 G3：归并唯一出口（原私有 breakerUnitCost 已提升 orderCalc）
    if (need && !hasDevice) {
      const add = Math.round(unit * 100) / 100
      items.push({
        order,
        updates: { materialCost: Math.round(((order.materialCost ?? 0) + add) * 100) / 100 },
        summary: `漏保需自购未计成本 → 补 +${add}（${order.brandName} ${order.powerKw || ''}kW）`,
      })
    } else {
      const sub = Math.round(unit * 100) / 100
      items.push({
        order,
        updates: { materialCost: Math.round(((order.materialCost ?? 0) - sub) * 100) / 100 },
        summary: `漏保免配却计了成本 → 减 -${sub}（${order.brandName} ${order.powerKw || ''}kW）`,
      })
    }
  }
  return { items }
}

export function buildBreakerCostBackupKey(ts: number): string {
  const d = new Date(ts)
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`
  return `${BREAKER_COST_BACKUP_PREFIX}_${stamp}`
}

/** 执行修正：强制备份→逐单写入→报告 */
export function runBreakerCostBackfillFix(): BreakerCostReport {
  const orders = useOrderStore.getState().orders
  const { items } = planBreakerCostBackfillFix(orders)
  const backupKey = buildBreakerCostBackupKey(Date.now())
  localStorage.setItem(backupKey, JSON.stringify(items.map((it) => it.order)))
  const updateOrder = useOrderStore.getState().updateOrder
  let fixed = 0
  for (const it of items) {
    try {
      updateOrder(it.order.id, it.updates)
      fixed++
    } catch (error) {
      console.warn('[漏保回填] 单条失败已跳过', it.order.id, error)
    }
  }
  return { total: items.length, fixed, backedUp: true, backupKey, runAt: Date.now() }
}
