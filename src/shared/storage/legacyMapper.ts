import type { Order, OrderStatus, Platform, Region } from '@/types'
import type { LegacyOrderData } from './legacyReader'

/** v7 状态 → v3 中文状态映射（含历史别名） */
const STATUS_MAP: Record<string, OrderStatus> = {
  'pending':     '待办',
  'surveyed':    '待办',
  'appointed':   '已预约',
  'appointment': '已预约',
  'scheduled':   '已预约',
  'booked':      '已预约',
  'completed':   '已完成',
  'done':        '已完成',
  'finished':    '已完成',
  'cancelled':   '待办',
  'trash':       '回收站',
  'deleted':     '回收站',
  '待办':        '待办',
  '已勘测':      '待办',
  '已预约':      '已预约',
  '已完成':      '已完成',
  '已取消':      '待办',
  '回收站':      '回收站',
}

/** 翻正逻辑：pending + 有预约信息 → 已预约 */
function shouldFlipToAppointed(
  rawStatus: string,
  finalStatus: OrderStatus,
  legacy: LegacyOrderData
): OrderStatus {
  if (rawStatus !== 'pending' && finalStatus !== '待办') return finalStatus

  const hasDate = (legacy.appointmentDate || '').trim() !== ''
  const hasTime = (legacy.appointmentTime || '').trim() !== ''
  if (hasDate && hasTime) return '已预约'

  return finalStatus
}

export function mapLegacyToNew(legacy: LegacyOrderData): Order {
  const rawStatus = legacy.status || ''
  let finalStatus = STATUS_MAP[rawStatus] || '待办'
  finalStatus = shouldFlipToAppointed(rawStatus, finalStatus, legacy)

  const order: Order = {
    id: legacy.id || String(Date.now()),
    customerName: legacy.customerName || '',
    phone: legacy.phone || '',
    address: legacy.address || '',
    platform: (legacy.platform || '其他') as Platform,
    status: finalStatus,
    region: (legacy.region || '其他') as Region,
    appointmentDate: legacy.appointmentDate,
    appointmentTime: legacy.appointmentTime,
    materialCost: legacy.materialCost || 0,
    laborCost: legacy.laborCost || 0,
    platformFee: legacy.platformFee || 0,
    actualProfit: legacy.actualProfit || 0,
    notes: legacy.notes || '',
    meterStatus: (legacy.meterStatus || '未安装') as '已安装' | '未安装',
    createdAt: legacy.createdAt || Date.now(),
    updatedAt: Date.now(),
  }

  return order
}
