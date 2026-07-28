import type { Order, OrderStatus, Platform, Region, OrderMaterialItem, OrderSurvey, InstallType } from '@/types'
import { extractBrandName, extractPlatformName, POWER_RE, METERS_RE } from '@/lib/parser-core'

/* ------------------------------------------------------------
 * v7 老备份 → v3 Order 转换器（R10：13字段补全版）
 * R10：补全老备份导入缺失的13个字段
 * R9c：兼容v3导出格式（customerName/address标准字段名）
 * R9b：翻正逻辑补appointmentPeriod（老系统预约时段真实字段名）
 * R9：依据老备份真实字段结构精准对齐——
 *   应收   = profitData.customerPaid（客户实付，第一优先）
 *   扣点   = 老系统不存此字段 → 按官方公式补算（京东/天猫10%，其他20%）
 *   完成日 = completedAt（时间戳自动转YYYY-MM-DD）
 *   利润   = profitData.profit（快照原值，不重算）
 * ------------------------------------------------------------ */

/** v7 状态 → v3 中文状态映射（含历史别名） */
const STATUS_MAP: Record<string, OrderStatus> = {
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

/** P0-008：从serviceType/remark推断InstallType（老系统无此字段时用） */
function inferInstallType(serviceType: string, remark: string): InstallType | undefined {
  const st = serviceType.toLowerCase()
  const rm = remark.toLowerCase()
  if (st.includes('带桩') || rm.includes('带桩上门')) return '带桩上门'
  if (st.includes('维修')) return '维修'
  if (/勘察|勘测/.test(st)) return '勘察'
  if (st.includes('检测')) return '检测'
  if (st.includes('拆桩')) return '拆桩'
  if (st.includes('移机')) return '移机'
  if (st.includes('安装')) return '仅安装'
  return undefined
}

/** P0-008：安全读取材料清单（格式不匹配返回[]） */
function safeMaterials(raw: unknown): OrderMaterialItem[] {
  if (!raw || !Array.isArray(raw)) return []
  const result: OrderMaterialItem[] = []
  for (const item of raw as unknown[]) {
    if (!item || typeof item !== 'object') continue
    const m = item as Record<string, unknown>
    result.push({
      name: asStr(m.name || m.materialName || m.title),
      spec: asStr(m.spec || m.specification || m.model) || undefined,
      quantity: pickNum(m.quantity, m.count, m.qty, m.num) || 1,
      unit: asStr(m.unit || m.unitText) || '个',
      unitPrice: pickNum(m.unitPrice, m.price, m.settlementPrice, m.costPrice),
    })
  }
  return result
}

/** P0-008：安全读取勘测记录（格式不匹配返回undefined） */
function safeSurvey(raw: unknown): OrderSurvey | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const s = raw as Record<string, unknown>
  const hasAnyField =
    asStr(s.powerSource || s.cableSpec || s.installMethod || s.meterStatus || s.surveyResult).trim() !== ''
    || (s.cableDistance !== undefined && Number(s.cableDistance) > 0)
    || (s.estimatedCableCost !== undefined && Number(s.estimatedCableCost) > 0)
  if (!hasAnyField) return undefined

  return {
    estimatedMaterials: safeMaterials(s.estimatedMaterials || s.materials || s.items),
    powerSource: validatePowerSource(asStr(s.powerSource)),
    cableSpec: asStr(s.cableSpec) || undefined,
    cableDistance: pickNum(s.cableDistance) || undefined,
    estimatedCableCost: pickNum(s.estimatedCableCost) || undefined,
    installMethod: validateInstallMethod(asStr(s.installMethod)),
    meterStatus: validateMeterStatus(asStr(s.meterStatus)),
    needBlueprint: validateBlueprint(asStr(s.needBlueprint)),
    surveyResult: validateSurveyResult(asStr(s.surveyResult)),
    locationInfo: asStr(s.locationInfo) || undefined,
  }
}

function validatePowerSource(v: string): OrderSurvey['powerSource'] {
  if (v === '物业配电' || v === '自家电表' || v === '其他') return v
  return '国网取电'
}

function validateInstallMethod(v: string): OrderSurvey['installMethod'] {
  if (v === '立柱安装' || v === '吊装' || v === '其他') return v
  return '壁挂安装'
}

function validateMeterStatus(v: string): OrderSurvey['meterStatus'] {
  return v === '未安装' ? '未安装' : '已安装'
}

function validateBlueprint(v: string): OrderSurvey['needBlueprint'] {
  return v === '是' ? '是' : '否'
}

