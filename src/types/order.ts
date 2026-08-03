import type { BaseEntity, Platform, OrderStatus, Region, InstallType } from './common'
export interface OrderMaterialItem { name: string; spec?: string; quantity: number; unit: string; unitPrice: number }
export interface OrderPayment { paid: boolean; paidDate?: string }
export interface OrderSurvey {
  estimatedMaterials?: OrderMaterialItem[]
  powerSource?: '国网取电' | '物业配电' | '自家电表' | '其他'
  cableSpec?: string; cableDistance?: number; estimatedCableCost?: number
  installMethod?: '壁挂安装' | '立柱安装' | '吊装' | '其他'
  meterStatus?: '已安装' | '未安装'; needBlueprint?: '是' | '否'
  surveyResult?: '勘测完成' | '符合安装' | '不符合安装' | '需整改' | '待定'
  locationInfo?: string
}
export interface Order extends BaseEntity {
  customerName: string
  phone: string
  address: string
  platform: Platform
  status: OrderStatus
  region: Region
  appointmentDate?: string; appointmentTime?: string; appointmentNote?: string
  materialCost: number; laborCost: number
  platformFee: number
  actualProfit: number
  notes: string
  meterStatus: '已安装' | '未安装'
  meterNumber?: string
  completeDate?: string
  customerPrice?: number
  serviceFee?: number
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
  surveyNote?: string
  completionNotes?: string
  nature?: string
}
export interface OrderFilter {
  status?: OrderStatus
  platform?: Platform
  region?: Region
  dateRange?: [string, string]
  keyword?: string
}
