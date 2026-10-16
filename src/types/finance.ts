export type DeductionType = '京东10%' | '其他20%'

export interface MonthlyStats {
  month: string
  totalOrders: number
  completedOrders: number
  totalRevenue: number
  totalMaterialCost: number
  totalLaborCost: number
  totalPlatformFee: number
  actualProfit: number
}

export interface PackageConfig {
  name: string
  meterLength: number
  basePrice: number
}
