import { create } from 'zustand'
import type { Material } from '@/types'
import { LocalStorageAdapter } from '@/shared/storage'

interface MaterialState {
  materials: Material[]
  addMaterial: (material: Material) => void
  updateMaterial: (id: string, updates: Partial<Material>) => void
  deleteMaterial: (id: string) => void
  importFromLegacy: (legacyMaterials: Material[]) => void
}

const storage = new LocalStorageAdapter<Material[]>('cdz_v3_materials_')

export const useMaterialStore = create<MaterialState>((set, get) => ({
  materials: storage.get('list') || [],
  addMaterial: (material) => {
    const newMaterials = [...get().materials, material]
    storage.set('list', newMaterials)
    set({ materials: newMaterials })
  },
  updateMaterial: (id, updates) => {
    const newMaterials = get().materials.map((m) => m.id === id ? { ...m, ...updates, updatedAt: Date.now() } : m)
    storage.set('list', newMaterials)
    set({ materials: newMaterials })
  },
  deleteMaterial: (id) => {
    const newMaterials = get().materials.filter((m) => m.id !== id)
    storage.set('list', newMaterials)
    set({ materials: newMaterials })
  },
  importFromLegacy: (legacyMaterials) => {
    console.log('Import legacy materials:', legacyMaterials.length)
  },
}))
