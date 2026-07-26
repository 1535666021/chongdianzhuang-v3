import type { Order, OrderStatus, Platform, Region } from '@/types'

/* ------------------------------------------------------------
 * v7 老备份 → v3 Order 转换器（R9精准对齐版）
 * R9b：翻正逻辑补appointmentPeriod（老系统预约时段真实字段名）
 * R9：依据老备份真实字段结构精准对齐——
 *   应收   = profitData.customerPaid（客户实付，第一优先）
 *   扣点   = 老系统不存此字段 → 按官方公式补算（京东/天猫10%，其他20%）
 *   完成日 = completedAt（时间戳自动转YYYY-MM-DD）
 *   利润   = profitData.profit（快照原值，不重算）
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

/** 多候选取第一个有效数字（undefined/null/空串/NaN跳过，0是合法值） */
function pickNum(...candidates: unknown[]): number {
  for (const c of candidates) {
    if (c === undefined || c === null || c === '') continue
    const n = Number(c)
    if (Number.isFinite(n)) return n
  }
  return 0
}

/** 保留两位小数 */
function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** 日期兼容转换：时间戳（秒/毫秒）→ YYYY-MM-DD；字符串原样 */
function asDateStr(v: unknown): string {
  if (v === undefined || v === null || v === '') return ''
  if (typeof v === 'number' && Number.isFinite(v)) {
    const ms = v < 1e12 ? v * 1000 : v
    const d = new Date(ms)
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
    return ''
  }
  return asStr(v)
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
  const hasTopTime = asStr(raw.appointmentTime || raw.appointmentPeriod || raw.timeSlot).trim() !== ''
  if (hasTopDate && hasTopTime) return '已预约'

  return finalStatus
}

/** 金额快照候选容器：老系统混乱命名全兼容（只读，不改原始数据） */
function getMoneyContainer(raw: Record<string, unknown>): Record<string, unknown> {
  const candidates = [raw.profitData, raw.finance, raw.settlement, raw.costData, raw.money]
  for (const c of candidates) {
    if (c && typeof c === 'object' && !Array.isArray(c)) return c as Record<string, unknown>
  }
  return {}
}

/** 平台扣点率（官方公式：京东/天猫10%，其他20%） */
function platformRate(platform: Platform): number {
  return platform === '京东' || platform === '天猫' ? 0.1 : 0.2
}

/** 单条 v7 订单 → v3 Order */
function convertV7Order(raw: Record<string, unknown>, finalStatus: OrderStatus): Order | null {
  try {
    const id = asStr(raw.id) || 'legacy_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
    const now = Date.now()
    const createdAt = typeof raw.createdAt === 'number' ? raw.createdAt : now
    const updatedAt = typeof raw.updatedAt === 'number' ? raw.updatedAt : now

    // ===== R9：金额精准对齐 =====
    const pd = getMoneyContainer(raw)

    const materialCost = pickNum(
      pd.materialCost, pd.material, pd.materialFee, pd.materialsCost,
      raw.materialCost, raw.material, raw.materialFee, raw.materialsCost
    )
    const laborCost = pickNum(
      pd.laborCost, pd.labor, pd.laborFee, pd.installFee,
      raw.laborCost, raw.labor, raw.laborFee, raw.installFee
    )
    const actualProfit = pickNum(
      pd.profit, pd.actualProfit, pd.netProfit,
      raw.actualProfit, raw.profit, raw.netProfit
    )
    // 应收：老系统真实字段 customerPaid 第一优先（客户实付）
    let customerPrice = pickNum(
      pd.customerPaid, raw.customerPaid,
      pd.customerPrice, raw.customerPrice,
      pd.receivable, raw.receivable,
      pd.revenue, raw.revenue,
      pd.totalAmount, raw.totalAmount,
      pd.amount, raw.amount,
      pd.price, raw.price,
      raw.total
    )

    const platform = mapPlatform(raw.platform)

    // 平台扣点：优先快照原值；老系统不存此字段 → 按官方公式补算
    let platformFee = pickNum(
      pd.platformFee, pd.platformDeduction, pd.deduction, pd.fee,
      raw.platformFee, raw.platformDeduction, raw.deduction, raw.fee
    )
    if (!platformFee && customerPrice > 0) {
      platformFee = round2(customerPrice * platformRate(platform))
    }

    // 应收兜底：仍无应收但有利润/成本快照时按官方公式反推
    if (!customerPrice && (actualProfit || materialCost || laborCost || platformFee)) {
      customerPrice = round2(actualProfit + materialCost + laborCost + platformFee)
    }

    // 完成日期：completedAt（老系统真实字段，时间戳自动转日期）第一优先
    const completeDate =
      asDateStr(raw.completedAt) ||
      asDateStr(raw.completeDate) ||
      asDateStr(raw.finishDate) ||
      asDateStr(raw.completedDate) ||
      asDateStr(raw.doneDate) ||
      asDateStr(pd.completeDate) ||
      asDateStr(pd.finishDate) ||
      undefined

    const order: Order = {
      id,
      customerName: asStr(raw.name).trim() || '未知客户',
      phone: extractPhone(raw.phone),
      address: asStr(raw.addr).trim() || '地址未填写',
      platform,
      status: finalStatus,
      region: mapRegion(raw.region),
      appointmentDate: asStr(raw.appointmentDate) || undefined,
      appointmentTime: asStr(raw.appointmentTime || raw.appointmentPeriod || raw.timeSlot) || undefined,
      materialCost,
      laborCost,
      platformFee,
      actualProfit,
      customerPrice: customerPrice || undefined,
      completeDate,
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
