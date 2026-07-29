import { costMaterials } from '@/constants/materialData'

interface PresetRule {
  keywords: string[]
  exclude?: string[]
  costName: string
}

const PRESET_RULES: PresetRule[] = [
  { keywords: ['保护箱'], exclude: ['仅安装', '自购', '安装'], costName: '保护箱' },
  { keywords: ['保护箱'], exclude: ['含箱体'], costName: '保护箱安装费' },
  { keywords: ['立柱'], exclude: ['仅安装', '自购', '安装'], costName: '立柱' },
  { keywords: ['立柱'], exclude: ['含立柱'], costName: '立柱安装费' },
  { keywords: ['吊丝'], costName: '吊丝' },
  { keywords: ['打孔', '开孔'], costName: '开孔' },
]

function matchesRule(name: string, rule: PresetRule): boolean {
  if (!rule.keywords.every((k) => name.includes(k))) return false
  if (rule.exclude && rule.exclude.some((e) => name.includes(e))) return false
  return true
}

export function matchCostName(materialName: string): string | null {
  for (const rule of PRESET_RULES) {
    if (matchesRule(materialName, rule)) return rule.costName
  }
  return null
}

export function getCostPrice(materialName: string): number | null {
  const costName = matchCostName(materialName)
  if (!costName) return null
  const costItem = costMaterials.find((m) => m.name === costName)
  return costItem?.costPrice ?? null
}

export function getCostMaterialList(): { name: string; costPrice: number }[] {
  return costMaterials.map((m) => ({ name: m.name, costPrice: m.costPrice ?? 0 }))
}
