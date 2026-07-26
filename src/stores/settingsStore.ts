import { create } from 'zustand'
import { DEFAULT_ENGINEER, STORAGE_KEY_PREFIX } from '@/constants/common'
import { LocalStorageAdapter } from '@/shared/storage'

interface PersistedSettings {
  engineerName: string
  engineerPhone: string
  engineerAddress: string
  costPriceOverrides: Record<string, number>
  addonPriceOverrides: Record<string, number>
  packageConfig: { name: string; meterLength: number; basePrice: number }[]
}

interface SettingsState extends PersistedSettings {
  setEngineer: (name: string, phone: string, address?: string) => void
  setCostPrice: (materialId: string, price: number) => void
  setAddonPrice: (materialId: string, price: number) => void
  getCostPrice: (materialId: string, defaultPrice: number) => number
  getAddonPrice: (materialId: string, defaultPrice: number) => number
  resetToFactory: () => void
}

const storage = new LocalStorageAdapter<PersistedSettings>(STORAGE_KEY_PREFIX)
const saved = storage.get('settings')

const defaults: PersistedSettings = {
  engineerName: DEFAULT_ENGINEER.name,
  engineerPhone: DEFAULT_ENGINEER.phone,
  engineerAddress: '',
  costPriceOverrides: {},
  addonPriceOverrides: {},
  packageConfig: [],
}

const initial: PersistedSettings = {
  ...defaults,
  ...saved,
}

function persist(state: PersistedSettings) {
  storage.set('settings', state)
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...initial,
  setEngineer: (name, phone, address = '') => {
    const next = { ...get(), engineerName: name, engineerPhone: phone, engineerAddress: address }
    set(next)
    persist(next)
  },
  setCostPrice: (materialId, price) => {
    const overrides = { ...get().costPriceOverrides, [materialId]: price }
    const next = { ...get(), costPriceOverrides: overrides }
    set(next)
    persist(next)
  },
  setAddonPrice: (materialId, price) => {
    const overrides = { ...get().addonPriceOverrides, [materialId]: price }
    const next = { ...get(), addonPriceOverrides: overrides }
    set(next)
    persist(next)
  },
  getCostPrice: (materialId, defaultPrice) => {
    return get().costPriceOverrides[materialId] ?? defaultPrice
  },
  getAddonPrice: (materialId, defaultPrice) => {
    return get().addonPriceOverrides[materialId] ?? defaultPrice
  },
  resetToFactory: () => {
    set(defaults)
    persist(defaults)
  },
}))
