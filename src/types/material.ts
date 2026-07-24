import type { ID } from './common'

export type MaterialCategory = '线缆' | '管材' | '辅材' | '工具' | '其他'

export interface Material extends BaseEntity {
  name: string
  category: MaterialCategory
  unit: string
  costPrice: number
  settlementPrice: number
  stock: number
  minStock: number
}

export interface MaterialUsage {
  materialId: ID
  quantity: number
  unitPrice: number
}
