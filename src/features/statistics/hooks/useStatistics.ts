import { useMemo } from 'react'
import { useOrderStore } from '@/stores/orderStore'
import { calcReconciliationProfit, calcActualProfitByPolicy, resolveDoneDate, getCompletedOrderFinancials } from '@/shared/utils/orderCalc'
import type { Order } from '@/types'

export interface MonthlyStats {
  /** 口径来源（P0-183）：revenue=Σ actualIncome（付费+服务费-|扣点|）/cost=Σ materialCost 存值快照/platformFee=Σ 存值原样——逐单 getCompletedOrderFinancials 聚合 */
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
  /** 口径同 MonthlyStats（P0-183），逐单 getCompletedOrderFinancials 聚合 */
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

function calcMonthStats(orders: Order[], year: number, month: number): MonthlyStats {
  const filtered = orders.filter((o) => {
    const d = resolveDoneDate(o)
    const [y, m] = d.split('-').map(Number)
    return y === year && m === month
  })

  let revenue = 0
  let cost = 0
  let platformFee = 0

  // P0-183：取数归一——逐单 getCompletedOrderFinancials（唯一出口），禁反推/重算
  for (const o of filtered) {
    const f = getCompletedOrderFinancials(o)
    revenue += f.actualIncome
    cost += f.materialCost
    platformFee += f.platformFee
  }

  revenue = Math.round(revenue * 100) / 100
  cost = Math.round(cost * 100) / 100
  platformFee = Math.round(platformFee * 100) / 100
  // P0-177-R3：双口径改道 orderCalc 政策出口按单求和（禁聚合四则自造）
  let receivableProfit = 0
  let actualProfit = 0
  for (const o of filtered) {
    receivableProfit += calcReconciliationProfit(o)
    actualProfit += calcActualProfitByPolicy(o)
  }
  receivableProfit = Math.round(receivableProfit * 100) / 100
  actualProfit = Math.round(actualProfit * 100) / 100

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
      const f = getCompletedOrderFinancials(o)
      s.orderCount += 1
      s.revenue += f.actualIncome
      s.cost += f.materialCost
      s.platformFee += f.platformFee
      // P0-177-R3：按单政策出口累加（同统计页同值）
      s.receivableProfit += calcReconciliationProfit(o)
      s.actualProfit += calcActualProfitByPolicy(o)
    }
    return Array.from(map.values()).map((s) => ({
      ...s,
      revenue: Math.round(s.revenue * 100) / 100,
      cost: Math.round(s.cost * 100) / 100,
      platformFee: Math.round(s.platformFee * 100) / 100,
      receivableProfit: Math.round(s.receivableProfit * 100) / 100,
      actualProfit: Math.round(s.actualProfit * 100) / 100,
    }))
  }, [orders])

  // 总计
  const totalStats = useMemo(() => {
    let revenue = 0
    let cost = 0
    let platformFee = 0
    let orderCount = 0
    let receivableProfit = 0
    let actualProfit = 0
    for (const o of orders) {
      const f = getCompletedOrderFinancials(o)
      revenue += f.actualIncome
      cost += f.materialCost
      platformFee += f.platformFee
      orderCount += 1
      // P0-177-R3：按单政策出口累加（同统计页同值）
      receivableProfit += calcReconciliationProfit(o)
      actualProfit += calcActualProfitByPolicy(o)
    }
    revenue = Math.round(revenue * 100) / 100
    cost = Math.round(cost * 100) / 100
    platformFee = Math.round(platformFee * 100) / 100
    return {
      orderCount,
      revenue,
      cost,
      platformFee,
      receivableProfit: Math.round(receivableProfit * 100) / 100,
      actualProfit: Math.round(actualProfit * 100) / 100,
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
