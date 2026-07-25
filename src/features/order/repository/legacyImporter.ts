import type { Order, OrderStatus, Platform, Region } from '@/types'

/* ------------------------------------------------------------
 * v7 老备份 → v3 Order 转换器（批次4-R1修复版）
 * 修复：老备份status字段为英文小写，非中文；单桶结构
 * ------------------------------------------------------------ */

/** v7 英文状态 → v3 中文状态映射
 *  老系统：pending(待勘测)/surveyed(已勘测)/appointed(已预约)/
 *         completed(已完成)/cancelled(已取消)/trash(回收站)
 *  v3简化：待勘测/已勘测/已取消 → 归入"待办"（甲方可后续手动调整）
 */
const STATUS_MAP: Record<string, OrderStatus> = {
  'pending':    '待办',
  'surveyed':   '待办',
  'appointed':  '已预约',
  'completed':  '已完成',
  'cancelled':  '待办',
  'trash':      '回收站',
}

/** v7 平台 → v3 平台映射 */
function mapPlatform(raw: unknown): Platform {
  const text = String(raw || '').trim()
  if (text === '京东' || text === 'jd' || text === 'JD') return '京东'
  if (text === '天猫') return '天猫'
  if (text === '淘宝') return '淘宝'
  if (text === '拼多多') return '拼多多'
  if (text === '抖音') return '抖音'
  return '其他'
}

/** v7 地区 → v3 地区映射 */
function mapRegion(raw: unknown): Region {
  const text = String(raw || '').trim()
  const regions: Region[] = ['巢湖', '合肥', '芜湖', '马鞍山', '滁州', '宣城', '安庆', '其他']
  const found = regions.find((r) => r === text)
  return found || '其他'
}

/** 脏值 → 字符串 */
function asStr(v: unknown): string {
  if (v === undefined || v === null) return ''
  return typeof v === 'string' ? v : String(v)
}

/** 脏值 → 数字 */
function asNum(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

/** 从phone字段提取手机号 */
function extractPhone(raw: unknown): string {
  const text = asStr(raw)
  const m = text.match(/1[3-9]\d{9}/)
  return m ? m[0] : text
}

/** 单条 v7 订单 → v3 Order */
function convertV7Order(raw: Record<string, unknown>, finalStatus: OrderStatus): Order | null {
  try {
    const id = asStr(raw.id) || 'legacy_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
    const now = Date.now()
    const createdAt = typeof raw.createdAt === 'number' ? raw.createdAt : now
    const updatedAt = typeof raw.updatedAt === 'number' ? raw.updatedAt : now

    const order: Order = {
      id,
      customerName: asStr(raw.name).trim() || '未知客户',
      phone: extractPhone(raw.phone),
      address: asStr(raw.addr).trim() || '地址未填写',
      platform: mapPlatform(raw.platform),
      status: finalStatus,
      region: mapRegion(raw.region),
      appointmentDate: asStr(raw.appointmentDate) || undefined,
      appointmentTime: asStr(raw.appointmentTime) || undefined,
      materialCost: asNum(raw.materialCost),
      laborCost: asNum(raw.laborCost),
      platformFee: asNum(raw.platformFee),
      actualProfit: asNum(raw.actualProfit),
      notes: asStr(raw.notes || raw.remark).trim(),
      meterStatus: raw.meterStatus === '已安装' ? '已安装' : '未安装',
      meterNumber: asStr(raw.meterNumber) || undefined,
      createdAt,
      updatedAt,
    }

    return order
  } catch (err) {
    return null
  }
}

/** 解析 v7 备份 JSON 文本
 *  老备份结构：单桶 orders，status字段为英文
 */
export function parseV7Backup(jsonText: string): {
  success: Order[]
  failed: { reason: string; index: number }[]
  summary: Record<string, number>
} {
  let payload: unknown
  try {
    payload = JSON.parse(jsonText)
  } catch {
    return { success: [], failed: [{ reason: '备份文件不是有效的JSON', index: -1 }], summary: {} }
  }

  if (typeof payload !== 'object' || payload === null) {
    return { success: [], failed: [{ reason: '备份内容为空', index: -1 }], summary: {} }
  }

  const obj = payload as Record<string, unknown>
  const success: Order[] = []
  const failed: { reason: string; index: number }[] = []

  // 老备份只有一个 orders 桶，所有订单在里面
  const list = obj['orders']
  if (!Array.isArray(list)) {
    return { success: [], failed: [{ reason: '备份中无订单数据', index: -1 }], summary: {} }
  }

  for (let i = 0; i < list.length; i++) {
    const raw = list[i]
    if (typeof raw !== 'object' || raw === null) {
      failed.push({ reason: `orders[${i}] 不是对象`, index: i })
      continue
    }

    const rawStatus = asStr((raw as Record<string, unknown>).status)
    const finalStatus = STATUS_MAP[rawStatus] || '待办'

    const order = convertV7Order(raw as Record<string, unknown>, finalStatus)
    if (order) {
      success.push(order)
    } else {
      failed.push({ reason: `orders[${i}] 转换失败`, index: i })
    }
  }

  const summary: Record<string, number> = {}
  for (const s of ['待办', '已预约', '已完成', '回收站'] as OrderStatus[]) {
    summary[s] = success.filter((o) => o.status === s).length
  }

  return { success, failed, summary }
}

/** 去重导入：按id去重，已存在的跳过 */
export function mergeOrders(existing: Order[], incoming: Order[]): {
  merged: Order[]
  added: number
  skipped: number
} {
  const existingIds = new Set(existing.map((o) => o.id))
  const merged = [...existing]
  let added = 0
  let skipped = 0

  for (const order of incoming) {
    if (existingIds.has(order.id)) {
      skipped++
    } else {
      merged.push(order)
      existingIds.add(order.id)
      added++
    }
  }

  return { merged, added, skipped }
}
