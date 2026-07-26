import { useState, useCallback } from 'react'
import { useOrderStore } from '@/stores/orderStore'
import type { OrderSurvey, SurveyFormData, SurveyMaterialItem } from '../types/survey'

export function useSurvey(orderId: string) {
  const order = useOrderStore((s) => s.orders.find((o) => o.id === orderId))
  const updateOrder = useOrderStore((s) => s.updateOrder)

  const [form, setForm] = useState<SurveyFormData>({
    surveyDate: new Date().toISOString().slice(0, 10),
    meterLocation: '楼道',
    cableRoute: '',
    difficulty: '一般',
    estimatedMaterials: [],
    photosDesc: '',
    notes: '',
  })

  const initFromOrder = useCallback(() => {
    if (order?.survey) {
      setForm({
        surveyDate: order.survey.surveyDate,
        meterLocation: order.survey.meterLocation,
        cableRoute: order.survey.cableRoute,
        difficulty: order.survey.difficulty,
        estimatedMaterials: order.survey.estimatedMaterials || [],
        photosDesc: order.survey.photosDesc,
        notes: order.survey.notes,
      })
    }
  }, [order])

  const updateForm = useCallback((updates: Partial<SurveyFormData>) => {
    setForm((prev) => ({ ...prev, ...updates }))
  }, [])

  const addMaterial = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      estimatedMaterials: [
        ...prev.estimatedMaterials,
        { name: '', spec: '', quantity: 1, unit: '米' },
      ],
    }))
  }, [])

  const updateMaterial = useCallback((index: number, updates: Partial<SurveyMaterialItem>) => {
    setForm((prev) => {
      const next = [...prev.estimatedMaterials]
      next[index] = { ...next[index], ...updates }
      return { ...prev, estimatedMaterials: next }
    })
  }, [])

  const removeMaterial = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      estimatedMaterials: prev.estimatedMaterials.filter((_, i) => i !== index),
    }))
  }, [])

  const save = useCallback(() => {
    if (!order) return false
    updateOrder(orderId, {
      survey: {
        surveyDate: form.surveyDate,
        meterLocation: form.meterLocation,
        cableRoute: form.cableRoute,
        difficulty: form.difficulty,
        estimatedMaterials: form.estimatedMaterials,
        photosDesc: form.photosDesc,
        notes: form.notes,
      },
    })
    return true
  }, [order, orderId, form, updateOrder])

  return {
    order,
    form,
    initFromOrder,
    updateForm,
    addMaterial,
    updateMaterial,
    removeMaterial,
    save,
  }
}
