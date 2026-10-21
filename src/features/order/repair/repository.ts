/**
 * P0-166-B：订单自愈统一入口 orderRepairRepository
 * 四工具收编（utils/repairXxx → 本模块方法），自愈留痕（lastRepairedAt/repairType）统一由 withTrace 落。
 * 业务规则与幂等标记逐字搬迁，行为与旧工具逐例一致（B3兜底铁律）。
 */
import type { Order } from '@/types'
import { PILE_BRAND_KEYWORDS } from '@/constants/brands'
import { parseBlock } from '@/lib/parser-engines'
import { useOrderStore } from '@/stores/orderStore'

// ---------- 收编自 utils/repairGroupNoticeNames.ts（业务规则零改动） ----------
/**
 * P0-123：群公告错单姓名自修复（一次性迁移，App启动执行一次，幂等）。
 * 口径：凡保存有原始文本(rawText)且为群公告来源（原文含"订单来源"）的订单，
 * 按新口径从原文"购车人/电话""联系人/电话"字段重新提取姓名回写；
 * 仅确定性提取（字段存在且剥离电话后非空）才回写；提取失败保持原样并计数；
 * 已修复单（_nameRepaired标记）重复扫描零改动；非群公告订单零触碰。
 */

interface RepairReport { scanned: number; repaired: number; skipped: number; nonGroupNotice: number }

/** 从群公告原文确定性提取姓名（购车人/电话优先，联系人/电话兜底） */
function extractNameFromGroupNotice(rawText: string): string {
  const m = rawText.match(/购车人\/电话[:：]\s*([^\s\d:：]+)/) || rawText.match(/联系人\/电话[:：]\s*([^\s\d:：]+)/)
  return m ? m[1].trim() : ''
}

function isGroupNoticeRaw(rawText?: string): boolean {
  return !!rawText && /订单来源[:：]/.test(rawText)
}

function repairGroupNoticeNames(): RepairReport {
  const report: RepairReport = { scanned: 0, repaired: 0, skipped: 0, nonGroupNotice: 0 }
  const store = useOrderStore.getState()
  for (const order of store.orders) {
    report.scanned++
    if (!isGroupNoticeRaw(order.rawText)) { report.nonGroupNotice++; continue }
    if ((order as unknown as { _nameRepaired?: boolean })._nameRepaired) continue
    const name = extractNameFromGroupNotice(order.rawText!)
    if (!name) { report.skipped++; continue }
    store.updateOrder(order.id, { customerName: name, _nameRepaired: true } as Partial<Order>)
    report.repaired++
  }
  if (report.scanned > 0 && report.repaired + report.skipped > 0) {
    console.log(`[P0-123迁移] 扫描${report.scanned} 修复${report.repaired} 跳过${report.skipped} 非群公告${report.nonGroupNotice}`)
  }
  return report
}

// ---------- 收编自 utils/repairMistakenBrands.ts（业务规则零改动） ----------
/**
 * P0-136：桩名称品牌错单自愈（一次性迁移，App启动执行一次，幂等，与P0-123姓名迁移并行互不依赖）。
 * brand 非法判定：空/未知品牌，或 brandName 值恰为原文"订单来源"行值（发布者昵称串位，甲方实证"妍伟"案例）；
 * 从原文桩名称/车辆型号行按 PILE_BRAND_KEYWORDS 最长匹配重识别；确定性命中才回写 brandName；
 * 歧义/未命中保持原样计数；_brandRepaired 标记幂等；非此类订单零触碰。
 */

interface BrandRepairReport { scanned: number; repaired: number; skipped: number; untouched: number; ambiguous: number }

/** brand 是否非法（需重识别）：空/未知，或值=原文订单来源行值（串位特征） */
function isMistakenBrand(order: Order): boolean {
  const b = (order.brandName || '').trim()
  if (!b || b === '未知品牌') return true
  if (order.rawText) {
    const esc = b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (new RegExp(`订单来源[:：]\\s*${esc}`).test(order.rawText)) return true
  }
  return false
}

/** 从原文桩名称/车辆型号行确定性识别品牌：最长匹配，同长度多命中=歧义（返回null） */
function identifyBrandFromPile(rawText: string): string | null {
  const pileText = (rawText.match(/桩名称[:：]([^\n]+)/)?.[1] || '') + (rawText.match(/车辆型号[:：]([^\n]+)/)?.[1] || '')
  if (!pileText) return null
  const matched = PILE_BRAND_KEYWORDS.filter((e) => pileText.includes(e.kw))
  if (matched.length === 0) return null
  const maxLen = Math.max(...matched.map((e) => e.kw.length))
  const best = matched.filter((e) => e.kw.length === maxLen)
  return best.length === 1 ? best[0].brand : null
}

