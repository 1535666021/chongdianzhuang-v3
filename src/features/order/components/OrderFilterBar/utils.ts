import type { GroupMode, Order } from '@/types'
import { extractAreaTag, extractAreaChain, extractTimeTag } from '@/shared/utils/groupTags'
import { resolveDoneDate } from '@/shared/utils/orderCalc'

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
export function getGroupLabel(order: Order, groupMode: GroupMode, opts?: { doneDate?: boolean }): string {
  if (groupMode === 'time') {
    // P0-167：已完成Tab分组键=实际完工日（actualInstallDate→completeDate→createdAt回退）；其余维持原口径
    if (opts?.doneDate && order.status === '已完成') {
      const d = resolveDoneDate(order)
      if (d) return d.slice(0, 7)
    }
    return extractTimeTag(order)
  }
  return extractAreaTag(order.address)
}

/**
 * P0-242：分组标题与点选层级匹配——
 * 点选某级胶囊→该级订单按下一级分组（点省按市/点市按区县/点区县按乡镇）；
 * 未点选→按最细可用级分组（乡镇>区县>市>省）；解析不出归「其他」
 */
function areaGroupLabel(order: Order, selectedTag?: string | null): string {
  const chain = extractAreaChain(order.address)
  if (!chain) return '其他'
  const tag = selectedTag
  if (tag) {
    if (chain.province === tag) return chain.city || chain.district || chain.township || tag
    if (chain.city === tag) return chain.district || chain.township || tag
    if (chain.district === tag) return chain.township || tag
    if (chain.township === tag) return tag
  }
  return chain.township || chain.district || chain.city || chain.province || '其他'
}

export function groupOrdersByTag(orders: Order[], groupMode: GroupMode, opts?: { doneDate?: boolean; selectedTag?: string | null }): { label: string; orders: Order[] }[] {
  const groups = new Map<string, Order[]>()
  orders.forEach((order) => {
    const label = groupMode === 'region' ? areaGroupLabel(order, opts?.selectedTag) : getGroupLabel(order, groupMode, opts)
    groups.set(label, [...(groups.get(label) || []), order])
  })
  return [...groups.entries()]
    .map(([label, groupOrders]) => ({ label, orders: groupOrders }))
    // 时间维度最新月份在前；区域维度保持拼音升序不变
    .sort((a, b) => (groupMode === 'time'
      ? b.label.localeCompare(a.label)
      : a.label.localeCompare(b.label, 'zh-CN')))
}
