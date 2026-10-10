/**
 * P0-142：订单可约时间窗口——档位常量与计算（集中配置，甲方一句话可调档值）。
 * 口径：以"当天"为基准锁定绝对日期区间（本地时区），设档后跨天打开不重算。
 */
/** 本地时区当日 YYYY-MM-DD（与 AppointmentModal getTodayLocal 同口径，constants 自持防跨层 import） */
export function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 三档档位（值入 constants 禁散落；label 甲方真机可改） */
export const AVAILABLE_WINDOW_TIERS = [
  { key: '1-2', label: '1~2天', fromOffset: 1, toOffset: 2 },
  { key: '3-5', label: '3~5天', fromOffset: 3, toOffset: 5 },
  { key: '7', label: '一周内', fromOffset: 1, toOffset: 7 },
] as const

export interface AvailableWindow { from: string; to: string }

/** 按档位计算绝对窗口（base 默认当天本地时区；跨月/跨年由 Date 自然进位） */
export function getAvailableWindow(tierKey: string, base: string = todayLocal()): AvailableWindow | null {
  const tier = AVAILABLE_WINDOW_TIERS.find((t) => t.key === tierKey)
  if (!tier) return null
  const mk = (offset: number) => {
    const d = new Date(base + 'T00:00:00')
    d.setDate(d.getDate() + offset)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  return { from: mk(tier.fromOffset), to: mk(tier.toOffset) }
}

/** 红显判定：窗口结束 < 当天 且仍待办 → 到期提醒 */
export function isAvailableWindowExpired(order: { availableTo?: string; status?: string }, today: string = todayLocal()): boolean {
  return !!order.availableTo && order.availableTo < today && order.status === '待办'
}
