import { useState, useMemo, useCallback } from 'react'
import { useOrderStore } from '@/stores/orderStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { addonMaterialsData, brandList } from '@/constants/materialData'
import type { Material } from '@/types/material'
import type { Order } from '@/types'
import type { SurveyFormData, SurveyMaterialItem } from '../types/survey'

export function useSurvey(order: Order) {
  const updateOrder = useOrderStore((s) => s.updateOrder)

  const [selectedBrand, setSelectedBrand] = useState('')
  const [form, setForm] = useState<SurveyFormData>({
    estimatedMaterials: [],
    powerSource: '国网取电',
    cableSpec: '',
    cableDistance: 0,
    estimatedCableCost: 0,
    installMethod: '壁挂安装',
    meterStatus: '已安装',
    needBlueprint: '否',
    surveyResult: '勘测完成',
    locationInfo: '',
  })

  const effectiveBrand = order.brandName || selectedBrand

  const materialUsageCount = useSettingsStore((s) => s.materialUsageCount)

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

  const updateForm = useCallback((updates: Partial<SurveyFormData>) => {
    setForm((prev) => ({ ...prev, ...updates }))
  }, [])

  const toggleAddon = useCallback((mat: Material) => {
    setForm((prev) => {
      const exists = prev.estimatedMaterials.find((m) => m.name === mat.name)
      if (exists) {
        return {
          ...prev,
          estimatedMaterials: prev.estimatedMaterials.filter((m) => m.name !== mat.name),
        }
      }
      const item: SurveyMaterialItem = {
        name: mat.name,
        spec: '',
        quantity: 1,
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

  const updateQuantity = useCallback((name: string, quantity: number) => {
    setForm((prev) => ({
      ...prev,
      estimatedMaterials: prev.estimatedMaterials.map((m) =>
        m.name === name ? { ...m, quantity: Math.max(1, quantity) } : m
      ),
    }))
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
    save,
  }
}
