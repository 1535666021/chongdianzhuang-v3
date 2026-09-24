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
  actualInstallDate?: string
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
  /** 补桩状态（仅安装单）：needed=需补桩 / done=已补桩 */
  restockStatus?: 'needed' | 'done'
  /** 结算编辑最后时间（完工单事后修改留痕） */
  lastEditedAt?: number
  /** 结算编辑次数 */
  editCount?: number
  /** 完工结算-电缆米数（编辑态回填用） */
  completionCableMeters?: number
  /** 完工结算-PVC米数 */
  completionPvcMeters?: number
  /** 完工结算-漏保型号 */
  completionBreakerType?: string
}
export type GroupMode = 'region' | 'time' | 'smart'

export interface OrderFilter {
  status?: OrderStatus
  platform?: string | null
  region?: string
  areaTag?: string | null
  dateRange?: [string, string]
  keyword?: string
  installType?: InstallType | null
  brand?: string | null
  sortBy?: 'createdAt' | 'appointmentDate' | 'completeDate' | 'customerName' | 'businessTime'
  sortOrder?: 'asc' | 'desc'
  groupMode?: GroupMode
}
