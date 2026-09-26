/**
 * P0-128：增项材料动态读取——addonMaterialsData常量572项 + 用户新增项
 * （materialStore，id前缀custom_addon_）。模块级同步函数（zustand getState），
 * 禁缓存副本；新增/删除后 ExtraItemManager/SurveyModal/MaterialPicker/useMaterial 同源即时生效。
 */
import { addonMaterialsData } from '@/constants/materialData'
import { useMaterialStore } from '@/stores/materialStore'
import type { Material } from '@/types'

export const CUSTOM_ADDON_PREFIX = 'custom_addon_'

export function isCustomAddonMaterial(id: string): boolean {
  return id.startsWith(CUSTOM_ADDON_PREFIX)
}

export function getAllAddonMaterials(): Material[] {
  const stored = useMaterialStore.getState().materials
  const customs = stored.filter((s) => isCustomAddonMaterial(s.id))
  return [...addonMaterialsData, ...customs]
}
