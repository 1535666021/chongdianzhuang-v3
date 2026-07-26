import type { Order } from '@/types'

export interface FinanceOrder extends Order {
  revenue: number
  materialCostDetail: number
  laborCostDetail: number
  platformFeeDetail: number
  actualProfitDetail: number
}

export interface MonthlyReconciliation {
  year: number
  month: number
  label: string
  orderCount: number
  totalRevenue: number
  totalPlatformFee: number
  totalActualIncome: number
  totalMaterialCost: number
  totalLaborCost: number
  totalActualProfit: number
}

export interface CostBreakdown {
  orderId: string
  customerName: string
  platform: string
  materials: { name: string; quantity: number; unitPrice: number; subtotal: number }[]
  materialTotal: number
  laborCost: number
  platformFee: number
  actualProfit: number
}

export type ReceivableFilter = 'all' | 'unpaid' | 'paid'
