import { useCallback } from 'react'
import type { Material } from '@/types'
import { FIXED_MATERIALS } from '@/constants/finance'
import { useMaterialStore } from '@/stores/materialStore'

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
