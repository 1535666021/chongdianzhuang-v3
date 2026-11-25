text

═══ 文件：src/shared/utils/orderCalc.ts ═══
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
  // P0-239：出差=胶囊开关唯一判定——OrderFinancialSource 无胶囊字段=非出差，platformFee 存值原样取用（原窗口启发式已废）
  const platformFee = geely ? 0 : order.platformFee || 0
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

/** P0-251：勘测电缆行客户收费判定唯一出口（useSurvey/SurveyModal/报告全链同源，禁第二份判定）。
 * 命中口径：① categoryCode==='CABLE'；② 显式免费额度 (freeQuota ?? 0)>0（套包外线缆敷设类，
 * 如 addon_312 freeQuota=30=套餐内含米数，套餐内不得向客户收费）；③ 无 categoryCode 时
 * 去空格兜底 /电缆敷设|线缆敷设/（旧字面空格正则「电缆敷设␣」几乎全灭，已废）；
 * 万帮按米线缆（findWanbangMeteredCable）同口径保留。查无材料行时按名字兜底（含万帮表）。
 */
export function isCableLikeSurveyCharge(
  mat: { name: string; categoryCode?: string; freeQuota?: number } | null | undefined,
  name = '',
): boolean {
  if (mat) {
    if (mat.categoryCode === 'CABLE') return true
    if ((mat.freeQuota ?? 0) > 0) return true
    if (!mat.categoryCode && /电缆敷设|线缆敷设/.test(mat.name.replace(/\s+/g, ''))) return true
    return false
  }
  const n = name.replace(/\s+/g, '')
  return /电缆敷设|线缆敷设/.test(n) || !!findWanbangMeteredCable(name)
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
export interface FullMaterialCostInput {
  brandName?: string
  powerKw?: string
  cableMeters?: number
  /** P0-188-R1：PVC独立米数（默认=电缆米数）与漏保盒数量（默认1），保写入端等价性 */
  pvcMeters?: number
  breakerCount?: number
  extraItems: { name: string; quantity: number }[]
  breakerType?: string
}
export interface FullMaterialCostItem { name: string; quantity: number; unitCost: number; amount: number }
export interface FullMaterialCostResult { total: number; items: FullMaterialCostItem[]; unmatched: string[] }

/** P0-210 G1：卡片/详情同源输入组装唯一出口（照抄 P0-194 useMemo 输入构造，禁两处各写一份）。
 * 存值 survey.cableDistance/materials 经此组装进 calcFullMaterialCost；breakerType 不预传，
 * 由出口内同款回退解析（与详情页行为逐字节等价）。
 */
export function buildFullMaterialCostInput(order: {
  brandName?: string
  powerKw?: string
  survey?: { cableDistance?: number }
  materials?: Array<{ name: string; quantity: number }>
}): FullMaterialCostInput {
  return {
    brandName: order.brandName,
    powerKw: order.powerKw,
    cableMeters: order.survey?.cableDistance ?? 0,
    extraItems: (order.materials || []).filter((m) => !isFreeQuotaMaterial(m.name)).map((m) => ({ name: m.name, quantity: m.quantity })),
  }
}

export function calcFullMaterialCost(input: FullMaterialCostInput): FullMaterialCostResult {
  const items: FullMaterialCostItem[] = []
  const unmatched: string[] = []
  const meterCost = (name: string, quantity: number, forceZero = false) => {
    if (!quantity || quantity <= 0) return
    if (forceZero) { items.push({ name, quantity, unitCost: 0, amount: 0 }); return }
    const unitCost = findCostPrice(name)
    if (unitCost === null) { unmatched.push(name); items.push({ name, quantity, unitCost: 0, amount: 0 }); return }
    items.push({ name, quantity, unitCost, amount: round2(unitCost * quantity) })
  }
  // 电缆/PVC 全量计价（§5.1）
  meterCost('电缆', input.cableMeters || 0)
  meterCost('PVC', input.pvcMeters ?? input.cableMeters ?? 0)
  // 漏保盒每单必含（§1.6，不参与矩阵；默认1个）
  meterCost('漏保盒', input.breakerCount ?? 1)
  // P0-248：漏保矩阵废除——漏保器每单必计成本（漏保盒仍每单必含，二者互不替代）
  {
    let breakerName = input.breakerType || ''
    if (!breakerName) {
      const fb = resolveCostMaterials().find((c) => /漏保|漏电保护/.test(c.name) && !/盒/.test(c.name))
      breakerName = fb?.name || ''
    }
    if (breakerName) meterCost(breakerName, 1)
    // P0-239（P0-238 待裁#1）：兜底命名落空=漏保成本静默 0，入 unmatched 橙警（静默 0 禁止）
    else unmatched.push('漏保器（未绑定成本名）')
  }
  // 增项 Σ数量×成本价
  // P0-202-R2（§1.6 P0-202-R2 增补）：extraItems 手加漏保行一律由矩阵接管，禁叠加——
  // isBreakerMaterial 行无条件 skip（需自配单的 1 支由上方 needBreakerCost 矩阵行独供，
  // 免配单 0 支），杜绝需自配单手加行与矩阵行双计
  for (const m of input.extraItems) {
    if (isBreakerMaterial(m.name)) continue
    meterCost(m.name, m.quantity)
  }
  return { total: round2(items.reduce((s, x) => s + x.amount, 0)), items, unmatched }
}

/** 收入侧同源出口（P0-188-R1）：勘测单=勘测费50/勘察单=勘察费50/维修单=维修费60/
 * 常规安装单=套餐分档（20米200/30米300）。与完工核算 getServiceFee 同表同值零分叉。
 */
export function calcOrderServiceFee(order: { notes?: string; packageMeters?: number }): number {
  return getServiceFee(order.notes || '', order.packageMeters ?? DEFAULT_PACKAGE_METERS)
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

  // P0-188-R1：本地costItems改调统一出口calcFullMaterialCost（漏保器矩阵随之补全，数值变化属口径修正）
  const materialCost = calcFullMaterialCost({
    brandName: brand,
    cableMeters: actualMeters,
    extraItems: nonCable.map((m) => ({ name: m.name, quantity: m.quantity })),
  }).total

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
  if (order.createdAt) {
    // P0-186：createdAt回退改本地时区（禁用UTC toISOString，北京时间20:00后跨日偏差一天；参照todayLocal先例）
    const d = new Date(order.createdAt)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  return ''
}

/** 扣点统一读值（abs归一，兼容存量符号分裂） */
export function absPlatformFee(order: { platformFee?: number }): number {
  return Math.abs(order.platformFee || 0)
}

/** 出差判定（R3双规则 + R7人工开关优先） */
export function isBusinessTripOrder(order: { isBusinessTrip?: boolean }): boolean {
  // P0-239 甲方裁定（最高优先）：出不出差唯一判断=订单胶囊字段——true 才出差，false/undefined 一律不出差；
  // 原日期窗（POLICY_FIX_TRIP_START/END）与扣点启发式（absPlatformFee===0）两条兜底全废
  return order.isBusinessTrip === true
}

/** 出差补助：30/台，普通单0 */
export function calcTripSubsidy(isTrip: boolean): number {
  return isTrip ? TRIP_SUBSIDY_PER_UNIT : 0
}

/** 普通单扣点：返回负数（-应收×10%，20%作废，负号约定） */
export function calcPolicyPlatformFee(receivable: number): number {
  return -round2(receivable * PLATFORM_FEE_RATE)
}

/** P0-210 G2：功率数值归一——提取首个数值与五菱 3.5 数值等值比较（'3.5kW'/'3.5KW'/' 3.5 '同命中）；提取不到数值→不命中 */
function isWuling35Power(powerKw: string | undefined): boolean {
  const m = String(powerKw || '').match(/\d+(?:\.\d+)?/)
  return m !== null && Number(m[0]) === Number(BREAKER_EXCLUDE_WULING_POWER)
}

/** 漏保矩阵（仅漏保器）：领克全不含 / 五菱3.5kW不含 / 其余含 */
/** P0-197-R1 新增：漏保成本矩阵新语义——含=出厂自带免配0成本；不含=出厂未配需自购计成本。
 * true=需自购（领克全系/五菱3.5kW）；false=免配（五菱7kW/其余品牌/吉利厂家提供）。
 * 漏保盒每单必含永远计成本，不参与本判定。旧 shouldIncludeBreaker 保留（调用点已迁移）。
 */
export function needBreakerCost(brandName: string, powerKw: string | undefined): boolean {
  const b = brandName || ''
  if (isGeelyBrand(b)) return false // 吉利厂家提供=0成本
  if (BREAKER_EXCLUDE_BRANDS.some((k) => b.includes(k))) return true // 领克全系不含→需自购
  if (b.includes('五菱') && isWuling35Power(powerKw)) return true // P0-210 G2：功率数值归一命中=五菱3.5kW不含→需自购
  return false // 五菱7kW/其余品牌 出厂自带→免配
}

export function shouldIncludeBreaker(brandName: string, powerKw: string | undefined): boolean {
  const b = brandName || ''
  if (BREAKER_EXCLUDE_BRANDS.some((k) => b.includes(k))) return false
  if (b.includes('五菱') && isWuling35Power(powerKw)) return false // P0-210 G2：同口径数值归一
  return true
}

/**
 * P0-210 G3：漏保器成本价同款回退唯一出口（P0-197-R1 breakerUnitCost 提升归并，消除重复实现）——
 * breakerType 有成本价取之；否则成本表首个漏保器（非盒）成本价；再无→0。
 * 供存量纠偏自检与回填器共用；calcFullMaterialCost 本体语义不动。
 */
export function resolveBreakerUnitCost(order: Order): number {
  const named = findCostPrice((order as { fixedAux?: { breakerType?: string } }).fixedAux?.breakerType || '')
  if (named !== null) return named
  const fb = resolveCostMaterials().find((c) => /漏保|漏电保护/.test(c.name) && !/盒/.test(c.name))
  return fb ? (fb.costPrice ?? 0) : 0
}

/** P0-210 G3：漏保器行名称同款回退（与 calcFullMaterialCost 矩阵行同链：breakerType→成本表首个漏保器名） */
export function resolveBreakerRowName(order: Order): string {
  const bt = (order as { fixedAux?: { breakerType?: string } }).fixedAux?.breakerType
  if (bt) return bt
  return resolveCostMaterials().find((c) => /漏保|漏电保护/.test(c.name) && !/盒/.test(c.name))?.name || ''
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
 * 对账利润（只算安装费维度，P0-187甲方锁定口径）
 * 出差单 = 安装费 + 每台补助30（零扣点）
 * 不出差单 = 安装费 − 扣点（扣点=客户付款×10%，从安装费里扣），无补助
 * 客户增项系私下现金收款，不进对账；两分支均不减材料不减工资。
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
  // P0-239：补助实时判定——唯一真相=胶囊字段，出口零存值兜底（原 order.tripSubsidy 存值直吃废止）
  const subsidy = calcTripSubsidy(order.isBusinessTrip === true)
  if (order.isBusinessTrip === true) return round2(serviceFee + subsidy)
  // P0-187：不出差单只算安装费维度——安装费−扣点；补助恒为0故不带入，customerPrice（客户增项现金）不进对账
  return round2(serviceFee - absPlatformFee(order))
}

/**
 * 实际利润 = 付费 − |扣点| + 安装费 + 出差补助 − 材料成本 − 工资（自己记账，全部真实收支）
 * P0-187：口径不变。与对账口径差异——实际利润含客户增项现金（真实收支全记），
 * 对账利润只算安装费维度（出差=安装费+补助；不出差=安装费−扣点），不含客户增项现金。
 */
export function calcActualProfitByPolicy(order: {
  customerPrice?: number
  materialCost?: number
  laborCost?: number
  platformFee?: number
  serviceFee?: number
  tripSubsidy?: number
  notes?: string
  isBusinessTrip?: boolean
}): number {
  const serviceFee = order.serviceFee ?? getServiceFee(order.notes || '')
  // P0-239：补助实时判定——唯一真相=胶囊字段（true 才 30），order.tripSubsidy 存值参数保留签名（写入侧留痕）但出口不再消费
  const subsidy = calcTripSubsidy(order.isBusinessTrip === true)
  return round2((order.customerPrice || 0) - absPlatformFee(order) + serviceFee + subsidy - (order.materialCost || 0) - (order.laborCost || 0))
}


═══ 文件：src/features/order/hooks/useCompletion.ts ═══
import { useState, useMemo, useCallback } from 'react'
import { JD_ADDON_PRICES } from '@/constants/addonPrice_jd'
import { isDaomeiOrder } from '@/shared/utils/company'
import { usePackageMeters } from './usePackageMeters'
import { getOrderPlatformFee, resolveOrderPackageMeters, calcInstallFee, isGeelyBrand, calcOverFee, calcPlatformFee, isFreeQuotaMaterial, isBreakerMaterial, calcMaterialCost, calcActualProfitByPolicy, calcReconciliationProfit, calcTripSubsidy, isBusinessTripOrder, findCostPrice, resolveCostPrice, calcFullMaterialCost, resolveBreakerUnitCost } from '@/shared/utils/orderCalc'
import { useOrderStore } from '@/stores/orderStore'
import { detectMeterMismatch, METER_ZERO_OVERRIDE_LOG_KEY } from '@/shared/dataFix/meterMismatchFix'
import { useSettingsStore } from '@/stores/settingsStore'
import { getAllAddonMaterials } from '@/shared/utils/addonMaterialsResolver'
import { getAllCostMaterials } from '@/shared/utils/costMaterialsResolver'
import { adjustStock, previewShortfall } from '@/shared/utils/stockCalc'
import { WANBANG_GEELY_ADDON_PRICES, isWanbangGeelyOrder } from '@/constants/addonPrice_wanbang_geely'
import { isZhidaWulingOrder } from '@/constants/addonPrice_zhida_wuling'
import { updateMaterialFrequency } from '@/features/material/hooks/useMaterialFrequency'
import { BRAND_DEFAULTS, DEFAULT_GEELY_POWER_KW } from '@/constants/brands'
import { PLATFORM_FEE_RATE } from '@/constants/policy'
import { todayLocal } from '@/constants/availableWindow'
import type { Order } from '@/types'
import type { MaterialInput, FixedAuxInput, ProfitBreakdownItem, ProfitPreview, CompletionFormData } from '../types/completion'

function findCostMaterial(name: string) {
  return getAllCostMaterials().find((m) => m.name === name)
}

/** P0-130：同名按品牌——候选=精确名匹配集，优先命中订单品牌组（万帮吉利/挚达五菱/品牌名口径，与useSurvey customTarget一致）；无同组命中回退首个 */
function findAddonMaterial(name: string, brand?: string) {
  const matches = getAllAddonMaterials().filter((m) => m.name === name)
  if (matches.length <= 1 || !brand) return matches[0]
  const target = isWanbangGeelyOrder(brand) ? '万帮吉利' : isZhidaWulingOrder(brand) ? '挚达/五菱' : brand
  return matches.find((m) => m.brand === target) ?? matches[0]
}

function inferBreakerType(order: Order | undefined): FixedAuxInput['breakerType'] {
  if (!order) return ''
  const brand = order.brandName || ''
  // P0-112：吉利系功率为空→默认7kW（常量brands.ts，判定复用isWanbangGeelyOrder）；有真实功率一律不动
  const power = (order.powerKw || (isWanbangGeelyOrder(order.brandName, order.platformName || order.platform, order.rawText) ? DEFAULT_GEELY_POWER_KW : '')).toString()
  for (const [key, cfg] of Object.entries(BRAND_DEFAULTS)) {
    if (brand.includes(key)) {
      if (cfg.powerBreakers) {
        for (const [p, bt] of Object.entries(cfg.powerBreakers)) {
          if (power.includes(p)) return bt as FixedAuxInput['breakerType']
        }
      }
      if (cfg.breakerType) return cfg.breakerType as FixedAuxInput['breakerType']
    }
  }
  const num = parseFloat(power)
  if (num === 3.5) return 'C25'
  if (num === 7) return 'C40'
  return ''
}

interface BreakdownCtx {
  materials: MaterialInput[]
  fixedAux: FixedAuxInput
  packageMeters: number
  cableCustomerPrice: number
  cableCostPrice: number
  pvcCostPrice: number
  breakerBoxPrice: number
  breakerTypeCost: number
  breakerFreeByMatrix: boolean
  cableReceivable: number
  cableCost: number
  pvcCost: number
  cableMatName?: string
}

function buildReceivableItems(ctx: BreakdownCtx): { name: string; calc: string; amount: number }[] {
  const items: { name: string; calc: string; amount: number }[] = []
  if (ctx.cableReceivable > 0) {
    const overMeters = Math.max(0, ctx.fixedAux.cableMeters - ctx.packageMeters)
    items.push({
      name: ctx.cableMatName || '电缆',
      calc: `${ctx.cableMatName || '电缆'} 超${overMeters}米 × ¥${ctx.cableCustomerPrice}/米`,
      amount: ctx.cableReceivable,
    })
  }
  for (const m of ctx.materials) {
    if (isFreeQuotaMaterial(m.name)) continue
    if (m.customerSubtotal > 0) {
      items.push({ name: m.name, calc: `${m.name} ${m.quantity}${m.unit} × ¥${m.settlementPrice}`, amount: m.customerSubtotal })
    }
  }
  return items
}

function buildMaterialItems(ctx: BreakdownCtx): ProfitBreakdownItem[] {
  const { fixedAux: f, packageMeters: pm } = ctx
  const items: ProfitBreakdownItem[] = []
  // P0-109：成本侧文案同步——实际米数全额计价，不再显示套餐内免费
  const fmtCost = (label: string, meters: number, price: number) => `${label} ${meters}米 × ¥${price}/米`
  if (f.cableMeters > 0) items.push({ name: '电缆', calc: fmtCost('电缆', f.cableMeters, ctx.cableCostPrice), amount: ctx.cableCost })
  if (f.pvcMeters > 0) items.push({ name: 'PVC', calc: fmtCost('PVC', f.pvcMeters, ctx.pvcCostPrice), amount: ctx.pvcCost })
  items.push({ name: '漏保盒', calc: `漏保盒 ${f.breakerCount}个 × ¥${ctx.breakerBoxPrice}`, amount: f.breakerCount * ctx.breakerBoxPrice })
  if (f.breakerType) {
    items.push({ name: '漏保', calc: ctx.breakerFreeByMatrix ? `漏保 ${f.breakerType} 1个（厂家提供）` : `漏保 ${f.breakerType} 1个 × ¥${ctx.breakerTypeCost}`, amount: ctx.breakerTypeCost })
  }
  for (const m of ctx.materials) {
    if (isFreeQuotaMaterial(m.name)) continue
    // P0-248/P0-202：手加漏保行由固定漏保行统一展示，禁双计
    if (isBreakerMaterial(m.name)) continue
    const unitCost = resolveCostPrice(m.name)
    const amount = Math.round(unitCost * m.quantity * 100) / 100
    if (amount > 0) {
      items.push({ name: m.name, calc: `${m.name} ${m.quantity}${m.unit} × ¥${unitCost}`, amount, materialName: m.name })
    }
  }
  return items
}

function initFormMaterials(order: Order | undefined): MaterialInput[] {
  const src = order?.materials?.length ? order.materials : order?.survey?.estimatedMaterials || []
  return src.map((m) => {
    const addon = findAddonMaterial(m.name, order?.brandName)
    // P0-130：订单快照价优先——已存单价一律不动；表价仅用于订单无价(0/空)的新行
    const sp = m.unitPrice > 0 ? m.unitPrice : (addon?.settlementPrice ?? 0)
    const cp = findCostPrice(m.name) ?? addon?.costPrice ?? m.unitPrice ?? 0
    return {
      id: Math.random().toString(36).slice(2),
      name: m.name, spec: m.spec, quantity: m.quantity,
      unit: m.unit || addon?.unit || '个',
      settlementPrice: sp, costPrice: cp,
      customerSubtotal: sp * m.quantity, costSubtotal: cp * m.quantity,
    }
  })
}

function buildSettlementBase(form: CompletionFormData, profit: ProfitPreview, savedMaterials: { name: string; spec?: string; quantity: number; unit: string; unitPrice: number }[], order?: Order) {
  return {
    actualInstallDate: form.actualInstallDate,
    installer: form.installer,
    materials: savedMaterials,
    materialCost: profit.materialCost,
    laborCost: profit.laborCost,
    platformFee: profit.platformFee,
    actualProfit: profit.actualProfit,
    customerPrice: profit.customerReceivable,
    serviceFee: profit.serviceFee,
    // P0-181：手改特批覆盖留痕（输入框override非空时置真）
    isServiceFeeOverridden: form.serviceFeeOverride !== undefined && String(form.serviceFeeOverride).trim() !== '',
    tripSubsidy: profit.tripSubsidy,
    // P0-177-R2：写回字段组与 orderCalc 出口逐字段同源——对账利润同步落库
    reconciliationProfit: calcReconciliationProfit({
      customerPrice: profit.customerReceivable,
      platformFee: profit.platformFee,
      serviceFee: profit.serviceFee,
      tripSubsidy: profit.tripSubsidy,
      isBusinessTrip: order?.isBusinessTrip,
      notes: form.notes,
    }),
    completionCableMeters: form.fixedAux.cableMeters,
    completionPvcMeters: form.fixedAux.pvcMeters,
    completionBreakerType: form.fixedAux.breakerType,
  }
}

export function useCompletion(orderId: string) {
  const order = useOrderStore((s) => s.orders.find((o) => o.id === orderId))
  const completeOrder = useOrderStore((s) => s.completeOrder)
  const updateOrderStore = useOrderStore((s) => s.updateOrder)
  const recordMaterialUsage = useSettingsStore((s) => s.recordMaterialUsage)

  // P0-104-D：已完成单进入编辑态（不改动状态/完成时间，仅改结算数据）
  const isEditMode = order?.status === '已完成'

  const [packageMeters, setPackageMeters] = useState(() => resolveOrderPackageMeters(order ?? {}))

  const [form, setForm] = useState<CompletionFormData>({
    completeDate: todayLocal(), // P0-228：本地时区预填（不落库但经 useScript 进话术默认值，同偏差一并修）
    // P0-179：预填=已存值 || 当前日期（删 appointmentDate 兜底——预约在12月但10月干活
    // 会把预填固化成12月错值；todayLocal 为本地时区口径，禁 UTC toISOString 跨日偏差）
    actualInstallDate: order?.actualInstallDate || todayLocal(),
    installer: order?.installer || '',
    materials: initFormMaterials(order),
    fixedAux: {
      cableMeters: order?.completionCableMeters ?? (order?.survey?.cableDistance || 0),
      pvcMeters: order?.completionPvcMeters ?? (order?.survey?.cableDistance || 0),
      breakerCount: 1,
      breakerType: (order?.completionBreakerType as FixedAuxInput['breakerType']) || inferBreakerType(order),
    },
    laborCost: order?.laborCost || 0,
    notes: order?.completionNotes || order?.surveyNote || order?.survey?.locationInfo || order?.notes || '',
  })

  const updateForm = useCallback((updates: Partial<CompletionFormData>) => {
    setForm((prev) => ({ ...prev, ...updates }))
  }, [])

  // P0-255：添加材料弹窗——当前品牌客户价表条目一次全进单；客户价进 settlementPrice/customerSubtotal，
  // 成本另走既有成本绑定解析（findCostPrice），与本弹窗解耦（行结构同 addMaterial 既有口径）
  const addMaterials = useCallback((list: { name: string; unit: string; quantity: number; settlementPrice: number }[]) => {
    if (!list.length) return
    setForm((prev) => ({
      ...prev,
      materials: [
        ...prev.materials,
        ...list.map((it) => {
          const sp = it.settlementPrice || 0
          const cp = findCostPrice(it.name) ?? 0
          const qty = it.quantity || 0
          return {
            id: Math.random().toString(36).slice(2),
            name: it.name, spec: '', quantity: qty, unit: it.unit,
            settlementPrice: sp, costPrice: cp,
            customerSubtotal: Math.round(sp * qty * 100) / 100,
            costSubtotal: Math.round(cp * qty * 100) / 100,
          }
        }),
      ],
    }))
  }, [])

  const addMaterial = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      materials: [...prev.materials, {
        id: Math.random().toString(36).slice(2), name: '', spec: '', quantity: 1, unit: '个',
        settlementPrice: 0, costPrice: 0, customerSubtotal: 0, costSubtotal: 0,
      }],
    }))
  }, [])

  const updateMaterial = useCallback((index: number, updates: Partial<MaterialInput>) => {
    setForm((prev) => {
      const next = [...prev.materials]
      next[index] = { ...next[index], ...updates }
      const sp = next[index].settlementPrice || 0
      const cp = next[index].costPrice || 0
      const qty = next[index].quantity || 0
      next[index].customerSubtotal = Math.round(sp * qty * 100) / 100
      next[index].costSubtotal = Math.round(cp * qty * 100) / 100
      return { ...prev, materials: next }
    })
  }, [])

  const removeMaterial = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index),
    }))
  }, [])

  const updateFixedAux = useCallback((updates: Partial<FixedAuxInput>) => {
    setForm((prev) => ({
      ...prev,
      fixedAux: { ...prev.fixedAux, ...updates },
    }))
  }, [])

  // P0-220：京东（到美）单判定优先，增项候选走京东价表；到美单禁用万帮/挚达模板
  const isDaomei = isDaomeiOrder(order || {})
  const canApplyWanbangTemplate = !isDaomei && isWanbangGeelyOrder(order?.brandName, order?.platformName || order?.platform, order?.rawText)
  // P0-113：挚达/五菱单（与万帮判定互斥），增项候选走挚达价表
  const isZhidaWuling = !isDaomei && isZhidaWulingOrder(order?.brandName, order?.platformName || order?.platform, order?.rawText)
  // P0-220：到美完成页京东增项模板（价表暂空则隐藏按钮，R2 补录后自动出现）
  const canApplyJdTemplate = isDaomei && JD_ADDON_PRICES.length > 0
  const applyJdAddonTemplate = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      materials: JD_ADDON_PRICES.map((item: import('@/constants/addonPrice_wanbang_geely').AddonPriceItem) => ({
        id: item.id, name: item.name, spec: item.spec, quantity: 0, unit: item.unit,
        settlementPrice: item.customerPrice, costPrice: findCostPrice(item.name) ?? 0,
        customerSubtotal: 0, costSubtotal: 0,
      })),
    }))
  }, [])

  const applyWanbangAddonTemplate = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      materials: WANBANG_GEELY_ADDON_PRICES.map((item) => ({
        id: item.id, name: item.name, spec: item.spec, quantity: 0, unit: item.unit,
        settlementPrice: item.customerPrice, costPrice: findCostPrice(item.name) ?? 0,
        customerSubtotal: 0, costSubtotal: 0,
      })),
    }))
  }, [])

  const [bindVersion, setBindVersion] = useState(0)
  const [dismissedMats, setDismissedMats] = useState<Set<string>>(new Set())

  const packageBreakdown = usePackageMeters(form.materials, packageMeters)

  const profit = useMemo<ProfitPreview>(() => {
    // P0-104-A：电缆/线缆类材料走超米口径（calcOverFee 单点），套餐内¥0
    // 从增项材料中定位电缆条目，取客户单价；若未选中则从增项价目表兜底取价
    const cableMat = form.materials.find((m) => isFreeQuotaMaterial(m.name) && !m.name.includes('PVC'))
    const cableCustomerPrice = cableMat?.settlementPrice
      ?? findAddonMaterial(cableMat?.name || '', order?.brandName)?.settlementPrice
      ?? 0

    const { overFee: cableReceivable } = calcOverFee(form.fixedAux.cableMeters, packageMeters, cableCustomerPrice)

    const cable = findCostMaterial('电缆')
    const pvc = findCostMaterial('PVC')
    const breaker = findCostMaterial('漏保盒')
    const cableCostPrice = cable?.costPrice || 17.9
    const pvcCostPrice = pvc?.costPrice || 1
    // P0-248：漏保矩阵废除——漏保器每单必计；免配 0 支与「（厂家提供）」文案同步废除
    const breakerFreeByMatrix = false
    const breakerTypeCost = order ? resolveBreakerUnitCost(order) : 0

    // 增项应收：跳过电缆/线缆（已由固定辅材超米口径统一计算），其余按明细
    let addonReceivable = 0
    for (const m of form.materials) {
      if (isFreeQuotaMaterial(m.name)) continue
      addonReceivable += m.customerSubtotal
    }
    const customerReceivable = addonReceivable + cableReceivable

    // 增项材料成本：排除电缆/PVC/漏保（由统一出口按矩阵计入），吉利单漏保成本归零
    // P0-202（§1.6 增补裁定1）：手加漏保行统一由 calcFullMaterialCost 出口按 needBreakerCost 拦截，此处只滤免费配额材料
    const chargeableMaterials = form.materials.filter((m) => !isFreeQuotaMaterial(m.name))
    // P0-188-R1：手工ctx成本构造改调统一出口 calcFullMaterialCost（§5.1 凡使用即有成本；
    // 等价性=甲方成本绑定表值与既有硬编码口径一致（监理已核）；漏保器矩阵随之补全）
    // P0-188-R1：展示项电缆/PVC金额同步取出口值（消除展示与计算两皮）
    const fullCostResult = calcFullMaterialCost({
      brandName: order?.brandName,
      powerKw: order?.powerKw,
      cableMeters: form.fixedAux.cableMeters,
      pvcMeters: form.fixedAux.pvcMeters,
      breakerCount: form.fixedAux.breakerCount,
      extraItems: chargeableMaterials.map((m) => ({ name: m.name, quantity: m.quantity })),
      breakerType: form.fixedAux.breakerType,
    })
    const materialCost = fullCostResult.total
    const cableCost = fullCostResult.items.find((i) => i.name === '电缆')?.amount ?? 0
    const pvcCost = fullCostResult.items.find((i) => i.name === 'PVC')?.amount ?? 0

    // 平台扣点（吉利品牌无扣点）；支持手动覆盖（P0-104-D 编辑项）
    const geelyOrder = isGeelyBrand(order?.brandName || '')
    // P0-177-R3：无平台配置预填统一政策费率10%（禁0.2旧值硬编码）
    const platformRate = geelyOrder ? 0 : PLATFORM_FEE_RATE // P0-204：费率唯一来源=PLATFORM_FEE_RATE（旧按平台取率+0.2兜底废止）
    // P0-184①：出差不扣点——auto路径落库0；override手改照存（P0-104-D特批留痕分支不受影响）
    const isTripOrder = order ? isBusinessTripOrder(order) : false
    const autoPlatformFee = isTripOrder
      ? 0
      : order
        ? Math.round(getOrderPlatformFee(order, customerReceivable) * 100) / 100
        : Math.round(calcPlatformFee(customerReceivable, PLATFORM_FEE_RATE) * 100) / 100
    const platformFee = form.platformFeeOverride ?? autoPlatformFee

    // 服务费（吉利品牌按套餐米数计算结算费）；支持手动覆盖
    // P0-181：预填走分档唯一出口（按订单套餐米数，禁用实测米数查档）；手改走override分支不变
    const autoServiceFee = order ? calcInstallFee(resolveOrderPackageMeters(order)) : 300
    const serviceFee = form.serviceFeeOverride ?? autoServiceFee

    // P0-177-R2：写入端走新政策出口（含出差补助分支），与展示端 orderCalc 同源
    const laborCost = form.laborCost || 0
    // P0-239：补助实时同口径——唯一真相=胶囊字段，不再存值优先（幽灵补助 30 根因②修复）
    const tripSubsidy = order ? calcTripSubsidy(order.isBusinessTrip === true) : 0
    const profitAfterLabor = calcActualProfitByPolicy({
      customerPrice: customerReceivable,
      materialCost,
      platformFee,
      serviceFee,
      tripSubsidy,
      laborCost,
    })

    const bctx: BreakdownCtx = {
      materials: form.materials, fixedAux: form.fixedAux, packageMeters,
      cableCustomerPrice, cableCostPrice, pvcCostPrice,
      breakerBoxPrice: breaker?.costPrice || 5, breakerTypeCost, breakerFreeByMatrix,
      cableReceivable, cableCost, pvcCost, cableMatName: cableMat?.name,
    }
    const receivableItems = buildReceivableItems(bctx)
    const materialItems = buildMaterialItems(bctx)

    return {
      customerReceivable: Math.round(customerReceivable * 100) / 100,
      freeAmount: Math.round(packageBreakdown.freeAmount * 100) / 100,
      platformFee,
      materialCost,
      serviceFee,
      laborCost,
      tripSubsidy,
      actualProfit: profitAfterLabor,
      breakdown: {
        receivableItems,
        platformRate,
        serviceFeeLabel: `安装费 = ¥${serviceFee}`, // P0-184⑥：文案统一
        materialItems,
      },
    }
  }, [form, order, packageMeters, packageBreakdown, bindVersion])

  const pendingCostBind = useMemo(() => {
    const chargeable = form.materials.filter((m) => m.name && m.quantity > 0)
    const { unmatched } = calcMaterialCost(chargeable)
    const needsBind = unmatched.filter((n) => !isFreeQuotaMaterial(n) && !dismissedMats.has(n))
    return needsBind[0] || null
  }, [form.materials, bindVersion, dismissedMats])

  const handleCostBound = useCallback(() => {
    setBindVersion((v) => v + 1)
  }, [])

  const handleCostBindClose = useCallback(() => {
    const chargeable = form.materials.filter((m) => m.name && m.quantity > 0)
    const { unmatched } = calcMaterialCost(chargeable)
    const needsBind = unmatched.filter((n) => !isFreeQuotaMaterial(n) && !dismissedMats.has(n))
    const current = needsBind[0]
    if (current) {
      setDismissedMats((prev) => new Set(prev).add(current))
    }
    setBindVersion((v) => v + 1)
  }, [form.materials])

  const save = useCallback(() => {
    // P0-247 件1：米数不一致拦截——按 0 米计成本但勘测有米数 → 双选弹窗
    const surveyMeters = order?.survey?.cableDistance || 0
    if (detectMeterMismatch(form.fixedAux.cableMeters, surveyMeters)) {
      const bringIn = window.confirm(`勘测已记 ${surveyMeters} 米电缆，当前按 0 米计成本。
「确定」=带入重算为 ${surveyMeters} 米（重算后再点一次保存）；「取消」=再选。`)
      if (bringIn) {
        updateForm({ fixedAux: { ...form.fixedAux, cableMeters: surveyMeters, pvcMeters: surveyMeters } })
        return false
      }
      if (!window.confirm(`坚持按 0 米保存本次订单？将写入留痕（键 ${METER_ZERO_OVERRIDE_LOG_KEY}）。`)) return false
      try {
        const log = JSON.parse(localStorage.getItem(METER_ZERO_OVERRIDE_LOG_KEY) || '[]')
        log.push({ orderId, surveyMeters, at: new Date().toISOString() })
        localStorage.setItem(METER_ZERO_OVERRIDE_LOG_KEY, JSON.stringify(log))
      } catch { /* 留痕失败不阻断保存 */ }
    }
    // P0-247 件2：未绑定=弹窗绑定，禁静默保存——pendingCostBind=首个未绑定非免费配额非豁免材料；
    // 弹窗由 OrderComplete 常驻挂载（不做绑定=逐条豁免留痕后转 null 可存，兼容 P0-241 事后处理口径）
    if (pendingCostBind) return false

    if (!order) return false

    const savedMaterials = form.materials.filter((m) => m.name && m.quantity > 0).map((m) => ({
      name: m.name, spec: m.spec, quantity: m.quantity, unit: m.unit, unitPrice: m.settlementPrice,
    }))
    const base = buildSettlementBase(form, profit, savedMaterials, order)

    if (isEditMode) {
      // P0-104-D：编辑态——不改动状态/完成时间，仅更新结算数据，留痕；P0-206-M：已完工单编辑不动库存（不回滚不重减）
      updateOrderStore(orderId, { ...base, completionNotes: form.notes, lastEditedAt: Date.now(), editCount: (order.editCount || 0) + 1 })
    } else {
      // P0-206-M：完工落库（R-11.4①）——calcFullMaterialCost items 逐项经 adjustStock 唯一出口（R-11.11），
      // 输入与 profit memo 同源（免费配额材料已由出口按矩阵计入电缆/PVC行，不重复）；
      // R-11.8 按订单 stockDeducted 防重；删除/取消完工不回滚
      if (!order.stockDeducted) {
        // P0-202（§1.6 增补裁定1）：出口统一拦截手加漏保行（needBreakerCost 唯一判定），此处直传非免费配额材料
        const chargeable = form.materials.filter((m) => !isFreeQuotaMaterial(m.name))
        const costItems = calcFullMaterialCost({
          brandName: order.brandName,
          powerKw: order.powerKw,
          cableMeters: form.fixedAux.cableMeters,
          pvcMeters: form.fixedAux.pvcMeters,
          breakerCount: form.fixedAux.breakerCount,
          extraItems: chargeable.map((m) => ({ name: m.name, quantity: m.quantity })),
          breakerType: form.fixedAux.breakerType,
        }).items
        // R-11.7 缺口确认弹窗：列"名称缺N"，确认才落库
        const gaps = costItems.filter((i) => i.quantity > 0 && previewShortfall(i.name, i.quantity) > 0)
        if (gaps.length > 0) {
          const detail = gaps.map((g) => `${g.name} 缺${previewShortfall(g.name, g.quantity)}`).join('\n')
          if (!window.confirm(`库存不足（缺口仅记录提示，库存扣至0即止）：\n${detail}\n\n确认完工落库？`)) return false
        }
        costItems.forEach((i) => {
          if (i.quantity > 0) adjustStock(i.name, -i.quantity, 'complete', order.id, { reason: `订单完成: ${order.customerName}` })
        })
        updateOrderStore(orderId, { stockDeducted: true })
      }
      completeOrder(orderId, { ...base, notes: form.notes })
      recordMaterialUsage(form.materials.map((m) => m.name))
      updateMaterialFrequency({ ...order, status: '已完成', materials: savedMaterials })
    }
    return true
  }, [order, orderId, form, pendingCostBind, profit, completeOrder, isEditMode, updateOrderStore])

  return {
    order,
    form,
    profit,
    isEditMode,
    packageMeters,
    setPackageMeters,
    packageBreakdown,
    updateForm,
    addMaterial,
    addMaterials,
    updateMaterial,
    removeMaterial,
    updateFixedAux,
    canApplyWanbangTemplate,
    isZhidaWuling,
    applyWanbangAddonTemplate,
    canApplyJdTemplate,
    applyJdAddonTemplate,
    save,
    pendingCostBind,
    handleCostBound,
    handleCostBindClose,
  }
}


