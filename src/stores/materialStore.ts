import { create } from 'zustand'
import type { Material, MaterialUsageRecord } from '@/types'
import { LocalStorageAdapter } from '@/shared/storage'

interface MaterialState {
  materials: Material[]
  addMaterial: (material: Material) => void
  updateMaterial: (id: string, updates: Partial<Material>) => void
  deleteMaterial: (id: string) => void
  importFromLegacy: (legacyMaterials: Material[]) => void

  usageRecords: MaterialUsageRecord[]
  addUsageRecord: (record: MaterialUsageRecord) => void
  updateUsageRecord: (id: string, updates: Partial<MaterialUsageRecord>) => void
  deleteUsageRecord: (id: string) => void
  importUsageFromLegacy: (records: MaterialUsageRecord[]) => void
}

const storage = new LocalStorageAdapter<Material[]>('cdz_v3_materials_')
const usageStorage = new LocalStorageAdapter<MaterialUsageRecord[]>('cdz_v3_material_usage_')

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

  usageRecords: usageStorage.get('list') || [],
  addUsageRecord: (record) => {
    const records = [...get().usageRecords, record]
    usageStorage.set('list', records)
    set({ usageRecords: records })
  },
  updateUsageRecord: (id, updates) => {
    const records = get().usageRecords.map((r) => r.id === id ? { ...r, ...updates } : r)
    usageStorage.set('list', records)
    set({ usageRecords: records })
  },
  deleteUsageRecord: (id) => {
    const records = get().usageRecords.filter((r) => r.id !== id)
    usageStorage.set('list', records)
    set({ usageRecords: records })
  },
  importUsageFromLegacy: (records) => {
    const existing = get().usageRecords
    const existingIds = new Set(existing.map((r) => r.id))
    const newRecords = records.filter((r) => !existingIds.has(r.id))
    if (newRecords.length === 0) return
    const merged = [...existing, ...newRecords]
    usageStorage.set('list', merged)
    set({ usageRecords: merged })
  },
}))
