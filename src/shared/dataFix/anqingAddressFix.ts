/**
 * P0-250 v2 件3（甲方裁示④）：存量从系统原始记录重跑重新提取地址
 * 范围：order.rawText 有值（卡片「查看原始记录」）→ 用修复后解析出口重跑 → 新地址≠存值则只归正 address
 * 禁打省市补丁（v1 补丁法作废）；只写 address，金额/品牌/电话/姓名/VIN 零触碰；其他字段脏→日志记数上报不自作主张
 * 保险：plan/run 分离+执行前备份+幂等+留痕日志；首进自动执行一次+toast
 */
import type { Order } from '@/types'
import { useOrderStore } from '@/stores/orderStore'
import { parseOrderTextDetailed } from '@/lib/parser'

export const AQ_REEXTRACT_BACKUP_PREFIX = 'cdz_v3_aqreextract_backup_'
export const AQ_REEXTRACT_RUN_AT_KEY = 'cdz_aqreextract_p0250v2_run_at'
export const AQ_REEXTRACT_LOG_KEY = 'cdz_aqreextract_fix_log'

/** plan（纯函数）：重跑原始记录取地址，与存值比对 */
export function planAddressReextract(orders: Order[]): { order: Order; from: string; to: string }[] {
  return orders
    .filter((o) => !!o.rawText && o.address)
    .map((o) => {
      let to = ''
      try { to = (parseOrderTextDetailed(o.rawText!).items[0] || {}).address || '' } catch { to = '' }
      return { o, to }
    })
    .filter((x) => x.to && x.to !== x.o.address)
    .map(({ o, to }) => ({ order: o, from: o.address!, to }))
}

export function runAddressReextract(orders: Order[]): { fixed: number; otherDirty: number } {
  if (localStorage.getItem(AQ_REEXTRACT_RUN_AT_KEY)) return { fixed: 0, otherDirty: 0 }
  const targets = planAddressReextract(orders)
  const runAt = Date.now()
  let otherDirty = 0
  if (targets.length > 0) {
    localStorage.setItem(`${AQ_REEXTRACT_BACKUP_PREFIX}${runAt}`, JSON.stringify(targets.map(({ order, from }) => ({ id: order.id, address: from }))))
    const log = JSON.parse(localStorage.getItem(AQ_REEXTRACT_LOG_KEY) || '[]')
    const { updateOrder } = useOrderStore.getState()
    for (const { order, to } of targets) {
      const before = order.rawText ? (() => { try { return parseOrderTextDetailed(order.rawText).items[0] || {} } catch { return {} } })() : {}
      const afterAddr = to
      const otherFields = ['customerName', 'phone', 'brandName', 'vin'] as const
      const dirtyOthers = otherFields.filter((k) => (before as any)[k] && (before as any)[k] !== (order as any)[k]).length
      if (dirtyOthers > 0) otherDirty++
      updateOrder(order.id, { address: afterAddr })
      log.push({ id: order.id, from: order.address, to, otherFieldsDirty: dirtyOthers, at: new Date().toISOString() })
    }
    localStorage.setItem(AQ_REEXTRACT_LOG_KEY, JSON.stringify(log))
  }
  localStorage.setItem(AQ_REEXTRACT_RUN_AT_KEY, String(runAt))
  return { fixed: targets.length, otherDirty }
}
