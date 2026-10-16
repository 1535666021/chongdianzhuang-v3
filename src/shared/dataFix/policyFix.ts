/**
 * P0-165-R3：9-10月旧账自动修正器（总修订版）
 * B3规则（按当前存储值重算）+ R3修订：
 *  符号：扣点一律存负数（calcPolicyPlatformFee 负号约定），读取 abs 归一
 *  出差判定（C）：完成日期∈[TRIP_START,TRIP_END]→出差；窗口外启发式|扣点|=0→出差
 *  漏保拆分（D）：矩阵只判漏保器；漏保盒每单必含（缺则补，成本表价/无价按行unitPrice并披露）
 *  幂等（B4/F）：版本匹配跳过；r1→r3 再修一轮（正数扣点重算翻负、误删漏保盒补回）
 */
import type { Order } from '@/types'
import {
  POLICY_FIX_VERSION, POLICY_FIX_RANGE, POLICY_FIX_BACKUP_KEY, POLICY_FIX_RUN_AT_KEY,
  POLICY_FIX_TRIP_START, POLICY_FIX_TRIP_END,
  BREAKER_DEVICE_NAMES, BREAKER_BOX_NAMES,
} from '@/constants/policy'
import {
  calcInstallFee, calcTripSubsidy, calcPolicyPlatformFee,
  shouldIncludeBreaker, isBreakerDeviceRow, isBreakerBoxRow,
  calcReconciliationProfit, calcActualProfitByPolicy,
  resolveOrderPackageMeters, findCostPrice, getOrderBusinessDate, absPlatformFee,
} from '@/shared/utils/orderCalc'
import { useOrderStore } from '@/stores/orderStore'

const round2 = (v: number) => Math.round(v * 100) / 100

export interface PolicyFixDetail {
  orderId: string
  customerName: string
  summary: string
}
export interface PolicyFixReport {
  total: number
  skippedVersion: number
  tripMarked: number
  installFeeAdjusted: number
  breakerRemoved: number
  breakerAdded: number
  breakerBoxAdded: number
  breakerSkippedNoPrice: number
  rateAlignedOnly: number
  details: PolicyFixDetail[]
  backedUp: boolean
  backupKey: string
  runAt: number
}

/** 范围判定：已完成 && 业务完成日期在9-10月窗口 */
export function isInPolicyFixScope(order: Order): boolean {
  if (order.status !== '已完成') return false
  if (order.deletedAt) return false
  const date = getOrderBusinessDate(order)
  return date >= POLICY_FIX_RANGE.start && date <= POLICY_FIX_RANGE.end
}

/** 出差判定（R3双规则）：时间窗口内全出差；窗口外 |扣点|=0 启发式 */
export function resolveTrip(order: Order): boolean {
  const date = getOrderBusinessDate(order)
  if (date >= POLICY_FIX_TRIP_START && date <= POLICY_FIX_TRIP_END) return true
  return absPlatformFee(order) === 0
}

export interface PolicyFixPlanItem {
  order: Order
  updates: Partial<Order>
  summary: string
  category: 'trip' | 'installFee' | 'breakerRemoved' | 'breakerAdded' | 'breakerBoxAdded' | 'rateAligned' | 'breakerSkippedNoPrice'
}

