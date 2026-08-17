import { useMemo } from 'react'
import { useOrderStore } from '@/stores/orderStore'
import type { InstallType, Order, OrderFilter } from '@/types'

export type TagMode = 'region' | 'time'

/** 地址 → 片区标签：提取首个「XX街道/镇/乡」，失败归入「其他」 */
const AREA_TAG_RE = /([^省市]{2,6}?(?:街道|镇|乡))/

export function extractAreaTag(address: string): string {
  return address.match(AREA_TAG_RE)?.[1] || '其他'
}

/** 按筛选条件过滤订单（不含排序） */
export function filterOrders(orders: Order[], filter?: OrderFilter): Order[] {
  return orders.filter((order) => {
    if (filter?.status && order.status !== filter.status) return false
    if (filter?.platform && (order.platformName || order.platform) !== filter.platform) return false
    if (filter?.region && order.region !== filter.region) return false
    if (filter?.areaTag) {
      const matches = order.region === filter.areaTag || extractAreaTag(order.address) === filter.areaTag
      if (!matches) return false
    }
    if (filter?.installType && order.installType !== filter.installType) return false
    if (filter?.brand && order.brandName !== filter.brand) return false
    if (filter?.dateRange) {
      const [start, end] = filter.dateRange
      if (!order.appointmentDate || order.appointmentDate < start || order.appointmentDate > end) return false
    }
    if (filter?.keyword) {
      const kw = filter.keyword.toLowerCase()
      const matches = [order.customerName, order.phone, order.address]
        .some((value) => value?.toLowerCase().includes(kw))
      if (!matches) return false
    }
    return true
  })
}

function getSortValue(order: Order, sortBy: NonNullable<OrderFilter['sortBy']>) {
  if (sortBy === 'customerName') return order.customerName || ''
  if (sortBy === 'createdAt') return order.createdAt || 0
  return order[sortBy] || ''
}

/** 排序：按 sortBy/sortOrder；预约时间排序时今日订单置顶 */
export function sortOrders(orders: Order[], filter?: OrderFilter): Order[] {
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

/** 标签云计数：time 模式取 region 字段，region 模式从 address 提取街道 */
export function extractRegionTags(orders: Order[], mode: TagMode): { label: string; count: number }[] {
  const counts = new Map<string, number>()
  orders.forEach((order) => {
    const label = mode === 'time' ? order.region || '其他' : extractAreaTag(order.address)
    counts.set(label, (counts.get(label) || 0) + 1)
  })
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'zh-CN'))
}

/** 安装类型计数（排除空值与「其他」） */
export function extractTypeCounts(orders: Order[]): { label: InstallType; count: number }[] {
  const counts = new Map<InstallType, number>()
  orders.forEach((order) => {
    const type = order.installType
    if (type && type !== '其他') counts.set(type, (counts.get(type) || 0) + 1)
  })
  return [...counts.entries()].map(([label, count]) => ({ label, count }))
}

/** 品牌选项：从 brandName 动态提取，去重过滤空值与「其他」，按字母排序 */
export function extractBrandOptions(orders: Order[]): string[] {
  const set = new Set<string>()
  orders.forEach((order) => {
    const brand = order.brandName
    if (brand && brand !== '其他') set.add(brand)
  })
  return [...set].sort((a, b) => a.localeCompare(b, 'zh-CN'))
}

/** 平台选项：从 platformName/platform 动态提取，去重过滤空值与「其他」 */
export function extractPlatformOptions(orders: Order[]): string[] {
  const set = new Set<string>()
  orders.forEach((order) => {
    const platform = order.platformName || order.platform
    if (platform && platform !== '其他') set.add(platform)
  })
  return [...set].sort((a, b) => a.localeCompare(b, 'zh-CN'))
}

export function useOrderList(filter?: OrderFilter) {
  const orders = useOrderStore((state) => state.orders)

  const filteredOrders = useMemo(() => {
    return sortOrders(filterOrders(orders, filter), filter)
  }, [orders, filter])

  const stats = useMemo(() => {
    const total = orders.length
    const pending = orders.filter((o) => o.status === '待办').length
    const scheduled = orders.filter((o) => o.status === '已预约').length
    const completed = orders.filter((o) => o.status === '已完成').length
    return { total, pending, scheduled, completed }
  }, [orders])

  return { orders: filteredOrders, stats }
}
