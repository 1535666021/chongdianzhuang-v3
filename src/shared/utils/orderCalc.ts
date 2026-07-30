export const DEFAULT_OVER_PRICE = 45
export const DEFAULT_PACKAGE_METERS = 30

import { costMaterials } from '@/constants/materialData'
import { matchCostName } from '@/features/material/hooks/useCostMatcher'
import { getCostMapping } from '@/shared/storage/costMappingStorage'

export const SERVICE_FEE: Record<string, number> = {
  安装: 300,
  维修: 60,
  勘察: 0,
  勘测: 0,
}

export interface OverFeeResult {
  overMeters: number
  overPrice: number
  overFee: number
}

export function calcOverFee(
  actualMeters: number,
  packageMeters = DEFAULT_PACKAGE_METERS,
  overPrice = DEFAULT_OVER_PRICE
): OverFeeResult {
  const over = Math.max(0, actualMeters - packageMeters)
  return { overMeters: over, overPrice, overFee: over * overPrice }
}

export function calcAddonTotal(materials: Array<{ quantity: number; unitPrice: number }>) {
  return materials.reduce((s, m) => s + m.quantity * m.unitPrice, 0)
}

export function buildAddonItemsText(
  materials: Array<{ name: string; quantity: number; unit: string; unitPrice: number }>
) {
  return materials
    .map((m) => {
      const subtotal = (m.quantity * m.unitPrice).toFixed(2)
      return `${m.name} ${m.quantity}${m.unit} × ¥${m.unitPrice} = ¥${subtotal}`
    })
    .join('\n')
}

export interface MaterialCostResult {
  total: number
  unmatched: string[]
}

export function calcProfit(
  customerPrice: number,
  materialCost: number,
  platformFee: number,
  serviceFee = 0
) {
  return customerPrice - materialCost - platformFee + serviceFee
}

export function calcPlatformFee(receivable: number, rate: number) {
  return receivable * rate
}

export function getServiceFee(orderNotes: string) {
  const notes = orderNotes || ''
  if (notes.includes('维修')) return SERVICE_FEE['维修']
  if (notes.includes('勘察') || notes.includes('勘测')) return SERVICE_FEE['勘察']
  return SERVICE_FEE['安装']
}

export function buildPlatformBrand(platform: string, brandName: string) {
  return `${platform || ''} ${brandName || ''}`.trim()
}

export function buildAddonSummary(customerTotal: number, actualProfit: number) {
  if (customerTotal && actualProfit && customerTotal !== actualProfit) {
    return `客户增项合计 ¥${customerTotal.toFixed(2)}\n实收 ¥${actualProfit.toFixed(2)}`
  }
  return `客户增项合计 ¥${(customerTotal || actualProfit || 0).toFixed(2)}`
}

const FREE_QUOTA_KEYWORDS = ['电缆', 'PVC', 'YJV', 'yjv']

export function isFreeQuotaMaterial(name: string) {
  return FREE_QUOTA_KEYWORDS.some((k) => name.includes(k))
}

export function extractCableMeters(materials: Array<{ name: string; quantity: number }>) {
  const cable = materials.find((m) => m.name.includes('电缆') || m.name.includes('YJV') || m.name.includes('yjv'))
  return cable ? cable.quantity : 0
}

export function calcMaterialCost(materials: Array<{ name: string; quantity: number }>): MaterialCostResult {
  const unmatched: string[] = []
  const total = materials.reduce((sum, m) => {
    const mappedName = getCostMapping(m.name)
    if (mappedName) {
      const costItem = costMaterials.find((c) => c.name === mappedName)
      return sum + (costItem?.costPrice || 0) * m.quantity
    }
    const matchedName = matchCostName(m.name)
    if (matchedName) {
      const costItem = costMaterials.find((c) => c.name === matchedName)
      return sum + (costItem?.costPrice || 0) * m.quantity
    }
    unmatched.push(m.name)
    return sum
  }, 0)
  return { total, unmatched }
}
