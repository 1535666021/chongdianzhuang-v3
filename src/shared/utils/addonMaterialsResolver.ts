/**
 * P0-128：增项材料动态读取——addonMaterialsData常量572项 + 用户新增项
 * （materialStore，id前缀custom_addon_）。模块级同步函数（zustand getState），
 * 禁缓存副本；新增/删除后 ExtraItemManager/SurveyModal/MaterialPicker/useMaterial 同源即时生效。
 */
import { addonMaterialsData } from '@/constants/materialData'
import { useMaterialStore } from '@/stores/materialStore'
import type { Material } from '@/types'
import { getDeletedAddonIds } from '@/shared/storage/addonDeleteListStorage'

export const CUSTOM_ADDON_PREFIX = 'custom_addon_'

export function isCustomAddonMaterial(id: string): boolean {
  return id.startsWith(CUSTOM_ADDON_PREFIX)
}

export function getAllAddonMaterials(): Material[] {
  const stored = useMaterialStore.getState().materials
  const customs = stored.filter((s) => isCustomAddonMaterial(s.id))
  // P0-129：底表删除名单过滤（被删底表项不进入任何计算/显示；常量文件零改动）
  const deleted = getDeletedAddonIds()
  return [...addonMaterialsData.filter((m) => !deleted.includes(m.id)), ...customs]
}
