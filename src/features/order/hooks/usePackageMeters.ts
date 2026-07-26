import { useMemo } from 'react'
import { DEFAULT_PACKAGE_METERS, isFreeQuotaMaterial } from '@/constants/package'
import type { MaterialInput } from '../types/completion'

export interface PackageBreakdown {
  materialName: string
  quantity: number
  freeQuantity: number
  overQuantity: number
  settlementPrice: number
  customerSubtotal: number
  originalSubtotal: number
}

export function usePackageMeters(materials: MaterialInput[], packageMeters: number = DEFAULT_PACKAGE_METERS) {
  const breakdown = useMemo(() => {
    const result: PackageBreakdown[] = []
    let totalFree = 0
    let totalOver = 0

    for (const m of materials) {
      const isFree = isFreeQuotaMaterial(m.name)
      if (isFree && m.quantity > 0) {
        const freeQty = Math.min(m.quantity, packageMeters)
        const overQty = Math.max(0, m.quantity - packageMeters)
        const customerSub = overQty * m.settlementPrice
        result.push({
          materialName: m.name,
          quantity: m.quantity,
          freeQuantity: freeQty,
          overQuantity: overQty,
          settlementPrice: m.settlementPrice,
          customerSubtotal: customerSub,
          originalSubtotal: m.quantity * m.settlementPrice,
        })
        totalFree += freeQty
        totalOver += overQty
      } else {
        result.push({
          materialName: m.name,
          quantity: m.quantity,
          freeQuantity: 0,
          overQuantity: m.quantity,
          settlementPrice: m.settlementPrice,
          customerSubtotal: m.customerSubtotal,
          originalSubtotal: m.customerSubtotal,
        })
      }
    }

    return {
      items: result,
      totalFreeQuantity: totalFree,
      totalOverQuantity: totalOver,
      totalCustomerReceivable: result.reduce((s, r) => s + r.customerSubtotal, 0),
      totalOriginalReceivable: result.reduce((s, r) => s + r.originalSubtotal, 0),
      freeAmount: result.reduce((s, r) => s + (r.originalSubtotal - r.customerSubtotal), 0),
    }
  }, [materials, packageMeters])

  return breakdown
}
