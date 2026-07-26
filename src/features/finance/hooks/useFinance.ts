import { useMemo, useCallback } from 'react'
import { useOrderStore } from '@/stores/orderStore'
import type { MonthlyReconciliation, ReceivableOrder, OrderCostDetail } from '../types/finance'

export function useFinance() {
  const { orders, updateOrder } = useOrderStore()

  const completedOrders = useMemo(
    () => orders.filter(o => o.status === '已完成'),
    [orders]
  )

  const availableMonths = useMemo(() => {
    const set = new Set<string>()
    completedOrders.forEach(o => {
      const d = o.completeDate || o.appointmentDate || ''
      if (d.length >= 7) set.add(d.slice(0, 7))
    })
    return Array.from(set).sort().reverse()
  }, [completedOrders])

  const getMonthReconciliation = useCallback((month: string): MonthlyReconciliation | null => {
    const monthOrders = completedOrders.filter(o => {
      const d = o.completeDate || o.appointmentDate || ''
      return d.slice(0, 7) === month
    })
    if (monthOrders.length === 0) return null

    const totalReceivable = monthOrders.reduce((s, o) => s + (o.customerPrice || 0), 0)
    const totalDeduction = monthOrders.reduce((s, o) => s + (o.platformFee || 0), 0)
    const totalMaterial = monthOrders.reduce((s, o) => s + (o.materialCost || 0), 0)
    const totalLabor = monthOrders.reduce((s, o) => s + (o.laborCost || 0), 0)

    return {
      month,
      orderCount: monthOrders.length,
      totalReceivable,
      totalDeduction,
      totalActual: totalReceivable - totalDeduction,
      totalMaterial,
      totalLabor,
      totalProfit: totalReceivable - totalDeduction - totalMaterial - totalLabor,
    }
  }, [completedOrders])

  const getReceivables = useCallback((): ReceivableOrder[] => {
    return completedOrders.map(o => ({
      id: o.id,
      customerName: o.customerName,
      amount: o.customerPrice || o.actualProfit + o.materialCost + o.platformFee || 0,
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
        const d = o.completeDate || o.appointmentDate || ''
        return d.slice(0, 7) === month
      })
      .map(o => ({
        orderId: o.id,
        customerName: o.customerName,
        materials: (o.materials || []).map(m => ({
          ...m,
          subtotal: (m.unitPrice || 0) * (m.quantity || 0),
        })),
        materialCost: o.materialCost,
        laborCost: o.laborCost,
        platformDeduction: o.platformFee,
        actualProfit: o.actualProfit,
      }))
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
