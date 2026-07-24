import type { Order } from '@/types'
import type { LegacyOrderData } from './legacyReader'

export function mapLegacyToNew(legacy: LegacyOrderData): Order {
  const order: any = {
    id: legacy.id || String(Date.now()),
    customerName: legacy.customerName || '',
    phone: legacy.phone || '',
    address: legacy.address || '',
    platform: legacy.platform || '其他',
    status: legacy.status || '待办',
    region: legacy.region || '其他',
    appointmentDate: legacy.appointmentDate,
    appointmentTime: legacy.appointmentTime,
    materialCost: legacy.materialCost || 0,
    laborCost: legacy.laborCost || 0,
    platformFee: legacy.platformFee || 0,
    actualProfit: legacy.actualProfit || 0,
    notes: legacy.notes || '',
    meterStatus: legacy.meterStatus || '未安装',
    createdAt: legacy.createdAt || Date.now(),
    updatedAt: Date.now(),
  }
  return order as Order
}
