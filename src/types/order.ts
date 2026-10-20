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
  /** P0-199-R1：重复隔离箱标记（true=隔离中，主页/已完成/统计/查重均视为不存在） */
  dupQuarantine?: boolean
  region: Region
  appointmentDate?: string; appointmentTime?: string; appointmentNote?: string
  materialCost: number; laborCost: number
  platformFee: number
  actualProfit: number
  notes: string
  /** P0-140-R3：万联流式变体——车型/桩名称/安装方式（可空） */
  vehicleModel?: string
  pileName?: string
  installMode?: string
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
  /** P0-142：可约时间窗口（绝对日期 YYYY-MM-DD，设档锁定，预约成功自动清除） */
  /** P0-142-R3：预约区间（起止绝对日期；老 appointmentDate 单由一次性迁移补为同日区间） */
  appointmentFrom?: string
  appointmentTo?: string
  /** P0-142-R3：预约时段（上午/下午） */
  appointmentPeriod?: string
  /** P0-139-R1：软删除标记（时间戳）；回收站单，undefined=正常 */
  deletedAt?: number
  /** P0-138：双联系人结构化（外联单车主+联系人）；主字段customerName/phone=车主优先，全链既有消费方零改动 */
  contacts?: Array<{ relation: string; name: string; phone: string }>
  /** P0-133-R2：子品牌/型号 */
  subBrand?: string
  powerKw?: string
  packageMeters?: string
  serviceType?: string
  platformName?: string
  remark?: string
  rawText?: string
  installType?: InstallType
  surveyNote?: string
  /** P0-114：勘测实收金额（空=按预估费用计算；有值=按实收计算，仅作用客户侧） */
  surveyActualReceive?: number
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
  /** P0-165-R1：出差单标记（修正器按"现扣点=0"判定补写） */
  isBusinessTrip?: boolean
  /** P0-165-R1：出差补助（30/台，普通单=0） */
  tripSubsidy?: number
  /** P0-165-R1：对账利润（应收-扣点+安装费+出差补助，不减材料不减工资） */
  reconciliationProfit?: number
  /** P0-165-R1：政策修正留痕 */
  lastPolicyFixAt?: number
  policyFixVersion?: string
  /** P0-177-R1：利润一致性巡检留痕 */
  lastProfitAuditAt?: number
  /** P0-181：服务费特批覆盖留痕（手改输入框时置真） */
  isServiceFeeOverridden?: boolean
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
