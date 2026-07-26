import { useState, useMemo, useCallback } from 'react'
import { useOrderStore } from '@/stores/orderStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { addonMaterialsData, costMaterials } from '@/constants/materialData'
import type { Order } from '@/types'
import type { MaterialInput, FixedAuxInput, ProfitPreview, CompletionFormData } from '../types/completion'

const SERVICE_FEE: Record<string, number> = {
  安装: 300,
  维修: 60,
  勘察: 0,
}

function getServiceFee(order: Order): number {
  const notes = order.notes || ''
  if (notes.includes('维修')) return SERVICE_FEE['维修']
  if (notes.includes('勘察') || notes.includes('勘测')) return SERVICE_FEE['勘察']
  return SERVICE_FEE['安装']
}

function findAddonMaterial(name: string) {
  return addonMaterialsData.find((m) => m.name === name)
}

function findCostMaterial(name: string) {
  return costMaterials.find((m) => m.name === name)
}

export function useCompletion(orderId: string) {
  const order = useOrderStore((s) => s.orders.find((o) => o.id === orderId))
  const updateOrder = useOrderStore((s) => s.updateOrder)
  const getPlatformFeeRate = useSettingsStore((s) => s.getPlatformFeeRate)

  const [form, setForm] = useState<CompletionFormData>({
    completeDate: new Date().toISOString().slice(0, 10),
    installer: order?.installer || '',
    materials: (order?.materials || []).map((m) => {
      const addon = findAddonMaterial(m.name)
      const sp = addon?.settlementPrice || m.unitPrice || 0
      const cp = addon?.costPrice || m.unitPrice || 0
      return {
        id: Math.random().toString(36).slice(2),
        name: m.name,
        spec: m.spec,
        quantity: m.quantity,
        unit: m.unit,
        settlementPrice: sp,
        costPrice: cp,
        customerSubtotal: sp * m.quantity,
        costSubtotal: cp * m.quantity,
      }
    }),
    fixedAux: {
      cableMeters: 0,
      pvcMeters: 0,
      breakerCount: 0,
      groundRodCount: 0,
    },
    notes: order?.notes || '',
  })

  const updateForm = useCallback((updates: Partial<CompletionFormData>) => {
    setForm((prev) => ({ ...prev, ...updates }))
  }, [])

  const addMaterial = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      materials: [
        ...prev.materials,
        {
          id: Math.random().toString(36).slice(2),
          name: '',
          spec: '',
          quantity: 1,
          unit: '个',
          settlementPrice: 0,
          costPrice: 0,
          customerSubtotal: 0,
          costSubtotal: 0,
        },
      ],
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

  const profit = useMemo<ProfitPreview>(() => {
    // 客户增项费 = Σ(settlementPrice × quantity)
    const customerReceivable = form.materials.reduce((s, m) => s + m.customerSubtotal, 0)

    // 固定辅材成本
    const cable = findCostMaterial('电缆')
    const pvc = findCostMaterial('PVC')
    const breaker = findCostMaterial('漏保盒')
    const groundRod = findCostMaterial('接地棒') || findCostMaterial('接地')
    const fixedCost =
      (form.fixedAux.cableMeters * (cable?.costPrice || 16)) +
      (form.fixedAux.pvcMeters * (pvc?.costPrice || 1)) +
      (form.fixedAux.breakerCount * (breaker?.costPrice || 5)) +
      (form.fixedAux.groundRodCount * (groundRod?.costPrice || 0))

    // 材料成本 = 增项材料成本 + 固定辅材成本
    const addonCost = form.materials.reduce((s, m) => s + m.costSubtotal, 0)
    const materialCost = Math.round((addonCost + fixedCost) * 100) / 100

    // 平台扣点
    const platformRate = order ? getPlatformFeeRate(order.platform) : 0.2
    const platformFee = Math.round(customerReceivable * platformRate * 100) / 100

    // 服务费
    const serviceFee = order ? getServiceFee(order) : 300

    // 利润
    const actualProfit = Math.round((customerReceivable - platformFee + serviceFee - materialCost - (order?.laborCost || 0)) * 100) / 100

    return {
      customerReceivable: Math.round(customerReceivable * 100) / 100,
      platformFee,
      materialCost,
      laborCost: order?.laborCost || 0,
      serviceFee,
      actualProfit,
    }
  }, [form, order, getPlatformFeeRate])

  const save = useCallback(() => {
    if (!order) return false
    updateOrder(orderId, {
      status: '已完成',
      completeDate: form.completeDate,
      installer: form.installer,
      materials: form.materials.map((m) => ({
        name: m.name,
        spec: m.spec,
        quantity: m.quantity,
        unit: m.unit,
        unitPrice: m.settlementPrice,
      })),
      materialCost: profit.materialCost,
      laborCost: profit.laborCost,
      platformFee: profit.platformFee,
      actualProfit: profit.actualProfit,
      customerPrice: profit.customerReceivable,
      notes: form.notes,
    })
    return true
  }, [order, orderId, form, profit, updateOrder])

  return {
    order,
    form,
    profit,
    updateForm,
    addMaterial,
    updateMaterial,
    removeMaterial,
    updateFixedAux,
    save,
  }
}
