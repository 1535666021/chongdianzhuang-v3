/**
 * P0-142-R3：日期工具（可约窗口行已下线，本文件保留通用日期口径）。
 * todayLocal：本地时区当日 YYYY-MM-DD（禁用UTC toISOString——北京时间0-8点跨日偏差一天）。
 * daysRemaining：to − from 的天数差（纯函数，本地零点对齐）。
 */
export function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function daysRemaining(to: string, from: string = todayLocal()): number {
  return Math.round((new Date(to + 'T00:00:00').getTime() - new Date(from + 'T00:00:00').getTime()) / 86400000)
}
