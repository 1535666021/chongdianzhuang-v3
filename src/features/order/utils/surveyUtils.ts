import type { MaterialCategory } from '@/types/material'

const CATEGORY_SHORT_MAP: Record<MaterialCategory, string> = {
  '线缆': '电缆',
  '保护箱': '保护箱',
  '立柱': '立柱',
  '基础': '基础',
  '开孔': '开孔',
  '电表': '电表',
  '漏保': '断路器',
  '浪涌': '断路器',
  '拆除': '拆除',
  '服务': '服务',
  '桥架': '桥架',
  '管材': '管材',
  '路面': '基础',
  '安装': '安装',
  '高空': '高空',
  '接地': '其他',
  '吊筋': '桥架',
  '辅材': '其他',
  '工具': '其他',
  '其他': '其他',
}

const CATEGORY_SORT_ORDER: Record<string, number> = {
  '电缆': 1,
  '断路器': 2,
  '保护箱': 3,
  '立柱': 4,
  '开孔': 5,
  '电表': 6,
  '桥架': 7,
  '管材': 8,
  '基础': 9,
  '安装': 10,
  '高空': 11,
  '拆除': 12,
  '服务': 13,
  '其他': 99,
}

export function getShortName(name: string, category: MaterialCategory): string {
  return CATEGORY_SHORT_MAP[category] || category
}

export function getCategorySortOrder(category: MaterialCategory): number {
  return CATEGORY_SORT_ORDER[CATEGORY_SHORT_MAP[category]] || 99
}
