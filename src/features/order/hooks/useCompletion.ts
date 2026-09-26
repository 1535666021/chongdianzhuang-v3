import { useState, useMemo, useCallback } from 'react'
import { usePackageMeters } from './usePackageMeters'
import { getSettlementFee, getOrderPlatformFee, resolveOrderPackageMeters, isGeelyBrand, calcOverFee, calcPlatformFee, isFreeQuotaMaterial, isBreakerMaterial, calcMaterialCost, calcProfit, findCostPrice, resolveCostPrice } from '@/shared/utils/orderCalc'
import { useOrderStore } from '@/stores/orderStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useInventoryStore } from '@/stores/inventoryStore'
import { getAllAddonMaterials } from '@/shared/utils/addonMaterialsResolver'
import { getAllCostMaterials } from '@/shared/utils/costMaterialsResolver'
import { WANBANG_GEELY_ADDON_PRICES, isWanbangGeelyOrder } from '@/constants/addonPrice_wanbang_geely'
import { isZhidaWulingOrder } from '@/constants/addonPrice_zhida_wuling'
import { updateMaterialFrequency } from '@/features/material/hooks/useMaterialFrequency'
import { BRAND_DEFAULTS, BREAKER_NAMES, DEFAULT_GEELY_POWER_KW } from '@/constants/brands'
import type { Order } from '@/types'
import type { MaterialInput, FixedAuxInput, ProfitBreakdownItem, ProfitPreview, CompletionFormData } from '../types/completion'

function findAddonMaterial(name: string) {
  return getAllAddonMaterials().find((m) => m.name === name)
}

function findCostMaterial(name: string) {
  return getAllCostMaterials().find((m) => m.name === name)
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
  geelyBreakerFree: boolean
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
    items.push({ name: '漏保', calc: ctx.geelyBreakerFree ? `漏保 ${f.breakerType} 1个（厂家提供）` : `漏保 ${f.breakerType} 1个 × ¥${ctx.breakerTypeCost}`, amount: ctx.breakerTypeCost })
  }
  for (const m of ctx.materials) {
    if (isFreeQuotaMaterial(m.name)) continue
    const breakerFree = ctx.geelyBreakerFree && isBreakerMaterial(m.name)
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
    const addon = findAddonMaterial(m.name)
    const sp = addon?.settlementPrice || m.unitPrice || 0
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

function buildSettlementBase(form: CompletionFormData, profit: ProfitPreview, savedMaterials: { name: string; spec?: string; quantity: number; unit: string; unitPrice: number }[]) {
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
    completionCableMeters: form.fixedAux.cableMeters,
    completionPvcMeters: form.fixedAux.pvcMeters,
    completionBreakerType: form.fixedAux.breakerType,
  }
}

function doStockOut(form: CompletionFormData, customerName: string, stockOut: (id: string, name: string, qty: number, reason: string) => void) {
  const reason = `订单完成: ${customerName}`
  form.materials.forEach((m) => {
    if (m.name && m.quantity > 0) {
      const addon = findAddonMaterial(m.name)
      if (addon) stockOut(addon.id, addon.name, m.quantity, reason)
    }
  })
  const pairs: Array<[number, string]> = [
    [form.fixedAux.cableMeters, '电缆'],
    [form.fixedAux.pvcMeters, 'PVC'],
  ]
  for (const [qty, name] of pairs) {
    if (qty > 0) {
      const mat = findCostMaterial(name)
      if (mat) stockOut(mat.id, mat.name, qty, reason)
    }
  }
  if (form.fixedAux.breakerCount > 0) {
    const b = findCostMaterial('漏保盒')
    if (b) stockOut(b.id, b.name, form.fixedAux.breakerCount, reason)
  }
  if (form.fixedAux.breakerType) {
    const btName = BREAKER_NAMES[form.fixedAux.breakerType]
    if (btName) stockOut('breaker-' + form.fixedAux.breakerType, btName, 1, reason)
  }
}

