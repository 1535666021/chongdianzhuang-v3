/**
 * P0-136：桩名称品牌错单自愈（一次性迁移，App启动执行一次，幂等，与P0-123姓名迁移并行互不依赖）。
 * brand 非法判定：空/未知品牌，或 brandName 值恰为原文"订单来源"行值（发布者昵称串位，甲方实证"妍伟"案例）；
 * 从原文桩名称/车辆型号行按 PILE_BRAND_KEYWORDS 最长匹配重识别；确定性命中才回写 brandName；
 * 歧义/未命中保持原样计数；_brandRepaired 标记幂等；非此类订单零触碰。
 */
import type { Order } from '@/types'
import { PILE_BRAND_KEYWORDS } from '@/constants/brands'
import { useOrderStore } from '@/stores/orderStore'

export interface BrandRepairReport { scanned: number; repaired: number; skipped: number; untouched: number; ambiguous: number }

/** brand 是否非法（需重识别）：空/未知，或值=原文订单来源行值（串位特征） */
export function isMistakenBrand(order: Order): boolean {
  const b = (order.brandName || '').trim()
  if (!b || b === '未知品牌') return true
  if (order.rawText) {
    const esc = b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (new RegExp(`订单来源[:：]\\s*${esc}`).test(order.rawText)) return true
  }
  return false
}

/** 从原文桩名称/车辆型号行确定性识别品牌：最长匹配，同长度多命中=歧义（返回null） */
export function identifyBrandFromPile(rawText: string): string | null {
  const pileText = (rawText.match(/桩名称[:：]([^\n]+)/)?.[1] || '') + (rawText.match(/车辆型号[:：]([^\n]+)/)?.[1] || '')
  if (!pileText) return null
  const matched = PILE_BRAND_KEYWORDS.filter((e) => pileText.includes(e.kw))
  if (matched.length === 0) return null
  const maxLen = Math.max(...matched.map((e) => e.kw.length))
  const best = matched.filter((e) => e.kw.length === maxLen)
  return best.length === 1 ? best[0].brand : null
}

export function repairMistakenBrands(): BrandRepairReport {
  const report: BrandRepairReport = { scanned: 0, repaired: 0, skipped: 0, untouched: 0, ambiguous: 0 }
  const store = useOrderStore.getState()
  for (const order of store.orders) {
    report.scanned++
    if ((order as unknown as { _brandRepaired?: boolean })._brandRepaired) continue
    if (!isMistakenBrand(order)) { report.untouched++; continue }
    const raw = order.rawText || ''
    const brand = identifyBrandFromPile(raw)
    if (!brand) { report.skipped++; continue }
    // 歧义判定：identifyBrandFromPile返回null含歧义与无命中两种，细分：有匹配但同长度多命中=歧义
    const pileText = (raw.match(/桩名称[:：]([^\n]+)/)?.[1] || '') + (raw.match(/车辆型号[:：]([^\n]+)/)?.[1] || '')
    const matched = PILE_BRAND_KEYWORDS.filter((e) => pileText.includes(e.kw))
    if (matched.length > 0 && brand === null) report.ambiguous++
    store.updateOrder(order.id, { brandName: brand, _brandRepaired: true } as Partial<Order>)
    report.repaired++
  }
  if (report.scanned > 0 && report.repaired + report.skipped > 0) {
    console.log(`[P0-136迁移] 扫描${report.scanned} 修复${report.repaired} 跳过${report.skipped} 未触碰${report.untouched} 歧义${report.ambiguous}`)
  }
  return report
}
