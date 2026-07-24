import type { BaseEntity, Platform, OrderStatus, Region } from './common'

export interface Order extends BaseEntity {
  customerName: string
  phone: string
  address: string
  platform: Platform
  status: OrderStatus
  region: Region
  appointmentDate?: string
  appointmentTime?: string
  materialCost: number
  laborCost: number
  platformFee: number
  actualProfit: number
  notes: string
  meterStatus: '已安装' | '未安装'
  meterNumber?: string
}

export interface OrderFilter {
  status?: OrderStatus
  platform?: Platform
  region?: Region
  dateRange?: [string, string]
  keyword?: string
}
