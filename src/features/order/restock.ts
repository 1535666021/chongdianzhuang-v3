import type { Order } from '@/types'

export type RestockStatus = 'needed' | 'done'

const INSTALL_TYPES = new Set(['带桩上门', '仅安装'])
const NON_INSTALL_KEYWORDS = ['维修', '勘察', '勘测', '检测', '拆桩', '移机']

export function isInstallOrder(order: Order): boolean {
  if (order.installType) return INSTALL_TYPES.has(order.installType)
  const text = order.serviceType || ''
  return text.includes('安装') && !NON_INSTALL_KEYWORDS.some((k) => text.includes(k))
}

/** P0-134：口径变更（甲方拍板）——所有待办工单一律需补桩，不再区分带桩上门/仅安装/维修/勘测等类型。
 * 恒真返回（保留签名与导出面；P0-133-R2 的类型判定已删，如需回滚可从 git 历史 b0bf9d16 前的 ec9751ef^ 恢复）。
 * 手动标「已补桩」的退出通道在 effectiveRestock（手动标签优先），不受本口径影响。 */
export function needsRestock(_order: Order): boolean {
  void _order
  return true
}

/** P0-133-R2：有效状态=手动标签优先，未标则自动判定（存量零迁移，动态生效） */
export function effectiveRestock(order: Order): 'needed' | 'done' | undefined {
  return order.restockStatus ?? (needsRestock(order) ? 'needed' : undefined)
}

/** P0-133-R2：补桩清单目标——仅待办且需补桩（三处共用helper） */
export function restockTargets(orders: Order[]): Order[] {
  return orders.filter((o) => o.status === '待办' && effectiveRestock(o) === 'needed')
}

export interface RestockMaterialRow { name: string; quantity: string }

export function platformNameOf(order: Order): string {
  return (order.platformName || order.platform || '').trim()
}

/** P0-133-R2：发货单——key含子品牌维度；功率缺失「功率未填」；原4参签名/辅材区/落款保留 */
export function buildRestockShipmentText(date: Date, orders: Order[], materials: RestockMaterialRow[], receiveAddr: string): string {
  const lines: string[] = [`${date.getMonth() + 1}月${date.getDate()}日发货明细`]
  const groups = new Map<string, number>()
  for (const order of orders) {
    const key = [platformNameOf(order), order.brandName || '未知品牌', order.subBrand || '', order.powerKw || ''].join('|')
    groups.set(key, (groups.get(key) ?? 0) + 1)
  }
  const rows = [...groups.entries()].map(([key, count]) => {
    const [platform, brand, sub, power] = key.split('|')
    return { platform, brand, sub, power, count }
  }).sort((a, b) => `${a.platform}${a.brand}${a.sub}${a.power}`.localeCompare(`${b.platform}${b.brand}${b.sub}${b.power}`, 'zh-Hans-CN'))
  for (const row of rows) {
    const parts = [row.platform, row.brand]
    if (row.sub) parts.push(row.sub)
    parts.push(row.power ? `${row.power}kW` : '功率未填')
    lines.push(`${parts.join(' ')} ${row.count}台`)
  }
  const materialLines = materials.filter((m) => m.name.trim() !== '' && m.quantity.trim() !== '').map((m) => `${m.name.trim()} ${m.quantity.trim()}`)
  if (materialLines.length > 0) { lines.push('辅材：'); lines.push(...materialLines) }
  const addr = receiveAddr.trim()
  if (addr !== '') lines.push(addr)
  return lines.join('\n')
}