═══ 文件：src/constants/releaseNotes.ts ═══
/** P0-217 G5：更新弹窗文案——施工队每次交付将本书"更新说明"追加至文件头部，最多保留30条 */
export const RELEASE_NOTES: string[] = [
  '漏保矩阵取消：每单自动配漏保并计成本，漏保盒仍每单必含', // P0-248
  '导入恢复：私仓拉密文本地解密恢复，导入前自动备份、冲突人工处理不静默覆盖', // P0-253-6
  '私仓上传：今日密文包一键推私仓，base+today 两份滚动维护', // P0-253-5
  '变更监听上线：订单增删改 30 秒防抖自动打包今日加密同步包（队列只留密文）', // P0-253-4
  '设置页本地加解密：JSON 用公钥出 .age/.sha256，私钥本地解密还原', // P0-253-3
  '设置页可手动导出 JSON 同步包：新增修改删除三态按主键去重计数', // P0-253-2
  '批量添加材料改吃当前品牌客户价表，只按客户价收费，按使用频率排序', // P0-255
  '设置页可生成 age 备份密钥：公钥本机保存，私钥只给下载一次', // P0-253-1
  '数据统计支持按「全部」范围查看和导出对账单', // P0-252
  '套包外线缆敷设套餐内含 30 米不另收费，只收超出米数', // P0-251
  '历史订单从原始记录重跑提取干净地址', // P0-250 v2
  '历史缺省市的安庆地址自动补齐层级', // P0-250
  '勘测填米数即同步三账，电缆判定修码短路', // P0-247 v4
  '粘贴群消息自动清干净地址并认出安庆区县', // P0-249
  '保存拦米数不一致与未绑定材料，存量错单自动修正', // P0-247
  '粘贴自动识别方程豹等子品牌，历史错标单可一键归正', // P0-246
  '跟单备注改橙红加粗一眼可见，原始备注保持灰', // P0-245
  '勘测单辅材可按品牌自己加料改价删料，不动官方常量', // P0-244
  '订单卡片可随手记跟单备注，就地编辑只存卡片', // P0-243
  '订单列表区域胶囊行政层级化：省市区乡镇逐级累计计数，点哪级看哪级', // P0-242
  '完工页材料可删可改价，添加材料弹窗批量进单，绑定对账一次清', // P0-241
  '品牌选不到不再卡死：下拉可手动输入品牌，辅材给全部增项兜底', // P0-240
  '出差判定改为唯一看胶囊开关，未点开关不再发补助',
  '修复群公告行首符号导致电话/地址识别错误',
  '利润显示改为实时重算口径',
  '更新通知改顶部横幅，不挡操作',
  '已完成列表卡片显示完工时间',
  '删除新手引导弹窗',
  '增项明细零费自动收口',
  '勘测支持客户自布线（线缆客户自备自敷）',
  '打开秒开，新版自动提醒',
  '完成页可按公司筛选',
  '粘贴自动去重，解析守卫收口，图码一致',
  '群公告不扰单，待补可补全，公司胶囊全量',
  '施工队操作手册与教训录上线',
  '首访加载提速（资源分包）',
  '修复打开卡顿与白屏；新版首页弹窗告诉你每次更新了什么',
]


