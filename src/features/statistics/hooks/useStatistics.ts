import { useMemo } from 'react'
import { useOrderStore } from '@/stores/orderStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { calcMaterialCost, calcPlatformFee, calcProfit } from '@/shared/utils/orderCalc'
import type { Order } from '@/types'

export interface MonthlyStats {
  year: number
  month: number
  label: string
  orderCount: number
  revenue: number
  cost: number
  platformFee: number
  receivableProfit: number
  actualProfit: number
}

export interface PlatformStats {
  platform: string
  orderCount: number
  revenue: number
  cost: number
  platformFee: number
  receivableProfit: number
  actualProfit: number
}

function formatMonthLabel(year: number, month: number): string {
  return `${year}年${month}月`
}

function getOrderRevenue(order: Order): number {
  // 优先使用 totalAmount，否则从现有字段反推
  const totalAmount = (order as any).totalAmount
  if (typeof totalAmount === 'number' && totalAmount > 0) {
    return totalAmount
  }
  // 反推：收入 = 实际利润 + 成本 + 平台扣点
  return (order.actualProfit || 0) + (order.materialCost || 0) + (order.laborCost || 0) + (order.platformFee || 0)
}

function getOrderCost(order: Order): number {
  // 优先使用 materials 数组计算
  const materials = (order as any).materials
  if (Array.isArray(materials) && materials.length > 0) {
    const { total } = calcMaterialCost(materials)
    return total
  }
  // 否则使用 materialCost + laborCost
  return (order.materialCost || 0) + (order.laborCost || 0)
}

function getOrderPlatformFee(order: Order): number {
  if (typeof order.platformFee === 'number' && order.platformFee > 0) {
    return order.platformFee
  }
  const revenue = getOrderRevenue(order)
  const rate = useSettingsStore.getState().getPlatformFeeRate(order.platform)
  return calcPlatformFee(revenue, rate)
}

function calcMonthStats(orders: Order[], year: number, month: number): MonthlyStats {
  const filtered = orders.filter((o) => {
    const d = new Date(o.createdAt || Date.now())
    return d.getFullYear() === year && d.getMonth() + 1 === month
  })

  let revenue = 0
  let cost = 0
  let platformFee = 0

  for (const o of filtered) {
    revenue += getOrderRevenue(o)
    cost += getOrderCost(o)
    platformFee += getOrderPlatformFee(o)
  }

  revenue = Math.round(revenue * 100) / 100
  cost = Math.round(cost * 100) / 100
  platformFee = Math.round(platformFee * 100) / 100
  const receivableProfit = calcProfit(revenue, cost, 0)
  const actualProfit = calcProfit(revenue, cost, platformFee)

  return {
    year,
    month,
    label: formatMonthLabel(year, month),
    orderCount: filtered.length,
    revenue,
    cost,
    platformFee,
    receivableProfit,
    actualProfit,
  }
}

export function useStatistics() {
  const orders = useOrderStore((s) => s.orders)

  // 生成月份选项：2024-05 到 2026-07
  const monthOptions = useMemo(() => {
    const opts: { value: string; label: string; year: number; month: number }[] = []
    for (let y = 2024; y <= 2026; y++) {
      const startM = y === 2024 ? 5 : 1
      const endM = y === 2026 ? 7 : 12
      for (let m = startM; m <= endM; m++) {
        opts.push({
          value: `${y}-${String(m).padStart(2, '0')}`,
          label: formatMonthLabel(y, m),
          year: y,
          month: m,
        })
      }
    }
    return opts.reverse()
  }, [])

  // 按月份统计
  const monthlyStats = useMemo(() => {
    return monthOptions.map((opt) => calcMonthStats(orders, opt.year, opt.month))
  }, [orders, monthOptions])

  // 当前选中月份统计（默认最新月份 = 2026-07）
  const currentMonthStats = useMemo(() => {
    return monthlyStats[0] || null
  }, [monthlyStats])

  // 平台分布统计
  const platformStats = useMemo((): PlatformStats[] => {
    const map = new Map<string, PlatformStats>()
    for (const o of orders) {
      const p = o.platform || '其他'
      if (!map.has(p)) {
        map.set(p, {
          platform: p,
          orderCount: 0,
          revenue: 0,
          cost: 0,
          platformFee: 0,
          receivableProfit: 0,
          actualProfit: 0,
        })
      }
      const s = map.get(p)!
      s.orderCount += 1
      s.revenue += getOrderRevenue(o)
      s.cost += getOrderCost(o)
      s.platformFee += getOrderPlatformFee(o)
    }
    return Array.from(map.values()).map((s) => ({
      ...s,
      revenue: Math.round(s.revenue * 100) / 100,
      cost: Math.round(s.cost * 100) / 100,
      platformFee: Math.round(s.platformFee * 100) / 100,
      receivableProfit: calcProfit(s.revenue, s.cost, 0),
      actualProfit: calcProfit(s.revenue, s.cost, s.platformFee),
    }))
  }, [orders])

  // 总计
  const totalStats = useMemo(() => {
    let revenue = 0
    let cost = 0
    let platformFee = 0
    let orderCount = 0
    for (const o of orders) {
      revenue += getOrderRevenue(o)
      cost += getOrderCost(o)
      platformFee += getOrderPlatformFee(o)
      orderCount += 1
    }
    revenue = Math.round(revenue * 100) / 100
    cost = Math.round(cost * 100) / 100
    platformFee = Math.round(platformFee * 100) / 100
    return {
      orderCount,
      revenue,
      cost,
      platformFee,
      receivableProfit: calcProfit(revenue, cost, 0),
      actualProfit: calcProfit(revenue, cost, platformFee),
    }
  }, [orders])

  // 最近6个月（有数据的）
  const recent6Months = useMemo(() => {
    return monthlyStats.filter((m) => m.orderCount > 0).slice(0, 6).reverse()
  }, [monthlyStats])

  return {
    monthOptions,
    monthlyStats,
    currentMonthStats,
    platformStats,
    totalStats,
    recent6Months,
  }
}
