import { useState, useMemo, useCallback } from 'react'
import { PLATFORM_FEE_RATE } from '@/constants/policy'
import { useOrderStore } from '@/stores/orderStore'
import { isGeelyBrand, calcOverFee, calcSurveyTotal, calcInstallFee, resolveOrderPackageMeters, findWanbangMeteredCable, calcFullMaterialCost, calcOrderServiceFee, isBreakerBoxRow, isBreakerMaterial } from '@/shared/utils/orderCalc'
import { useSettingsStore } from '@/stores/settingsStore'
import { addonMaterialsData, brandList } from '@/constants/materialData'
import { WANBANG_GEELY_ADDON_MATERIALS, isWanbangGeelyOrder } from '@/constants/addonPrice_wanbang_geely'
import { ZHIDA_WULING_ADDON_MATERIALS, isZhidaWulingOrder } from '@/constants/addonPrice_zhida_wuling'
import { getAllAddonMaterials, isCustomAddonMaterial } from '@/shared/utils/addonMaterialsResolver'
import type { Material } from '@/types/material'
import type { Order } from '@/types'
import type { SurveyFormData, SurveyMaterialItem } from '../types/survey'

/** P0-114：勘测实收口径——空=按预估；有值=按实收（仅作用客户侧，成本/利润侧不受影响）。非法值保守回退预估。 */
export function resolveSurveyFinalFee(actualReceiveInput: string, estimatedFee: number): number {
  const t = (actualReceiveInput || '').trim()
  if (t === '') return estimatedFee
  const v = Number(t)
  return Number.isFinite(v) && v > 0 ? v : estimatedFee
}

/** P0-114：实收校验——null=合法（空或正数）；否则返回错误信息（拦截0/负数/非数字），保存前调用 */
export function validateSurveyActualReceive(input: string): string | null {
  const t = (input || '').trim()
  if (t === '') return null
  const v = Number(t)
  if (!Number.isFinite(v)) return '实收金额格式不正确'
  if (v <= 0) return '实收金额必须大于0，请清空或填写正数'
  return null
}