═══ 文件：src/shared/dataFix/breakerRowSelfCheckFix.ts ═══
/**
 * P0-210 G3：已完成单漏保器行存量纠偏·启动自检（挂 App.tsx 启动序列）
 * 背景：已完成单材料清单是完工时刻快照，漏保矩阵（P0-210 G2 归一化）修好后存量不跟进。
 * 口径：机器纠偏，只纠漏保器行，其余行一律不碰——
 *  ① 矩阵需自购且清单无漏保器行 → 补行（unitPrice 取 resolveBreakerUnitCost 同款回退），materialCost 同步+差额；
 *  ② 矩阵免配且清单有多余漏保器行 → 移除该行，materialCost 同步-差额（行存价缺失时按同款回退价计）；
 *  ③ 差额回写沿用 P0-197-R1 舍入（round2）与备份模式（写前 localStorage 备份受影响单原文，固定前缀+时间戳）；
 *  ④ 幂等：纯比对（need===hasDevice 即跳过），重跑零写入，禁标记滥用；
 *  ⑤ 与 P0-207 repairWanlianFlowOrders 互不干涉。
 */
import { useOrderStore } from '@/stores/orderStore'
import { needBreakerCost, isBreakerDeviceRow, resolveBreakerUnitCost, resolveBreakerRowName } from '@/shared/utils/orderCalc'
import type { Order, OrderMaterialItem } from '@/types'

