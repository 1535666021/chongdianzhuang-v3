/**
 * P0-206-M：库存变动唯一出口（R-11.11 一切变动走 adjustStock，组件禁直写 stock）。
 * 名称三级归一（R-11.9）：精确名 → 成本表别名(matchCostName/映射表/漏保剥前缀) → 自动新建。
 * 禁负（R-11.7）：下限0，缺口=差额进返回与日志 shortfall，不记负数。
 * 库存变动禁扰动 orderCalc/利润体系（〇号条⑤）。
 */
import { useInventoryStore } from '@/stores/inventoryStore'
import { materialRepository } from '@/features/material/repository/materialRepository'
import { getAllCostMaterials } from '@/shared/utils/costMaterialsResolver'
import { matchCostName } from '@/features/material/hooks/useCostMatcher'
import { getCostMapping } from '@/shared/storage/costMappingStorage'
import { stockLogStorage, makeStockLogId, monthOf, type StockSource } from '@/shared/storage/stockLogStorage'
import type { Material } from '@/types'

export interface AdjustStockResult {
  /** 实际变动量（正=入库 负=出库实际扣减） */
  applied: number
  /** 缺口（请求出库量 - 实际扣减量；无缺口=0） */
  shortfall: number
}

interface ResolveOptions {
  /** 默认 true；false=纯查询（余量显示/缺口预估用，绝不新建） */
  create?: boolean
  /** 自动新建时的成本价（批量导入第三列；无则取绑定价或0） */
  unitCostOverride?: number
}

function allEntries(): Material[] {
  // materialRepository 内含 custom 成本条目（与 resolver 同源可能重叠，find 首个即归一）
  return [...getAllCostMaterials(), ...materialRepository.getAll()]
}

function findExact(name: string): Material | undefined {
  return allEntries().find((e) => e.name === name)
}

/** 名称三级归一（R-11.9），返回台账条目 */
export function resolveStockEntry(name: string, opts: ResolveOptions = {}): Material | undefined {
  const raw = (name || '').trim()
  if (!raw) return undefined
  const { create = true, unitCostOverride } = opts

  // 一级：精确名
  const exact = findExact(raw)
  if (exact) return exact

  // 二级：成本表别名（预设规则 → 绑定映射表 → "漏保 C25"剥前缀精确命中）
  const alias = matchCostName(raw) ?? getCostMapping(raw)
  if (alias) {
    const hit = findExact(alias)
    if (hit) return hit
  }
  if (/^漏保\s*/.test(raw)) {
    const rest = raw.replace(/^漏保\s*/, '')
    const hit = rest ? findExact(rest) : undefined
    if (hit) return hit
  }

  // 三级：自动新建（单位个/成本价=绑定价或0）；禁同名重复（上方精确已拦截）
  if (!create) return undefined
  const list = materialRepository.add({
    id: 'stock_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: raw,
    category: '其他' as const,
    unit: '个',
    costPrice: unitCostOverride ?? 0,
    settlementPrice: 0,
    stock: 0,
    minStock: 0,
    source: 'cost',
    createdAt: Date.now(),
  })
  return list.find((m) => m.name === raw)
}

/** 余量显示用：纯查库存（不新建条目） */
export function getStockByName(name: string): number {
  const entry = resolveStockEntry(name, { create: false })
  if (!entry) return 0
  return useInventoryStore.getState().getStock(entry.id)
}

/** 缺口预估（完工确认弹窗用，只读） */
export function previewShortfall(name: string, needQty: number): number {
  if (needQty <= 0) return 0
  const entry = resolveStockEntry(name, { create: false })
  const current = entry ? useInventoryStore.getState().getStock(entry.id) : 0
  return Math.max(0, needQty - current)
}

/**
 * 库存变动唯一出口。
 * @param delta 正=入库 负=出库；禁负下限0，缺口进 shortfall
 * @param refId restock=批次哈希（幂等查重在调用方）/ complete=订单ID / import=行号
 */
export function adjustStock(
  name: string,
  delta: number,
  source: StockSource,
  refId = '',
  opts: { unitCostOverride?: number; reason?: string } = {}
): AdjustStockResult {
  const entry = resolveStockEntry(name, { create: true, unitCostOverride: opts.unitCostOverride })
  if (!entry || !delta || !Number.isFinite(delta)) return { applied: 0, shortfall: 0 }

  const store = useInventoryStore.getState()
  const current = store.getStock(entry.id)
  let applied = 0
  let shortfall = 0
  if (delta > 0) {
    applied = delta
    store.stockIn(entry.id, entry.name, applied, opts.reason || '')
  } else {
    const need = -delta
    const actual = Math.min(current, need) // 禁负：下限0
    applied = -actual // 带符号：出库为负
    shortfall = need - actual // 缺口进提示，不记负数
    if (actual > 0) store.stockOut(entry.id, entry.name, actual, opts.reason || '')
  }

  // 当时成本价（R-11.3）：绑定价；桩=0元只计数（R-11.1）
  const unitCost = opts.unitCostOverride ?? entry.costPrice ?? 0
  const amount = Math.round(applied * unitCost * 100) / 100
  stockLogStorage.append({
    id: makeStockLogId(),
    ts: Date.now(),
    month: monthOf(Date.now()),
    name: entry.name,
    delta: applied,
    unit: entry.unit || '个',
    unitCost,
    amount,
    source,
    refId,
    shortfall,
    reason: opts.reason,
  })
  return { applied, shortfall }
}

/** 库存预警计数（R-11.10）：stock≤minStock 且 minStock>0（默认0不预警） */
export function countStockAlerts(): number {
  const inventory = useInventoryStore.getState().inventory
  return Object.values(inventory).filter((i) => i.minStock > 0 && i.currentStock <= i.minStock).length
}
