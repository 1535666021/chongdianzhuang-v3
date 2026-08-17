import type { Order } from '@/types'
import type { GroupMode } from './OrderFilters'

export interface OrderGroup {
  label: string
  orders: Order[]
}

function getAddressGroup(order: Order) {
  return order.address.match(/(.+?)(街道|镇|乡)/)?.[0] || '其他'
}

function getAppointmentValue(order: Order) {
  return `${order.appointmentDate || '9999-12-31'} ${order.appointmentTime || '99:99'}`
}

export function groupOrders(orders: Order[], mode: GroupMode): OrderGroup[] {
  const groups = new Map<string, Order[]>()
  orders.forEach((order) => {
    const label = mode === 'time'
      ? order.appointmentDate || '未预约'
      : getAddressGroup(order)
    groups.set(label, [...(groups.get(label) || []), order])
  })
  return [...groups.entries()]
    .map(([label, groupedOrders]) => ({
      label,
      orders: mode === 'smart' ? [...groupedOrders].sort((a, b) => getAppointmentValue(a).localeCompare(getAppointmentValue(b))) : groupedOrders,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'))
}
