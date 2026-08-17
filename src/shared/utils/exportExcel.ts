import type { Order } from '@/types'
import { getOrderBusinessDate } from './orderCalc'
import { getPlatformLabel } from '@/constants/platforms'

const headers = ['日期', '序号', '客户名', '电话', '地址', '平台', '金额', '材料成本', '平台扣点', '利润']

function escapeCsv(value: string | number) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function formatDate(order: Order) {
  return getOrderBusinessDate(order)
}

export function exportReconciliationCsv(orders: Order[], month: string) {
  const rows = orders.map((order, index) => [
    formatDate(order),
    index + 1,
    order.customerName,
    order.phone,
    order.address,
    getPlatformLabel(order.platformName || order.platform),
    (order.customerPrice || 0).toFixed(2),
    (order.materialCost || 0).toFixed(2),
    (order.platformFee || 0).toFixed(2),
    (order.actualProfit || 0).toFixed(2),
  ])
  const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `充电桩对账单_${month}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