function repairMistakenBrands(): BrandRepairReport {
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

// ---------- 收编自 utils/repairWailianContacts.ts（业务规则零改动） ----------
/**
 * P0-138：外联单错单自愈（车主姓名优先+双联系人补录，一次性迁移，幂等，与P0-123/136标记独立）。
 * 外联单来源（原文含"外联单号"）且（customerName≠车主姓名 或 contacts缺失）的旧单，
 * 从原文"车主姓名/车主电话/联系人/联系人电话"字段重提取回写；确定性命中才回写；
 * 失败保持原样计数；_wailianRepaired 标记幂等；非外联单零触碰。
 */

interface WailianRepairReport { scanned: number; repaired: number; skipped: number; untouched: number }

const stripDate = (v: string) => (v || '').replace(/\s*\d{1,2}\.\d{1,2}-\d{1,2}\.\d{1,2}号?/g, '').trim()

function isWailianRaw(rawText?: string): boolean {
  return !!rawText && /外联单号[:：]/.test(rawText)
}

/** 从外联单原文提取车主+联系人（车主姓名优先为主姓名） */
function extractWailianContacts(rawText: string): Array<{ relation: string; name: string; phone: string }> {
  const pick = (keys: string[]) => {
    for (const k of keys) {
      const m = rawText.match(new RegExp(k + '[:：]\\s*([^\\n\\r]+)'))
      if (m) return stripDate(m[1])
    }
    return ''
  }
  const ownerName = pick(['车主姓名', '车主'])
  const ownerPhone = pick(['车主电话'])
  const contactName = pick(['联系人'])
  const contactPhone = pick(['联系人电话'])
  const out: Array<{ relation: string; name: string; phone: string }> = []
  if (ownerName) out.push({ relation: '车主', name: ownerName, phone: ownerPhone })
  if (contactName) out.push({ relation: '联系人', name: contactName, phone: contactPhone })
  return out
}

function repairWailianContacts(): WailianRepairReport {
  const report: WailianRepairReport = { scanned: 0, repaired: 0, skipped: 0, untouched: 0 }
  const store = useOrderStore.getState()
  for (const order of store.orders) {
    report.scanned++
    if ((order as unknown as { _wailianRepaired?: boolean })._wailianRepaired) continue
    if (!isWailianRaw(order.rawText)) { report.untouched++; continue }
    const contacts = extractWailianContacts(order.rawText!)
    if (contacts.length === 0) { report.skipped++; continue }
    const owner = contacts.find((c) => c.relation === '车主')
    const primaryName = owner?.name || contacts[0].name
    const primaryPhone = owner?.phone || contacts[0].phone
    const needsRepair = order.customerName !== primaryName || !order.contacts || order.contacts.length === 0
    if (!needsRepair) { report.untouched++; continue }
    store.updateOrder(order.id, { customerName: primaryName, phone: order.phone || primaryPhone, contacts, _wailianRepaired: true } as Partial<Order>)
    report.repaired++
  }
  if (report.scanned > 0 && report.repaired + report.skipped > 0) {
    console.log(`[P0-138迁移] 扫描${report.scanned} 修复${report.repaired} 跳过${report.skipped} 未触碰${report.untouched}`)
  }
  return report
}

// ---------- 收编自 utils/repairWanlianFlow.ts（业务规则零改动） ----------
/**
 * P0-140-R3：万联流式错单自动更正（启动一次，_flowRepaired幂等，与P0-123/136/138标记独立）。
 * 凡有 rawText 且为万联流式来源（^D16位WL）的订单，整单重解析；受影响字段不一致→回写；
 * 一致则仅置标；无rawText或非万联→跳过计数。
 */

interface FlowRepairReport { scanned: number; repaired: number; marked: number; skipped: number }

function isWanlianFlowRaw(rawText?: string): boolean {
  const t = (rawText || '').trim()
  return !!t && (/^D\d{16}WL/.test(t) || /HW\d{16}/.test(t) || /客户名称[:：]/.test(t))
}

interface FlowRepairReport { scanned: number; repaired: number; marked: number; skipped: number; misMarked: number }

function repairWanlianFlowOrders(): FlowRepairReport {
  // P0-207：机器让位人手（RULES R-12.5）——已存非空字段一律跳过，仅补空缺，用户手改永不被解析值覆盖。
  // _flowRepaired 维持 R5"上次核对一致"快照语义：每次启动仍重解析比对，一致→置标/跳过，不一致→只补缺。
  const report: FlowRepairReport = { scanned: 0, repaired: 0, marked: 0, skipped: 0, misMarked: 0 }
  const store = useOrderStore.getState()
  for (const order of store.orders) {
    if (!isWanlianFlowRaw(order.rawText)) continue
    report.scanned++
    const hadMark = !!(order as unknown as { _flowRepaired?: boolean })._flowRepaired
    const fresh = parseBlock(order.rawText!.trim())
    if (!fresh || (!fresh.orderNo && !fresh.customerName)) { report.skipped++; continue } // P0-141: KV类无单号键但有姓名仍可比对更正
    const patch: Partial<Order> = {}
    const fields: Array<[keyof Order, unknown]> = [
      ['orderNo', fresh.orderNo], ['platformName', fresh.platformName], ['customerName', fresh.customerName],
      ['phone', fresh.phone], ['address', fresh.address], ['vin', fresh.vin], ['powerKw', fresh.powerKw],
      ['vehicleModel', fresh.vehicleModel], ['pileName', fresh.pileName], ['installMode', fresh.installMode],
      ['remark', fresh.remark], ['brandName', fresh.brandName],
      ['appointmentDate', fresh.appointmentDate], // P0-207：P0-141 清空语义随裁定废除——已存日期一律保留，缺且解析有才补
    ]
    // P0-207（RULES R-12.5）补缺不覆盖：已存为空的定义=undefined/null/trim 后 ''（数字 0 视为非空）；
    // 解析值非空=非 null/undefined 且 trim 后长度>0。已存任何非空值（含用户手改值）一律跳过不回写。
    const isBlank = (v: unknown): boolean => v === undefined || v === null || (typeof v === 'string' && v.trim() === '')
    for (const [k, v] of fields) {
      if (isBlank(order[k]) && !isBlank(v)) (patch as Record<string, unknown>)[k] = v
    }
    if (Object.keys(patch).length > 0) {
      store.updateOrder(order.id, { ...patch, _flowRepaired: true } as Partial<Order>)
      report.repaired++
      if (hadMark) report.misMarked++ // 错标纠正：有标记但现解析不一致（R3错标事故单）
    } else {
      if (!hadMark) store.updateOrder(order.id, { _flowRepaired: true } as Partial<Order>)
      report.marked++
    }
  }
  if (report.scanned > 0) {
    console.log(`[P0-140迁移] 扫描${report.scanned} 更正${report.repaired} 错标纠正${report.misMarked} 一致${report.marked} 跳过${report.skipped}`)
  }
  return report
}

// ==================== 统一留痕（B2：唯一落点，禁止散写） ====================
export type RepairType = 'groupNoticeNames' | 'mistakenBrands' | 'wailianContacts' | 'wanlianFlow'

export interface RepairTrace {
  lastRepairedAt: number
  repairType: RepairType
}

const REPAIR_MARKER: Record<RepairType, string> = {
  groupNoticeNames: '_nameRepaired',
  mistakenBrands: '_brandRepaired',
  wailianContacts: '_wailianRepaired',
  wanlianFlow: '_flowRepaired',
}

function withTrace<T>(type: RepairType, fn: () => T): T {
  const result = fn()
  try {
    const store = useOrderStore.getState()
    const now = Date.now()
    const marker = REPAIR_MARKER[type]
    for (const o of store.orders) {
      if ((o as unknown as Record<string, unknown>)[marker]) {
        store.updateOrder(o.id, { lastRepairedAt: now, repairType: type } as Partial<Order>)
      }
    }
  } catch (error) {
    console.warn('[orderRepairRepository] 统一留痕失败（不影响修复结果）', type, error)
  }
  return result
}

/** 统一自愈入口（P0-166-B） */
export const orderRepairRepository = {
  repairGroupNoticeNames: () => withTrace('groupNoticeNames', repairGroupNoticeNames),
  repairMistakenBrands: () => withTrace('mistakenBrands', repairMistakenBrands),
  repairWailianContacts: () => withTrace('wailianContacts', repairWailianContacts),
  repairWanlianFlowOrders: () => withTrace('wanlianFlow', repairWanlianFlowOrders),
}
export type { RepairReport, BrandRepairReport, WailianRepairReport, FlowRepairReport }
export default orderRepairRepository
