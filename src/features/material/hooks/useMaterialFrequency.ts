import type { Order } from '@/types'
import { isFreeQuotaMaterial } from '@/shared/utils/orderCalc'

export interface MaterialFrequency {
  name: string
  count: number
  lastUpdated: number
}

const FREQUENCY_KEY = 'cdz_material_frequency_v1'

export function initMaterialFrequency(orders: Order[]): MaterialFrequency[] {
  const countMap: Record<string, number> = {}
  for (const order of orders) {
    if (order.status !== '已完成') continue
    for (const m of order.materials || []) {
      if (isFreeQuotaMaterial(m.name)) continue
      countMap[m.name] = (countMap[m.name] || 0) + 1
    }
  }
  const result = Object.entries(countMap)
    .map(([name, count]) => ({ name, count, lastUpdated: Date.now() }))
    .sort((a, b) => b.count - a.count)
  localStorage.setItem(FREQUENCY_KEY, JSON.stringify(result))
  return result
}

export function updateMaterialFrequency(order: Order): void {
  if (order.status !== '已完成') return
  const cached = getMaterialFrequency()
  for (const m of order.materials || []) {
    if (isFreeQuotaMaterial(m.name)) continue
    const existing = cached.find(f => f.name === m.name)
    if (existing) {
      existing.count += 1
      existing.lastUpdated = Date.now()
    } else {
      cached.push({ name: m.name, count: 1, lastUpdated: Date.now() })
    }
  }
  cached.sort((a, b) => b.count - a.count)
  localStorage.setItem(FREQUENCY_KEY, JSON.stringify(cached))
}

export function getMaterialFrequency(): MaterialFrequency[] {
  const raw = localStorage.getItem(FREQUENCY_KEY)
  return raw ? JSON.parse(raw) : []
}

export function sortMaterialsByFrequency<T extends { name: string }>(
  materials: T[],
  frequency: MaterialFrequency[]
): T[] {
  const freqMap: Record<string, number> = {}
  for (const f of frequency) {
    freqMap[f.name] = f.count
  }
  const CABLE_SPEC_RE = /[3452][*×xX][46]|3[*×xX]10|3[*×xX]16|5[*×xX]10|5[*×xX]16/
  return [...materials].sort((a, b) => {
    const aSpec = CABLE_SPEC_RE.test(a.name)
    const bSpec = CABLE_SPEC_RE.test(b.name)
    if (aSpec && !bSpec) return -1
    if (!aSpec && bSpec) return 1
    const countA = freqMap[a.name] || 0
    const countB = freqMap[b.name] || 0
    return countB - countA
  })
}
