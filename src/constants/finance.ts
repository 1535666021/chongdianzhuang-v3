import type { DeductionType, PackageConfig } from '@/types'

export const DEDUCTION_RULES: Record<DeductionType, number> = {
  '京东10%': 0.10,
  '其他20%': 0.20,
}

export const DEFAULT_PACKAGES: PackageConfig[] = [
  { name: '30米套包', meterLength: 30, basePrice: 0 },
  { name: '50米套包', meterLength: 50, basePrice: 0 },
]

export function calculatePlatformFee(amount: number, platform: string): number {
  const deduction = platform === '京东' ? DEDUCTION_RULES['京东10%'] : DEDUCTION_RULES['其他20%']
  return Math.round(amount * deduction * 100) / 100
}
