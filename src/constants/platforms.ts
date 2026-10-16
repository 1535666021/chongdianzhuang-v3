export const PLATFORM_MAP: Record<string, string> = {
  '西安领充': '西安领充',
  '领充': '西安领充',
  '京东': '京东',
  '均胜': '均胜',
  '妍伟': '妍伟',
  '苏宁易购': '苏宁',
  '苏宁': '苏宁',
  '拼多多': '拼多多',
  '天猫': '天猫',
  '淘宝': '淘宝',
  '万帮': '万帮',
  '挚达': '挚达',
  '空灵': '空灵',
  '美团': '美团',
  '苹果': '苹果',
  '其他': '其他',
}

export const PLATFORM_NAMES = Object.keys(PLATFORM_MAP)

export function getPlatformLabel(platform: string | undefined): string {
  const value = platform?.trim() || ''
  return PLATFORM_MAP[value] || value || '未知'
}