function validateSurveyResult(v: string): OrderSurvey['surveyResult'] {
  const valid = ['勘测完成', '符合安装', '不符合安装', '需整改', '待定'] as const
  return valid.includes(v as any) ? (v as any) : '勘测完成'
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

    let platformFee = pickNum(
      pd.platformFee, pd.platformDeduction, pd.deduction, pd.fee,
      raw.platformFee, raw.platformDeduction, raw.deduction, raw.fee
    )
    if (!platformFee && customerPrice > 0) {
      platformFee = round2(customerPrice * platformRate(platform))
    }

    if (!customerPrice && (actualProfit || materialCost || laborCost || platformFee)) {
      customerPrice = round2(actualProfit + materialCost + laborCost + platformFee)
    }

    const completeDate =
      asDateStr(raw.completedAt) ||
      asDateStr(raw.completeDate) ||
      asDateStr(raw.finishDate) ||
      asDateStr(raw.completedDate) ||
      asDateStr(raw.doneDate) ||
      asDateStr(pd.completeDate) ||
      asDateStr(pd.finishDate) ||
      undefined

    const notes = asStr(raw.notes || raw.remark).trim()

    // ===== P0-008：13个缺失字段映射 =====
    let platformName = asStr(
      raw.platformName || raw.operator || raw.运营商 || raw.platform
    ).trim() || undefined

    const remark = asStr(raw.remark || raw.remarks || raw.comment || raw.备注).trim() || undefined

    const orderNo = asStr(
      raw.orderNo || raw.orderNumber || raw.order_id || raw.orderId || raw.订单号
    ).trim() || undefined

    const vin = asStr(
      raw.vin || raw.vinNo || raw.frameNo || raw.frameNumber || raw.车架号
    ).trim() || undefined

    let brandName = asStr(
      raw.brandName || raw.brand || raw.serviceBrand || raw.品牌
    ).trim() || undefined

    let powerKw = asStr(
      raw.powerKw || raw.power || raw.kw || raw.powerKW || raw.功率
    ).trim() || undefined

    let packageMeters = asStr(
      raw.packageMeters || raw.meters || raw.meterCount || raw.packageMeter || raw.套包米数 || raw.米数
    ).trim() || undefined

    let serviceType = asStr(
      raw.serviceType || raw.service || raw.type || raw.serviceTypeText || raw.服务类型
    ).trim() || undefined

    let installType: InstallType | undefined
    const rawInstall = asStr(
      raw.installType || raw.install || raw.installationType || raw.安装类型
    ).trim()
    if (rawInstall) {
      const validTypes: InstallType[] = ['带桩上门', '仅安装', '维修', '勘察', '检测', '拆桩', '移机', '其他']
      installType = validTypes.includes(rawInstall as InstallType) ? (rawInstall as InstallType) : undefined
    }
    if (!installType) {
      installType = inferInstallType(serviceType || '', remark || '')
    }

    const rawText = asStr(
      raw.rawText || raw.originalText || raw.text || raw.content || raw.source || raw.original || raw.orderText
    ).trim() || undefined

    // P0-009：从 rawText 做 fallback 提取（仅在原字段为空时）
    if (!brandName && rawText) {
      brandName = extractBrandName(rawText) || undefined
    }
    if (!platformName && rawText) {
      platformName = extractPlatformName(rawText) || undefined
    }
    if (!powerKw && rawText) {
      const pm = rawText.match(POWER_RE)
      if (pm) powerKw = pm[1]
    }
    if (!packageMeters && rawText) {
      const mm = rawText.match(METERS_RE)
      if (mm) packageMeters = mm[1]
    }
    if (!serviceType && rawText) {
      const st = rawText
      if (st.includes('带桩上门') || st.includes('带桩')) serviceType = '带桩上门'
      else if (st.includes('维修')) serviceType = '维修'
      else if (st.includes('勘察') || st.includes('勘测')) serviceType = '勘察'
      else if (st.includes('检测')) serviceType = '检测'
      else if (st.includes('拆桩')) serviceType = '拆桩'
      else if (st.includes('移机')) serviceType = '移机'
      else if (st.includes('安装')) serviceType = '仅安装'
    }

    const installer = asStr(
      raw.installer || raw.engineer || raw.worker || raw.工程师 || raw.installerName || raw.安装工
    ).trim() || undefined

    const materials = safeMaterials(raw.materials || raw.materialList || raw.items || raw.materialItems)
    const survey = safeSurvey(raw.survey || raw.surveyData || raw.investigation || raw.勘测)

    const order: Order = {
      id,
      customerName: (asStr(raw.name) || asStr(raw.customerName)).trim() || '未知客户',
      phone: extractPhone(raw.phone),
      address: (asStr(raw.addr) || asStr(raw.address)).trim() || '地址未填写',
      platform,
      platformName,
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
      notes,
      remark,
      meterStatus: raw.meterStatus === '已安装' ? '已安装' : '未安装',
      meterNumber: asStr(raw.meterNumber) || undefined,
      orderNo,
      vin,
      brandName,
      powerKw,
      packageMeters,
      serviceType,
      installType,
      rawText,
      installer,
      materials: materials.length > 0 ? materials : undefined,
      survey,
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

      let finalStatus: OrderStatus
      if (useStatusMap) {
        finalStatus = STATUS_MAP[rawStatus] || bucketDefaultStatus
      } else {
        finalStatus = bucketDefaultStatus
      }

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
