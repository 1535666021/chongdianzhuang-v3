import { useState, useMemo, useCallback } from 'react'
import { useOrderStore } from '@/stores/orderStore'
import { calcAddonTotal, calcOverFee, calcSurveyTotal, getServiceFee } from '@/shared/utils/orderCalc'
import { useSettingsStore } from '@/stores/settingsStore'
import { addonMaterialsData, brandList } from '@/constants/materialData'
import type { Material } from '@/types/material'
import type { Order } from '@/types'
import type { SurveyFormData, SurveyMaterialItem } from '../types/survey'

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
  const serviceFee = getServiceFee(order.notes || '')

  const isCableMat = (name: string) => {
    const mat = addonMaterialsData.find((a) => a.name === name)
    return mat && (mat.categoryCode === 'CABLE' || /电缆敷设 | 线缆敷设/.test(mat.name))
  }

  const brandAddons = useMemo<Material[]>(() => {
    if (!effectiveBrand) return []
    const usageCount = materialUsageCount
    return addonMaterialsData
      .filter((m) => {
        const b = m.brand || ''
        const target = effectiveBrand || ''
        return b.includes(target) || target.includes(b)
      })
      .sort((a, b) => {
        const countA = usageCount[a.name] || 0
        const countB = usageCount[b.name] || 0
        if (countB !== countA) return countB - countA
        return a.name.localeCompare(b.name)
      })
  }, [effectiveBrand, materialUsageCount])

  const totalEstimatedCost = useMemo(() => {
    const items = form.estimatedMaterials.map((m) => ({
      name: m.name,
      quantity: m.quantity,
      unitPrice: m.unitPrice,
      isCable: isCableMat(m.name) || false,
    }))
    return calcSurveyTotal(items, form.estimatedCableCost)
  }, [form.estimatedMaterials, form.estimatedCableCost])

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

  const calcCableCost = (name: string, distance: number) => {
    const mat = addonMaterialsData.find((a) => a.name === name)
    if (!mat) return 0
    const { overFee } = calcOverFee(distance, mat.freeQuota || 0, mat.settlementPrice)
    return overFee
  }

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
    serviceFee,
    platformRate,
    save,
  }
}
