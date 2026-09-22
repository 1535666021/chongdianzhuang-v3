/* ============================================================
 * 分组标签提取（P0-095 下沉自 useOrderList.ts，计算集中化）
 * extractAreaTag：地址 → 片区标签（镇/街道/乡 → 区/县 → 其他）
 * extractTimeTag：订单 → 月份标签（完工 > 预约 > 创建，YYYY-MM）
 * ============================================================ */

import type { Order } from '@/types'

/**
 * 一级（最细）：XX镇/街道/乡。
 * 前缀排除 省/市/区/县 与空白字符，防止"博望区 丹阳镇"被误并为长名。
 */
const AREA_TAG_STREET_RE = /([^\s省市区县]{2,8}?(?:镇|街道|乡))/
/** 二级：XX区/县。前缀排除"市"字，"马鞍山市"类地级市不会命中 */
const AREA_TAG_DISTRICT_RE = /([^\s省市]{2,8}?(?:区|县))/

/** 地址 → 片区标签：镇/街道/乡优先，其次区/县，均无命中归「其他」 */
export function extractAreaTag(address: string): string {
  const street = address.match(AREA_TAG_STREET_RE)?.[1]
  if (street) return street
  return address.match(AREA_TAG_DISTRICT_RE)?.[1] || '其他'
}

/** 订单 → 时间维度分组标签：完工日期 > 预约日期 > 创建时间，取 YYYY-MM */
export function extractTimeTag(order: Order): string {
  const raw = (order.completeDate || order.appointmentDate || '').slice(0, 7)
  if (/^\d{4}-\d{2}$/.test(raw)) return raw
  const created = new Date(order.createdAt)
  return Number.isNaN(created.getTime()) ? '其他' : created.toISOString().slice(0, 7)
}
