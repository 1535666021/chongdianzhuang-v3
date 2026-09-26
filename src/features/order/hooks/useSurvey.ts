import { useState, useMemo, useCallback } from 'react'
import { useOrderStore } from '@/stores/orderStore'
import { calcOverFee, calcSurveyTotal, getOrderServiceFee, resolveOrderPackageMeters, findWanbangMeteredCable } from '@/shared/utils/orderCalc'
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
  const platformRate = useSettingsStore((s) => s.getPlatformFeeRate(order.platform))
  const serviceFee = getOrderServiceFee(order)

  // P0-103：万帮"线缆 X*Ymm²"行与电缆同口径（按布线距离超米计费），勘测/完工全链路同源
  const isCableMat = (name: string) => {
    const mat = addonMaterialsData.find((a) => a.name === name)
    return (mat && (mat.categoryCode === 'CABLE' || /电缆敷设 | 线缆敷设/.test(mat.name))) || !!findWanbangMeteredCable(name)
  }

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
      const isCable = mat.categoryCode === 'CABLE' || /电缆敷设|线缆敷设/.test(mat.name)
      const item: SurveyMaterialItem = {
        name: mat.name,
        spec: '',
        quantity: isCable ? 0 : 1,
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
      const q = cable ? Math.max(0, quantity) : Math.max(1, quantity)
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
    updateOrder(order.id, { survey: { ...form } } as any)
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
    platformRate,
    save,
  }
}
