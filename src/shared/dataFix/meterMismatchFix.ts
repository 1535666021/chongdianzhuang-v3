/**
 * P0-247：米数不一致存量错单自动修正器（仅首次进入自动执行一次）
 * 收窄范围：status=已完成 ∧ completionCableMeters 空/0 ∧ survey.cableDistance>0 ∧ 存值 materialCost ≠ 实时导出
 * 修正：completionCableMeters 补 survey 米数；materialCost/actualProfit/reconciliationProfit 按实时导出三出口同刷
 * 保险：执行前备份 cdz_v3_metermismatch_backup_<ts> + RUN_AT_KEY 幂等 + 日志文件 cdz_metermismatch_fix_log
 */
import type { Order } from '@/types'
import { useOrderStore } from '@/stores/orderStore'
import { calcFullMaterialCost, calcActualProfitByPolicy, calcReconciliationProfit, buildFullMaterialCostInput } from '@/shared/utils/orderCalc'

export const METER_FIX_BACKUP_PREFIX = 'cdz_v3_metermismatch_backup_'
export const METER_FIX_RUN_AT_KEY = 'cdz_metermismatch_p0247_run_at'
export const METER_FIX_LOG_KEY = 'cdz_metermismatch_fix_log'
export const METER_ZERO_OVERRIDE_LOG_KEY = 'cdz_meter_zero_overrides' // 件1 坚持按0留痕键

/** 件1 拦截判定：电缆米数不一致（当前按 0 ∧ 勘测有米数） */
export function detectMeterMismatch(cableMeters: number | undefined | null, surveyMeters: number | undefined | null): boolean {
  return (cableMeters ?? 0) === 0 && (surveyMeters ?? 0) > 0
}

/** 命中条件（收窄三条件+存值不符） */
export function isMeterMismatchOrder(order: Order): boolean {
  if (order.status !== '已完成') return false
  const sm = order.survey?.cableDistance || 0
  if (sm <= 0) return false
  if ((order.completionCableMeters ?? 0) !== 0) return false
  const live = liveCalc(order, sm)
  return order.materialCost !== live.materialCost
}

/** 实时导出：buildFullMaterialCostInput 覆米数=勘测值 → 三出口 */
export function liveCalc(order: Order, surveyMeters: number) {
  const input = { ...buildFullMaterialCostInput(order), cableMeters: surveyMeters, pvcMeters: surveyMeters }
  const t = calcFullMaterialCost(input)
  const materialCost = t.total
  const common = {
    customerPrice: order.customerPrice, platformFee: order.platformFee, serviceFee: order.serviceFee,
    tripSubsidy: order.tripSubsidy, notes: order.notes, isBusinessTrip: order.isBusinessTrip,
  }
  const reconciliationProfit = calcReconciliationProfit(common)
  const actualProfit = calcActualProfitByPolicy({ ...common, materialCost, laborCost: order.laborCost })
  return { materialCost, actualProfit, reconciliationProfit }
}

/** 执行修正（幂等：RUN_AT_KEY 已置则返回 0；无命中也置 RUN_AT_KEY） */
export function runMeterMismatchFix(orders: Order[]): number {
  if (localStorage.getItem(METER_FIX_RUN_AT_KEY)) return 0
  const targets = orders.filter(isMeterMismatchOrder)
  const runAt = Date.now()
  if (targets.length > 0) {
    const backup = targets.map((o) => ({ id: o.id, materialCost: o.materialCost, actualProfit: o.actualProfit, reconciliationProfit: o.reconciliationProfit, completionCableMeters: o.completionCableMeters }))
    localStorage.setItem(`${METER_FIX_BACKUP_PREFIX}${runAt}`, JSON.stringify(backup))
    const log = JSON.parse(localStorage.getItem(METER_FIX_LOG_KEY) || '[]')
    const { updateOrder } = useOrderStore.getState()
    for (const o of targets) {
      const sm = o.survey!.cableDistance!
      const live = liveCalc(o, sm)
      updateOrder(o.id, { completionCableMeters: sm, ...live })
      log.push({ id: o.id, from: { materialCost: o.materialCost, actualProfit: o.actualProfit, reconciliationProfit: o.reconciliationProfit }, to: live, at: new Date().toISOString() })
    }
    localStorage.setItem(METER_FIX_LOG_KEY, JSON.stringify(log))
  }
  localStorage.setItem(METER_FIX_RUN_AT_KEY, String(runAt))
  return targets.length
}
