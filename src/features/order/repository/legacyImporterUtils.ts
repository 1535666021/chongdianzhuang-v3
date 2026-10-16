import type { InstallType, OrderMaterialItem, OrderStatus, OrderSurvey, Platform, Region } from '@/types'
import { extractBrandName, extractPlatformName, METERS_RE, POWER_RE } from '@/lib/parser-core'
import { useSettingsStore } from '@/stores/settingsStore'

export const STATUS_MAP: Record<string, OrderStatus> = {
  pending: '待办', surveyed: '待办', appointed: '已预约', appointment: '已预约', scheduled: '已预约', booked: '已预约',
  completed: '已完成', done: '已完成', finished: '已完成', cancelled: '待办', trash: '回收站', deleted: '回收站',
  待办: '待办', 已勘测: '待办', 已预约: '已预约', 已完成: '已完成', 已取消: '待办', 回收站: '回收站',
}

export function mapPlatform(raw: unknown): Platform {
  const text = String(raw || '').trim()
  if (text === '京东' || text === 'jd' || text === 'JD') return '京东'
  if (text === '天猫') return '天猫'
  if (text === '淘宝') return '淘宝'
  if (text === '拼多多') return '拼多多'
  if (text === '抖音') return '抖音'
  return '其他'
}

export function mapRegion(raw: unknown): Region {
  const text = String(raw || '').trim().replace(/[省市]$/, '')
  const regions: Region[] = ['巢湖', '合肥', '芜湖', '马鞍山', '滁州', '宣城', '安庆', '其他']
  return regions.find((region) => region === text || text.includes(region)) || '其他'
}

export function asStr(value: unknown): string {
  if (value === undefined || value === null) return ''
  return typeof value === 'string' ? value : String(value)
}

export function pickNum(...candidates: unknown[]): number {
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null || candidate === '') continue
    const value = Number(candidate)
    if (Number.isFinite(value)) return value
  }
  return 0
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export function asDateStr(value: unknown): string {
  if (value === undefined || value === null || value === '') return ''
  if (typeof value !== 'number' || !Number.isFinite(value)) return asStr(value)
  const date = new Date(value < 1e12 ? value * 1000 : value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function extractPhone(raw: unknown): string {
  const text = asStr(raw)
  return text.match(/1[3-9]\d{9}/)?.[0] || text
}

export function shouldFlipToAppointed(rawStatus: string, finalStatus: OrderStatus, raw: Record<string, unknown>): OrderStatus {
  if (rawStatus !== 'pending' && finalStatus !== '待办') return finalStatus
  const appointment = raw.appointment
  if (appointment && typeof appointment === 'object') {
    const value = appointment as Record<string, unknown>
    if (asStr(value.appointmentDate || value.date).trim() && asStr(value.timeSlot || value.time || value.period).trim()) return '已预约'
  }
  if (asStr(raw.appointmentDate).trim() && asStr(raw.appointmentTime || raw.appointmentPeriod || raw.timeSlot).trim()) return '已预约'
  return finalStatus
}

export function getMoneyContainer(raw: Record<string, unknown>): Record<string, unknown> {
  for (const candidate of [raw.profitData, raw.finance, raw.settlement, raw.costData, raw.money]) {
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) return candidate as Record<string, unknown>
  }
  return {}
}

export function platformRate(platform: Platform): number {
  return useSettingsStore.getState().getPlatformFeeRate(platform)
}

export function inferInstallType(serviceType: string, remark: string): InstallType | undefined {
  const service = serviceType.toLowerCase()
  const note = remark.toLowerCase()
  if (service.includes('带桩') || note.includes('带桩上门')) return '带桩上门'
  if (service.includes('维修')) return '维修'
  if (/勘察|勘测/.test(service)) return '勘察'
  if (service.includes('检测')) return '检测'
  if (service.includes('拆桩')) return '拆桩'
  if (service.includes('移机')) return '移机'
  if (service.includes('安装')) return '仅安装'
  return undefined
}

export function safeMaterials(raw: unknown): OrderMaterialItem[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const material = item as Record<string, unknown>
    return [{
      name: asStr(material.name || material.materialName || material.title),
      spec: asStr(material.spec || material.specification || material.model) || undefined,
      quantity: pickNum(material.quantity, material.count, material.qty, material.num) || 1,
      unit: asStr(material.unit || material.unitText) || '个',
      unitPrice: pickNum(material.unitPrice, material.price, material.settlementPrice, material.costPrice),
    }]
  })
}

export function safeSurvey(raw: unknown): OrderSurvey | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const survey = raw as Record<string, unknown>
  const hasFields = asStr(survey.powerSource || survey.cableSpec || survey.installMethod || survey.meterStatus || survey.surveyResult).trim()
    || Number(survey.cableDistance) > 0 || Number(survey.estimatedCableCost) > 0
  if (!hasFields) return undefined
  return {
    estimatedMaterials: safeMaterials(survey.estimatedMaterials || survey.materials || survey.items),
    powerSource: validatePowerSource(asStr(survey.powerSource)),
    cableSpec: asStr(survey.cableSpec) || undefined,
    cableDistance: pickNum(survey.cableDistance) || undefined,
    estimatedCableCost: pickNum(survey.estimatedCableCost) || undefined,
    installMethod: validateInstallMethod(asStr(survey.installMethod)),
    meterStatus: validateMeterStatus(asStr(survey.meterStatus)),
    needBlueprint: validateBlueprint(asStr(survey.needBlueprint)),
    surveyResult: validateSurveyResult(asStr(survey.surveyResult)),
    locationInfo: asStr(survey.locationInfo) || undefined,
  }
}

function validatePowerSource(value: string): OrderSurvey['powerSource'] {
  return value === '物业配电' || value === '自家电表' || value === '其他' ? value : '国网取电'
}

function validateInstallMethod(value: string): OrderSurvey['installMethod'] {
  return value === '立柱安装' || value === '吊装' || value === '其他' ? value : '壁挂安装'
}

function validateMeterStatus(value: string): OrderSurvey['meterStatus'] {
  return value === '未安装' ? '未安装' : '已安装'
}

function validateBlueprint(value: string): OrderSurvey['needBlueprint'] {
  return value === '是' ? '是' : '否'
}

function validateSurveyResult(value: string): OrderSurvey['surveyResult'] {
  const valid = ['勘测完成', '符合安装', '不符合安装', '需整改', '待定'] as const
  return valid.includes(value as (typeof valid)[number]) ? value as (typeof valid)[number] : '勘测完成'
}

export function fillOrderTextFallbacks(rawText: string, values: { brandName?: string; platformName?: string; powerKw?: string; packageMeters?: string; serviceType?: string }) {
  const next = { ...values }
  if (!next.brandName) next.brandName = extractBrandName(rawText) || undefined
  if (!next.platformName) next.platformName = extractPlatformName(rawText) || undefined
  if (!next.powerKw) next.powerKw = rawText.match(POWER_RE)?.[1]
  if (!next.packageMeters) next.packageMeters = rawText.match(METERS_RE)?.[1]
  if (!next.serviceType) {
    const matched = [['带桩上门', '带桩上门'], ['维修', '维修'], ['勘察', '勘察'], ['勘测', '勘察'], ['检测', '检测'], ['拆桩', '拆桩'], ['移机', '移机'], ['安装', '仅安装']] as const
    next.serviceType = matched.find(([term]) => rawText.includes(term))?.[1]
  }
  return next
}
