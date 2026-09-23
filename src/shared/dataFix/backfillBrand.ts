/* ============================================================
 * P0-102：品牌识别一次性回溯修正
 * 背景：P0-101 前导入的万帮单，brandName 被工单描述"品牌：银河"抢先，
 *       正确应为"服务品牌：吉利极氪…"的"吉利"。
 *       以 order.rawText 为数据源，用新解析逻辑重推导并回填。
 * 口径：仅万帮单（rawText 含"外联单号"）且重解析候选品牌为"吉利"
 *       且当前品牌非"吉利"——保守防误伤，其他场景一律不碰。
 * ============================================================ */

import type { Order } from '@/types'
import { parseOrderTextDetailed } from '@/lib/parser'
import { useOrderStore } from '@/stores/orderStore'
import { LocalStorageAdapter } from '@/shared/storage'
import { toast } from '@/shared/hooks/useToast'

const MIGRATION_KEY = 'cdz_migration_brandfix_v1'
const TARGET_BRAND = '吉利'
const WANBANG_MARKER = '外联单号'

const migrationStorage = new LocalStorageAdapter<string>('')

export interface BrandFixDetail { orderId: string; oldBrand: string; newBrand: string }
export interface BrandFixResult { updated: number; details: BrandFixDetail[] }

/** 计算待修正明细（纯函数，不写库）：rawText空跳过、非万帮单不碰、单单异常隔离 */
export function planBrandBackfill(orders: Order[]): BrandFixDetail[] {
  const details: BrandFixDetail[] = []
  for (const order of orders) {
    try {
      const raw = order.rawText || ''
      if (!raw.trim() || !raw.includes(WANBANG_MARKER)) continue
      if ((order.brandName || '') === TARGET_BRAND) continue
      const candidate = parseOrderTextDetailed(raw).items[0]?.brandName || ''
      if (candidate === TARGET_BRAND) {
        details.push({ orderId: order.id, oldBrand: order.brandName || '', newBrand: TARGET_BRAND })
      }
    } catch (error) {
      console.warn('[品牌修正] 单条解析失败已跳过', order.id, error)
    }
  }
  return details
}

/** 执行回溯：仅回填 brandName，其他字段一律不动 */
export function backfillBrandFromRawText(orders: Order[]): BrandFixResult {
  const details = planBrandBackfill(orders)
  const updateOrder = useOrderStore.getState().updateOrder
  for (const d of details) updateOrder(d.orderId, { brandName: d.newBrand })
  console.log('[品牌修正] 明细', details)
  return { updated: details.length, details }
}

function toastResult(updated: number) {
  if (updated > 0) toast.success(`品牌修正完成：修正${updated}单（银河→吉利）`)
  else toast.info('无需修正')
}

/** App启动一次性触发：标记不存在 → 执行回溯 → 写入标记（二次启动不再执行） */
export function runBrandBackfillOnce(): void {
  try {
    if (migrationStorage.get(MIGRATION_KEY)) return
    const { updated } = backfillBrandFromRawText(useOrderStore.getState().orders)
    migrationStorage.set(MIGRATION_KEY, new Date().toISOString())
    toastResult(updated)
  } catch (error) {
    console.warn('[品牌修正] 启动回溯失败', error)
  }
}

/** 设置页手动入口：可重复执行，幂等（已修正的单因条件不满足自然跳过） */
export function runBrandBackfillManual(): void {
  const { updated } = backfillBrandFromRawText(useOrderStore.getState().orders)
  toastResult(updated)
}
