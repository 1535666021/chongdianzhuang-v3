import { useMemo } from 'react'
import { useOrderStore } from '@/stores/orderStore'
import type { Order } from '@/types'
import type { MonthlyReconciliation, CostBreakdown, ReceivableFilter } from '../types/finance'

function getOrderRevenue(order: Order): number {
  const totalAmount = (order as any).totalAmount
  if (typeof totalAmount === 'number' && totalAmount > 0) return totalAmount
  return (order.actualProfit || 0) + (order.materialCost || 0) + (order.laborCost || 0) + (order.platformFee || 0)
}

function getOrderCost(order: Order): number {
  const materials = (order as any).materials
  if (Array.isArray(materials) && materials.length > 0) {
    return materials.reduce((sum: number, m: any) => {
      const costPrice = m?.costPrice ?? m?.price ?? 0
      const quantity = m?.quantity ?? 1
      return sum + costPrice * quantity
    }, 0)
  }
  return (order.materialCost || 0) + (order.laborCost || 0)
}

function getPlatformFeeRate(platform: string): number {
  if (platform === '京东' || platform === '天猫') return 0.1
  return 0.2
}

function getOrderPlatformFee(order: Order): number {
  if (typeof order.platformFee === 'number' && order.platformFee > 0) return order.platformFee
  const revenue = getOrderRevenue(order)
  const rate = getPlatformFeeRate(order.platform)
  return Math.round(revenue * rate * 100) / 100
}

function formatMonthLabel(year: number, month: number): string {
  return `${year}年${month}月`
}

function calcMonthReconciliation(orders: Order[], year: number, month: number): MonthlyReconciliation {
  const filtered = orders.filter((o) => {
    const d = new Date(o.createdAt || Date.now())
    return d.getFullYear() === year && d.getMonth() + 1 === month && o.status === '已完成'
  })

  let totalRevenue = 0, totalPlatformFee = 0, totalMaterialCost = 0, totalLaborCost = 0

  for (const o of filtered) {
    const revenue = getOrderRevenue(o)
    const platformFee = getOrderPlatformFee(o)
    const materials = (o as any).materials
    totalRevenue += revenue
    totalPlatformFee += platformFee
    if (Array.isArray(materials) && materials.length > 0) {
      const matCost = materials.reduce((sum: number, m: any) => {
        const costPrice = m?.costPrice ?? m?.price ?? 0
        const quantity = m?.quantity ?? 1
        return sum + costPrice * quantity
      }, 0)
      totalMaterialCost += matCost
      totalLaborCost += (o.laborCost || 0)
    } else {
      totalMaterialCost += (o.materialCost || 0)
      totalLaborCost += (o.laborCost || 0)
    }
  }

  totalRevenue = Math.round(totalRevenue * 100) / 100
  totalPlatformFee = Math.round(totalPlatformFee * 100) / 100
  totalMaterialCost = Math.round(totalMaterialCost * 100) / 100
  totalLaborCost = Math.round(totalLaborCost * 100) / 100
  const totalActualIncome = Math.round((totalRevenue - totalPlatformFee) * 100) / 100
  const totalActualProfit = Math.round((totalActualIncome - totalMaterialCost - totalLaborCost) * 100) / 100

  return {
    year, month, label: formatMonthLabel(year, month), orderCount: filtered.length,
    totalRevenue, totalPlatformFee, totalActualIncome, totalMaterialCost, totalLaborCost, totalActualProfit,
  }
}

