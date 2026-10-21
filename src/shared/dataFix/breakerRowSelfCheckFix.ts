/**
 * P0-210 G3：已完成单漏保器行存量纠偏·启动自检（挂 App.tsx 启动序列）
 * 背景：已完成单材料清单是完工时刻快照，漏保矩阵（P0-210 G2 归一化）修好后存量不跟进。
 * 口径：机器纠偏，只纠漏保器行，其余行一律不碰——
 *  ① 矩阵需自购且清单无漏保器行 → 补行（unitPrice 取 resolveBreakerUnitCost 同款回退），materialCost 同步+差额；
 *  ② 矩阵免配且清单有多余漏保器行 → 移除该行，materialCost 同步-差额（行存价缺失时按同款回退价计）；
 *  ③ 差额回写沿用 P0-197-R1 舍入（round2）与备份模式（写前 localStorage 备份受影响单原文，固定前缀+时间戳）；
 *  ④ 幂等：纯比对（need===hasDevice 即跳过），重跑零写入，禁标记滥用；
 *  ⑤ 与 P0-207 repairWanlianFlowOrders 互不干涉。
 */
import { useOrderStore } from '@/stores/orderStore'
import { needBreakerCost, isBreakerDeviceRow, resolveBreakerUnitCost, resolveBreakerRowName } from '@/shared/utils/orderCalc'
import type { Order, OrderMaterialItem } from '@/types'

export const BREAKER_ROW_SELFCHECK_BACKUP_PREFIX = 'cdz_v3_breaker_row_selfcheck_backup'

export interface BreakerRowPlanItem {
  order: Order
  updates: Partial<Order>
  summary: string
}

export interface BreakerRowSelfCheckReport {
  total: number
  fixed: number
  backedUp: boolean
  backupKey: string
  runAt: number
}

/** P0-197-R1 同款舍入 */
const round2 = (n: number): number => Math.round(n * 100) / 100

/** 纯函数 plan（不写库）：已完成单；需自购缺行→补行；免配多行→删行；口径一致→跳过（重跑即空=幂等） */
export function planBreakerRowSelfCheck(orders: Order[]): { items: BreakerRowPlanItem[] } {
  const items: BreakerRowPlanItem[] = []
  for (const order of orders) {
    if (order.status !== '已完成') continue
    const need = needBreakerCost(order.brandName || '', order.powerKw)
    const materials = order.materials || []
    const deviceRows = materials.filter((m) => isBreakerDeviceRow(m.name))
    const hasDevice = deviceRows.length > 0
    if (need === hasDevice) continue // 幂等：口径一致跳过，零写入
    if (need && !hasDevice) {
      const unit = round2(resolveBreakerUnitCost(order))
      const name = resolveBreakerRowName(order)
      if (!name) continue // 安全兜底：无可用漏保器名称不补（正常不会发生）
      const row: OrderMaterialItem = { name, quantity: 1, unit: '个', unitPrice: unit }
      items.push({
        order,
        updates: { materials: [...materials, row], materialCost: round2((order.materialCost ?? 0) + unit) },
        summary: `需自购缺漏保行 → 补行「${name}×1」+${unit}（${order.brandName} ${order.powerKw || ''}）`,
      })
    } else if (!need && hasDevice) {
      const sub = round2(
        deviceRows.reduce((s, m) => s + (typeof m.unitPrice === 'number' ? m.unitPrice : resolveBreakerUnitCost(order)) * (m.quantity || 1), 0)
      )
      items.push({
        order,
        updates: { materials: materials.filter((m) => !isBreakerDeviceRow(m.name)), materialCost: round2((order.materialCost ?? 0) - sub) },
        summary: `免配多余漏保行 → 移除 ${deviceRows.length} 行 -${sub}（${order.brandName} ${order.powerKw || ''}）`,
      })
    }
  }
  return { items }
}

/** 备份键：P0-197-R1 同款模式（固定前缀+YYYYMMDD_HHmmss） */
function buildBackupKey(ts: number): string {
  const d = new Date(ts)
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`
  return `${BREAKER_ROW_SELFCHECK_BACKUP_PREFIX}_${stamp}`
}

/** 执行自检：零命中零写入直返；有命中→写前备份受影响单原文→逐单写入→console 报告 */
export function runBreakerRowSelfCheck(): BreakerRowSelfCheckReport {
  const runAt = Date.now()
  const orders = useOrderStore.getState().orders
  const { items } = planBreakerRowSelfCheck(orders)
  if (items.length === 0) {
    console.log('[漏保行自检] 全部单口径一致，零写入')
    return { total: 0, fixed: 0, backedUp: false, backupKey: '', runAt }
  }
  const backupKey = buildBackupKey(runAt)
  localStorage.setItem(backupKey, JSON.stringify(items.map((it) => it.order))) // 写前备份受影响单（P0-197-R1 同款）
  const updateOrder = useOrderStore.getState().updateOrder
  let fixed = 0
  for (const it of items) {
    try {
      updateOrder(it.order.id, it.updates)
      fixed++
      console.log('[漏保行自检]', it.summary)
    } catch (error) {
      console.warn('[漏保行自检] 单条失败已跳过', it.order.id, error)
    }
  }
  console.log(`[漏保行自检] 完成：命中 ${items.length}，写入 ${fixed}，备份键 ${backupKey}`)
  return { total: items.length, fixed, backedUp: true, backupKey, runAt }
}
