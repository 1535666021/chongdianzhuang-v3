import type { Order } from '@/types'

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
      // P0-256-A：免配额辅材（30m 线材等）一并计入使用频率，不再跳过
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
    // P0-256-A：免配额辅材一并计入，与 init 同口径
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

type OrdersProvider = () => Order[]
let ordersProvider: OrdersProvider | null = null

// P0-256-C：懒重算订单来源；由 orderStore 在 initMaterialFrequency 后注册，避免与 store 循环依赖
export function registerFrequencyOrdersProvider(provider: OrdersProvider): void {
  ordersProvider = provider
}

export function sortMaterialsByFrequency<T extends { name: string }>(
  materials: T[],
  frequency?: MaterialFrequency[]
): T[] {
  // P0-256-C：频率缓存缺失/为空时，先基于已完成订单重算一次再排序
  let freq = frequency
  if ((!freq || freq.length === 0) && ordersProvider) {
    initMaterialFrequency(ordersProvider())
    freq = getMaterialFrequency()
  }
  const freqMap: Record<string, number> = {}
  for (const f of freq ?? []) {
    freqMap[f.name] = f.count
  }
  const isCable36 = (name: string) =>
    name.includes('3*6') || name.includes('3×6') || name.includes('3x6') || name.includes('3X6')
  return [...materials].sort((a, b) => {
    if (isCable36(a.name)) return -1
    if (isCable36(b.name)) return 1
    const countA = freqMap[a.name] || 0
    const countB = freqMap[b.name] || 0
    return countB - countA
  })
}
