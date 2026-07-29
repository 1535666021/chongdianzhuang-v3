import type { Order } from '@/types'
import {
  calcOverFee,
  calcAddonTotal,
  buildAddonItemsText,
  buildAddonSummary,
  buildPlatformBrand,
  extractCableMeters,
} from '@/shared/utils/orderCalc'

export function buildScriptVars(
  order: Order,
  scene: string,
  settings: { engineerName: string; engineerPhone: string }
): Record<string, string> {
  const survey = order.survey
  const vars: Record<string, string> = {
    customerName: order.customerName || '',
    phone: order.phone || '',
    address: order.address || '',
    brand: order.brandName || '',
    installer: settings.engineerName || '谢责强',
    appointmentDate: order.appointmentDate || '',
    timeSlot: order.appointmentTime || '',
    amount: String(order.customerPrice || 0),
    notes: order.notes || '',
    city: order.address?.slice(0, 2) || '',
    platformBrand: buildPlatformBrand(order.platformName || order.platform || '', order.brandName || ''),
  }

  if (survey) {
    vars.surveyDate = new Date().toISOString().slice(0, 10)
    vars.powerSource = survey.powerSource || ''
    vars.installType = survey.installMethod || ''
    vars.meterStatus = survey.meterStatus || ''
    vars.needPlanDoc = survey.needBlueprint || ''
    vars.surveyResult = survey.surveyResult || ''
    vars.surveyNote = survey.locationInfo || ''
    vars.cableDistance = String(survey.cableDistance || 0)

    if (survey.estimatedMaterials?.length) {
      vars.addonItems = buildAddonItemsText(survey.estimatedMaterials)
      vars.addonTotal = calcAddonTotal(survey.estimatedMaterials).toFixed(2)
    }
  }

  vars.completeDate = order.completeDate || ''
  vars.actualCable = String(extractCableMeters(order.materials || []) || vars.cableDistance || '0')

  const pkg = order.packageMeters ? parseInt(order.packageMeters) : 30
  const actual = parseFloat(vars.actualCable) || 0
  const { overMeters, overPrice, overFee } = calcOverFee(actual, pkg)
  vars.overMeters = String(overMeters)
  vars.overPrice = String(overPrice)
  vars.overFee = overFee.toFixed(2)

  vars.addonSummary = buildAddonSummary(order.customerPrice || 0, order.actualProfit || 0)
  vars.installDetail = survey ? `${survey.installMethod || ''} ${survey.powerSource || ''}` : ''
  vars.propertyAllow = ''
  return vars
}

export function renderScript(template: string, vars: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '')
  }
  result = result.replace(/{{[a-zA-Z]+}}/g, '')
  return result.trim()
}