export const BREAKER_ROW_SELFCHECK_BACKUP_PREFIX = 'cdz_v3_breaker_row_selfcheck_backup'

export interface BreakerRowPlanItem {
  order: Order
  updates: Partial<Order>
  summary: string
}

export interface BreakerRowSelfCheckReport {
  total: number
  fixed: number
  backedUp: boolean
  backupKey: string
  runAt: number
}

/** P0-197-R1 同款舍入 */
const round2 = (n: number): number => Math.round(n * 100) / 100

/** 纯函数 plan（不写库）：已完成单；需自购缺行→补行；免配多行→删行；口径一致→跳过（重跑即空=幂等） */
export function planBreakerRowSelfCheck(orders: Order[]): { items: BreakerRowPlanItem[] } {
  // P0-248：漏保矩阵废除；已完成单按完工时刻快照冻结，启动自检不再补/删漏保器行（老单零变化铁律）
  void orders
  return { items: [] }
  const items: BreakerRowPlanItem[] = []
  for (const order of orders) {
    if (order.status !== '已完成') continue
    const need = needBreakerCost(order.brandName || '', order.powerKw)
    const materials = order.materials || []
    const deviceRows = materials.filter((m) => isBreakerDeviceRow(m.name))
    const hasDevice = deviceRows.length > 0
    if (need === hasDevice) continue // 幂等：口径一致跳过，零写入
    if (need && !hasDevice) {
      const unit = round2(resolveBreakerUnitCost(order))
      const name = resolveBreakerRowName(order)
      if (!name) continue // 安全兜底：无可用漏保器名称不补（正常不会发生）
      const row: OrderMaterialItem = { name, quantity: 1, unit: '个', unitPrice: unit }
      items.push({
        order,
        updates: { materials: [...materials, row], materialCost: round2((order.materialCost ?? 0) + unit) },
        summary: `需自购缺漏保行 → 补行「${name}×1」+${unit}（${order.brandName} ${order.powerKw || ''}）`,
      })
    } else if (!need && hasDevice) {
      const sub = round2(
        deviceRows.reduce((s, m) => s + (typeof m.unitPrice === 'number' ? m.unitPrice : resolveBreakerUnitCost(order)) * (m.quantity || 1), 0)
      )
      items.push({
        order,
        updates: { materials: materials.filter((m) => !isBreakerDeviceRow(m.name)), materialCost: round2((order.materialCost ?? 0) - sub) },
        summary: `免配多余漏保行 → 移除 ${deviceRows.length} 行 -${sub}（${order.brandName} ${order.powerKw || ''}）`,
      })
    }
  }
  return { items }
}

