import type { Order } from '@/types'

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
    platformBrand: (order.platformName || order.platform || '') + ' ' + (order.brandName || ''),
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
      vars.addonItems = survey.estimatedMaterials
        .map(m => `${m.name} ${m.quantity}${m.unit} × ¥${m.unitPrice} = ¥${(m.quantity * m.unitPrice).toFixed(2)}`)
        .join('\n')
      vars.addonTotal = survey.estimatedMaterials
        .reduce((s, m) => s + m.quantity * m.unitPrice, 0)
        .toFixed(2)
    }
  }

  vars.completeDate = order.completeDate || ''
  const cableItem = order.materials?.find(m => m.name.includes('电缆') || m.name.includes('YJV'))
  vars.actualCable = cableItem ? String(cableItem.quantity) : (vars.cableDistance || '0')

  const pkg = order.packageMeters ? parseInt(order.packageMeters) : 30
  const actual = parseFloat(vars.actualCable) || 0
  const over = Math.max(0, actual - pkg)
  vars.overMeters = String(over)
  vars.overPrice = '45'
  vars.overFee = (over * 45).toFixed(2)

  const custTotal = order.customerPrice || 0
  const actProfit = order.actualProfit || 0
  if (custTotal && actProfit && custTotal !== actProfit) {
    vars.addonSummary = `客户增项合计 ¥${custTotal.toFixed(2)}\n实收 ¥${actProfit.toFixed(2)}`
  } else {
    vars.addonSummary = `客户增项合计 ¥${(custTotal || actProfit || 0).toFixed(2)}`
  }

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
