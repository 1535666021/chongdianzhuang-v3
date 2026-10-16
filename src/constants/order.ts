import type { Platform, OrderStatus, Region, InstallType } from '@/types'

export const PLATFORMS: Platform[] = ['京东', '天猫', '淘宝', '拼多多', '抖音', '其他']

export const ORDER_STATUSES: OrderStatus[] = ['待办', '已预约', '已完成', '回收站']

export const REGIONS: Region[] = ['巢湖', '合肥', '芜湖', '马鞍山', '滁州', '宣城', '安庆', '其他']

export const INSTALL_TYPES: InstallType[] = ['带桩上门', '仅安装', '维修', '勘察', '检测', '拆桩', '移机', '其他']

// P0-149-R2：色系收敛——映射表留 constants（维度→变量名），色值定义在 :root 令牌
export const INSTALL_TYPE_COLORS: Record<InstallType, { bg: string; text: string }> = {
  '带桩上门': { bg: 'var(--tag-install-zaizhuang-bg)', text: 'var(--tag-install-zaizhuang-text)' },
  '仅安装':   { bg: 'var(--tag-install-anzhuang-bg)', text: 'var(--tag-install-anzhuang-text)' },
  '维修':     { bg: 'var(--tag-install-weixiu-bg)', text: 'var(--tag-install-weixiu-text)' },
  '勘察':     { bg: 'var(--tag-install-kancha-bg)', text: 'var(--tag-install-kancha-text)' },
  '检测':     { bg: 'var(--tag-install-jiance-bg)', text: 'var(--tag-install-jiance-text)' },
  '拆桩':     { bg: 'var(--tag-install-chaizhuang-bg)', text: 'var(--tag-install-chaizhuang-text)' },
  '移机':     { bg: 'var(--tag-install-yiji-bg)', text: 'var(--tag-install-yiji-text)' },
  '其他':     { bg: 'var(--tag-install-other-bg)', text: 'var(--tag-install-other-text)' },
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
