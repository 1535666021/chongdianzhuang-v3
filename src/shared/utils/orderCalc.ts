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

/** P0-204：费率唯一来源=PLATFORM_FEE_RATE（平台差异化费率与0.2默认兜底已废止）；吉利=0 保留 */
export function getOrderPlatformFee(
  order: Order,
  customerReceivable: number
): number {
  if (isGeelyBrand(order.brandName || '')) return 0
  return calcPlatformFee(customerReceivable, PLATFORM_FEE_RATE)
}

export interface OverFeeResult {
  overMeters: number
  overPrice: number
  overFee: number
}

/** 套餐分解（P0-186：写入端唯一出口，R-0.1计算集中化）
 * freeQty=min(qty,套餐米数)；overQty=max(0,qty−套餐米数)；customerAmount=overQty×结算价（计费同源）。
 */
export function calcPackageSplit(qty: number, packageMeters: number, settlementPrice: number) {
  const freeQty = Math.min(qty, packageMeters)
  const overQty = Math.max(0, qty - packageMeters)
  return { freeQty, overQty, customerAmount: overQty * settlementPrice }
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

/** 材料成本统一出口（P0-188-R1，RULES §5.1）：凡实际使用即有成本，超不超米都算。
 * 构成=电缆全量+PVC全量+漏保盒1+漏保器按§1.6矩阵（不含/吉利厂家提供=0）+增项Σ数量×成本价。
 * 成本价唯一来源=成本绑定表 findCostPrice（R-5.2），禁售价充成本。
 */