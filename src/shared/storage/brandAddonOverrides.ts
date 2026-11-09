import type { Material } from '@/types/material'

/**
 * P0-244：品牌辅材覆盖层（存储，零改常量）
 * localStorage key=cdz_brand_addon_overrides_v1
 * 按品牌三维操作：added 新增辅材 / priceOverrides 结算价覆盖 / hidden 删除=不再显示
 * 唯一合并点 getBrandAddonsWithOverrides(brand, base)：base 过滤 hidden → 套改价 → 追加 added
 * brand 空直通零扰动；已存订单零重算（快照口径既有）
 */

const STORAGE_KEY = 'cdz_brand_addon_overrides_v1'

export interface BrandAddonOverride {
  added: Material[]
  priceOverrides: Record<string, number>
  hidden: string[]
}

type Store = Record<string, BrandAddonOverride>

function readStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Store) : {}
  } catch {
    return {}
  }
}

function writeStore(store: Store): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function ensureOverride(store: Store, brand: string): BrandAddonOverride {
  if (!store[brand]) store[brand] = { added: [], priceOverrides: {}, hidden: [] }
  return store[brand]
}

export function getBrandAddonOverride(brand: string): BrandAddonOverride {
  return readStore()[brand] || { added: [], priceOverrides: {}, hidden: [] }
}

/** P0-244：添加辅材（写入该品牌覆盖层 added；调用方做同名校验） */
export function addBrandAddonMaterial(brand: string, mat: Material): void {
  const store = readStore()
  const o = ensureOverride(store, brand)
  o.added = [...o.added.filter((m) => m.name !== mat.name), { ...mat, brand }]
  writeStore(store)
}

/** P0-244：改价（覆盖该品牌同名辅材结算价；基础表与新增项同吃此价） */
export function setBrandAddonPrice(brand: string, name: string, price: number): void {
  const store = readStore()
  ensureOverride(store, brand).priceOverrides[name] = price
  writeStore(store)
}

/** P0-244：删除=该品牌不再显示（基础表与新增项一并隐藏；恢复入口不在本期范围） */
export function hideBrandAddonMaterial(brand: string, name: string): void {
  const store = readStore()
  const o = ensureOverride(store, brand)
  if (!o.hidden.includes(name)) o.hidden.push(name)
  writeStore(store)
}

/** ============================================================
 * P0-244 唯一合并点：基础表 ⊕ 覆盖层（删/改价/增）
 * useSurvey 的 brandAddons、弹窗选项源、一切按名查表消费点全走此出口
 * ============================================================ */
export function getBrandAddonsWithOverrides(brand: string | null | undefined, base: Material[]): Material[] {
  if (!brand) return base
  const { added, priceOverrides, hidden } = getBrandAddonOverride(brand)
  if (added.length === 0 && Object.keys(priceOverrides).length === 0 && hidden.length === 0) return base
  const hiddenSet = new Set(hidden)
  const applyPrice = (m: Material): Material =>
    priceOverrides[m.name] !== undefined ? { ...m, settlementPrice: priceOverrides[m.name] } : m
  return [
    ...base.filter((m) => !hiddenSet.has(m.name)).map(applyPrice),
    ...added.filter((m) => !hiddenSet.has(m.name)).map(applyPrice),
  ]
}
