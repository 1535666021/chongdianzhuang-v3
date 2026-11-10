/**
 * P0-246：子品牌归正存量修正器（一次性工具，RULES §9 模板：plan/run 分离+执行前备份+幂等+留痕+设置页入口）
 * 范围：历史错标单（brandName=母品牌，subBrand/vehicleModel/rawText 含子品牌词）→ brandName 归正为子品牌词+subBrand 清脏
 * 幂等：重跑即空（归正后 brandName=子品牌词不再命中母品牌范围）
 */
import type { Order } from '@/types'
import { useOrderStore } from '@/stores/orderStore'

export const SUBBRAND_FIX_BACKUP_PREFIX = 'cdz_v3_subbrand_backup_'
export const SUBBRAND_FIX_RUN_AT_KEY = 'cdz_subbrand_p0246_run_at'

/** P0-246：子品牌词表（与 parser-engines SUB_BRAND_WORDS 同源同序） */
export const SUB_BRAND_WORDS_FIX = [
  '方程豹', '仰望', '腾势', '欧拉', '坦克', '魏牌', '星途', '捷途',
  '深蓝', '阿维塔', '埃安', '昊铂', '乐道', '极狐', '岚图',
  '问界', '智界', '享界', '尊界',
]

/** 品牌谱系：子品牌词→母品牌 */
const PARENT_OF: Record<string, string> = {
  '方程豹': '比亚迪', '仰望': '比亚迪', '腾势': '比亚迪',
  '欧拉': '长城', '坦克': '长城', '魏牌': '长城',
  '星途': '奇瑞', '捷途': '奇瑞',
  '深蓝': '长安', '阿维塔': '长安',
  '埃安': '广汽', '昊铂': '广汽',
  '乐道': '蔚来', '极狐': '北汽', '岚图': '东风',
  '问界': '赛力斯', '智界': '奇瑞', '享界': '北汽', '尊界': '江淮',
}

export interface SubBrandPlanItem { order: Order; summary: string }
export interface SubBrandPlan { items: SubBrandPlanItem[]; total: number }
export interface SubBrandReport { total: number; fixed: number; backedUp: boolean; backupKey: string; runAt: number }

/** 检测：brandName=母品牌 + （subBrand/vehicleModel/rawText 任一含子品牌词）→ 归正目标词 */
export function detectMislabeledSubBrand(order: Order): { word: string; parent: string } | null {
  const brand = order.brandName || ''
  const parentEntry = Object.entries(PARENT_OF).find(([, p]) => p === brand)
  if (!parentEntry) return null
  const hit = SUB_BRAND_WORDS_FIX.find((w) => (
    (order.subBrand || '').includes(w) ||
    (order.rawText || '').includes(w) ||
    (order.vehicleModel || '').includes(w)
  ))
  return hit ? { word: hit, parent: brand } : null
}

export function isInSubBrandFixScope(order: Order): boolean {
  const d = detectMislabeledSubBrand(order)
  return !!d && order.brandName !== d.word
}

export function planSubBrandFix(orders: Order[]): SubBrandPlan {
  const items = orders.filter(isInSubBrandFixScope).map((order) => {
    const d = detectMislabeledSubBrand(order)!
    return { order, summary: `${order.customerName || '（未命名）'}｜单号 ${order.id.slice(0, 8)}…｜${d.parent}→${d.word}` }
  })
  return { items, total: items.length }
}

export function runSubBrandFix(orders: Order[]): SubBrandReport {
  const plan = planSubBrandFix(orders)
  const { updateOrder } = useOrderStore.getState()
  const runAt = Date.now()
  let backupKey = ''
  let backedUp = false
  if (plan.total > 0) {
    const backup = plan.items.map(({ order }) => ({ id: order.id, brandName: order.brandName, subBrand: order.subBrand }))
    backupKey = `${SUBBRAND_FIX_BACKUP_PREFIX}${runAt}`
    localStorage.setItem(backupKey, JSON.stringify(backup))
    backedUp = true
    for (const { order } of plan.items) {
      const d = detectMislabeledSubBrand(order)!
      updateOrder(order.id, { brandName: d.word, subBrand: undefined })
    }
  }
  localStorage.setItem(SUBBRAND_FIX_RUN_AT_KEY, String(runAt))
  return { total: plan.total, fixed: plan.total, backedUp, backupKey, runAt }
}
