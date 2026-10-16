/* ============================================================
 * 分组标签提取（P0-095 下沉自 useOrderList.ts，计算集中化）
 * extractAreaTag：地址 → 片区标签（P0-112：区/县 → 街道/镇 → 其他）
 * extractTimeTag：订单 → 月份标签（完工 > 预约 > 创建，YYYY-MM）
 * ============================================================ */

import type { Order } from '@/types'

/**
 * 一级（最细）：XX镇/街道/乡。
 * 前缀排除 省/市/区/县 与空白字符，防止"博望区 丹阳镇"被误并为长名。
 */
const AREA_TAG_STREET_RE = /([^\s省市区县]{2,8}?(?:镇|街道|乡))/
/**
 * 二级：XX区/县（P0-099 收紧）。
 * 前缀排除 省/市/空白/数字/字母/连字符：防"丰收佳苑3区"吃数字成垃圾组、
 * 防"安徽省-马鞍山市-花山区"产出"-花山区"；"马鞍山市"类地级市不会命中。
 * 后行断言排除"区小区/区社区"粘连场景。
 */
const AREA_TAG_DISTRICT_RE = /([^省市\s0-9A-Za-z\-]{2,8}?(?:区|县))(?!小区|社区)/

/** 防御性剥除标签首尾非汉字字符（如连字符前缀） */
function stripNonHanEdges(text: string): string {
  return text.replace(/^[^一-龥]+/, '').replace(/[^一-龥]+$/, '')
}

/** 地址 → 片区标签：P0-112区/县优先（甲方裁定，如花山区优先于解放路街道），无区/县再街道/镇，均无归「其他」 */
export function extractAreaTag(address: string): string {
  const district = stripNonHanEdges(address.match(AREA_TAG_DISTRICT_RE)?.[1] || '')
  // "XX小区/XX社区"是住宅小区名而非行政区（如"江南人家小区"），归「其他」
  if (district && !/(?:小区|社区)$/.test(district)) return district
  const street = address.match(AREA_TAG_STREET_RE)?.[1]
  if (street) return stripNonHanEdges(street) || '其他'
  return '其他'
}

/** 订单 → 时间维度分组标签：完工日期 > 预约日期 > 创建时间，取 YYYY-MM */
export function extractTimeTag(order: Order): string {
  const raw = (order.completeDate || order.appointmentDate || '').slice(0, 7)
  if (/^\d{4}-\d{2}$/.test(raw)) return raw
  const created = new Date(order.createdAt)
  return Number.isNaN(created.getTime()) ? '其他' : created.toISOString().slice(0, 7)
}