export function useSurvey(order: Order) {
  const updateOrder = useOrderStore((s) => s.updateOrder)

  const [selectedBrand, setSelectedBrand] = useState('')
  const [form, setForm] = useState<SurveyFormData>({
    estimatedMaterials: order.survey?.estimatedMaterials || [],
    powerSource: order.survey?.powerSource || '国网取电',
    cableSpec: order.survey?.cableSpec || '',
    cableDistance: order.survey?.cableDistance || 0,
    estimatedCableCost: order.survey?.estimatedCableCost || 0,
    installMethod: order.survey?.installMethod || '壁挂安装',
    meterStatus: order.survey?.meterStatus || '已安装',
    needBlueprint: order.survey?.needBlueprint || '否',
    surveyResult: order.survey?.surveyResult || '勘测完成',
    locationInfo: order.survey?.locationInfo || '',
  })

  const effectiveBrand = order.brandName || selectedBrand

  const materialUsageCount = useSettingsStore((s) => s.materialUsageCount)
  const platformRate = isGeelyBrand(order.brandName || '') ? 0 : PLATFORM_FEE_RATE // P0-204：费率唯一来源
  // P0-188-R1：收入侧同源口径（calcOrderServiceFee：勘测50/勘察50/维修60/常规套餐分档，与完工核算同表同值）
  const serviceFee = calcOrderServiceFee({ notes: order.notes || '', packageMeters: resolveOrderPackageMeters(order) })
  const notesText = order.notes || ''
  const feeLabel = /维修/.test(notesText) ? '维修费' : /勘察/.test(notesText) ? '勘察费' : /勘测/.test(notesText) ? '勘测费' : '安装费（米数分档）'

  // P0-103：万帮"线缆 X*Ymm²"行与电缆同口径（按布线距离超米计费），勘测/完工全链路同源
  const isCableMat = (name: string) => {
    const mat = addonMaterialsData.find((a) => a.name === name)
    return (mat && (mat.categoryCode === 'CABLE' || /电缆敷设 | 线缆敷设/.test(mat.name))) || !!findWanbangMeteredCable(name)
  }

  // P0-188-R1：成本侧统一出口 calcFullMaterialCost（电缆全量+PVC+漏保盒+漏保器矩阵自动计入；
  // 列表内电缆/漏保盒/漏保器行由出口统一处理故过滤；未绑定→unmatched 橙色警示 §5.3）
  // P0-191-R2：改绑/绑定后 bump 版本触发重算（金额实时刷新）
  const [costVersion, setCostVersion] = useState(0)
  const refreshCost = useCallback(() => setCostVersion((v) => v + 1), [])
  const fullCost = useMemo(() => calcFullMaterialCost({
    brandName: effectiveBrand,
    powerKw: order.powerKw,
    cableMeters: form.cableDistance || 0,
    extraItems: (form.estimatedMaterials || []).filter((m) => !isCableMat(m.name) && !isBreakerBoxRow(m.name) && !isBreakerMaterial(m.name)).map((m) => ({ name: m.name, quantity: m.quantity })),
  }), [effectiveBrand, order.powerKw, form.cableDistance, form.estimatedMaterials, costVersion])

  const calcCableCost = (name: string, distance: number) => {
    const mat = addonMaterialsData.find((a) => a.name === name)
    const unitPrice = mat?.settlementPrice ?? findWanbangMeteredCable(name)?.customerPrice
    if (!unitPrice) return 0
    const { overFee } = calcOverFee(distance, resolveOrderPackageMeters(order), unitPrice)
    return overFee
  }

  const brandAddons = useMemo<Material[]>(() => {
    const usageCount = materialUsageCount
    const wanbangHit = isWanbangGeelyOrder(order.brandName, order.platformName || order.platform, order.rawText)
    // P0-113：挚达/五菱单走挚达价表（与万帮互斥）
    const source = wanbangHit
      ? WANBANG_GEELY_ADDON_MATERIALS
      : isZhidaWulingOrder(order.brandName, order.platformName || order.platform, order.rawText)
        ? ZHIDA_WULING_ADDON_MATERIALS
        : addonMaterialsData.filter((m) => {
          if (!effectiveBrand) return false
          const b = m.brand || ''
          // P0-113-R1：旧brand过滤分支排除挚达价表项——平台未命中挚达门槛时不得混入（验收④⑤⑥）
          if (b === '挚达/五菱') return false
          return b.includes(effectiveBrand) || effectiveBrand.includes(b)
        })
    // P0-128：用户新增增项(custom_addon_)按品牌组并入候选（与订单平台/品牌同组才出现；通用分支放行未分组项）
    const zhidaHitNow = isZhidaWulingOrder(order.brandName, order.platformName || order.platform, order.rawText)
    const customTarget = wanbangHit ? '万帮吉利' : zhidaHitNow ? '挚达/五菱' : effectiveBrand
    const sourceWithCustoms = [
      ...source,
      ...getAllAddonMaterials().filter((m) => isCustomAddonMaterial(m.id) && (m.brand === customTarget || (!wanbangHit && !zhidaHitNow && !m.brand))),
    ]
    return [...sourceWithCustoms].sort((a, b) => {
      const countA = usageCount[a.name] || 0
      const countB = usageCount[b.name] || 0
      if (countB !== countA) return countB - countA
      return a.name.localeCompare(b.name)
    })
  }, [effectiveBrand, materialUsageCount, order.brandName, order.platformName, order.platform, order.rawText])

  const totalEstimatedCost = useMemo(() => {
    const items = form.estimatedMaterials.map((m) => ({
      name: m.name,
      quantity: m.quantity,
      unitPrice: m.unitPrice,
      isCable: isCableMat(m.name) || false,
    }))
    const cableItem = form.estimatedMaterials.find((m) => isCableMat(m.name))
    const cableCost = cableItem ? calcCableCost(cableItem.name, form.cableDistance || 0) : 0
    return calcSurveyTotal(items, cableCost)
  }, [form.estimatedMaterials, form.cableDistance, order])

  const toggleAddon = useCallback((mat: Material) => {
    setForm((prev) => {
      const exists = prev.estimatedMaterials.find((m) => m.name === mat.name)
      if (exists) {
        const removed = prev.estimatedMaterials.filter((m) => m.name !== mat.name)
        // 如果移除的是电缆材料，清空相关字段
        const isCableRemoved = mat.categoryCode === 'CABLE' || /电缆敷设|线缆敷设/.test(mat.name)
        return {
          ...prev,
          estimatedMaterials: removed,
          ...(isCableRemoved ? { cableDistance: 0, estimatedCableCost: 0 } : {}),
        }
      }
      // P0-161：新增材料行数量默认空(0=未填待填)，含电缆行(数量随布线距离联动)
      const item: SurveyMaterialItem = {
        name: mat.name,
        spec: '',
        quantity: 0,
        unit: mat.unit,
        unitPrice: mat.settlementPrice,
      }
      return {
        ...prev,
        estimatedMaterials: [...prev.estimatedMaterials, item],
      }
    })
  }, [])

  const removeAddon = useCallback((name: string) => {
    setForm((prev) => ({
      ...prev,
      estimatedMaterials: prev.estimatedMaterials.filter((m) => m.name !== name),
    }))
  }, [])

  const updateForm = useCallback((updates: Partial<SurveyFormData>) => {
    setForm((prev) => {
      let next = { ...prev, ...updates }
      if (updates.cableDistance !== undefined) {
        const cableItem = prev.estimatedMaterials.find((m) => isCableMat(m.name))
        if (cableItem) {
          next = {
            ...next,
            estimatedMaterials: prev.estimatedMaterials.map((m) =>
              m.name === cableItem.name ? { ...m, quantity: Math.max(0, updates.cableDistance!) } : m
            ),
            estimatedCableCost: calcCableCost(cableItem.name, Math.max(0, updates.cableDistance!)),
          }
        }
      }
      return next
    })
  }, [])

  const updateQuantity = useCallback((name: string, quantity: number) => {
    setForm((prev) => {
      const cable = isCableMat(name)
      // P0-161：0=空态(未填)，非电缆行不再强制最低1；非法输入(NaN/负数)清空归零
      const q = Number.isFinite(quantity) ? Math.max(0, quantity) : 0
      const next = {
        ...prev,
        estimatedMaterials: prev.estimatedMaterials.map((m) =>
          m.name === name ? { ...m, quantity: q } : m
        ),
      }
      if (cable) {
        return {
          ...next,
          cableDistance: q,
          estimatedCableCost: calcCableCost(name, q),
        }
      }
      return next
    })
  }, [])

  const save = useCallback(() => {
    // P0-161：未填即未选——数量为空(0)的非电缆行保存时剔除，不进订单materials、不计费；电缆行数量=布线距离联动，保留既有语义
    const materials = form.estimatedMaterials.filter((m) => isCableMat(m.name) || m.quantity > 0)
    updateOrder(order.id, { survey: { ...form, estimatedMaterials: materials } } as any)
    return true
  }, [order.id, form, updateOrder])

  return {
    form,
    effectiveBrand,
    brandList,
    brandAddons,
    selectedBrand,
    setSelectedBrand,
    updateForm,
    toggleAddon,
    removeAddon,
    updateQuantity,
    totalEstimatedCost,
    calcCableCost,
    serviceFee,
    feeLabel,
    fullCost,
    refreshCost,
    platformRate,
    save,
  }
}
