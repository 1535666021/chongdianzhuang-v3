export const POWER_MAP: Record<string, string> = {
  '3.5': '3.5kW',
  '3.5kW': '3.5kW',
  '7': '7kW',
  '7kW': '7kW',
  '11': '11kW',
  '11kW': '11kW',
  '21': '21kW',
  '21kW': '21kW',
  '22': '22kW',
  '22kW': '22kW',
}

export const POWER_OPTIONS = ['3.5', '7', '11', '21', '22']

export function getPowerLabel(power: string | undefined): string {
  const value = power?.trim() || ''
  return POWER_MAP[value] || (value ? `${value}kW` : '未知')
}
