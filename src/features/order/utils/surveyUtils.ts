import type { MaterialCategory } from '@/types/material'

const CATEGORY_SHORT_MAP: Record<MaterialCategory, string> = {
  '线缆': '电缆',
  '保护箱': '保护箱',
  '立柱': '立柱',
  '基础': '基础',
  '开孔': '开孔',
  '电表': '电表',
  '漏保': '断路器',
  '浪涌': '断路器',
  '拆除': '拆除',
  '服务': '服务',
  '桥架': '桥架',
  '管材': '管材',
  '路面': '基础',
  '安装': '安装',
  '高空': '高空',
  '接地': '其他',
  '吊筋': '桥架',
  '辅材': '其他',
  '工具': '其他',
  '其他': '其他',
}

const CATEGORY_SORT_ORDER: Record<string, number> = {
  '电缆': 1,
  '断路器': 2,
  '保护箱': 3,
  '立柱': 4,
  '开孔': 5,
  '电表': 6,
  '桥架': 7,
  '管材': 8,
  '基础': 9,
  '安装': 10,
  '高空': 11,
  '拆除': 12,
  '服务': 13,
  '其他': 99,
}

export function getShortName(name: string, category: MaterialCategory): string {
  const n = name || ''

  // 线缆
  if (n.includes('3*6') || n.includes('3×6')) return '电缆3*6'
  if (n.includes('3*10') || n.includes('3×10')) return '电缆3*10'
  if (n.includes('3*16') || n.includes('3×16')) return '电缆3*16'
  if (n.includes('升级')) return '线缆升级'
  if (n.includes('桥架')) return '电缆桥架'
  if (n.includes('高空架设')) return '高空电缆'
  if (n.includes('线缆拆除') || (n.includes('拆除') && category === '线缆')) return '线缆拆除'
  if (n.includes('套内')) return '套内线缆'

  // 保护箱
  if (n.includes('充电器')) return '充电器保护箱'
  if (n.includes('安装') && category === '保护箱') return '保护箱安装'
  if (n.includes('500*') || n.includes('箱体')) return '保护箱(含箱体)'

  // 立柱
  if (n.includes('充电桩立柱')) return '充电桩立柱'
  if (n.includes('立柱安装') || (n.includes('安装') && n.includes('立柱'))) return '立柱安装'
  if (n.includes('防撞')) return '防撞柱'

  // 开孔
  if (n.includes('≤20cm') || (n.includes('20cm') && !n.includes('<'))) return '打孔≤20cm'
  if (n.includes('20cm<') && n.includes('40cm')) return '打孔20-40cm'
  if (n.includes('40cm<') && n.includes('60cm')) return '打孔40-60cm'
  if (n.includes('60cm<') && n.includes('80cm')) return '打孔60-80cm'
  if (n.includes('专业开孔')) return '专业开孔'

  // 路面/基础
  if (n.includes('土路')) return '土路开沟'
  if (n.includes('水泥路')) return '水泥路开沟'
  if (n.includes('柏油路')) return '柏油路开沟'
  if (n.includes('铺砖')) return '铺砖开沟'
  if (n.includes('水泥基础')) return '水泥基础'
  if (n.includes('钢结构底座')) return '钢结构底座'

  // 漏保/断路器
  if (n.includes('漏电保护') || n.includes('漏保')) return '漏保开关'
  if (n.includes('浪涌')) return '浪涌保护'
  if (n.includes('C25')) return 'C25断路器'
  if (n.includes('C40')) return 'C40断路器'

  // 服务
  if (n.includes('勘测')) return '勘测费'
  if (n.includes('售后')) return '售后费'
  if (n.includes('报装')) return '报装费'

  // 拆除
  if (n.includes('拆除和挂装')) return '拆+装'
  if (n.includes('拆除')) return '拆除'
  if (n.includes('挂装')) return '挂装'

  // 其他
  if (n.includes('电度表')) return '电度表'
  if (n.includes('限位胶')) return '限位胶'
  if (n.includes('工单')) return '工单'
  if (n.includes('泡钉')) return '泡钉'
  if (n.includes('PVC') || n.includes('镀锌管')) return '管材'
  if (n.includes('吊丝')) return '吊丝'
  if (n.includes('柏油')) return '柏油'
  if (n.includes('水泥') && category === '路面') return '水泥'
  if (n.includes('桥架') && category === '桥架') return '桥架'

  // 兜底
  return CATEGORY_SHORT_MAP[category] || category
}

export function getCategorySortOrder(category: MaterialCategory): number {
  return CATEGORY_SORT_ORDER[CATEGORY_SHORT_MAP[category]] || 99
}
