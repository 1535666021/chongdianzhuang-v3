import type { BaseEntity, Platform, OrderStatus, Region } from './common'

export interface OrderMaterialItem {
  name: string
  spec?: string
  quantity: number
  unit: string
  unitPrice: number
}

export interface OrderPayment {
  paid: boolean
  paidDate?: string
}

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
  // 批次7新增：财务对账所需（全部可选，兼容旧数据）
  completeDate?: string
  customerPrice?: number
  installer?: string
  materials?: OrderMaterialItem[]
  payment?: OrderPayment
}

export interface OrderFilter {
  status?: OrderStatus
  platform?: Platform
  region?: Region
  dateRange?: [string, string]
  keyword?: string
}
