import type { GroupMode, Order } from '@/types'
import { extractAreaTag, extractTimeTag } from '@/shared/utils/groupTags'

export { extractAreaTag }

export const SORT_OPTIONS = [
  // P0-106：默认项——业务时间混排（预约>完工>创建），首页全部Tab首帧即选中
  { value: 'businessTime', label: '按业务时间' },
  { value: 'createdAt', label: '按创建时间' },
  { value: 'appointmentDate', label: '按预约时间' },
  { value: 'completeDate', label: '按完工时间' },
  { value: 'customerName', label: '按客户姓名' },
] as const

export type SortBy = (typeof SORT_OPTIONS)[number]['value']

/**
 * 分组标签（P0-095 语义修正）：
 * time 模式取月份标签（完工>预约>创建），不再错取 region 字段；
 * region/smart 模式从地址提取片区
 */
export function getGroupLabel(order: Order, groupMode: GroupMode): string {
  return groupMode === 'time' ? extractTimeTag(order) : extractAreaTag(order.address)
}

export function groupOrdersByTag(orders: Order[], groupMode: GroupMode): { label: string; orders: Order[] }[] {
  const groups = new Map<string, Order[]>()
  orders.forEach((order) => {
    const label = getGroupLabel(order, groupMode)
    groups.set(label, [...(groups.get(label) || []), order])
  })
  return [...groups.entries()]
    .map(([label, groupOrders]) => ({ label, orders: groupOrders }))
    // 时间维度最新月份在前；区域维度保持拼音升序不变
    .sort((a, b) => (groupMode === 'time'
      ? b.label.localeCompare(a.label)
      : a.label.localeCompare(b.label, 'zh-CN')))
}
