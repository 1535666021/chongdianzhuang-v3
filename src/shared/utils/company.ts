/** P0-220：公司维度唯一判定出口（全App禁自写京东判定） */
export const isDaomeiOrder = (o: { platformName?: string; platform?: string }): boolean =>
  /京东/.test((o.platformName || o.platform || ''))

/** P0-216：双公司平台集合（工单文本无区分信号，进来挂未分公司；后续再有双属平台只加这里） */
export const DUAL_COMPANY_PLATFORMS = ['速家']

export type CompanyKey = 'all' | 'benyang' | 'daomei' | 'unassigned'

/**
 * P0-216：公司归属唯一出口——显式 order.company 字段 > 平台规则：
 * 京东→到每家；DUAL_COMPANY_PLATFORMS（速家）→未分公司；其余→本杨。
 * 老数据无 company 字段=走平台规则（零迁移）。
 */
export function resolveCompany(o: { platformName?: string; platform?: string; company?: 'benyang' | 'daomei' }): CompanyKey {
  if (o.company === 'benyang' || o.company === 'daomei') return o.company
  const p = o.platformName || o.platform || ''
  if (/京东/.test(p)) return 'daomei'
  if (DUAL_COMPANY_PLATFORMS.some((x) => p.includes(x))) return 'unassigned'
  return 'benyang'
}

/** P0-220+P0-216：公司过滤（全部/本杨/到每家/未分），统计/财务/对账共用 */
export const companyHit = (o: Parameters<typeof resolveCompany>[0], company: CompanyKey): boolean => {
  const resolved = resolveCompany(o)
  if (company === 'all') return true
  return resolved === company
}
