export interface SurveyMaterialItem {
  name: string
  spec?: string
  quantity: number
  unit: string
  unitPrice: number
}

export interface SurveyFormData {
  // 📦 预估材料
  estimatedMaterials: SurveyMaterialItem[]

  // 🔌 线缆信息
  powerSource: '国网取电' | '物业配电' | '自家电表' | '其他'
  cableSpec: string
  cableDistance: number
  estimatedCableCost: number

  // 🔧 勘测详情
  installMethod: '壁挂安装' | '立柱安装' | '吊装' | '其他'
  meterStatus: '已安装' | '未安装'
  needBlueprint: '是' | '否'
  surveyResult: '勘测完成' | '符合安装' | '不符合安装' | '需整改' | '待定'

  // 📍 位置信息
  locationInfo: string
}

export interface OrderSurvey extends SurveyFormData {}