/** 计算修正计划（纯函数，不写库） */
export function planPolicyFix(orders: Order[]): { items: PolicyFixPlanItem[]; skippedVersion: number } {
  const items: PolicyFixPlanItem[] = []
  let skippedVersion = 0
  for (const order of orders) {
    if (!isInPolicyFixScope(order)) continue
    if (order.policyFixVersion === POLICY_FIX_VERSION) { skippedVersion++; continue }

    const updates: Partial<Order> = {}
    const changes: string[] = []
    let category: PolicyFixPlanItem['category'] = 'rateAligned'

    // b+c. 出差判定与扣点重算（负数约定）
    const isTrip = resolveTrip(order)
    const receivable = order.customerPrice || 0
    const newPlatformFee = isTrip ? 0 : calcPolicyPlatformFee(receivable)
    if (isTrip && !order.isBusinessTrip) {
      updates.isBusinessTrip = true
      changes.push('补出差标记')
      category = 'trip'
    }
    if (newPlatformFee !== (order.platformFee || 0)) {
      updates.platformFee = newPlatformFee
      changes.push(`扣点 ${order.platformFee || 0}→${newPlatformFee}`)
    }

    // d. 安装费分档重算
    const pkgMeters = resolveOrderPackageMeters(order)
    const newServiceFee = calcInstallFee(pkgMeters)
    if (newServiceFee !== (order.serviceFee ?? 0)) {
      updates.serviceFee = newServiceFee
      changes.push(`安装费→${newServiceFee}（${pkgMeters}米档）`)
      if (category === 'rateAligned') category = 'installFee'
    }

    // e. 漏保拆分（D）：矩阵只判漏保器；漏保盒每单必含
    const materials = [...(order.materials || [])]
    const shouldInclude = shouldIncludeBreaker(order.brandName || '', order.powerKw)
    let materialCost = order.materialCost || 0
    if (!shouldInclude) {
      // 只移除漏保器行，漏保盒行保留
      const deviceRows = materials.filter((m) => isBreakerDeviceRow(m.name))
      if (deviceRows.length > 0) {
        const removedCost = round2(deviceRows.reduce((s, m) => s + (findCostPrice(m.name) ?? m.unitPrice ?? 0) * m.quantity, 0))
        updates.materials = materials.filter((m) => !isBreakerDeviceRow(m.name))
        materialCost = round2(materialCost - removedCost)
        updates.materialCost = materialCost
        changes.push(`移除漏保器${deviceRows.length}行(-¥${removedCost})，漏保盒保留`)
        category = 'breakerRemoved'
      }
    } else {
      // 含漏保器品牌：本体缺失→别名探测成本价原子补入
      const hasDevice = materials.some((m) => isBreakerDeviceRow(m.name))
      if (!hasDevice) {
        let devicePrice: number | null = null
        for (const n of BREAKER_DEVICE_NAMES) { const p = findCostPrice(n); if (p !== null) { devicePrice = p; break } }
        if (devicePrice === null) {
          changes.push('漏保器补入跳过：无成本价映射')
          if (category === 'rateAligned') category = 'breakerSkippedNoPrice'
        } else {
          materials.push({ name: '漏保', quantity: 1, unit: '个', unitPrice: devicePrice })
          materialCost = round2(materialCost + devicePrice)
          changes.push(`补入漏保器(+¥${devicePrice})`)
          category = 'breakerAdded'
        }
      }
    }
    // 漏保盒每单必含（全品牌无例外）：缺失→补入
    const hasBox = materials.some((m) => isBreakerBoxRow(m.name))
    if (!hasBox) {
      let boxPrice: number | null = null
      for (const n of BREAKER_BOX_NAMES) { const p = findCostPrice(n); if (p !== null) { boxPrice = p; break } }
      const rowPrice = boxPrice ?? 5
      if (boxPrice === null) changes.push('漏保盒无成本价映射，按¥5计(披露)')
      materials.push({ name: BREAKER_BOX_NAMES[0], quantity: 1, unit: '个', unitPrice: rowPrice })
      materialCost = round2(materialCost + rowPrice)
      updates.materials = [...materials]
      updates.materialCost = materialCost
      changes.push(`补入漏保盒(+¥${rowPrice})`)
      if (category === 'rateAligned') category = 'breakerBoxAdded'
    }

    // f. 补助
    const subsidy = calcTripSubsidy(isTrip)
    if ((order.tripSubsidy ?? 0) !== subsidy) {
      updates.tripSubsidy = subsidy
      changes.push(`出差补助→${subsidy}`)
    }

    // g. 利润双口径
    const finalOrder = { ...order, ...updates, materialCost, serviceFee: updates.serviceFee ?? order.serviceFee ?? 0 }
    updates.reconciliationProfit = calcReconciliationProfit(finalOrder)
    updates.actualProfit = calcActualProfitByPolicy(finalOrder)

    // h. 留痕
    updates.lastPolicyFixAt = Date.now()
    updates.policyFixVersion = POLICY_FIX_VERSION

    if (changes.length === 0) { category = 'rateAligned'; changes.push('无需调整（已符合现行政策）') }
    items.push({ order, updates, summary: changes.join('；'), category })
  }
  return { items, skippedVersion }
}

/** 备份键：固定前缀+执行时间戳，不覆盖旧备份（R4） */
export function buildPolicyFixBackupKey(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}`
  return `${POLICY_FIX_BACKUP_KEY}_${stamp}`
}

/** 执行修正：强制备份(带时间戳键)→逐单写入→报告（幂等：r3版本匹配跳过，旧版单全量归一重跑） */
export function runPolicyFix(): PolicyFixReport {
  const orders = useOrderStore.getState().orders
  const { items, skippedVersion } = planPolicyFix(orders)
  const backup = items.map((it) => it.order)
  const backupKey = buildPolicyFixBackupKey(Date.now())
  localStorage.setItem(backupKey, JSON.stringify(backup))
  const updateOrder = useOrderStore.getState().updateOrder
  const details: PolicyFixDetail[] = []
  const report: PolicyFixReport = {
    total: items.length, skippedVersion, tripMarked: 0, installFeeAdjusted: 0,
    breakerRemoved: 0, breakerAdded: 0, breakerBoxAdded: 0, breakerSkippedNoPrice: 0, rateAlignedOnly: 0,
    details, backedUp: true, backupKey, runAt: Date.now(),
  }
  for (const it of items) {
    try {
      updateOrder(it.order.id, it.updates)
      details.push({ orderId: it.order.id, customerName: it.order.customerName, summary: it.summary })
      if (it.category === 'trip') report.tripMarked++
      else if (it.category === 'installFee') report.installFeeAdjusted++
      else if (it.category === 'breakerRemoved') report.breakerRemoved++
      else if (it.category === 'breakerAdded') report.breakerAdded++
      else if (it.category === 'breakerBoxAdded') report.breakerBoxAdded++
      else if (it.category === 'breakerSkippedNoPrice') report.breakerSkippedNoPrice++
      else report.rateAlignedOnly++
    } catch (error) {
      console.warn('[政策修正] 单条失败已跳过', it.order.id, error)
    }
  }
  localStorage.setItem(POLICY_FIX_RUN_AT_KEY, String(report.runAt))
  console.log('[政策修正] 报告', report)
  return report
}

export function getPolicyFixRunAt(): number | null {
  const raw = localStorage.getItem(POLICY_FIX_RUN_AT_KEY)
  return raw ? Number(raw) : null
}
