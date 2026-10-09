/**
 * P0-140-R3：万联流式错单自动更正（启动一次，_flowRepaired幂等，与P0-123/136/138标记独立）。
 * 凡有 rawText 且为万联流式来源（^D16位WL）的订单，整单重解析；受影响字段不一致→回写；
 * 一致则仅置标；无rawText或非万联→跳过计数。
 */
import type { Order } from '@/types'
import { parseBlock } from '@/lib/parser-engines'
import { useOrderStore } from '@/stores/orderStore'

export interface FlowRepairReport { scanned: number; repaired: number; marked: number; skipped: number }

export function isWanlianFlowRaw(rawText?: string): boolean {
  return !!rawText && /^D\d{16}WL/.test(rawText.trim())
}

export interface FlowRepairReport { scanned: number; repaired: number; marked: number; skipped: number; misMarked: number }

export function repairWanlianFlowOrders(): FlowRepairReport {
  // P0-140-R5：_flowRepaired 降级为"上次核对一致"快照——有标记仍重解析：一致→跳过，不一致→照常更正（错标纠正）。幂等由"结果一致"天然保证。
  const report: FlowRepairReport = { scanned: 0, repaired: 0, marked: 0, skipped: 0, misMarked: 0 }
  const store = useOrderStore.getState()
  for (const order of store.orders) {
    if (!isWanlianFlowRaw(order.rawText)) continue
    report.scanned++
    const hadMark = !!(order as unknown as { _flowRepaired?: boolean })._flowRepaired
    const fresh = parseBlock(order.rawText!.trim())
    if (!fresh || !fresh.orderNo) { report.skipped++; continue }
    const patch: Partial<Order> = {}
    const fields: Array<[keyof Order, unknown]> = [
      ['orderNo', fresh.orderNo], ['platformName', fresh.platformName], ['customerName', fresh.customerName],
      ['phone', fresh.phone], ['address', fresh.address], ['vin', fresh.vin], ['powerKw', fresh.powerKw],
      ['vehicleModel', fresh.vehicleModel], ['pileName', fresh.pileName], ['installMode', fresh.installMode],
      ['remark', fresh.remark], ['brandName', fresh.brandName],
    ]
    for (const [k, v] of fields) {
      if ((order[k] || '') !== (v || '')) (patch as Record<string, unknown>)[k] = v
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
