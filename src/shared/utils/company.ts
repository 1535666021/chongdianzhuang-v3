/** P0-220：公司维度唯一判定出口（全App禁自写京东判定） */
export const isDaomeiOrder = (o: { platformName?: string; platform?: string }): boolean =>
  /京东/.test((o.platformName || o.platform || ''))

export type CompanyKey = 'all' | 'benyang' | 'daomei'
/** P0-220：公司过滤（全部/本杨/到美），统计/财务/对账共用 */
export const companyHit = (o: { platformName?: string; platform?: string }, company: CompanyKey): boolean =>
  company === 'all' ? true : company === 'daomei' ? isDaomeiOrder(o) : !isDaomeiOrder(o)
