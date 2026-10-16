/**
 * P0-160：预约字段唯一读写层。
 * 预约数据 = 订单聚合内字段（appointmentDate/appointmentFrom/appointmentTo/
 * appointmentTime/appointmentPeriod/appointmentNote），本模块是唯一读写入口，
 * 域外禁止直触上述裸字段（订单类型定义、存储层与本层内部除外）。
 *
 * 业务口径承载（全部照旧，仅收拢入口）：
 *  - To=锚点：appointmentDate 恒写为区间止日；
 *  - To留空=与开始同日（P0-157-158）；
 *  - 排序按 To 主键 + 单日优先次级键（P0-157-158）；
 *  - 倒计时徽章 / 止日前夜橙条按 To（P0-145 / P0-142-R3）。
 */
import type { Order } from '@/types'
import { useOrderStore } from '@/stores/orderStore'
import { todayLocal } from '@/constants/availableWindow'
import type { AppointmentInfo, AppointmentWriteInput, AppointmentWriteResult, CountdownBadge } from './types'

const DAY_MS = 24 * 60 * 60 * 1000

/** 统一读出口：任何组件读取预约信息只允许走这里 */
export function readAppointment(order: Order): AppointmentInfo {
  const isAppointed = order.status === '已预约'
  const from = order.appointmentFrom || order.appointmentDate || ''
  const to = order.appointmentTo || order.appointmentDate || from
  const time = order.appointmentTime || ''
  const isMissingDate = isAppointed && !to
  let displayText = ''
  if (isMissingDate) {
    displayText = '已预约·日期待补'
  } else if (from) {
    const f = from.replace(/-/g, '/')
    displayText = from === to ? f : `${f} ~ ${to.replace(/-/g, '/').slice(5)}`
    if (time) displayText = `${displayText} · ${time}`
  } else if (to) {
    displayText = to.replace(/-/g, '/')
    if (time) displayText = `${displayText} · ${time}`
  }
  return { from, to, time, note: order.appointmentNote, displayText, isAppointed, isMissingDate }
}

/**
 * 统一写入口：写入=置为已预约，内置联动校验——已预约必须有日期，无日期拒绝写入。
 * To 留空=与开始同日（单日预约）；appointmentDate 锚点恒写止日。
 */
export function writeAppointment(orderId: string, input: AppointmentWriteInput): AppointmentWriteResult {
  const from = (input.from || '').trim()
  if (!from) return { ok: false, reason: '预约失败：已预约必须有预约日期' }
  const finalTo = (input.to || '').trim() || from
  if (finalTo < from) return { ok: false, reason: '预约失败：结束日期不能早于开始日期' }
  useOrderStore.getState().updateOrder(orderId, {
    status: '已预约',
    appointmentFrom: from,
    appointmentTo: finalTo,
    appointmentDate: finalTo, // legacy 排序/今日口径锚点 = 区间止日（口径照旧）
    appointmentTime: input.time,
    appointmentPeriod: input.period ?? input.time,
    appointmentNote: input.note || undefined,
  })
  return { ok: true }
}

/** 清空预约 = 显式取消语义：状态回待办 + 清全部预约字段 */
export function cancelAppointment(orderId: string): void {
  useOrderStore.getState().updateOrder(orderId, {
    status: '待办',
    appointmentFrom: undefined,
    appointmentTo: undefined,
    appointmentDate: undefined,
    appointmentTime: undefined,
    appointmentPeriod: undefined,
    appointmentNote: undefined,
  })
}

/**
 * 导入路径唯一预约规范化口（原 P0-159 规则）。
 * 导入构造器（legacyMapper）不再直写预约裸字段——预约字段搬运在此完成：
 * 已预约但无日期 → 降级待办。
 */
export function normalizeForImport<T extends Order>(
  order: T,
  legacyOrder?: { appointmentDate?: string; appointmentTime?: string; status?: string },
): T {
  let result = (legacyOrder
    ? { ...order, appointmentDate: legacyOrder.appointmentDate, appointmentTime: legacyOrder.appointmentTime }
    : order) as T
  if (legacyOrder) {
    // 翻正（原 legacyMapper.shouldFlipToAppointed 迁入）：pending/待办 + 有预约日期与时段 → 已预约
    const rawStatus = legacyOrder.status || ''
    const hasDate = (legacyOrder.appointmentDate || '').trim() !== ''
    const hasTime = (legacyOrder.appointmentTime || '').trim() !== ''
    if ((rawStatus === 'pending' || result.status === '待办') && hasDate && hasTime) {
      result = { ...result, status: '已预约' } as T
    }
  }
  // 降级（原 P0-159 规则）：已预约但无日期 → 待办
  const info = readAppointment(result)
  if (info.isAppointed && info.isMissingDate) return { ...result, status: '待办' } as T
  return result
}

/** 存量自愈（main.tsx 启动钩子调用）：扫描已预约无日期存量脏单 → 规范化降级待办。幂等，无脏单零写入 */
export function healMissingAppointments(): number {
  const store = useOrderStore.getState()
  const broken = store.orders.filter((o) => {
    const info = readAppointment(o)
    return info.isAppointed && info.isMissingDate
  })
  broken.forEach((o) => store.updateOrder(o.id, { status: '待办' }))
  if (broken.length > 0) console.log(`[P0-160] 预约存量自愈：${broken.length} 单「已预约无日期」→ 降级待办`)
  return broken.length
}

/** 排序主键（P0-157-158 迁入）：预约排序值=止日时间戳，空值回退 createdAt 兜底 */
export function appointmentSortTs(order: Order): number {
  const ts = Date.parse(readAppointment(order).to || '')
  return Number.isNaN(ts) ? order.createdAt || 0 : ts
}

/** 排序次级键辅助（P0-157-158 迁入）：跨天区间单=true（From<To），精确单日单=false */
export function isRangeAppointment(order: Order): boolean {
  const info = readAppointment(order)
  return !!info.from && !!info.to && info.from < info.to
}

/** 倒计时徽章（P0-145 迁入）：按止日计算，每次渲染按当天动态算；未约单（无日期）与已完成单不显示 */
export function getAppointmentCountdown(order: Order, today: string = todayLocal()): CountdownBadge | null {
  const date = readAppointment(order).to
  if (!date || order.status === '已完成') return null
  const diff = Math.round((new Date(date + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / DAY_MS)
  if (diff < 0) return { text: `已过期${-diff}天`, tone: 'expired' }
  if (diff === 0) return { text: '今天装', tone: 'today' }
  if (diff === 1) return { text: '明天装', tone: 'tomorrow' }
  return { text: `还剩${diff}天`, tone: 'future' }
}

/** 区间展示文本（原 appointmentCountdown.formatAppointmentRange 迁入）：= readAppointment().displayText */
export function formatAppointmentRange(order: Order): string {
  return readAppointment(order).displayText
}
