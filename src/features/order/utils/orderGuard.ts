import type { Order } from '@/types'

export type GuardMatchBy = 'orderNo' | 'vin' | 'phone'
export type GuardWhere = '已预约' | '已完成' | '其他状态'

export interface OrderExistsResult {
  exists: boolean
  where?: GuardWhere
  matchBy?: GuardMatchBy
  existing?: Order
}

/** P0-196-R2：单号归一化（忽略大小写/空白） */
function norm(s?: string): string {
  return (s || '').replace(/\s+/g, '').toUpperCase()
}

function whereOf(order: Order): GuardWhere {
  // P0-196-R2：按现有状态字段判（禁新造状态）
  if (order.status === '已完成') return '已完成'
  if (order.status === '已预约') return '已预约'
  return '其他状态'
}

/** P0-196-R2 录入防重检测：单号（铁）→ VIN（铁）→ 电话（疑）。
 * 铁=单号/VIN 精确归一化命中；疑=电话同但单号不同。检测全程本地。
 */
export function orderExists(parsed: { orderNo?: string; vin?: string; phone?: string }, orders: Order[]): OrderExistsResult {
  if (!parsed.orderNo && !parsed.vin && !parsed.phone) return { exists: false }
  const targetNo = norm(parsed.orderNo)
  const targetVin = norm(parsed.vin)
  const targetPhone = (parsed.phone || '').replace(/\D/g, '')
  if (targetNo) {
    const hit = orders.find((o) => norm(o.orderNo) === targetNo)
    if (hit) return { exists: true, where: whereOf(hit), matchBy: 'orderNo', existing: hit }
  }
  if (targetVin) {
    const hit = orders.find((o) => norm(o.vin) === targetVin && norm(o.vin) !== '')
    if (hit) return { exists: true, where: whereOf(hit), matchBy: 'vin', existing: hit }
  }
  if (targetPhone) {
    const hits = orders.filter((o) => (o.phone || '').replace(/\D/g, '') === targetPhone)
    const suspect = hits.find((o) => norm(o.orderNo) !== targetNo)
    if (suspect) return { exists: true, where: whereOf(suspect), matchBy: 'phone', existing: suspect }
  }
  return { exists: false }
}

export interface DuplicateGroup {
  key: string
  matchBy: 'orderNo' | 'vin' | 'phone'
  orders: Order[]
  keep: Order
  removeIds: string[]
}

export interface DuplicateScan {
  ironA: DuplicateGroup[]
  ironB: DuplicateGroup[]
  suspectC: DuplicateGroup[]
}

/** P0-196-R2：事后查重三分区（哈希分组 O(n)，600单<1s）。
 * 保留规则=字段更全优先（非空字段数多者）、并列取创建更早。
 */
export function detectDuplicates(orders: Order[]): DuplicateScan {
  const active = orders.filter((o) => o.status !== '回收站')
  const fieldCount = (o: Order) => Object.values(o).filter((v) => v !== undefined && v !== null && v !== '').length
  const pickKeep = (group: Order[]): Order => {
    return [...group].sort((a, b) => fieldCount(b) - fieldCount(a) || (a.createdAt || 0) - (b.createdAt || 0))[0]
  }
  const groupBy = (getKey: (o: Order) => string, matchBy: 'orderNo' | 'vin' | 'phone'): DuplicateGroup[] => {
    const map = new Map<string, Order[]>()
    for (const o of active) {
      const k = getKey(o)
      if (!k) continue
      const arr = map.get(k) || []
      arr.push(o)
      map.set(k, arr)
    }
    const out: DuplicateGroup[] = []
    for (const [key, group] of map) {
      if (group.length < 2) continue
      const keep = pickKeep(group)
      out.push({ key, matchBy, orders: group, keep, removeIds: group.filter((o) => o.id !== keep.id).map((o) => o.id) })
    }
    return out
  }
  const ironA = groupBy((o) => norm(o.orderNo), 'orderNo')
  const ironB = groupBy((o) => norm(o.vin), 'vin')
  const suspectC = groupBy((o) => {
    const phone = (o.phone || '').replace(/\D/g, '')
    const addr = (o.address || '').replace(/\s+/g, '')
    return phone && addr ? `${phone}|${addr}` : ''
  }, 'phone')
  return { ironA, ironB, suspectC }
}

/** P0-196-R2：铁重自动清理——localStorage 全量备份（固定前缀+时间戳）。 */
export function backupAndCleanupIron(orders: Order[], removeIds: string[]): { backupKey: string; removed: number } {
  const backupKey = `cdz_backup_${Date.now()}`
  localStorage.setItem(backupKey, JSON.stringify(orders))
  const ids = new Set(removeIds)
  return { backupKey, removed: ids.size }
}
