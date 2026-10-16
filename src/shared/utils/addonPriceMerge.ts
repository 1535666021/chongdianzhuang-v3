/**
 * P0-177-B：增项价并轨（铁律#45：不按品牌拆双轨）
 * 硬编码价表=初始数据；materialStore 同名录入优先（存储单一口径）。
 * liveAddonPrices 用 Proxy 让模块级导出保持"活"引用——设置页改价后
 * 勘测/完工默认模板无需刷新即读新值。
 */
import { useMaterialStore } from '@/stores/materialStore'

export function withStoreOverride<T extends { name: string }>(base: T[]): T[] {
  const storeMats = useMaterialStore.getState().materials
  if (!storeMats.length) return base
  const byName = new Map(storeMats.map((m) => [m.name, m]))
  return base.map((item) => {
    const hit = byName.get(item.name) as (T & { settlementPrice?: number; costPrice?: number }) | undefined
    if (!hit) return item
    const next = { ...item }
    if (typeof hit.settlementPrice === 'number') {
      if ('customerPrice' in next) (next as Record<string, unknown>).customerPrice = hit.settlementPrice
      if ('settlementPrice' in next) (next as Record<string, unknown>).settlementPrice = hit.settlementPrice
    }
    if (typeof hit.costPrice === 'number') (next as Record<string, unknown>).costPrice = hit.costPrice
    return next
  })
}

export function liveAddonPrices<T extends { name: string }>(base: T[]): T[] {
  return new Proxy(base, {
    get: (_t, key) => Reflect.get(withStoreOverride(base), key),
  }) as T[]
}
