export type MaterialCategory = '线缆' | '管材' | '辅材' | '工具' | '其他' | '漏保' | '接地' | '保护箱' | '立柱' | '开孔' | '路面' | '桥架' | '吊筋' | '电表' | '浪涌' | '服务' | '拆除' | '安装' | '基础' | '高空'

export type MaterialCategoryCode = 'CABLE' | 'PVC' | 'BREAKER' | 'GROUND' | 'OTHER' | 'BOX' | 'POLE' | 'WALL_DRILL' | 'ROAD_OPEN' | 'BRIDGE' | 'HANGER' | 'METER' | 'SURGE' | 'SERVICE' | 'REMOVE' | 'INSTALL' | 'FOUNDATION' | 'HIGH_ALTITUDE'

export const CATEGORY_CODE_MAP: Record<MaterialCategoryCode, MaterialCategory> = {
  CABLE: '线缆',
  PVC: '管材',
  BREAKER: '漏保',
  GROUND: '接地',
  OTHER: '其他',
  BOX: '保护箱',
  POLE: '立柱',
  WALL_DRILL: '开孔',
  ROAD_OPEN: '路面',
  BRIDGE: '桥架',
  HANGER: '吊筋',
  METER: '电表',
  SURGE: '浪涌',
  SERVICE: '服务',
  REMOVE: '拆除',
  INSTALL: '安装',
  FOUNDATION: '基础',
  HIGH_ALTITUDE: '高空',
}

export interface Material {
  id: string
  name: string
  category: MaterialCategory
  categoryCode?: MaterialCategoryCode
  unit: string
  costPrice: number | null
  settlementPrice: number
  customerPrice?: number
  brand?: string | null
  freeQuota?: number
  source?: 'cost' | 'addon'
  stock: number
  minStock: number
  isFixed?: boolean
  createdAt?: number
  updatedAt?: number
}

export interface MaterialUsage {
  materialId: string
  quantity: number
  unitPrice: number
}

export interface MaterialUsageRecord {
  id: string
  date: string
  name: string
  unit: string
  costPrice: number
  quantity: number
  total: number
  merged?: boolean
}
