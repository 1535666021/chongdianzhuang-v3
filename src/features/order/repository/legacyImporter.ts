import type { Order, OrderStatus, Platform, Region } from '@/types'

/* ------------------------------------------------------------
 * v7 老备份 → v3 Order 转换器（R7修复版）
 * 修复：增加第4组桶（appointmentOrders/appointedOrders/scheduledOrders）
 * ------------------------------------------------------------ */

/** v7 状态 → v3 中文状态映射（含历史别名） */
const STATUS_MAP: Record<string, OrderStatus> = {
  // 标准英文
  'pending':    '待办',
  'surveyed':   '待办',
  'appointed':  '已预约',
  'appointment': '已预约',
  'scheduled':  '已预约',
  'booked':     '已预约',
  'completed':  '已完成',
  'done':       '已完成',
  'finished':   '已完成',
  'cancelled':  '待办',
  'trash':      '回收站',
  'deleted':    '回收站',
  // 中文
  '待办':       '待办',
  '已勘测':     '待办',
  '已预约':     '已预约',
  '已完成':     '已完成',
  '已取消':     '待办',
  '回收站':     '回收站',
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

/** 翻正逻辑：pending + 有预约信息 → 已预约 */
function shouldFlipToAppointed(
  rawStatus: string,
  finalStatus: OrderStatus,
  raw: Record<string, unknown>
): OrderStatus {
  if (rawStatus !== 'pending' && finalStatus !== '待办') return finalStatus

  const rawAppointment = raw.appointment
  if (rawAppointment && typeof rawAppointment === 'object') {
    const appt = rawAppointment as Record<string, unknown>
    const hasDate = asStr(appt.appointmentDate || appt.date).trim() !== ''
    const hasTime = asStr(appt.timeSlot || appt.time || appt.period).trim() !== ''
    if (hasDate && hasTime) return '已预约'
  }

  const hasTopDate = asStr(raw.appointmentDate).trim() !== ''
  const hasTopTime = asStr(raw.appointmentTime || raw.timeSlot).trim() !== ''
  if (hasTopDate && hasTopTime) return '已预约'

  return finalStatus
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
      appointmentTime: asStr(raw.appointmentTime || raw.timeSlot) || undefined,
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

/** 解析 v7 备份 JSON 文本 */
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

  // 四桶遍历（新增第2组：已预约桶）
  const bucketDefs: { keys: string[]; bucketDefaultStatus: OrderStatus; useStatusMap: boolean }[] = [
    { keys: ['orders', 'pendingOrders', 'orderList', 'cdz_orders', 'cp_orders'], bucketDefaultStatus: '待办', useStatusMap: true },
    { keys: ['appointmentOrders', 'appointedOrders', 'scheduledOrders'], bucketDefaultStatus: '已预约', useStatusMap: true },
    { keys: ['completedOrders', 'completed', 'doneOrders'], bucketDefaultStatus: '已完成', useStatusMap: true },
    { keys: ['trashOrders', 'trash', 'deletedOrders', 'recycleOrders'], bucketDefaultStatus: '回收站', useStatusMap: false },
  ]

  for (const { keys, bucketDefaultStatus, useStatusMap } of bucketDefs) {
    let list: unknown[] | null = null
    let usedKey = ''
    for (const key of keys) {
      const candidate = obj[key]
      if (Array.isArray(candidate)) {
        list = candidate
        usedKey = key
        break
      }
    }
    if (!list) continue

    console.log(`[import] 桶 ${usedKey}: ${list.length} 条`)

    for (let i = 0; i < list.length; i++) {
      const raw = list[i]
      if (typeof raw !== 'object' || raw === null) {
        failed.push({ reason: `${usedKey}[${i}] 不是对象`, index: i })
        continue
      }

      const rawRecord = raw as Record<string, unknown>
      const rawStatus = asStr(rawRecord.status)

      // 是否使用STATUS_MAP
      let finalStatus: OrderStatus
      if (useStatusMap) {
        finalStatus = STATUS_MAP[rawStatus] || bucketDefaultStatus
      } else {
        finalStatus = bucketDefaultStatus
      }

      // 翻正逻辑：仅对主待办桶生效
      const isMainBucket = ['orders', 'pendingOrders', 'orderList', 'cdz_orders', 'cp_orders'].includes(usedKey)
      if (isMainBucket) {
        finalStatus = shouldFlipToAppointed(rawStatus, finalStatus, rawRecord)
      }

      console.log(`[import] ${usedKey}[${i}] rawStatus=${rawStatus} finalStatus=${finalStatus} name=${rawRecord.name}`)

      const order = convertV7Order(rawRecord, finalStatus)
      if (order) {
        success.push(order)
      } else {
        failed.push({ reason: `${usedKey}[${i}] 转换失败`, index: i })
      }
    }
  }

  const summary: Record<string, number> = {}
  for (const s of ['待办', '已预约', '已完成', '回收站'] as OrderStatus[]) {
    summary[s] = success.filter((o) => o.status === s).length
  }

  console.log(`[import] 汇总: ${JSON.stringify(summary)}`)

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
