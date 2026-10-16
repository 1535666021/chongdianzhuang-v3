const MAPPING_KEY = 'cdz_cost_mapping_v1'

export interface CostMapping {
  materialName: string
  costName: string
  boundAt: number
}

function loadAll(): CostMapping[] {
  try {
    const raw = localStorage.getItem(MAPPING_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveAll(mappings: CostMapping[]): void {
  localStorage.setItem(MAPPING_KEY, JSON.stringify(mappings))
}

export function getCostMapping(materialName: string): string | null {
  const found = loadAll().find((m) => m.materialName === materialName)
  return found?.costName ?? null
}

export function setCostMapping(materialName: string, costName: string): void {
  const mappings = loadAll().filter((m) => m.materialName !== materialName)
  mappings.push({ materialName, costName, boundAt: Date.now() })
  saveAll(mappings)
}

export function removeCostMapping(materialName: string): void {
  saveAll(loadAll().filter((m) => m.materialName !== materialName))
}

/** P0-126：删除成本材料时，清理映射表中所有指向该成本名的条目（绑定映射同步清理） */
export function removeCostMappingsByCostName(costName: string): void {
  saveAll(loadAll().filter((m) => m.costName !== costName))
}
