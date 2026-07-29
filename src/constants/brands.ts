export interface BrandConfig {
  packageMeters?: number
  breakerType?: string
  powerBreakers?: Record<string, string>
}

export const BRAND_DEFAULTS: Record<string, BrandConfig> = {
  '零跑': { packageMeters: 30, breakerType: 'C40A' },
  '空灵零跑': { packageMeters: 30, breakerType: 'C40A' },
  '苏宁': { breakerType: 'C40A' },
  '比亚迪': { packageMeters: 30, powerBreakers: { '3.5': 'C25', '7': 'C40' } },
}
