import { create } from 'zustand'
import { DEFAULT_ENGINEER, STORAGE_KEY_PREFIX } from '@/constants/common'
import { LocalStorageAdapter } from '@/shared/storage'

export interface PlatformFeeConfig {
  platform: string
  rate: number
}

export interface FormPreset {
  parkingPosition: string
  distributionRoom: string
  wiringMethod: string
  cableType: string
  meterLength: string
}

export interface WatermarkConfig {
  text: string
  enabled: boolean
}

export interface LingpaoItem {
  name: string
  price: number
  unit: string
}

interface PersistedSettings {
  amapKey: string
  amapZoom: number
  engineerName: string
  engineerPhone: string
  engineerAddress: string
  costPriceOverrides: Record<string, number>
  addonPriceOverrides: Record<string, number>
  packageConfig: { name: string; meterLength: number; basePrice: number }[]
  platformFeeRates: Record<string, number>
  formPresets: FormPreset
  brandTemplates: Record<string, string>
  watermark: WatermarkConfig
  lingpaoTemplate: LingpaoItem[]
  materialUsageCount: Record<string, number>
}

interface SettingsState extends PersistedSettings {
  setEngineer: (name: string, phone: string, address?: string) => void
  setCostPrice: (materialId: string, price: number) => void
  setAddonPrice: (materialId: string, price: number) => void
  getCostPrice: (materialId: string, defaultPrice: number) => number
  getAddonPrice: (materialId: string, defaultPrice: number) => number
  setPlatformFeeRate: (platform: string, rate: number) => void
  getPlatformFeeRate: (platform: string) => number
  setFormPresets: (presets: Partial<FormPreset>) => void
  setBrandTemplate: (brand: string, template: string) => void
  setWatermark: (config: Partial<WatermarkConfig>) => void
  setLingpaoTemplate: (items: LingpaoItem[]) => void
  setAmapKey: (key: string) => void
  setAmapZoom: (zoom: number) => void
  resetToFactory: () => void
  materialUsageCount: Record<string, number>
  recordMaterialUsage: (materialNames: string[]) => void
  getMaterialUsageCount: (name: string) => number
}

const storage = new LocalStorageAdapter<PersistedSettings>(STORAGE_KEY_PREFIX)
const saved = storage.get('settings')

function scanHistoryOrders(): Record<string, number> {
  try {
    const raw = localStorage.getItem('cdz_v3_orders_')
    if (!raw) return {}
    const data = JSON.parse(raw)
    const list = Array.isArray(data?.list) ? data.list : Array.isArray(data) ? data : []
    const count: Record<string, number> = {}
    for (const order of list) {
      if (order?.status !== '已完成') continue
      const materials = Array.isArray(order?.survey?.estimatedMaterials) ? order.survey.estimatedMaterials : []
      for (const m of materials) {
        const name = m?.name
        if (!name) continue
        count[name] = (count[name] || 0) + 1
      }
    }
    return count
  } catch {
    return {}
  }
}

const defaultPlatformRates: Record<string, number> = {
  京东: 0.1,
  天猫: 0.1,
  淘宝: 0.2,
  拼多多: 0.2,
  抖音: 0.2,
  其他: 0.2,
}

const defaultFormPresets: FormPreset = {
  parkingPosition: '地下车库',
  distributionRoom: '负一层配电室',
  wiringMethod: '桥架+穿管',
  cableType: 'YJV3*6',
  meterLength: '30',
}

const defaults: PersistedSettings = {
  engineerName: DEFAULT_ENGINEER.name,
  engineerPhone: DEFAULT_ENGINEER.phone,
  engineerAddress: '',
  costPriceOverrides: {},
  addonPriceOverrides: {},
  packageConfig: [],
  platformFeeRates: { ...defaultPlatformRates },
  formPresets: { ...defaultFormPresets },
  brandTemplates: {},
  watermark: { text: '', enabled: false },
  lingpaoTemplate: [],
  materialUsageCount: {},
  amapKey: '',
  amapZoom: 15,
}

const initial: PersistedSettings = {
  ...defaults,
  ...saved,
  platformFeeRates: { ...defaultPlatformRates, ...(saved?.platformFeeRates || {}) },
  formPresets: { ...defaultFormPresets, ...(saved?.formPresets || {}) },
  brandTemplates: { ...(saved?.brandTemplates || {}) },
  watermark: { ...defaults.watermark, ...(saved?.watermark || {}) },
  lingpaoTemplate: saved?.lingpaoTemplate || [],
  materialUsageCount: { ...(saved?.materialUsageCount || {}) },
}

// P0-010-R1：冷启动时若无频率缓存，自动扫描历史已完成订单初始化
if (!Object.keys(saved?.materialUsageCount || {}).length) {
  initial.materialUsageCount = scanHistoryOrders()
  storage.set('settings', { ...initial })
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
  setPlatformFeeRate: (platform, rate) => {
    const rates = { ...get().platformFeeRates, [platform]: rate }
    const next = { ...get(), platformFeeRates: rates }
    set(next)
    persist(next)
  },
  getPlatformFeeRate: (platform) => {
    return get().platformFeeRates[platform] ?? 0.2
  },
  setFormPresets: (presets) => {
    const next = { ...get(), formPresets: { ...get().formPresets, ...presets } }
    set(next)
    persist(next)
  },
  setBrandTemplate: (brand, template) => {
    const templates = { ...get().brandTemplates, [brand]: template }
    const next = { ...get(), brandTemplates: templates }
    set(next)
    persist(next)
  },
  setWatermark: (config) => {
    const next = { ...get(), watermark: { ...get().watermark, ...config } }
    set(next)
    persist(next)
  },
  setLingpaoTemplate: (items) => {
    const next = { ...get(), lingpaoTemplate: items }
    set(next)
    persist(next)
  },
  setAmapKey: (key) => {
    const next = { ...get(), amapKey: key }
    set(next)
    persist(next)
  },
  setAmapZoom: (zoom) => {
    const next = { ...get(), amapZoom: zoom }
    set(next)
    persist(next)
  },
  recordMaterialUsage: (materialNames) => {
    const usage = { ...get().materialUsageCount }
    const unique = new Set(materialNames)
    for (const name of unique) {
      if (!name) continue
      usage[name] = (usage[name] || 0) + 1
    }
    const next = { ...get(), materialUsageCount: usage }
    set(next)
    persist(next)
  },
  getMaterialUsageCount: (name) => {
    return get().materialUsageCount[name] || 0
  },
  resetToFactory: () => {
    set(defaults)
    persist(defaults)
  },
}))
