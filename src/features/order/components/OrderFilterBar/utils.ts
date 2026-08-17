import type { GroupMode, Order } from '@/types'
import { extractAreaTag } from '../../hooks/useOrderList'

export { extractAreaTag }

export const SORT_OPTIONS = [
  { value: 'createdAt', label: '按创建时间' },
  { value: 'appointmentDate', label: '按预约时间' },
  { value: 'completeDate', label: '按完成时间' },
  { value: 'customerName', label: '按客户姓名' },
] as const

export type SortBy = (typeof SORT_OPTIONS)[number]['value']

export function getGroupLabel(order: Order, groupMode: GroupMode): string {
  return groupMode === 'time' ? order.region || '其他' : extractAreaTag(order.address)
}

export function groupOrdersByTag(orders: Order[], groupMode: GroupMode): { label: string; orders: Order[] }[] {
  const groups = new Map<string, Order[]>()
  orders.forEach((order) => {
    const label = getGroupLabel(order, groupMode)
    groups.set(label, [...(groups.get(label) || []), order])
  })
  return [...groups.entries()]
    .map(([label, groupOrders]) => ({ label, orders: groupOrders }))
    .sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'))
}
