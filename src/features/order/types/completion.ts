import type { OrderMaterialItem } from '@/types'

export interface MaterialInput {
  id: string
  name: string
  spec?: string
  quantity: number
  unit: string
  settlementPrice: number
  costPrice: number
  customerSubtotal: number
  costSubtotal: number
}

export interface FixedAuxInput {
  cableMeters: number
  pvcMeters: number
  breakerCount: number
  breakerType: 'C25' | 'C40' | 'C40A' | ''
}

export interface ProfitBreakdownItem {
  name: string
  calc: string
  amount: number
}

export interface ProfitBreakdown {
  receivableItems: ProfitBreakdownItem[]
  platformRate: number
  serviceFeeLabel: string
  materialItems: ProfitBreakdownItem[]
  laborLabel: string
}

export interface ProfitPreview {
  customerReceivable: number
  freeAmount?: number
  platformFee: number
  materialCost: number
  laborCost: number
  serviceFee: number
  actualProfit: number
  breakdown: ProfitBreakdown
}

export interface CompletionFormData {
  completeDate: string
  installer: string
  materials: MaterialInput[]
  fixedAux: FixedAuxInput
  notes: string
}
