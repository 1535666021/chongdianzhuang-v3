import { useMemo, useState } from 'react'
import type { Order } from '@/types'
import { resolveDoneDate } from '@/shared/utils/orderCalc'

export interface DayGroup {
  key: string // resolveDoneDate 或 '未填日期'
  label: string // '10/12'
  orders: Order[]
  total: number // Σ actualProfit（读既有字段，展示层聚合不算重复计算）
  customerPriceTotal: number // P0-185：Σ customerPrice（客户付费=增项，禁混安装费）
  paidCount: number // P0-185：payment.paid=true 单数
  unpaidCount: number // P0-185：未收单数
}

/**
 * P0-153-R1：按天分组纯函数。P0-182：键=resolveDoneDate(o)（完工链），天倒序，"未填日期"置底。
 */
export function groupDaily(completedOrders: Order[]): DayGroup[] {
  const map = new Map<string, Order[]>()
  for (const o of completedOrders) {
    const key = resolveDoneDate(o) || '未填日期'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(o)
  }
  return Array.from(map.entries())
    .map(([key, orders]) => ({
      key,
      label: key === '未填日期' ? key : key.slice(5).replace('-', '/'),
      orders,
      total: orders.reduce((sum, o) => sum + (o.actualProfit || 0), 0),
      customerPriceTotal: Math.round(orders.reduce((sum, o) => sum + (o.customerPrice || 0), 0) * 100) / 100,
      paidCount: orders.filter((o) => o.payment?.paid).length,
      unpaidCount: orders.filter((o) => !o.payment?.paid).length,
    }))
    .sort((a, b) => {
      if (a.key === '未填日期') return 1
      if (b.key === '未填日期') return -1
      return b.key.localeCompare(a.key)
    })
}

/** 默认展开最近3个有单的天 */
export function defaultExpandedKeys(days: DayGroup[]): string[] {
  return days.slice(0, 3).map((d) => d.key)
}

/** 按天明细状态：展开集（切月/数据变更时重置为最近3天） */
export function useDailyBreakdown(completedOrders: Order[]) {
  const days = useMemo(() => groupDaily(completedOrders), [completedOrders])
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set(defaultExpandedKeys(days)))
  const [prevDays, setPrevDays] = useState(days)
  if (prevDays !== days) {
    setPrevDays(days)
    setExpandedKeys(new Set(defaultExpandedKeys(days))) // 月份切换联动重置
  }
  const toggle = (key: string) =>
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  return { days, expandedKeys, toggle }
}
