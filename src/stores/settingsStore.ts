import { create } from 'zustand'
import { DEFAULT_ENGINEER } from '@/constants/common'

interface SettingsState {
  engineerName: string
  engineerPhone: string
  packageConfig: { name: string; meterLength: number; basePrice: number }[]
  setEngineer: (name: string, phone: string) => void
  setPackageConfig: (config: any[]) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  engineerName: DEFAULT_ENGINEER.name,
  engineerPhone: DEFAULT_ENGINEER.phone,
  packageConfig: [],
  setEngineer: (name, phone) => set({ engineerName: name, engineerPhone: phone }),
  setPackageConfig: (config) => set({ packageConfig: config }),
}))
