export const DEFAULT_OVER_PRICE = 45
export const DEFAULT_PACKAGE_METERS = 30

import { getAllCostMaterials as resolveCostMaterials } from '@/shared/utils/costMaterialsResolver'
import { matchCostName } from '@/features/material/hooks/useCostMatcher'
import { getCostMapping } from '@/shared/storage/costMappingStorage'
import { BRAND_DEFAULTS } from '@/constants/brands'
import { WANBANG_GEELY_ADDON_PRICES } from '@/constants/addonPrice_wanbang_geely'
import type { Order } from '@/types'

export const SERVICE_FEE: Record<string, number> = {
  安装: 300,
  维修: 60,
  勘察: 50,
  勘测: 50,
}

/**
 * 【P0-177铁律】展示层只读存储快照或本文件出口函数，禁止页面自造计算公式。
 */

/** 解析订单减免套餐米数：优先订单解析值，其次品牌默认配置，兜底 0（无套餐全额计费） */
export function resolveOrderPackageMeters(order: { brandName?: string; packageMeters?: string }): number {
  const parsed = parseFloat(order.packageMeters || '')
  if (!Number.isNaN(parsed) && parsed > 0) return parsed
  const brandDefault = order.brandName ? BRAND_DEFAULTS[order.brandName]?.packageMeters : undefined
  return brandDefault ?? 0
}

const GEELY_KEYWORDS = ['吉利', '银河', '极氪']

export function isGeelyBrand(brand: string): boolean {
  const b = (brand || '').toLowerCase()
  return GEELY_KEYWORDS.some((k) => b.includes(k))
}

export function getSettlementFee(order: Order): number {
  const brand = order.brandName || ''
  const pkg = parseFloat(order.packageMeters || '0')
  if (isGeelyBrand(brand)) {
    return calcInstallFee(pkg)
  }
  return getOrderServiceFee(order)
}

export function getOrderPlatformFee(
  order: Order,
  customerReceivable: number,
  getPlatformRate: (platform: string) => number
): number {
  if (isGeelyBrand(order.brandName || '')) return 0
  const rate = getPlatformRate(order.platform)
  return calcPlatformFee(customerReceivable, rate)
}

export interface OverFeeResult {
  overMeters: number
  overPrice: number
  overFee: number
}

export function calcOverFee(
  actualMeters: number,
  packageMeters = DEFAULT_PACKAGE_METERS,
  overPrice = DEFAULT_OVER_PRICE
): OverFeeResult {
  const over = Math.max(0, actualMeters - packageMeters)
  return { overMeters: over, overPrice, overFee: over * overPrice }
}

export function calcAddonTotal(materials: Array<{ quantity: number; unitPrice: number }>) {
  return materials.reduce((s, m) => s + m.quantity * m.unitPrice, 0)
}

export function buildAddonItemsText(
  materials: Array<{ name: string; quantity: number; unit: string; unitPrice: number }>
) {
  return materials
    .map((m) => {
      const subtotal = formatCurrency(m.quantity * m.unitPrice)
      return `${m.name} ${m.quantity}${m.unit} × ¥${m.unitPrice} = ¥${subtotal}`
    })
    .join('\n')
}

export interface MaterialCostResult {
  total: number
  unmatched: string[]
}

export function calcPlatformFee(receivable: number, rate: number) {
  return receivable * rate
}


type OrderFinancialSource = {
  actualInstallDate?: string
  appointmentDate?: string
  completeDate?: string
  createdAt: number
  customerPrice?: number
  materialCost?: number
  platformFee?: number
  actualProfit?: number
  serviceFee?: number
  notes?: string
  brandName?: string
  packageMeters?: string
}

/** P0-182：完工口径归一——本函数与 resolveDoneDate 同链（actualInstallDate→completeDate→createdAt），内部直调，禁再引入 appointmentDate */
export function getOrderBusinessDate(order: Pick<OrderFinancialSource, 'actualInstallDate' | 'completeDate' | 'createdAt'>) {
  return resolveDoneDate(order)
}

export function getOrderServiceFee(order: Pick<OrderFinancialSource, 'serviceFee' | 'notes' | 'packageMeters'>) {
  return order.serviceFee ?? getServiceFee(order.notes || '', resolveOrderPackageMeters(order))
}

