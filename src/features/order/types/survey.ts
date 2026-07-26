export interface OrderSurvey {
  surveyDate: string
  meterLocation: '楼道' | '车库' | '户外' | '其他'
  cableRoute: string
  difficulty: '简单' | '一般' | '复杂' | '极难'
  estimatedMaterials?: SurveyMaterialItem[]
  photosDesc: string
  notes: string
}

export interface SurveyMaterialItem {
  name: string
  spec?: string
  quantity: number
  unit: string
  unitPrice: number
}

export interface SurveyFormData {
  surveyDate: string
  meterLocation: '楼道' | '车库' | '户外' | '其他'
  cableRoute: string
  difficulty: '简单' | '一般' | '复杂' | '极难'
  estimatedMaterials: SurveyMaterialItem[]
  photosDesc: string
  notes: string
}
