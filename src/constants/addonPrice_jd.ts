import type { Material, MaterialCategory, MaterialCategoryCode } from '@/types/material'
import { CATEGORY_MAP, type AddonPriceItem } from './addonPrice_wanbang_geely'
import { liveAddonPrices, withScopedStoreItems } from '@/shared/utils/addonPriceMerge'

/**
 * 京东（到美）增项价目表（P0-220，字段照 addonPrice_zhida_wuling.ts）。
 * 价目数据暂缺（甲方待提供，R2 补录）；P0-220-R1：存储层 priceScope==='jd'
 * 的条目自动注入本表（按名去重、存储层优先），表可从小长大，加条目不发版。
 */
const JD_BASE: AddonPriceItem[] = []

const JD_MATERIALS_BASE: Material[] = JD_BASE.map((item) => {
  const mapped = CATEGORY_MAP[item.category] || { category: '其他' as MaterialCategory, categoryCode: 'OTHER' as MaterialCategoryCode }
  return {
    id: item.id,
    name: item.name,
    category: mapped.category,
    categoryCode: mapped.categoryCode,
    unit: item.unit,
    costPrice: null,
    settlementPrice: item.customerPrice,
    customerPrice: item.customerPrice,
    brand: '京东',
    freeQuota: 0,
    source: 'addon',
    stock: 0,
    minStock: 0,
    isFixed: true,
  }
})

// 并轨：硬编码为初始数据，存储层同名录入/注入优先（存储单一口径）
export const JD_ADDON_PRICES: AddonPriceItem[] = liveAddonPrices(JD_BASE)
export const JD_ADDON_MATERIALS: Material[] = liveAddonPrices(withScopedStoreItems(JD_MATERIALS_BASE, 'jd') as unknown as Material[]) as unknown as Material[]
