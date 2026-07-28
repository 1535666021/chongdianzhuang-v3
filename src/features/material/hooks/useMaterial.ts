import { useCallback, useMemo } from 'react'
import type { Material, MaterialUsageRecord } from '@/types'
import { useMaterialStore } from '@/stores/materialStore'
import { costMaterials, addonMaterialsData } from '@/constants/materialData'

const FIXED_costMaterials: Material[] = costMaterials
const FIXED_ADDON_MATERIALS: Material[] = addonMaterialsData

export function useMaterial() {
  const {
    materials: storedMaterials,
    updateMaterial: storeUpdate,
    usageRecords,
    addUsageRecord: storeAddUsage,
    updateUsageRecord: storeUpdateUsage,
    deleteUsageRecord: storeDeleteUsage,
  } = useMaterialStore()

  const costMaterials = useMemo(() => {
    return FIXED_costMaterials.map((m) => {
      const stored = storedMaterials.find((s) => s.id === m.id)
      if (stored) {
        return {
          ...m,
          costPrice: stored.costPrice ?? m.costPrice,
          settlementPrice: stored.settlementPrice ?? m.settlementPrice,
          customerPrice: stored.customerPrice ?? m.customerPrice,
          freeQuota: stored.freeQuota ?? m.freeQuota,
          updatedAt: stored.updatedAt ?? m.updatedAt,
        }
      }
      return m
    })
  }, [storedMaterials])

  const addonMaterials = useMemo(() => {
    return FIXED_ADDON_MATERIALS.map((m) => {
      const stored = storedMaterials.find((s) => s.id === m.id)
      if (stored) {
        return {
          ...m,
          costPrice: stored.costPrice ?? m.costPrice,
          freeQuota: stored.freeQuota ?? m.freeQuota,
          updatedAt: stored.updatedAt ?? m.updatedAt,
        }
      }
      return m
    })
  }, [storedMaterials])

  const updateCostPrice = useCallback(
    (id: string, price: number) => {
      const target = FIXED_costMaterials.find((m) => m.id === id)
      if (!target) return
      const updated: Partial<Material> = {
        id,
        name: target.name,
        unit: target.unit,
        category: target.category,
        costPrice: price,
        settlementPrice: price,
        customerPrice: price,
        brand: target.brand,
        freeQuota: target.freeQuota,
        source: target.source,
        stock: target.stock,
        minStock: target.minStock,
        isFixed: true,
        createdAt: target.createdAt,
        updatedAt: Date.now(),
      }
      storeUpdate(id, updated)
    },
    [storeUpdate]
  )

  const updateAddonCostPrice = useCallback(
    (id: string, price: number) => {
      const target = FIXED_ADDON_MATERIALS.find((m) => m.id === id)
      if (!target) return
      const updated: Partial<Material> = {
        id,
        name: target.name,
        unit: target.unit,
        category: target.category,
        costPrice: price,
        settlementPrice: target.settlementPrice,
        customerPrice: target.customerPrice,
        brand: target.brand,
        freeQuota: target.freeQuota,
        source: target.source,
        stock: target.stock,
        minStock: target.minStock,
        isFixed: true,
        createdAt: target.createdAt,
        updatedAt: Date.now(),
      }
      storeUpdate(id, updated)
    },
    [storeUpdate]
  )

  const updateAddonFreeQuota = useCallback(
    (id: string, quota: number) => {
      const target = FIXED_ADDON_MATERIALS.find((m) => m.id === id)
      if (!target) return
      const updated: Partial<Material> = {
        id,
        name: target.name,
        unit: target.unit,
        category: target.category,
        costPrice: target.costPrice,
        settlementPrice: target.settlementPrice,
        customerPrice: target.customerPrice,
        brand: target.brand,
        freeQuota: quota,
        source: target.source,
        stock: target.stock,
        minStock: target.minStock,
        isFixed: true,
        createdAt: target.createdAt,
        updatedAt: Date.now(),
      }
      storeUpdate(id, updated)
    },
    [storeUpdate]
  )

  const addUsageRecord = useCallback((record: Omit<MaterialUsageRecord, 'id' | 'total'>) => {
    const total = Math.round(record.costPrice * record.quantity * 100) / 100
    const newRecord: MaterialUsageRecord = {
      ...record,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      total,
    }
    storeAddUsage(newRecord)
  }, [storeAddUsage])

  const updateUsageRecord = useCallback((id: string, updates: Partial<Omit<MaterialUsageRecord, 'id' | 'total'>>) => {
    const record = usageRecords.find((r) => r.id === id)
    if (!record) return
    const costPrice = updates.costPrice ?? record.costPrice
    const quantity = updates.quantity ?? record.quantity
    const total = Math.round(costPrice * quantity * 100) / 100
    storeUpdateUsage(id, { ...updates, total })
  }, [usageRecords, storeUpdateUsage])

  const deleteUsageRecord = useCallback((id: string) => {
    storeDeleteUsage(id)
  }, [storeDeleteUsage])

  return {
    costMaterials,
    addonMaterials,
    allMaterials: [...costMaterials, ...addonMaterials],
    updateCostPrice,
    updateAddonCostPrice,
    updateAddonFreeQuota,
    usageRecords,
    addUsageRecord,
    updateUsageRecord,
    deleteUsageRecord,
  }
}
