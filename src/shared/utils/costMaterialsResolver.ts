/**
 * P0-126：成本表动态读取——常量底表20项 + 用户新增项（materialStore，id前缀custom_cost_）。
 * 模块级同步函数（zustand getState），供非hook消费方（useCompletion/useCostMatcher）同源读取；
 * 新增/删除后即时生效，禁缓存副本。
 */
import { costMaterials } from '@/constants/costMaterialData'
import { useMaterialStore } from '@/stores/materialStore'
import type { Material } from '@/types'

/** 新增成本材料id前缀：标记用户新增项，防误吞材料池其他材料 */
export const CUSTOM_COST_PREFIX = 'custom_cost_'

export function isCustomCostMaterial(id: string): boolean {
  return id.startsWith(CUSTOM_COST_PREFIX)
}

export function getAllCostMaterials(): Material[] {
  const stored = useMaterialStore.getState().materials
  const customs = stored.filter((s) => isCustomCostMaterial(s.id))
  return [...costMaterials, ...customs]
}
