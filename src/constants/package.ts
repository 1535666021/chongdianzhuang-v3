export const DEFAULT_PACKAGE_METERS = 30

export const FREE_QUOTA_MATERIALS = ['电缆', 'PVC', 'YJV', 'yjv']

export interface PackageConfig {
  packageMeters: number
  freeMaterials: string[]
}

export const DEFAULT_PACKAGE_CONFIG: PackageConfig = {
  packageMeters: DEFAULT_PACKAGE_METERS,
  freeMaterials: FREE_QUOTA_MATERIALS,
}

export function isFreeQuotaMaterial(name: string): boolean {
  return FREE_QUOTA_MATERIALS.some((keyword) => name.includes(keyword))
}
