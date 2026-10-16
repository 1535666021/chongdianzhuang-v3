import type { Order, OrderStatus, Platform, Region } from '@/types'
import type { LegacyOrderData } from './legacyReader'
import { normalizeForImport } from '@/features/appointment/repository'

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

export function mapLegacyToNew(legacy: LegacyOrderData): Order {
  // P0-160：预约翻正（pending+有预约信息→已预约）迁入预约模块 normalizeForImport，此处只取状态映射
  const finalStatus = STATUS_MAP[legacy.status || ''] || '待办'

  const order: Order = {
    id: legacy.id || String(Date.now()),
    customerName: legacy.customerName || '',
    phone: legacy.phone || '',
    address: legacy.address || '',
    platform: (legacy.platform || '其他') as Platform,
    status: finalStatus,
    region: (legacy.region || '其他') as Region,
    materialCost: legacy.materialCost || 0,
    laborCost: legacy.laborCost || 0,
    platformFee: legacy.platformFee || 0,
    actualProfit: legacy.actualProfit || 0,
    notes: legacy.notes || '',
    meterStatus: (legacy.meterStatus || '未安装') as '已安装' | '未安装',
    createdAt: legacy.createdAt || Date.now(),
    updatedAt: Date.now(),
  }

  // P0-160：预约字段搬运+规范化走模块唯一入口（已预约无日期 → 降级待办，原P0-159规则）
  return normalizeForImport(order, legacy)
}
