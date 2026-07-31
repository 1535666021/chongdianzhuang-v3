import { useState, useMemo, useCallback } from 'react'
import { usePackageMeters } from './usePackageMeters'
import { DEFAULT_PACKAGE_METERS, getServiceFee, calcOverFee, calcPlatformFee, buildPlatformBrand, isFreeQuotaMaterial, calcMaterialCost, calcProfit, resolveCostPrice } from '@/shared/utils/orderCalc'
import { useOrderStore } from '@/stores/orderStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useInventoryStore } from '@/stores/inventoryStore'
import { addonMaterialsData, costMaterials } from '@/constants/materialData'
import { updateMaterialFrequency } from '@/features/material/hooks/useMaterialFrequency'
import { BRAND_DEFAULTS, BREAKER_NAMES } from '@/constants/brands'
import type { Order } from '@/types'
import type { MaterialInput, FixedAuxInput, ProfitPreview, CompletionFormData } from '../types/completion'

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
    if (order?.brandName && BRAND_DEFAULTS[order.brandName]?.packageMeters) {
      return BRAND_DEFAULTS[order.brandName].packageMeters!
    }
    return DEFAULT_PACKAGE_METERS
  })

  const [form, setForm] = useState<CompletionFormData>({
    completeDate: new Date().toISOString().slice(0, 10),
    installer: order?.installer || '',
    materials: (order?.materials?.length ? order.materials : order?.survey?.estimatedMaterials || []).map((m) => {
      const addon = findAddonMaterial(m.name)
      const sp = addon?.settlementPrice || m.unitPrice || 0
      const cp = resolveCostPrice(m.name) || addon?.costPrice || m.unitPrice || 0
      return {
        id: Math.random().toString(36).slice(2),
        name: m.name,
        spec: m.spec,
        quantity: m.quantity,
        unit: m.unit || addon?.unit || '个',
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
    notes: order?.completionNotes || order?.surveyNote || order?.survey?.locationInfo || order?.notes || '',
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

  const [bindVersion, setBindVersion] = useState(0)
  const [dismissedMats, setDismissedMats] = useState<Set<string>>(new Set())

  const packageBreakdown = usePackageMeters(form.materials, packageMeters)

  const profit = useMemo<ProfitPreview>(() => {
    let addonReceivable = 0
    for (const m of form.materials) {
      if (isFreeQuotaMaterial(m.name)) {
        const { overMeters } = calcOverFee(m.quantity, packageMeters)
        addonReceivable += overMeters * m.settlementPrice
      } else {
        addonReceivable += m.customerSubtotal
      }
    }
    const customerReceivable = addonReceivable

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
    const { total: addonCost, unmatched } = calcMaterialCost(form.materials)
    const materialCost = Math.round((addonCost + fixedCost) * 100) / 100

    // 平台扣点
    const platformRate = order ? getPlatformFeeRate(order.platform) : 0.2
    const platformFee = Math.round(calcPlatformFee(customerReceivable, platformRate) * 100) / 100

    // 服务费
    const serviceFee = order ? getServiceFee(order.notes || '') : 300

    // 利润
    const actualProfit = Math.round(calcProfit(customerReceivable, materialCost, platformFee, serviceFee) * 100) / 100

    const receivableItems: { name: string; calc: string; amount: number }[] = []
    for (const m of form.materials) {
      if (isFreeQuotaMaterial(m.name)) {
        const { overMeters } = calcOverFee(m.quantity, packageMeters)
        if (overMeters > 0) {
          receivableItems.push({
            name: m.name,
            calc: `${m.name} ${overMeters}${m.unit} × ¥${m.settlementPrice}/米`,
            amount: Math.round(overMeters * m.settlementPrice * 100) / 100,
          })
        }
      } else if (m.customerSubtotal > 0) {
        receivableItems.push({
          name: m.name,
          calc: `${m.name} ${m.quantity}${m.unit} × ¥${m.settlementPrice}`,
          amount: m.customerSubtotal,
        })
      }
    }

    const fixedCableCost = form.fixedAux.cableMeters * (cable?.costPrice || 16)
    const fixedPvcCost = form.fixedAux.pvcMeters * (pvc?.costPrice || 1)
    const fixedBreakerBoxCost = form.fixedAux.breakerCount * (breaker?.costPrice || 5)

    const materialItems: { name: string; calc: string; amount: number }[] = []
    if (form.fixedAux.cableMeters > 0) {
      materialItems.push({
        name: '电缆',
        calc: `电缆 ${form.fixedAux.cableMeters}米 × ¥${cable?.costPrice || 16}/米`,
        amount: fixedCableCost,
      })
    }
    if (form.fixedAux.pvcMeters > 0) {
      materialItems.push({
        name: 'PVC',
        calc: `PVC ${form.fixedAux.pvcMeters}米 × ¥${pvc?.costPrice || 1}/米`,
        amount: fixedPvcCost,
      })
    }
    materialItems.push({
      name: '漏保盒',
      calc: `漏保盒 ${form.fixedAux.breakerCount}个 × ¥${breaker?.costPrice || 5}`,
      amount: fixedBreakerBoxCost,
    })
    if (form.fixedAux.breakerType) {
      materialItems.push({
        name: '漏保',
        calc: `漏保 ${form.fixedAux.breakerType} 1个 × ¥${breakerTypeCost}`,
        amount: breakerTypeCost,
      })
    }
    for (const m of form.materials) {
      if (isFreeQuotaMaterial(m.name)) continue
      const unitCost = resolveCostPrice(m.name)
      const amount = Math.round(unitCost * m.quantity * 100) / 100
      if (amount > 0) {
        materialItems.push({
          name: m.name,
          calc: `${m.name} ${m.quantity}${m.unit} × ¥${unitCost}`,
          amount,
        })
      }
    }

    return {
      customerReceivable: Math.round(customerReceivable * 100) / 100,
      freeAmount: Math.round(packageBreakdown.freeAmount * 100) / 100,
      platformFee,
      materialCost,
      serviceFee,
      actualProfit,
      breakdown: {
        receivableItems,
        platformRate,
        serviceFeeLabel: `固定服务费 = ¥${serviceFee}`,
        materialItems,
      },
    }
  }, [form, order, getPlatformFeeRate, packageMeters, packageBreakdown, bindVersion])

  const pendingCostBind = useMemo(() => {
    const { unmatched } = calcMaterialCost(form.materials)
    const needsBind = unmatched.filter((n) => !isFreeQuotaMaterial(n) && !dismissedMats.has(n))
    return needsBind[0] || null
  }, [form.materials, bindVersion, dismissedMats])

  const handleCostBound = useCallback(() => {
    setBindVersion((v) => v + 1)
  }, [])

  const handleCostBindClose = useCallback(() => {
    const { unmatched } = calcMaterialCost(form.materials)
    const needsBind = unmatched.filter((n) => !isFreeQuotaMaterial(n) && !dismissedMats.has(n))
    const current = needsBind[0]
    if (current) {
      setDismissedMats((prev) => new Set(prev).add(current))
    }
    setBindVersion((v) => v + 1)
  }, [form.materials])

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
      const btName = BREAKER_NAMES[form.fixedAux.breakerType]
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
      platformFee: profit.platformFee,
      actualProfit: profit.actualProfit,
      customerPrice: profit.customerReceivable,
      notes: form.notes,
    })

    recordMaterialUsage(form.materials.map((m) => m.name))
    updateMaterialFrequency({
      ...order,
      status: '已完成',
      materials: form.materials.map((m) => ({ name: m.name, quantity: m.quantity, unit: m.unit, unitPrice: m.settlementPrice })),
    })
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
    pendingCostBind,
    handleCostBound,
    handleCostBindClose,
  }
}
