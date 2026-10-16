/**
 * P0-184⑦：存量出差单扣点归0修正器
 * plan+run分离；执行前localStorage备份（固定前缀+时间戳）；幂等（platformFee已=0的出差单跳过）
 */
import { useOrderStore } from '@/stores/orderStore'
import { isBusinessTripOrder } from '@/shared/utils/orderCalc'
import type { Order } from '@/types'

export const TRIP_FEE_ZERO_BACKUP_PREFIX = 'cdz_v3_trip_fee_zero_backup'
export const TRIP_FEE_ZERO_RUN_AT_KEY = 'cdz_trip_fee_zero_fix_run_at'

export interface TripFeeZeroPlanItem {
  order: Order
  updates: Partial<Order>
  summary: string
}

export interface TripFeeZeroReport {
  total: number
  fixed: number
  skippedAlreadyZero: number
  backedUp: boolean
  backupKey: string
  runAt: number
}

/** 纯函数 plan（不写库）：已完成 + 出差判定 + platformFee≠0 才出项；重跑即空=幂等 */
export function planTripFeeZeroFix(orders: Order[]): { items: TripFeeZeroPlanItem[]; skippedAlreadyZero: number } {
  const items: TripFeeZeroPlanItem[] = []
  let skippedAlreadyZero = 0
  for (const order of orders) {
    if (order.status !== '已完成') continue
    if (!isBusinessTripOrder(order)) continue
    if ((order.platformFee ?? 0) === 0) { skippedAlreadyZero++; continue }
    items.push({ order, updates: { platformFee: 0 }, summary: `出差单扣点归0（原 ${order.platformFee}）` })
  }
  return { items, skippedAlreadyZero }
}

export function buildTripFeeZeroBackupKey(ts: number): string {
  const d = new Date(ts)
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`
  return `${TRIP_FEE_ZERO_BACKUP_PREFIX}_${stamp}`
}

/** 执行修正：强制备份→逐单写入→报告 */
export function runTripFeeZeroFix(): TripFeeZeroReport {
  const orders = useOrderStore.getState().orders
  const { items, skippedAlreadyZero } = planTripFeeZeroFix(orders)
  const backupKey = buildTripFeeZeroBackupKey(Date.now())
  localStorage.setItem(backupKey, JSON.stringify(items.map((it) => it.order)))
  const updateOrder = useOrderStore.getState().updateOrder
  let fixed = 0
  for (const it of items) {
    try {
      updateOrder(it.order.id, it.updates)
      fixed++
    } catch (error) {
      console.warn('[出差归0] 单条失败已跳过', it.order.id, error)
    }
  }
  const report: TripFeeZeroReport = { total: items.length, fixed, skippedAlreadyZero, backedUp: true, backupKey, runAt: Date.now() }
  localStorage.setItem(TRIP_FEE_ZERO_RUN_AT_KEY, String(report.runAt))
  console.log('[出差归0] 报告', report)
  return report
}

export function getTripFeeZeroFixRunAt(): number | null {
  const raw = localStorage.getItem(TRIP_FEE_ZERO_RUN_AT_KEY)
  return raw ? Number(raw) : null
}
