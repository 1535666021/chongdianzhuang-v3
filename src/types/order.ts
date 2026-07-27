import type { BaseEntity, Platform, OrderStatus, Region, InstallType } from './common'

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

export interface OrderSurvey {
  surveyDate: string
  meterLocation: '楼道' | '车库' | '户外' | '其他'
  cableRoute: string
  difficulty: '简单' | '一般' | '复杂' | '极难'
  estimatedMaterials?: OrderMaterialItem[]
  photosDesc: string
  notes: string
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
  completeDate?: string
  customerPrice?: number
  installer?: string
  materials?: OrderMaterialItem[]
  payment?: OrderPayment
  survey?: OrderSurvey
  /* ---- 解析原始字段（可选） ---- */
  orderNo?: string
  vin?: string
  brandName?: string
  powerKw?: string
  packageMeters?: string
  serviceType?: string
  platformName?: string
  remark?: string
  rawText?: string
  installType?: InstallType
}

export interface OrderFilter {
  status?: OrderStatus
  platform?: Platform
  region?: Region
  dateRange?: [string, string]
  keyword?: string
}