export function getCompletedOrderFinancials(order: OrderFinancialSource) {
  const customerPrice = order.customerPrice || 0
  const materialCost = order.materialCost || 0
  const geely = isGeelyBrand(order.brandName || '')
  // P0-184①：出差=不扣点——出差单（人工开关或窗口启发式）platformFee归0，存值原样保留于order
  const platformFee = geely || isBusinessTripOrder(order) ? 0 : order.platformFee || 0
  const serviceFee = geely
    ? order.serviceFee ?? calcInstallFee(resolveOrderPackageMeters(order))
    : getOrderServiceFee(order)
  const customerPay = customerPrice + serviceFee
  // P0-183：扣点abs归一（P0-165-R3三态一致精神）——负号存量单实收=付费-|扣点|，与财务页useFinance同值
  const actualIncome = customerPay - Math.abs(platformFee)
  const actualProfit = order.actualProfit ?? actualIncome - materialCost

  // P0-185：customerPay=customerPrice+serviceFee 系公司流水合计（含安装费结算），禁用于客户付费展示；客户付费=customerPrice
  return { customerPrice, materialCost, platformFee, serviceFee, customerPay, actualIncome, actualProfit }
}

export function getServiceFee(orderNotes: string, packageMeters?: number) {
  const notes = orderNotes || ''
  if (notes.includes('维修')) return SERVICE_FEE['维修']
  if (notes.includes('勘察') || notes.includes('勘测')) return SERVICE_FEE['勘察']
  return calcInstallFee(packageMeters ?? DEFAULT_PACKAGE_METERS)
}

export function buildPlatformBrand(platform: string, brandName: string) {
  return `${platform || ''} ${brandName || ''}`.trim()
}

export function buildAddonSummary(customerTotal: number, actualProfit: number) {
  if (customerTotal && actualProfit && customerTotal !== actualProfit) {
    return `客户增项合计 ${formatCurrency(customerTotal)}\n实收 ${formatCurrency(actualProfit)}`
  }
  return `客户增项合计 ${formatCurrency((customerTotal || actualProfit || 0))}`
}

const FREE_QUOTA_KEYWORDS = ['电缆', 'PVC', 'YJV', 'yjv']

/** 万帮价表"按米线缆"条目（"线缆 3*6mm²"等：主表查无、名字不含电缆/YJV 的漏网命名；unit必须为米，排除按次的升级项） */
export function findWanbangMeteredCable(name: string) {
  const item = WANBANG_GEELY_ADDON_PRICES.find((a) => a.name === name)
  return item && item.category === '线缆铺设' && item.unit === '米' ? item : null
}

export function isFreeQuotaMaterial(name: string) {
  return FREE_QUOTA_KEYWORDS.some((k) => name.includes(k)) || !!findWanbangMeteredCable(name)
}

/** 漏保本体判定（别名：漏保/漏电保护器/漏保开关）：含"漏保/漏电保护"且非"漏保盒"（盒为安装辅材，厂家不提供） */
export function isBreakerMaterial(name: string) {
  return /漏电保护|漏保/.test(name) && !/盒/.test(name)
}

export function extractCableMeters(materials: Array<{ name: string; quantity: number }>) {
  const cable = materials.find((m) => m.name.includes('电缆') || m.name.includes('YJV') || m.name.includes('yjv'))
  return cable ? cable.quantity : 0
}

export function calcMaterialCost(materials: Array<{ name: string; quantity: number }>): MaterialCostResult {
  const unmatched: string[] = []
  const total = materials.reduce((sum, m) => {
    const unitCost = findCostPrice(m.name)
    if (unitCost === null) {
      unmatched.push(m.name)
    }
    return sum + (unitCost ?? 0) * m.quantity
  }, 0)
  return { total, unmatched }
}

export function resolveCostPrice(name: string): number { return findCostPrice(name) ?? 0 }

export function findCostPrice(name: string): number | null {
  // P0-129：精确名优先（用户新增材料参与计算的关键路径；顺序优先于映射/模糊匹配）
  const exact = resolveCostMaterials().find((c) => c.name === name)
  if (exact) return exact.costPrice ?? 0
  const mappedName = getCostMapping(name)
  if (mappedName) {
    const item = resolveCostMaterials().find((c) => c.name === mappedName)
    if (item) return item.costPrice ?? 0
  }
  const matchedName = matchCostName(name)
  if (matchedName) {
    const item = resolveCostMaterials().find((c) => c.name === matchedName)
    if (item) return item.costPrice ?? 0
  }
  const normalizedName = normalizeCostName(name)
  const fallbackItem = resolveCostMaterials().find((item) => {
    const normalizedCostName = normalizeCostName(item.name)
    return normalizedCostName === normalizedName
      || (normalizedName.startsWith('电缆') && normalizedCostName === '电缆')
  })
  return fallbackItem?.costPrice ?? null
}

