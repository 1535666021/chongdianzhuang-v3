export { DEFAULT_PACKAGE_METERS, isFreeQuotaMaterial } from '@/shared/utils/orderCalc'

export const FREE_QUOTA_MATERIALS = ['电缆', 'PVC', 'YJV', 'yjv']

export interface PackageConfig {
  packageMeters: number
  freeMaterials: string[]
}

export const DEFAULT_PACKAGE_CONFIG: PackageConfig = {
  packageMeters: 30,
  freeMaterials: FREE_QUOTA_MATERIALS,
}
