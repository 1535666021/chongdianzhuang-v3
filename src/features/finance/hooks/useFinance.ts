import { useMemo, useCallback } from 'react'
import { useOrderStore } from '@/stores/orderStore'
import { useUIStore } from '@/stores/uiStore'
import { companyHit } from '@/shared/utils/company'
import { getCompletedOrderFinancials, getOrderBusinessDate, resolveCostPrice } from '@/shared/utils/orderCalc'
import type { MonthlyReconciliation, ReceivableOrder, OrderCostDetail } from '../types/finance'

export function useFinance() {
  const { orders, updateOrder } = useOrderStore()

  const currentCompany = useUIStore((st) => st.currentCompany)
  // P0-220：公司维度过滤（全部/本杨/到美），唯一出口 companyHit
  const completedOrders = useMemo(
    () => orders.filter(o => o.status === '已完成' && companyHit(o, currentCompany)),
    [orders, currentCompany]
  )

  const availableMonths = useMemo(() => {
    const set = new Set<string>()
    completedOrders.forEach(o => {
      const d = getOrderBusinessDate(o)
      if (d.length >= 7) set.add(d.slice(0, 7))
    })
    return Array.from(set).sort().reverse()
  }, [completedOrders])

  const getMonthReconciliation = useCallback((month: string): MonthlyReconciliation | null => {
    const monthOrders = completedOrders.filter(o => {
      const d = getOrderBusinessDate(o)
      return d.slice(0, 7) === month
    })
    if (monthOrders.length === 0) return null

    const totals = monthOrders.reduce((sum, order) => {
      const financials = getCompletedOrderFinancials(order)
      return {
        totalReceivable: sum.totalReceivable + financials.customerPrice,
        totalServiceFee: sum.totalServiceFee + financials.serviceFee,
        totalCustomerPay: sum.totalCustomerPay + financials.customerPay,
        totalDeduction: sum.totalDeduction + financials.platformFee,
        totalActual: sum.totalActual + financials.actualIncome,
        totalMaterial: sum.totalMaterial + financials.materialCost,
        totalProfit: sum.totalProfit + financials.actualProfit,
      }
    }, { totalReceivable: 0, totalServiceFee: 0, totalCustomerPay: 0, totalDeduction: 0, totalActual: 0, totalMaterial: 0, totalProfit: 0 })

    return {
      month,
      orderCount: monthOrders.length,
      ...totals,
    }
  }, [completedOrders])

  const getReceivables = useCallback((): ReceivableOrder[] => {
    return completedOrders.map(o => ({
      id: o.id,
      customerName: o.customerName,
      amount: o.customerPrice || 0, // P0-177-C：应收缺省显0，禁止倒挤反推
      paid: o.payment?.paid || false,
      completeDate: o.completeDate,
    }))
  }, [completedOrders])

  const togglePaid = useCallback((orderId: string) => {
    const order = orders.find(o => o.id === orderId)
    if (!order) return
    updateOrder(orderId, {
      payment: {
        ...order.payment,
        paid: !order.payment?.paid,
      },
    })
  }, [orders, updateOrder])

  const getCostBreakdown = useCallback((month: string): OrderCostDetail[] => {
    return completedOrders
      .filter(o => {
        const d = getOrderBusinessDate(o)
        return d.slice(0, 7) === month
      })
      .map(o => {
        const financials = getCompletedOrderFinancials(o)
        return {
          orderId: o.id,
          customerName: o.customerName,
          materials: (o.materials || []).map(m => {
            const costUnitPrice = resolveCostPrice(m.name)
            return {
              ...m,
              subtotal: (m.unitPrice || 0) * (m.quantity || 0),
              costUnitPrice,
              costSubtotal: costUnitPrice * (m.quantity || 0),
            }
          }),
          customerPrice: financials.customerPrice,
          serviceFee: financials.serviceFee,
          customerPay: financials.customerPay,
          materialCost: financials.materialCost,
          platformDeduction: financials.platformFee,
          platformRate: financials.customerPrice > 0 ? Math.abs(financials.platformFee) / financials.customerPrice : 0, // P0-177-C：费率abs归一
          actualProfit: financials.actualProfit,
        }
      })
  }, [completedOrders])

  return {
    availableMonths,
    completedOrders,
    getMonthReconciliation,
    getReceivables,
    togglePaid,
    getCostBreakdown,
  }
}
