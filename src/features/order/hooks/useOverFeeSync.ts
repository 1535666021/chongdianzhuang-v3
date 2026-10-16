import { useMemo } from 'react'
import type { Order } from '@/types'

export interface OverFeeResult {
  isOverFee: boolean
  estimatedAmount: number
  actualAmount: number
  overFeeAmount: number
  overFeeRatio: number
}

const OVER_FEE_THRESHOLD = 0.2 // 超出20%标记为超费

export function useOverFeeSync(order: Order | undefined): OverFeeResult | null {
  return useMemo(() => {
    if (!order) return null

    // 从survey中获取预估材料金额
    const estimatedMaterials = order.survey?.estimatedMaterials || []
    const estimatedAmount = estimatedMaterials.reduce(
      (sum, m) => sum + ((m as any).unitPrice || 0) * (m.quantity || 0), 0
    )

    // 实际完成材料金额
    const actualMaterials = order.materials || []
    const actualAmount = actualMaterials.reduce(
      (sum, m) => sum + (m.unitPrice || 0) * (m.quantity || 0), 0
    )

    const overFeeAmount = Math.max(0, actualAmount - estimatedAmount)
    const overFeeRatio = estimatedAmount > 0 ? overFeeAmount / estimatedAmount : 0

    return {
      isOverFee: overFeeRatio > OVER_FEE_THRESHOLD && overFeeAmount > 100,
      estimatedAmount,
      actualAmount,
      overFeeAmount,
      overFeeRatio,
    }
  }, [order])
}
