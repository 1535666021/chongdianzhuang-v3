/* ============================================================
 * 批量导入判重（单点维护，P0-093）
 * 库内判重：orderNo 精确分支 + 电话/姓名分支（豁免逻辑原样保留）
 * 批内自查：orderNo→电话→姓名 三级键，同批重复只保留首条
 * ============================================================ */

import type { Order } from '@/types'

export type DupMatchedBy = 'orderNo' | 'phone' | 'name'

export interface ExistingDupMatch {
  matchedBy: DupMatchedBy
  existing: Order
}

export interface BatchDupMatch {
  /** 批内首条（被保留条）的下标 */
  firstIndex: number
  matchedBy: DupMatchedBy
}

/**
 * 库内判重：orderNo 精确匹配优先，其次电话、姓名。
 * 业务豁免（原 isDuplicate 逻辑保留）：
 * - 已完成单不参与判重
 * - 跨月单（createdAt 非当月）不参与判重
 * - nature 不同（安装/维修/勘测/补桩）不算重复
 */
export function matchExistingDuplicate(order: Order, existingOrders: Order[]): ExistingDupMatch | null {
  const currentMonth = new Date().toISOString().slice(0, 7)
  for (const existing of existingOrders) {
    const createdAt = new Date(existing.createdAt)
    const existingMonth = Number.isNaN(createdAt.getTime()) ? '' : createdAt.toISOString().slice(0, 7)
    if (existing.status === '已完成' || existingMonth !== currentMonth) continue
    if ((existing.nature || '安装') !== order.nature) continue
    // P0-093 单号判重：orderNo 非空且精确相同即判重，不再依赖电话是否解析成功
    if (order.orderNo && existing.orderNo === order.orderNo) {
      return { matchedBy: 'orderNo', existing }
    }
    if (order.phone && existing.phone === order.phone) {
      return { matchedBy: 'phone', existing }
    }
    if (existing.customerName === order.customerName) {
      return { matchedBy: 'name', existing }
    }
  }
  return null
}

/** 兼容旧签名：是否存在库内重复 */
export function isDuplicate(order: Order, existingOrders: Order[]): boolean {
  return matchExistingDuplicate(order, existingOrders) !== null
}

/**
 * 批内自查：按 orderNo→电话→姓名 三级键（均要求非空）去重。
 * 返回与 orders 等长的数组，重复项指向首条下标；首条与无重复项为 null。
 */
export function findBatchDuplicates(orders: Order[]): (BatchDupMatch | null)[] {
  const result: (BatchDupMatch | null)[] = orders.map(() => null)
  for (let i = 0; i < orders.length; i++) {
    for (let j = 0; j < i; j++) {
      const a = orders[i]
      const b = orders[j]
      if (a.orderNo && a.orderNo === b.orderNo) {
        result[i] = { firstIndex: j, matchedBy: 'orderNo' }
        break
      }
      if (a.phone && a.phone === b.phone) {
        result[i] = { firstIndex: j, matchedBy: 'phone' }
        break
      }
      if (a.customerName && a.customerName === b.customerName) {
        result[i] = { firstIndex: j, matchedBy: 'name' }
        break
      }
    }
  }
  return result
}
