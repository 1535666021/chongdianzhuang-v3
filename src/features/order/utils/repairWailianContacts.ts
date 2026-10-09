/**
 * P0-138：外联单错单自愈（车主姓名优先+双联系人补录，一次性迁移，幂等，与P0-123/136标记独立）。
 * 外联单来源（原文含"外联单号"）且（customerName≠车主姓名 或 contacts缺失）的旧单，
 * 从原文"车主姓名/车主电话/联系人/联系人电话"字段重提取回写；确定性命中才回写；
 * 失败保持原样计数；_wailianRepaired 标记幂等；非外联单零触碰。
 */
import type { Order } from '@/types'
import { useOrderStore } from '@/stores/orderStore'

export interface WailianRepairReport { scanned: number; repaired: number; skipped: number; untouched: number }

const stripDate = (v: string) => (v || '').replace(/\s*\d{1,2}\.\d{1,2}-\d{1,2}\.\d{1,2}号?/g, '').trim()

export function isWailianRaw(rawText?: string): boolean {
  return !!rawText && /外联单号[:：]/.test(rawText)
}

/** 从外联单原文提取车主+联系人（车主姓名优先为主姓名） */
export function extractWailianContacts(rawText: string): Array<{ relation: string; name: string; phone: string }> {
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

export function repairWailianContacts(): WailianRepairReport {
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
