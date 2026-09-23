export const DEFAULT_OVER_PRICE = 45
export const DEFAULT_PACKAGE_METERS = 30

import { costMaterials } from '@/constants/materialData'
import { matchCostName } from '@/features/material/hooks/useCostMatcher'
import { getCostMapping } from '@/shared/storage/costMappingStorage'
import { BRAND_DEFAULTS } from '@/constants/brands'
import { WANBANG_GEELY_ADDON_PRICES } from '@/constants/addonPrice_wanbang_geely'
import type { Order } from '@/types'

export const SERVICE_FEE: Record<string, number> = {
  安装: 300,
  维修: 60,
  勘察: 0,
  勘测: 0,
}

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

export function getGeelyServiceFee(packageMeters: number): number {
  if (packageMeters === 20) return 230
  if (packageMeters === 30) return 330
  return SERVICE_FEE['安装']
}

export function getSettlementFee(order: Order): number {
  const brand = order.brandName || ''
  const pkg = parseFloat(order.packageMeters || '0')
  if (isGeelyBrand(brand)) {
    return getGeelyServiceFee(pkg)
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
      const subtotal = (m.quantity * m.unitPrice).toFixed(2)
      return `${m.name} ${m.quantity}${m.unit} × ¥${m.unitPrice} = ¥${subtotal}`
    })
    .join('\n')
}

export interface MaterialCostResult {
  total: number
  unmatched: string[]
}

export function calcProfit(
  customerPrice: number,
  materialCost: number,
  platformFee: number,
  serviceFee = 0
) {
  return customerPrice - materialCost - platformFee + serviceFee
}

export function calcPlatformFee(receivable: number, rate: number) {
  return receivable * rate
}

export function calcOrderFinancials(customerPrice: number, materialCost: number, platformRate: number, serviceFee = 0) {
  const platformFee = calcPlatformFee(customerPrice, platformRate)
  return { platformFee, actualProfit: calcProfit(customerPrice, materialCost, platformFee, serviceFee) }
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

function isDateValue(value: string | undefined) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || '')
}

export function getOrderBusinessDate(order: Pick<OrderFinancialSource, 'actualInstallDate' | 'appointmentDate' | 'completeDate' | 'createdAt'>) {
  const businessDate = [order.actualInstallDate, order.appointmentDate, order.completeDate].find(isDateValue)
  if (businessDate) return businessDate

  const createdAt = new Date(order.createdAt)
  if (Number.isNaN(createdAt.getTime())) return ''
  return `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')}`
}

export function getOrderServiceFee(order: Pick<OrderFinancialSource, 'serviceFee' | 'notes'>) {
  return order.serviceFee ?? getServiceFee(order.notes || '')
}

export function getCompletedOrderFinancials(order: OrderFinancialSource) {
  const customerPrice = order.customerPrice || 0
  const materialCost = order.materialCost || 0
  const geely = isGeelyBrand(order.brandName || '')
  const platformFee = geely ? 0 : order.platformFee || 0
  const serviceFee = geely
    ? getGeelyServiceFee(parseFloat(order.packageMeters || '0'))
    : getOrderServiceFee(order)
  const customerPay = customerPrice + serviceFee
  const actualIncome = customerPay - platformFee
  const actualProfit = order.actualProfit ?? actualIncome - materialCost

  return { customerPrice, materialCost, platformFee, serviceFee, customerPay, actualIncome, actualProfit }
}

export function getServiceFee(orderNotes: string) {
  const notes = orderNotes || ''
  if (notes.includes('维修')) return SERVICE_FEE['维修']
  if (notes.includes('勘察') || notes.includes('勘测')) return SERVICE_FEE['勘察']
  return SERVICE_FEE['安装']
}

export function buildPlatformBrand(platform: string, brandName: string) {
  return `${platform || ''} ${brandName || ''}`.trim()
}

export function buildAddonSummary(customerTotal: number, actualProfit: number) {
  if (customerTotal && actualProfit && customerTotal !== actualProfit) {
    return `客户增项合计 ¥${customerTotal.toFixed(2)}\n实收 ¥${actualProfit.toFixed(2)}`
  }
  return `客户增项合计 ¥${(customerTotal || actualProfit || 0).toFixed(2)}`
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
  const mappedName = getCostMapping(name)
  if (mappedName) {
    const item = costMaterials.find((c) => c.name === mappedName)
    if (item) return item.costPrice ?? 0
  }
  const matchedName = matchCostName(name)
  if (matchedName) {
    const item = costMaterials.find((c) => c.name === matchedName)
    if (item) return item.costPrice ?? 0
  }
  const normalizedName = normalizeCostName(name)
  const fallbackItem = costMaterials.find((item) => {
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

  const settlementFee = geely ? getGeelyServiceFee(packageMeters) : SERVICE_FEE['安装']

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
