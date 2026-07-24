import type { Platform, OrderStatus, Region } from '@/types'

export const PLATFORMS: Platform[] = ['京东', '天猫', '淘宝', '拼多多', '抖音', '其他']

export const ORDER_STATUSES: OrderStatus[] = ['待办', '已预约', '已完成', '回收站']

export const REGIONS: Region[] = ['巢湖', '合肥', '芜湖', '马鞍山', '滁州', '宣城', '安庆', '其他']

export const STATUS_COLORS: Record<OrderStatus, string> = {
  '待办': '#f59e0b',
  '已预约': '#3b82f6',
  '已完成': '#10b981',
  '回收站': '#6b7280',
}

export const REGION_LABELS: Record<Region, string> = {
  '巢湖': '巢湖',
  '合肥': '合肥',
  '芜湖': '芜湖',
  '马鞍山': '马鞍山',
  '滁州': '滁州',
  '宣城': '宣城',
  '安庆': '安庆',
  '其他': '其他',
}
