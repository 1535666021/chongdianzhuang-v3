import { useCallback } from 'react'
import type { Material, MaterialCategory } from '@/types'
import { useMaterialStore } from '@/stores/materialStore'

/** 固定辅材基准数据（只读） */
const FIXED_MATERIALS: Material[] = [
  {
    id: 'fixed_pvc',
    name: 'PVC管',
    unit: '米',
    costPrice: 3.5,
    settlementPrice: 3.5,
    category: '管材' as MaterialCategory,
    categoryCode: 'PVC',
    stock: 0,
    minStock: 0,
    createdAt: 0,
    updatedAt: 0,
    isFixed: true,
  },
  {
    id: 'fixed_cable',
    name: '电缆',
    unit: '米',
    costPrice: 8.0,
    settlementPrice: 8.0,
    category: '线缆' as MaterialCategory,
    categoryCode: 'CABLE',
    stock: 0,
    minStock: 0,
    createdAt: 0,
    updatedAt: 0,
    isFixed: true,
  },
  {
    id: 'fixed_leakage',
    name: '漏保',
    unit: '个',
    costPrice: 45.0,
    settlementPrice: 45.0,
    category: '辅材' as MaterialCategory,
    categoryCode: 'BREAKER',
    stock: 0,
    minStock: 0,
    createdAt: 0,
    updatedAt: 0,
    isFixed: true,
  },
  {
    id: 'fixed_air',
    name: '空开',
    unit: '个',
    costPrice: 25.0,
    settlementPrice: 25.0,
    category: '辅材' as MaterialCategory,
    categoryCode: 'BREAKER',
    stock: 0,
    minStock: 0,
    createdAt: 0,
    updatedAt: 0,
    isFixed: true,
  },
  {
    id: 'fixed_ground',
    name: '接地棒',
    unit: '根',
    costPrice: 15.0,
    settlementPrice: 15.0,
    category: '工具' as MaterialCategory,
    categoryCode: 'GROUND',
    stock: 0,
    minStock: 0,
    createdAt: 0,
    updatedAt: 0,
    isFixed: true,
  },
]

export function useMaterial() {
  const {
    materials: customMaterials,
    addMaterial: storeAdd,
    updateMaterial: storeUpdate,
    deleteMaterial: storeDelete,
  } = useMaterialStore()

  const allMaterials = [...FIXED_MATERIALS, ...customMaterials]

  const addMaterial = useCallback(
    (material: Material) => {
      storeAdd(material)
    },
    [storeAdd]
  )

  const updateMaterial = useCallback(
    (id: string, updates: Partial<Material>) => {
      storeUpdate(id, updates)
    },
    [storeUpdate]
  )

  const deleteMaterial = useCallback(
    (id: string) => {
      storeDelete(id)
    },
    [storeDelete]
  )

  return {
    allMaterials,
    customMaterials,
    fixedMaterials: FIXED_MATERIALS,
    addMaterial,
    updateMaterial,
    deleteMaterial,
  }
}
