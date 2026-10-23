import { useState, useMemo, useCallback } from 'react'
import { usePackageMeters } from './usePackageMeters'
import { getOrderPlatformFee, resolveOrderPackageMeters, calcInstallFee, isGeelyBrand, calcOverFee, calcPlatformFee, isFreeQuotaMaterial, isBreakerMaterial, calcMaterialCost, calcActualProfitByPolicy, calcReconciliationProfit, calcTripSubsidy, isBusinessTripOrder, findCostPrice, resolveCostPrice, calcFullMaterialCost, needBreakerCost, resolveBreakerUnitCost } from '@/shared/utils/orderCalc'
import { useOrderStore } from '@/stores/orderStore'
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
    const breakerFree = ctx.breakerFreeByMatrix && isBreakerMaterial(m.name)
    const unitCost = breakerFree ? 0 : resolveCostPrice(m.name)
    const amount = Math.round(unitCost * m.quantity * 100) / 100
    if (amount > 0 || breakerFree) {
      items.push({ name: m.name, calc: breakerFree ? `${m.name} ${m.quantity}${m.unit}（厂家提供）` : `${m.name} ${m.quantity}${m.unit} × ¥${unitCost}`, amount, materialName: m.name })
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
    completeDate: new Date().toISOString().slice(0, 10),
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

  const canApplyWanbangTemplate = isWanbangGeelyOrder(order?.brandName, order?.platformName || order?.platform, order?.rawText)
  // P0-113：挚达/五菱单（与万帮判定互斥），增项候选走挚达价表
  const isZhidaWuling = isZhidaWulingOrder(order?.brandName, order?.platformName || order?.platform, order?.rawText)

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
    // P0-213：漏保免配判定归并唯一出口 needBreakerCost（矩阵：吉利厂家提供/五菱7kW免配/其余含漏保单需自购；禁重写）
    const breakerFreeByMatrix = !needBreakerCost(order?.brandName || '', order?.powerKw || '')
    const breakerTypeCost = breakerFreeByMatrix ? 0 : (order ? resolveBreakerUnitCost(order) : 0)

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
    const tripSubsidy = order ? (order.tripSubsidy ?? calcTripSubsidy(isBusinessTripOrder(order))) : 0
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
  }, [order, orderId, form, profit, completeOrder, isEditMode, updateOrderStore])

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
    updateMaterial,
    removeMaterial,
    updateFixedAux,
    canApplyWanbangTemplate,
    isZhidaWuling,
    applyWanbangAddonTemplate,
    save,
    pendingCostBind,
    handleCostBound,
    handleCostBindClose,
  }
}
