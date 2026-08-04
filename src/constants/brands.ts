export interface BrandConfig {
  packageMeters?: number
  breakerType?: string
  powerBreakers?: Record<string, string>
}

export const BREAKER_NAMES: Record<string, string> = {
  'C25': '漏保C25',
  'C40': '漏保C40',
  'C40A': '漏保C40A',
}

export const BRAND_MAP: Record<string, string> = {
  '长城欧拉': '长城欧拉', '长城坦克': '长城坦克', '长城皮卡': '长城皮卡',
  '鸿蒙智行': '鸿蒙智行', '广汽埃安': '广汽埃安', '特来电': '特来电', '比亚迪': '比亚迪', '特斯拉': '特斯拉', '零跑': '零跑', '埃安': '埃安',
  '五菱': '五菱', '公牛': '公牛', '捷途': '捷途', '吉利': '吉利', '长城': '长城', '坦克': '坦克', '欧拉': '欧拉', '奇瑞': '奇瑞', 'iCAR': 'iCAR',
  '理想': '理想', '蔚来': '蔚来', '小鹏': '小鹏', '长安': '长安', '深蓝': '深蓝', '极氪': '极氪', '问界': '问界', '小米': '小米', '传祺': '传祺',
  '华境': '华境', '奔驰': '奔驰', '宝马': '宝马', '奥迪': '奥迪', '大众': '大众', '丰田': '丰田', '本田': '本田', '日产': '日产', '皮卡': '皮卡',
}

export const BRAND_NAMES = Object.keys(BRAND_MAP)

export function getBrandLabel(brand: string | undefined): string {
  const value = brand?.trim() || ''
  return BRAND_MAP[value] || BRAND_MAP[value.toLowerCase() === 'icar' ? 'iCAR' : value] || value || '未知'
}

export const BRAND_DEFAULTS: Record<string, BrandConfig> = {
  '零跑': { packageMeters: 30, breakerType: 'C40A' },
  '空灵零跑': { packageMeters: 30, breakerType: 'C40A' },
  '苏宁': { breakerType: 'C40A' },
  '比亚迪': { packageMeters: 30, powerBreakers: { '3.5': 'C25', '7': 'C40' } },
}
