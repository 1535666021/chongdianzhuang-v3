/**
 * P0-177-R1：存量利润一致性巡检（写入端收口配套，一次性工具）
 * 全量已完成单：orderCalc 新政策出口 calcActualProfitByPolicy 重算值 vs 存储 actualProfit（容差0.01）
 * 不一致 → 按新政策回写 actualProfit + reconciliationProfit，留痕 lastProfitAuditAt
 * 执行前强制备份漂移单（时间戳键，不覆盖旧备份），修正器同款模式，幂等可重复执行
 */
import type { Order } from '@/types'
import { calcActualProfitByPolicy, calcReconciliationProfit, calcInstallFee, resolveOrderPackageMeters } from '@/shared/utils/orderCalc'
import { useOrderStore } from '@/stores/orderStore'

/** 校验容差（元） */
export const PROFIT_AUDIT_TOL = 0.01
export const PROFIT_AUDIT_BACKUP_PREFIX = 'cdz_v3_profit_audit_backup_'
export const PROFIT_AUDIT_RUN_AT_KEY = 'cdz_profit_audit_p0177r1_run_at'

export interface ProfitAuditDetail {
  orderId: string
  customerName: string
  summary: string
}
export interface ProfitAuditReport {
  total: number
  consistent: number
  drifted: number
  skippedNoStored: number
  overriddenFeeSkipped: number
  details: ProfitAuditDetail[]
  backedUp: boolean
  backupKey: string
  runAt: number
}

export interface ProfitAuditPlanItem {
  order: Order
  updates: Partial<Order>
  summary: string
}

/** 巡检范围：全量已完成未删除单（不限日期窗口） */
export function isInProfitAuditScope(order: Order): boolean {
  return order.status === '已完成' && !order.deletedAt
}

/** 计算巡检计划（纯函数，不写库）：actualProfit 无存储值的单跳过并计数 */
export function planProfitAudit(orders: Order[]): { items: ProfitAuditPlanItem[]; consistent: number; skippedNoStored: number; overriddenFeeSkipped: number } {
  const items: ProfitAuditPlanItem[] = []
  let consistent = 0
  let skippedNoStored = 0
  let overriddenFeeSkipped = 0
  for (const order of orders) {
    if (!isInProfitAuditScope(order)) continue
    if (typeof order.actualProfit !== 'number') { skippedNoStored++; continue }
    // P0-181：服务费分档一致性（手改覆盖单豁免单列，不回写）
    if (typeof order.serviceFee === 'number') {
      if (order.isServiceFeeOverridden) { overriddenFeeSkipped++ }
      else {
        const feeExpected = calcInstallFee(resolveOrderPackageMeters(order))
        if (Math.abs(feeExpected - order.serviceFee) > PROFIT_AUDIT_TOL) {
          items.push({
            order,
            updates: { serviceFee: feeExpected, lastProfitAuditAt: Date.now() },
            summary: `serviceFee ${order.serviceFee}→${feeExpected}（套餐分档重算）`,
          })
        }
      }
    }
    const expected = calcActualProfitByPolicy(order)
    if (Math.abs(expected - order.actualProfit) <= PROFIT_AUDIT_TOL) { consistent++; continue }
    items.push({
      order,
      updates: {
        actualProfit: expected,
        reconciliationProfit: calcReconciliationProfit(order),
        lastProfitAuditAt: Date.now(),
      },
      summary: `actualProfit ${order.actualProfit}→${expected}（按新政策出口重算）`,
    })
  }
  return { items, consistent, skippedNoStored, overriddenFeeSkipped }
}

/** 备份键：固定前缀+执行时间戳，不覆盖旧备份 */
export function buildProfitAuditBackupKey(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}`
  return `${PROFIT_AUDIT_BACKUP_PREFIX}${stamp}`
}

/** 执行巡检：备份→逐单回写→报告（幂等：二次执行时存储值已一致，漂移单=0） */
export function runProfitAudit(): ProfitAuditReport {
  const orders = useOrderStore.getState().orders
  const { items, consistent, skippedNoStored, overriddenFeeSkipped } = planProfitAudit(orders)
  const backupKey = buildProfitAuditBackupKey(Date.now())
  localStorage.setItem(backupKey, JSON.stringify(items.map((it) => it.order)))
  const updateOrder = useOrderStore.getState().updateOrder
  const details: ProfitAuditDetail[] = []
  const report: ProfitAuditReport = {
    total: items.length, consistent, drifted: 0, skippedNoStored, overriddenFeeSkipped,
    details, backedUp: true, backupKey, runAt: Date.now(),
  }
  for (const it of items) {
    try {
      updateOrder(it.order.id, it.updates)
      details.push({ orderId: it.order.id, customerName: it.order.customerName, summary: it.summary })
      report.drifted++
    } catch (error) {
      console.warn('[利润巡检] 单条失败已跳过', it.order.id, error)
    }
  }
  localStorage.setItem(PROFIT_AUDIT_RUN_AT_KEY, String(report.runAt))
  console.log('[利润巡检] 报告', report)
  return report
}

export function getProfitAuditRunAt(): number | null {
  const raw = localStorage.getItem(PROFIT_AUDIT_RUN_AT_KEY)
  return raw ? Number(raw) : null
}
