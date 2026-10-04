/**
 * P0-123：群公告错单姓名自修复（一次性迁移，App启动执行一次，幂等）。
 * 口径：凡保存有原始文本(rawText)且为群公告来源（原文含"订单来源"）的订单，
 * 按新口径从原文"购车人/电话""联系人/电话"字段重新提取姓名回写；
 * 仅确定性提取（字段存在且剥离电话后非空）才回写；提取失败保持原样并计数；
 * 已修复单（_nameRepaired标记）重复扫描零改动；非群公告订单零触碰。
 */
import type { Order } from '@/types'
import { useOrderStore } from '@/stores/orderStore'

export interface RepairReport { scanned: number; repaired: number; skipped: number; nonGroupNotice: number }

/** 从群公告原文确定性提取姓名（购车人/电话优先，联系人/电话兜底） */
export function extractNameFromGroupNotice(rawText: string): string {
  const m = rawText.match(/购车人\/电话[:：]\s*([^\s\d:：]+)/) || rawText.match(/联系人\/电话[:：]\s*([^\s\d:：]+)/)
  return m ? m[1].trim() : ''
}

export function isGroupNoticeRaw(rawText?: string): boolean {
  return !!rawText && /订单来源[:：]/.test(rawText)
}

export function repairGroupNoticeNames(): RepairReport {
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