function normalizeCostName(name: string) {
  return name.toLowerCase().replace(/\s/g, '').replace(/[x×]/g, '*').replace(/mm(?:²|2)/g, '')
}

/** 勘测预估费用汇总项 */
export interface CalcSurveyItem { name: string; quantity: number; unitPrice: number; isCable: boolean }

/** 计算勘测预估总费用 = 非电缆增项小计 + 电缆超米费用 */
export function calcSurveyTotal(materials: CalcSurveyItem[], cableCost: number): number {
  const nonCableTotal = materials
    .filter((m) => !m.isCable)
    .reduce((sum, m) => sum + m.quantity * m.unitPrice, 0)
  return nonCableTotal + cableCost
}

/** 临时工资计算器输入 */
export interface SalaryEstimateInput {
  brand: string
  packageMeters: number
  actualMeters: number
  platformRate: number
  materials: Array<{ name: string; quantity: number; settlementPrice: number }>
}

/** 临时工资计算器结果 */
export interface SalaryEstimate {
  isGeely: boolean
  settlementFee: number
  overMeters: number
  overFee: number
  addonFee: number
  materialCost: number
  platformFee: number
  salary: number
}

/** 工资估算：结算费 + 增项费用 - 材料成本 - 平台扣点（复用统一计算入口） */
export function calcSalaryEstimate(input: SalaryEstimateInput): SalaryEstimate {
  const { brand, packageMeters, actualMeters, platformRate, materials } = input
  const geely = isGeelyBrand(brand)

  const settlementFee = geely ? calcInstallFee(packageMeters) : SERVICE_FEE['安装']

  const cable = materials.find((m) => isFreeQuotaMaterial(m.name))
  const overPrice = cable?.settlementPrice || DEFAULT_OVER_PRICE
  const { overMeters, overFee } = calcOverFee(actualMeters, packageMeters, overPrice)

  const nonCable = materials.filter((m) => !isFreeQuotaMaterial(m.name))
  const addonNonCable = nonCable.reduce((s, m) => s + m.quantity * m.settlementPrice, 0)
  const addonFee = Math.round((overFee + addonNonCable) * 100) / 100

  const costItems = [
    { name: '电缆', quantity: actualMeters },
    { name: 'PVC', quantity: actualMeters },
    { name: '漏保盒', quantity: 1 },
    ...nonCable.map((m) => ({ name: m.name, quantity: m.quantity })),
  ]
  const materialCost = Math.round(calcMaterialCost(costItems).total * 100) / 100

  const platformFee = geely ? 0 : Math.round(calcPlatformFee(addonFee, platformRate) * 100) / 100

  const salary = Math.round((settlementFee + addonFee - materialCost - platformFee) * 100) / 100

  return { isGeely: geely, settlementFee, overMeters, overFee, addonFee, materialCost, platformFee, salary }
}

/* ============================================================
 * P0-165-R3 政策包计算出口（口径唯一来源：constants/policy.ts + 本文件）
 * 出差判定（双规则）：完成日期∈[TRIP_START,TRIP_END]→出差；
 *   窗口外恢复启发式 |platformFee|===0→出差（platformFee负号约定，取abs判定）
 * 对账利润 = 应收 − |扣点| + 安装费 + 出差补助（不减材料不减工资）
 *   选型：读取统一abs归一——存量扣点符号曾分裂（旧负数存量/旧正数存量），
 *   abs保证三态（修正器输出负数/旧存量/新完工单）计算一致
 * 实际利润 = 对账 − 材料成本 − 工资
 * ============================================================ */
import { PLATFORM_FEE_RATE, TRIP_SUBSIDY_PER_UNIT, INSTALL_FEE_TIERS, INSTALL_FEE_DEFAULT, BREAKER_EXCLUDE_BRANDS, BREAKER_EXCLUDE_WULING_POWER, POLICY_FIX_TRIP_START, POLICY_FIX_TRIP_END } from '@/constants/policy'
import { formatCurrency } from '@/shared/utils/format'

const round2 = (v: number) => Math.round(v * 100) / 100

/** 安装费分档：20米=200 / 30米=300 / 自定义归300 */
export function calcInstallFee(packageMeters: number): number {
  return INSTALL_FEE_TIERS[packageMeters] ?? INSTALL_FEE_DEFAULT
}

