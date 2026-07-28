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

export interface ProfitPreview {
  customerReceivable: number
  platformFee: number
  materialCost: number
  laborCost: number
  serviceFee: number
  actualProfit: number
}

export interface CompletionFormData {
  completeDate: string
  installer: string
  materials: MaterialInput[]
  fixedAux: FixedAuxInput
  notes: string
}
