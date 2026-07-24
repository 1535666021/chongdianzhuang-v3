import type { BaseEntity } from './common'

export type MaterialCategory = '线缆' | '管材' | '辅材' | '工具' | '其他'

export type MaterialCategoryCode = 'CABLE' | 'PVC' | 'BREAKER' | 'GROUND' | 'OTHER'

export const CATEGORY_CODE_MAP: Record<MaterialCategoryCode, MaterialCategory> = {
  CABLE: '线缆',
  PVC: '管材',
  BREAKER: '辅材',
  GROUND: '工具',
  OTHER: '其他',
}

export interface Material extends BaseEntity {
  name: string
  category: MaterialCategory
  categoryCode?: MaterialCategoryCode
  unit: string
  costPrice: number
  settlementPrice: number
  stock: number
  minStock: number
  isFixed?: boolean
}

export interface MaterialUsage {
  materialId: string
  quantity: number
  unitPrice: number
}