/**
 * P0-167：已完成域统一日期口径——实际完工日优先
 * 回退链 actualInstallDate → completeDate → createdAt（不沉底），一处定义多处用
 */
export function resolveDoneDate(order: { actualInstallDate?: string; completeDate?: string; createdAt?: number }): string {
  if (order.actualInstallDate) return order.actualInstallDate
  if (order.completeDate) return order.completeDate
  if (order.createdAt) return new Date(order.createdAt).toISOString().slice(0, 10)
  return ''
}

/** 扣点统一读值（abs归一，兼容存量符号分裂） */
export function absPlatformFee(order: { platformFee?: number }): number {
  return Math.abs(order.platformFee || 0)
}

/** 出差判定（R3双规则 + R7人工开关优先） */
export function isBusinessTripOrder(order: { isBusinessTrip?: boolean; completeDate?: string; platformFee?: number }): boolean {
  // R7：人工显式开关优先于启发式（OrderForm写入；修正器窗口/启发式照旧）
  if (typeof order.isBusinessTrip === 'boolean') return order.isBusinessTrip
  const date = getOrderBusinessDate(order as Parameters<typeof getOrderBusinessDate>[0])
  if (date >= POLICY_FIX_TRIP_START && date <= POLICY_FIX_TRIP_END) return true
  return absPlatformFee(order) === 0
}

/** 出差补助：30/台，普通单0 */
export function calcTripSubsidy(isTrip: boolean): number {
  return isTrip ? TRIP_SUBSIDY_PER_UNIT : 0
}

/** 普通单扣点：返回负数（-应收×10%，20%作废，负号约定） */
export function calcPolicyPlatformFee(receivable: number): number {
  return -round2(receivable * PLATFORM_FEE_RATE)
}

/** 漏保矩阵（仅漏保器）：领克全不含 / 五菱3.5kW不含 / 其余含 */
export function shouldIncludeBreaker(brandName: string, powerKw: string | undefined): boolean {
  const b = brandName || ''
  if (BREAKER_EXCLUDE_BRANDS.some((k) => b.includes(k))) return false
  if (b.includes('五菱') && String(powerKw || '').trim() === BREAKER_EXCLUDE_WULING_POWER) return false
  return true
}

/** 漏保器行判定（别名：漏保/漏电保护器/漏保开关，非盒） */
export function isBreakerDeviceRow(name: string): boolean {
  return isBreakerMaterial(name)
}

/** 漏保盒行判定（每单必含，不参与矩阵） */
export function isBreakerBoxRow(name: string): boolean {
  return /盒/.test(name) && /漏保|漏电保护/.test(name)
}

/**
 * 对账利润（公司结算额，R6口径·条件化）
 * 出差单：客户付费线下收、不进公司账 → 对账 = 安装费 + 出差补助（公司只付这两笔）
 * 普通单：付费走账 → 对账 = 付费 − |扣点| + 安装费 + 出差补助
 * 两分支均不减材料不减工资（公司不核材料与工资）。
 */
export function calcReconciliationProfit(order: {
  customerPrice?: number
  platformFee?: number
  serviceFee?: number
  tripSubsidy?: number
  notes?: string
  completeDate?: string
  isBusinessTrip?: boolean
}): number {
  const serviceFee = order.serviceFee ?? getServiceFee(order.notes || '')
  const subsidy = order.tripSubsidy || 0
  if (isBusinessTripOrder(order)) return round2(serviceFee + subsidy)
  return round2((order.customerPrice || 0) - absPlatformFee(order) + serviceFee + subsidy)
}

/**
 * 实际利润 = 付费 − |扣点| + 安装费 + 出差补助 − 材料成本 − 工资（自己记账，全部真实收支）
 * R6：与旧链"对账−材料−工资"数值等价（对账旧公式恰=付费−扣点+安装费+补助），现网数值不变。
 */
export function calcActualProfitByPolicy(order: {
  customerPrice?: number
  materialCost?: number
  laborCost?: number
  platformFee?: number
  serviceFee?: number
  tripSubsidy?: number
  notes?: string
}): number {
  const serviceFee = order.serviceFee ?? getServiceFee(order.notes || '')
  return round2((order.customerPrice || 0) - absPlatformFee(order) + serviceFee + (order.tripSubsidy || 0) - (order.materialCost || 0) - (order.laborCost || 0))
}
