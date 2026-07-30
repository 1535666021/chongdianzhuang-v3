import type { Platform, OrderStatus, Region, InstallType } from '@/types'

export const PLATFORMS: Platform[] = ['京东', '天猫', '淘宝', '拼多多', '抖音', '其他']

export const ORDER_STATUSES: OrderStatus[] = ['待办', '已预约', '已完成', '回收站']

export const REGIONS: Region[] = ['巢湖', '合肥', '芜湖', '马鞍山', '滁州', '宣城', '安庆', '其他']

export const INSTALL_TYPES: InstallType[] = ['带桩上门', '仅安装', '维修', '勘察', '检测', '拆桩', '移机', '其他']

export const INSTALL_TYPE_COLORS: Record<InstallType, { bg: string; text: string }> = {
  '带桩上门': { bg: '#ecfdf5', text: '#059669' },
  '仅安装':   { bg: '#eff6ff', text: '#2563eb' },
  '维修':     { bg: '#fef3c7', text: '#d97706' },
  '勘察':     { bg: '#f3e8ff', text: '#7c3aed' },
  '检测':     { bg: '#fce7f3', text: '#db2777' },
  '拆桩':     { bg: '#fee2e2', text: '#dc2626' },
  '移机':     { bg: '#e0f2fe', text: '#0284c7' },
  '其他':     { bg: '#f3f4f6', text: '#6b7280' },
}

export const STATUS_COLORS: Record<OrderStatus, string> = {
  '待办': '#f59e0b',
  '已预约': '#7a6aa8',
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

// 状态背景色映射（用于标签圆角背景）
export const STATUS_BG_COLORS: Record<OrderStatus, string> = {
  '待办': '#fef3c7',
  '已预约': '#ece8f4',
  '已完成': '#d1fae5',
  '回收站': '#f3f4f6',
}
