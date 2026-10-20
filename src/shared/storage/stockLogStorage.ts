/**
 * P0-206-M：库存变动日志持久化（R-11.2/R-11.3/R-11.5）。
 * 一切变动经 adjustStock 唯一出口写入；按月查询支撑"本月现金支出"。
 */
const LOG_KEY = 'cdz_stock_log_v1'

export type StockSource = 'restock' | 'complete' | 'manual' | 'import'

export interface StockLogEntry {
  id: string
  /** 时间戳 ms */
  ts: number
  /** YYYY-MM（冗余索引字段，按月查询免逐条格式化） */
  month: string
  /** 归一名称（R-11.9 归一后写日志） */
  name: string
  /** 实际变动量（applied，带符号；出库缺口部分不计入） */
  delta: number
  unit: string
  /** 当时成本价（R-11.3/R-11.5 当时价口径；桩=0 只计数） */
  unitCost: number
  /** delta × unitCost（现金账/消耗账共用） */
  amount: number
  source: StockSource
  /** 批次哈希（restock 幂等查重）/ 订单ID（complete）/ 行号（import）/ 空（manual） */
  refId: string
  /** 出库缺口（禁负下限0，差额进提示不记负数 R-11.7） */
  shortfall: number
  reason?: string
}

function loadAll(): StockLogEntry[] {
  try {
    const raw = localStorage.getItem(LOG_KEY)
    return raw ? (JSON.parse(raw) as StockLogEntry[]) : []
  } catch {
    return []
  }
}

function saveAll(entries: StockLogEntry[]): void {
  localStorage.setItem(LOG_KEY, JSON.stringify(entries))
}

export const stockLogStorage = {
  append(entry: StockLogEntry): void {
    saveAll([...loadAll(), entry])
  },

  getAll(): StockLogEntry[] {
    return loadAll()
  },

  /** R-11.8 幂等：补桩按批次哈希查重 */
  hasRefId(refId: string): boolean {
    return loadAll().some((e) => e.refId === refId)
  },

  /** 按月查询；excludeSources 用于"本月现金支出"排除 import（R-11.3） */
  queryMonth(month: string, excludeSources: StockSource[] = []): StockLogEntry[] {
    return loadAll().filter((e) => e.month === month && !excludeSources.includes(e.source))
  },

  /** R-11.3：当月入库金额合计（排除 import 来源） */
  sumMonthAmount(month: string, excludeSources: StockSource[] = ['import']): number {
    const total = this.queryMonth(month, excludeSources).reduce((s, e) => s + e.amount, 0)
    return Math.round(total * 100) / 100
  },
}

export function makeStockLogId(): string {
  return 'log_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function monthOf(ts: number): string {
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${d.getFullYear()}-${m}`
}