export function useCompletion(orderId: string) {
  const order = useOrderStore((s) => s.orders.find((o) => o.id === orderId))
  const completeOrder = useOrderStore((s) => s.completeOrder)
  const updateOrderStore = useOrderStore((s) => s.updateOrder)
  const getPlatformFeeRate = useSettingsStore((s) => s.getPlatformFeeRate)
  const stockOut = useInventoryStore((s) => s.stockOut)
  const recordMaterialUsage = useSettingsStore((s) => s.recordMaterialUsage)

  // P0-104-D：已完成单进入编辑态（不改动状态/完成时间，仅改结算数据）
  const isEditMode = order?.status === '已完成'

  const [packageMeters, setPackageMeters] = useState(() => resolveOrderPackageMeters(order ?? {}))

  const [form, setForm] = useState<CompletionFormData>({
    completeDate: new Date().toISOString().slice(0, 10),
    actualInstallDate: order?.actualInstallDate || order?.appointmentDate || new Date().toISOString().slice(0, 10),
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
      ?? findAddonMaterial(cableMat?.name || '')?.settlementPrice
      ?? 0

    const { overFee: cableReceivable } = calcOverFee(form.fixedAux.cableMeters, packageMeters, cableCustomerPrice)

    const cable = findCostMaterial('电缆')
    const pvc = findCostMaterial('PVC')
    const breaker = findCostMaterial('漏保盒')
    const cableCostPrice = cable?.costPrice || 17.9
    const pvcCostPrice = pvc?.costPrice || 1
    const breakerCostPrice: Record<string, number> = {
      'C25': 26.8, 'C40': 26.8, 'C40A': 46.5, '': 0,
    }
    // P0-100：吉利品牌单漏保由厂家随车提供，安装方不承担漏保本体成本（判定单点 isWanbangGeelyOrder，禁止重写）
    const geelyBreakerFree = isWanbangGeelyOrder(order?.brandName, order?.platformName || order?.platform, order?.rawText)
    const breakerTypeCost = geelyBreakerFree ? 0 : (breakerCostPrice[form.fixedAux.breakerType] || 0)

    // 增项应收：跳过电缆/线缆（已由固定辅材超米口径统一计算），其余按明细
    let addonReceivable = 0
    for (const m of form.materials) {
      if (isFreeQuotaMaterial(m.name)) continue
      addonReceivable += m.customerSubtotal
    }
    const customerReceivable = addonReceivable + cableReceivable

    // P0-109：成本侧按实际使用米数全额计价——成本/客户价两系统独立，套餐减免只作用客户应收侧
    const cableCost = Math.round(form.fixedAux.cableMeters * cableCostPrice * 100) / 100
    const pvcCost = Math.round(form.fixedAux.pvcMeters * pvcCostPrice * 100) / 100
    const fixedCost = cableCost + pvcCost + (form.fixedAux.breakerCount * (breaker?.costPrice || 5)) + breakerTypeCost

    // 增项材料成本：排除电缆/PVC（已由固定辅材计入），吉利单漏保成本归零
    const chargeableMaterials = form.materials.filter((m) => !isFreeQuotaMaterial(m.name) && !(geelyBreakerFree && isBreakerMaterial(m.name)))
    const { total: addonCost } = calcMaterialCost(chargeableMaterials)
    const materialCost = Math.round((addonCost + fixedCost) * 100) / 100

    // 平台扣点（吉利品牌无扣点）；支持手动覆盖（P0-104-D 编辑项）
    const geelyOrder = isGeelyBrand(order?.brandName || '')
    const platformRate = geelyOrder ? 0 : (order ? getPlatformFeeRate(order.platform) : 0.2)
    const autoPlatformFee = order
      ? Math.round(getOrderPlatformFee(order, customerReceivable, getPlatformFeeRate) * 100) / 100
      : Math.round(calcPlatformFee(customerReceivable, 0.2) * 100) / 100
    const platformFee = form.platformFeeOverride ?? autoPlatformFee

    // 服务费（吉利品牌按套餐米数计算结算费）；支持手动覆盖
    const autoServiceFee = order
      ? getSettlementFee({ ...order, packageMeters: String(packageMeters) })
      : 300
    const serviceFee = form.serviceFeeOverride ?? autoServiceFee

    // P0-104-B：利润 = 客户应收 - 平台扣点 + 车企服务费 - 材料成本 - 工资
    const actualProfit = Math.round(calcProfit(customerReceivable, materialCost, platformFee, serviceFee) * 100) / 100
    const laborCost = form.laborCost || 0
    const profitAfterLabor = Math.round((actualProfit - laborCost) * 100) / 100

    const bctx: BreakdownCtx = {
      materials: form.materials, fixedAux: form.fixedAux, packageMeters,
      cableCustomerPrice, cableCostPrice, pvcCostPrice,
      breakerBoxPrice: breaker?.costPrice || 5, breakerTypeCost, geelyBreakerFree,
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
      actualProfit: profitAfterLabor,
      breakdown: {
        receivableItems,
        platformRate,
        serviceFeeLabel: `车企服务费 = ¥${serviceFee}`,
        materialItems,
      },
    }
  }, [form, order, getPlatformFeeRate, packageMeters, packageBreakdown, bindVersion])

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
    const base = buildSettlementBase(form, profit, savedMaterials)

    if (isEditMode) {
      // P0-104-D：编辑态——不改动状态/完成时间，仅更新结算数据，留痕
      updateOrderStore(orderId, { ...base, completionNotes: form.notes, lastEditedAt: Date.now(), editCount: (order.editCount || 0) + 1 })
    } else {
      doStockOut(form, order.customerName, stockOut)
      completeOrder(orderId, { ...base, notes: form.notes })
      recordMaterialUsage(form.materials.map((m) => m.name))
      updateMaterialFrequency({ ...order, status: '已完成', materials: savedMaterials })
    }
    return true
  }, [order, orderId, form, profit, completeOrder, stockOut, isEditMode, updateOrderStore])

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