/** 备份键：P0-197-R1 同款模式（固定前缀+YYYYMMDD_HHmmss） */
function buildBackupKey(ts: number): string {
  const d = new Date(ts)
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`
  return `${BREAKER_ROW_SELFCHECK_BACKUP_PREFIX}_${stamp}`
}

/** 执行自检：零命中零写入直返；有命中→写前备份受影响单原文→逐单写入→console 报告 */
export function runBreakerRowSelfCheck(): BreakerRowSelfCheckReport {
  const runAt = Date.now()
  const orders = useOrderStore.getState().orders
  const { items } = planBreakerRowSelfCheck(orders)
  if (items.length === 0) {
    console.log('[漏保行自检] 全部单口径一致，零写入')
    return { total: 0, fixed: 0, backedUp: false, backupKey: '', runAt }
  }
  const backupKey = buildBackupKey(runAt)
  localStorage.setItem(backupKey, JSON.stringify(items.map((it) => it.order))) // 写前备份受影响单（P0-197-R1 同款）
  // P0-217 G1d：逐单写回改批量——一次全量序列化（写前备份语义与幂等纯比对不变，结果行为零变化）
  let fixed = 0
  try {
    const allOrders = useOrderStore.getState().orders
    const patch = new Map(items.map((it) => [it.order.id, it.updates as Partial<Order>]))
    useOrderStore.getState().setOrders(allOrders.map((o) => (patch.has(o.id) ? { ...o, ...patch.get(o.id)! } : o)))
    fixed = items.length
    items.forEach((it) => console.log('[漏保行自检]', it.summary))
  } catch (error) {
    console.warn('[漏保行自检] 批量写回失败', error)
  }
  console.log(`[漏保行自检] 完成：命中 ${items.length}，写入 ${fixed}，备份键 ${backupKey}`)
  return { total: items.length, fixed, backedUp: true, backupKey, runAt }
}


═══ 证据 ═══
- 基线 HEAD：ae585a5a763862036099c6cd1f012941fceddf7c
- 构建：npm run build 通过；[BUILD CHECK] 前置/后置检查通过
- 断言：P0-248_ASSERT_OK（吉利/领克/五菱3.5 原免配均计漏保 C40=26.8；漏保盒=5；手加漏保行不双计）
- 冻结：runBreakerRowSelfCheck 已完成单零写入
- 令牌：两段式注入仅用于 API 推送；未落明文/未入记忆
text
## 部署结果（核验窗 11-26 06:21）
- 部署执行：核验窗（RULES L70-72）；deploy 手动触发制
- 部署 run：45712554250 @c512249 success（手动 dispatch）
- 回拉核验：线上 version.json=c512249 与 HEAD 全同；notes 头条=本单漏保必计说明
- 结论：P0-248 核验通过+部署成功，销号成立
