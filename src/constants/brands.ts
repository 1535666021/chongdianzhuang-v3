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
  '华境': '华境', '阿维塔': '阿维塔', '上汽通用': '上汽通用', '奔驰': '奔驰', '宝马': '宝马', '奥迪': '奥迪', '大众': '大众', '丰田': '丰田', '本田': '本田', '日产': '日产', '皮卡': '皮卡',
}

export const BRAND_NAMES = Object.keys(BRAND_MAP)

export function getBrandLabel(brand: string | undefined): string {
  const value = brand?.trim() || ''
  return BRAND_MAP[value] || BRAND_MAP[value.toLowerCase() === 'icar' ? 'iCAR' : value] || value || '未知'
}

// P0-112：吉利系（吉利/银河/极氪，判定单点 isWanbangGeelyOrder）功率为空时的默认值
/** P0-136：桩名称品牌识别映射——桩名称/车辆型号含关键词→品牌。按关键词长度降序存储（最长匹配优先）。
 * 出处逐条注明；新增条目须附出处。歧义（同长度多命中）由消费方保持原样并计数。 */
export const PILE_BRAND_KEYWORDS: ReadonlyArray<{ kw: string; brand: string }> = [
  { kw: '银河微金刚', brand: '吉利' }, // 甲方实证样本（桩名称原文）
  { kw: '银河', brand: '吉利' }, // 任务书指定：银河=吉利银河系
  { kw: '极氪', brand: '吉利' }, // P0-112 吉利系判定词表同口径
  { kw: '万帮', brand: '吉利' }, // 万帮吉利价表关联（WANBANG_GEELY_ADDON）
  { kw: '五菱', brand: '五菱' }, // 挚达/五菱价表品牌键
  { kw: '挚达', brand: '挚达' }, // 挚达平台·五菱品牌价表
  { kw: '特斯拉', brand: '特斯拉' }, // KNOWN_BRANDS词表（桩名称直接含品牌名=强信号）
  { kw: '比亚迪', brand: '比亚迪' },
  { kw: '长安', brand: '长安' },
  { kw: '零跑', brand: '零跑' },
].sort((a, b) => b.kw.length - a.kw.length)

export const DEFAULT_GEELY_POWER_KW = '7'

export const BRAND_DEFAULTS: Record<string, BrandConfig> = {
  // P0-113：挚达/五菱套餐30米（3*6线缆30米内减免的兜底口径；服务费与米数无关不受影响）
  '挚达': { packageMeters: 30 },
  '五菱': { packageMeters: 30 },
  '零跑': { packageMeters: 30, breakerType: 'C40A' },
  '空灵零跑': { packageMeters: 30, breakerType: 'C40A' },
  '苏宁': { breakerType: 'C40A' },
  '比亚迪': { packageMeters: 30, powerBreakers: { '3.5': 'C25', '7': 'C40' } },
}
