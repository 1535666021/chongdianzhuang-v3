import type { DeductionType } from '@/types'

export const DEDUCTION_RULES: Record<DeductionType, number> = {
  '京东10%': 0.1,
  '其他20%': 0.2,
}

export const DEFAULT_PACKAGES = [
  { name: '30米套包', meterLength: 30, basePrice: 0 },
  { name: '50米套包', meterLength: 50, basePrice: 500 },
  { name: '100米套包', meterLength: 100, basePrice: 1200 },
]

export function calculatePlatformFee(revenue: number, platform: string): number {
  const rate = platform === '京东' ? DEDUCTION_RULES['京东10%'] : DEDUCTION_RULES['其他20%']
  return Math.round(revenue * rate * 100) / 100
}

export function calculateActualProfit(
  revenue: number,
  materialCost: number,
  laborCost: number,
  platform: string
): number {
  const platformFee = calculatePlatformFee(revenue, platform)
  return Math.round((revenue - materialCost - laborCost - platformFee) * 100) / 100
}
