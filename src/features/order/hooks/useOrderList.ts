import { useMemo } from 'react'
import { useOrderStore } from '@/stores/orderStore'
import type { Order, OrderFilter } from '@/types'

function matchesFilter(order: Order, filter?: OrderFilter, ignoredField?: keyof OrderFilter) {
  if (filter?.status && ignoredField !== 'status' && order.status !== filter.status) return false
  if (filter?.platform && ignoredField !== 'platform' && (order.platformName || order.platform) !== filter.platform) return false
  if (filter?.region && ignoredField !== 'region' && order.region !== filter.region) return false
  if (filter?.installType && ignoredField !== 'installType' && order.installType !== filter.installType) return false
  if (filter?.brand && ignoredField !== 'brand' && order.brandName !== filter.brand) return false
  if (filter?.dateRange && ignoredField !== 'dateRange') {
    const [start, end] = filter.dateRange
    if (!order.appointmentDate || order.appointmentDate < start || order.appointmentDate > end) return false
  }
  if (filter?.keyword && ignoredField !== 'keyword') {
    const keyword = filter.keyword.toLowerCase()
    const matches = [order.customerName, order.phone, order.address, order.platformName, order.brandName]
      .some((value) => value?.toLowerCase().includes(keyword))
    if (!matches) return false
  }
  return true
}

function getSortValue(order: Order, sortBy: NonNullable<OrderFilter['sortBy']>) {
  if (sortBy === 'customerName') return order.customerName || ''
  if (sortBy === 'createdAt') return order.createdAt || 0
  return order[sortBy] || ''
}

function sortOrders(orders: Order[], filter?: OrderFilter) {
  const sortBy = filter?.sortBy || 'createdAt'
  const sortOrder = filter?.sortOrder || 'desc'
  const direction = sortOrder === 'asc' ? 1 : -1
  const today = new Date().toISOString().slice(0, 10)

  return [...orders].sort((a, b) => {
    if (sortBy === 'appointmentDate') {
      const aToday = a.appointmentDate === today
      const bToday = b.appointmentDate === today
      if (aToday !== bToday) return aToday ? -1 : 1
    }
    const aValue = getSortValue(a, sortBy)
    const bValue = getSortValue(b, sortBy)
    if (typeof aValue === 'number' && typeof bValue === 'number') return (aValue - bValue) * direction
    return String(aValue).localeCompare(String(bValue), 'zh-CN') * direction
  })
}

export function useOrderList(filter?: OrderFilter) {
  const orders = useOrderStore((state) => state.orders)

  const filteredOrders = useMemo(() => {
    return sortOrders(orders.filter((order) => matchesFilter(order, filter)), filter)
  }, [orders, filter])

  const filterOptions = useMemo(() => {
    const countBy = (field: 'installType' | 'brand' | 'platform') => {
      const counts = new Map<string, number>()
      orders.filter((order) => matchesFilter(order, filter, field)).forEach((order) => {
        const value = field === 'installType'
          ? order.installType
          : field === 'brand'
            ? order.brandName
            : order.platformName || order.platform
        if (value) counts.set(value, (counts.get(value) || 0) + 1)
      })
      return [...counts.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'zh-CN'))
    }
    return {
      installTypes: countBy('installType'),
      brands: countBy('brand'),
      platforms: countBy('platform'),
    }
  }, [orders, filter])

  const stats = useMemo(() => {
    const total = orders.length
    const pending = orders.filter((o: any) => o.status === '待办').length
    const scheduled = orders.filter((o: any) => o.status === '已预约').length
    const completed = orders.filter((o: any) => o.status === '已完成').length
    return { total, pending, scheduled, completed }
  }, [orders])

  return { orders: filteredOrders, stats, filterOptions }
}
