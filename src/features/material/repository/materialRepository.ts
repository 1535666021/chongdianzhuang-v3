import type { Material } from '@/types'
import { LocalStorageAdapter } from '@/shared/storage'

const storage = new LocalStorageAdapter<Material[]>('cdz_v3_materials_')

export const materialRepository = {
  getAll(): Material[] {
    return storage.get('list') || []
  },

  saveAll(materials: Material[]): void {
    storage.set('list', materials)
  },

  add(material: Material): Material[] {
    const all = this.getAll()
    const updated = [...all, material]
    this.saveAll(updated)
    return updated
  },

  update(id: string, updates: Partial<Material>): Material[] {
    const all = this.getAll()
    const updated = all.map((m) =>
      m.id === id ? { ...m, ...updates, updatedAt: Date.now() } : m
    )
    this.saveAll(updated)
    return updated
  },

  remove(id: string): Material[] {
    const all = this.getAll()
    const updated = all.filter((m) => m.id !== id)
    this.saveAll(updated)
    return updated
  },
}