export function useFinance() {
  const orders = useOrderStore((s) => s.orders)
  const togglePaymentStatus = useOrderStore((s) => s.togglePaymentStatus)

  const completedOrders = useMemo(() => orders.filter((o) => o.status === '已完成'), [orders])

  const monthOptions = useMemo(() => {
    const opts: { value: string; label: string; year: number; month: number }[] = []
    for (let y = 2024; y <= 2026; y++) {
      const startM = y === 2024 ? 5 : 1
      const endM = y === 2026 ? 7 : 12
      for (let m = startM; m <= endM; m++) {
        opts.push({ value: `${y}-${String(m).padStart(2, '0')}`, label: formatMonthLabel(y, m), year: y, month: m })
      }
    }
    return opts.reverse()
  }, [])

  const monthlyReconciliation = useMemo(() => {
    return monthOptions.map((opt) => calcMonthReconciliation(orders, opt.year, opt.month))
  }, [orders, monthOptions])

  const receivableOrders = useMemo(() => {
    return completedOrders.map((o) => ({
      id: (o as any).id, customerName: o.customerName, platform: o.platform,
      revenue: getOrderRevenue(o), paid: !!o.paid, createdAt: o.createdAt,
    }))
  }, [completedOrders])

  const getFilteredReceivables = (filter: ReceivableFilter) => {
    if (filter === 'paid') return receivableOrders.filter((o) => o.paid)
    if (filter === 'unpaid') return receivableOrders.filter((o) => !o.paid)
    return receivableOrders
  }

  const getCostBreakdown = (year: number, month: number): CostBreakdown[] => {
    const filtered = completedOrders.filter((o) => {
      const d = new Date(o.createdAt || Date.now())
      return d.getFullYear() === year && d.getMonth() + 1 === month
    })
    return filtered.map((o) => {
      const materials = (o as any).materials
      const materialList: CostBreakdown['materials'] = []
      let materialTotal = 0
      if (Array.isArray(materials) && materials.length > 0) {
        for (const m of materials) {
          const costPrice = m?.costPrice ?? m?.price ?? 0
          const quantity = m?.quantity ?? 1
          const subtotal = Math.round(costPrice * quantity * 100) / 100
          materialList.push({ name: m?.name || '未知材料', quantity, unitPrice: costPrice, subtotal })
          materialTotal += subtotal
        }
      } else {
        materialTotal = o.materialCost || 0
      }
      const revenue = getOrderRevenue(o)
      const platformFee = getOrderPlatformFee(o)
      const actualProfit = Math.round((revenue - platformFee - materialTotal - (o.laborCost || 0)) * 100) / 100
      return {
        orderId: (o as any).id, customerName: o.customerName, platform: o.platform,
        materials: materialList, materialTotal: Math.round(materialTotal * 100) / 100,
        laborCost: o.laborCost || 0, platformFee, actualProfit,
      }
    })
  }

  const totalReconciliation = useMemo(() => {
    let totalRevenue = 0, totalPlatformFee = 0, totalMaterialCost = 0, totalLaborCost = 0
    for (const o of completedOrders) {
      totalRevenue += getOrderRevenue(o)
      totalPlatformFee += getOrderPlatformFee(o)
      const materials = (o as any).materials
      if (Array.isArray(materials) && materials.length > 0) {
        const matCost = materials.reduce((sum: number, m: any) => {
          const costPrice = m?.costPrice ?? m?.price ?? 0
          const quantity = m?.quantity ?? 1
          return sum + costPrice * quantity
        }, 0)
        totalMaterialCost += matCost
        totalLaborCost += (o.laborCost || 0)
      } else {
        totalMaterialCost += (o.materialCost || 0)
        totalLaborCost += (o.laborCost || 0)
      }
    }
    totalRevenue = Math.round(totalRevenue * 100) / 100
    totalPlatformFee = Math.round(totalPlatformFee * 100) / 100
    totalMaterialCost = Math.round(totalMaterialCost * 100) / 100
    totalLaborCost = Math.round(totalLaborCost * 100) / 100
    return {
      orderCount: completedOrders.length, totalRevenue, totalPlatformFee,
      totalActualIncome: Math.round((totalRevenue - totalPlatformFee) * 100) / 100,
      totalMaterialCost, totalLaborCost,
      totalActualProfit: Math.round((totalRevenue - totalPlatformFee - totalMaterialCost - totalLaborCost) * 100) / 100,
    }
  }, [completedOrders])

  return { monthOptions, monthlyReconciliation, receivableOrders, getFilteredReceivables, getCostBreakdown, totalReconciliation, togglePaymentStatus }
}
