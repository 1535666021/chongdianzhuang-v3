import { useState, useMemo, useCallback } from 'react'
import { usePackageMeters } from './usePackageMeters'
import { DEFAULT_PACKAGE_METERS } from '@/constants/package'
import { useOrderStore } from '@/stores/orderStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useInventoryStore } from '@/stores/inventoryStore'
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

function inferBreakerType(order: Order | undefined): FixedAuxInput['breakerType'] {
  if (!order) return ''
  const brand = order.brandName || ''
  const power = (order.powerKw || '').toString()
  if (brand.includes('零跑') || brand.includes('苏宁')) return 'C40A'
  if (brand.includes('比亚迪')) {
    if (power.includes('3.5')) return 'C25'
    if (power.includes('7')) return 'C40'
  }
  if (power.includes('3.5')) return 'C25'
  if (power.includes('7')) return 'C40'
  return ''
}

export function useCompletion(orderId: string) {
  const order = useOrderStore((s) => s.orders.find((o) => o.id === orderId))
  const updateOrder = useOrderStore((s) => s.updateOrder)
  const getPlatformFeeRate = useSettingsStore((s) => s.getPlatformFeeRate)
  const stockOut = useInventoryStore((s) => s.stockOut)
  const recordMaterialUsage = useSettingsStore((s) => s.recordMaterialUsage)

  const [packageMeters, setPackageMeters] = useState(() => {
    if (order?.packageMeters) {
      const pm = parseFloat(order.packageMeters)
      if (!isNaN(pm) && pm > 0) return pm
    }
    const brandDefaults: Record<string, number> = {
      '零跑': 30,
      '空灵零跑': 30,
    }
    if (order?.brandName && brandDefaults[order.brandName]) {
      return brandDefaults[order.brandName]
    }
    return DEFAULT_PACKAGE_METERS
  })

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
      cableMeters: order?.survey?.cableDistance || 0,
      pvcMeters: order?.survey?.cableDistance || 0,
      breakerCount: 1,
      breakerType: inferBreakerType(order),
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

  const packageBreakdown = usePackageMeters(form.materials, packageMeters)

  const profit = useMemo<ProfitPreview>(() => {
    const cableOver = Math.max(0, form.fixedAux.cableMeters - packageMeters)
    let cableOverPrice = 0
    if (cableOver > 0 && order?.brandName) {
      const brandName = order.brandName
      const cableAddon = addonMaterialsData.find((m) => {
        const isCable = m.name.includes('线缆敷设')
        const brandMatch = m.brand?.includes(brandName) || brandName.includes(m.brand || '')
        return isCable && brandMatch
      })
      cableOverPrice = cableAddon?.settlementPrice || 40
    }
    const cableOverReceivable = cableOver * cableOverPrice

    const customerReceivable = packageBreakdown.totalCustomerReceivable + cableOverReceivable

    const cable = findCostMaterial('电缆')
    const pvc = findCostMaterial('PVC')
    const breaker = findCostMaterial('漏保盒')
    const breakerCostPrice: Record<string, number> = {
      'C25': 26.8, 'C40': 26.8, 'C40A': 46.5, '': 0,
    }
    const breakerTypeCost = breakerCostPrice[form.fixedAux.breakerType] || 0
    const fixedCost =
      (form.fixedAux.cableMeters * (cable?.costPrice || 16)) +
      (form.fixedAux.pvcMeters * (pvc?.costPrice || 1)) +
      (form.fixedAux.breakerCount * (breaker?.costPrice || 5)) +
      breakerTypeCost

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
      freeAmount: Math.round(packageBreakdown.freeAmount * 100) / 100,
      platformFee,
      materialCost,
      laborCost: order?.laborCost || 0,
      serviceFee,
      actualProfit,
    }
  }, [form, order, getPlatformFeeRate, packageMeters, packageBreakdown])

  const save = useCallback(() => {
    if (!order) return false

    // 自动出库：扣减增项材料库存
    form.materials.forEach((m) => {
      if (m.name && m.quantity > 0) {
        const addon = findAddonMaterial(m.name)
        if (addon) {
          stockOut(addon.id, addon.name, m.quantity, `订单完成: ${order.customerName}`)
        }
      }
    })

    // 自动出库：扣减固定辅材库存
    if (form.fixedAux.cableMeters > 0) {
      const cable = findCostMaterial('电缆')
      if (cable) stockOut(cable.id, cable.name, form.fixedAux.cableMeters, `订单完成: ${order.customerName}`)
    }
    if (form.fixedAux.pvcMeters > 0) {
      const pvc = findCostMaterial('PVC')
      if (pvc) stockOut(pvc.id, pvc.name, form.fixedAux.pvcMeters, `订单完成: ${order.customerName}`)
    }
    if (form.fixedAux.breakerCount > 0) {
      const breaker = findCostMaterial('漏保盒')
      if (breaker) stockOut(breaker.id, breaker.name, form.fixedAux.breakerCount, `订单完成: ${order.customerName}`)
    }
    if (form.fixedAux.breakerType) {
      const breakerTypes: Record<string, string> = { 'C25': '漏保C25', 'C40': '漏保C40', 'C40A': '漏保C40A' }
      const btName = breakerTypes[form.fixedAux.breakerType]
      if (btName) stockOut('breaker-' + form.fixedAux.breakerType, btName, 1, `订单完成: ${order.customerName}`)
    }

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

    recordMaterialUsage(form.materials.map((m) => m.name))
    return true
  }, [order, orderId, form, profit, updateOrder, stockOut])

  return {
    order,
    form,
    profit,
    packageMeters,
    setPackageMeters,
    packageBreakdown,
    updateForm,
    addMaterial,
    updateMaterial,
    removeMaterial,
    updateFixedAux,
    save,
  }
}
