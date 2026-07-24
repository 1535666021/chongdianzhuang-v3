/**
 * 老系统数据读取器
 * 兼容 v32.1 快照数据格式
 */
export interface LegacyOrderData {
  id: string
  customerName: string
  phone: string
  address: string
  platform: string
  status: string
  region: string
  appointmentDate?: string
  appointmentTime?: string
  materialCost: number
  laborCost: number
  platformFee: number
  actualProfit: number
  notes: string
  meterStatus: string
  createdAt: number
}

export function readLegacyOrders(): LegacyOrderData[] {
  try {
    const raw = localStorage.getItem('cdz_orders')
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}
