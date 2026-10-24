/**
 * P0-177-B：增项价并轨（铁律#45：不按品牌拆双轨）
 * 硬编码价表=初始数据；materialStore 同名录入优先（存储单一口径）。
 * liveAddonPrices 用 Proxy 让模块级导出保持"活"引用——设置页改价后
 * 勘测/完工默认模板无需刷新即读新值。
 */
import { useMaterialStore } from '@/stores/materialStore'

// P0-220-R1：存储层注入——priceScope 归属标记的条目并入对应公司价表（按名去重，存储层优先），价表可从小长大
export function withScopedStoreItems<T extends { name: string }>(base: T[], scope: string): T[] {
  const store = useMaterialStore.getState().materials
  const injected = (store || []).filter((m) => (m as { priceScope?: string }).priceScope === scope)
  const names = new Set(injected.map((m) => m.name))
  return [...injected, ...base.filter((b) => !names.has(b.name))] as T[]
}

export function withStoreOverride<T extends { name: string }>(base: T[]): T[] {
  const storeMats = useMaterialStore.getState().materials
  if (!storeMats.length) return base
  const byName = new Map(storeMats.map((m) => [m.name, m]))
  return base.map((item) => {
    const hit = byName.get(item.name) as (T & { settlementPrice?: number; costPrice?: number }) | undefined
    if (!hit) return item
    const next = { ...item }
    // P0-219：0价=未定价，不覆盖厂家表（甲方2026-10-24裁定）——历史垃圾0价不得压厂家基准价
    if (typeof hit.settlementPrice === 'number' && hit.settlementPrice > 0) {
      if ('customerPrice' in next) (next as Record<string, unknown>).customerPrice = hit.settlementPrice
      if ('settlementPrice' in next) (next as Record<string, unknown>).settlementPrice = hit.settlementPrice
    }
    // P0-219：0价=未定价，不覆盖厂家表（甲方2026-10-24裁定）——costPrice 同款垃圾0价防护
    if (typeof hit.costPrice === 'number' && hit.costPrice > 0) (next as Record<string, unknown>).costPrice = hit.costPrice
    return next
  })
}

export function liveAddonPrices<T extends { name: string }>(base: T[]): T[] {
  return new Proxy(base, {
    get: (_t, key) => Reflect.get(withStoreOverride(base), key),
  }) as T[]
}
