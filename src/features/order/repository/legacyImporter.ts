import type { InstallType, Order, OrderStatus } from '@/types'
import { asDateStr, asStr, extractPhone, fillOrderTextFallbacks, getMoneyContainer, inferInstallType, mapPlatform, mapRegion, pickNum, platformRate, round2, safeMaterials, safeSurvey, shouldFlipToAppointed, STATUS_MAP } from './legacyImporterUtils'

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
    if (rawText) {
      ({ brandName, platformName, powerKw, packageMeters, serviceType } = fillOrderTextFallbacks(rawText, {
        brandName, platformName, powerKw, packageMeters, serviceType,
      }))
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
  materialUsage: Array<{ id: string; date: string; name: string; unit: string; costPrice: number; quantity: number; total: number }>
} {
  let payload: unknown
  try {
    payload = JSON.parse(jsonText)
  } catch {
    return { success: [], failed: [{ reason: '备份文件不是有效的JSON', index: -1 }], summary: {}, materialUsage: [] }
  }

  if (typeof payload !== 'object' || payload === null) {
    return { success: [], failed: [{ reason: '备份内容为空', index: -1 }], summary: {}, materialUsage: [] }
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

  const cpUsage = obj['cp_material_usage']
  let materialUsage: Array<{ id: string; date: string; name: string; unit: string; costPrice: number; quantity: number; total: number }> = []
  if (Array.isArray(cpUsage)) {
    materialUsage = cpUsage.map((r: any, i: number) => ({
      id: r.id || `cp_usage_${i}_${Date.now()}`,
      date: r.date || '',
      name: r.name || '',
      unit: r.unit || '个',
      costPrice: parseFloat(r.costPrice) || 0,
      quantity: parseFloat(r.quantity) || 0,
      total: parseFloat(r.total) || 0,
    }))
  }

  return { success, failed, summary, materialUsage }
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
