import type { Order } from '@/types'
import { getOrderBusinessDate, calcReconciliationProfit, calcActualProfitByPolicy, getSettlementFee } from './orderCalc'
import { getPlatformLabel } from '@/constants/platforms'
import { formatCurrency } from '@/shared/utils/format'

// P0-165-R3(E)：对账口径与统计页逐字一致
// 对账利润=付费-|扣点|+安装费+出差补助（不减材料不减工资）；实际利润=对账-材料-工资
// P0-211：序号后插"订单号"；安装费后插"套餐米数"（空值留空禁补假值，存值原样不拼单位）
const headers = ["日期", "序号", "订单号", "客户名", "电话", "地址", "平台", "金额", "平台扣点", "安装费", "套餐米数", "出差补助", "对账利润", "材料成本", "工资", "实际利润"]

function escapeCsv(value: string | number) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text
}

function formatDate(order: Order) {
  return getOrderBusinessDate(order)
}

export function exportReconciliationCsv(orders: Order[], month: string) {
  const rows = orders.map((order, index) => [
    formatDate(order),
    index + 1,
    order.orderNo || '',
    order.customerName,
    order.phone,
    order.address,
    getPlatformLabel(order.platformName || order.platform),
    formatCurrency(order.customerPrice || 0),
    formatCurrency(order.platformFee || 0),
    formatCurrency(order.serviceFee ?? getSettlementFee(order)),
    order.packageMeters || '',
    formatCurrency(order.tripSubsidy || 0),
    formatCurrency(calcReconciliationProfit(order)),
    formatCurrency(order.materialCost || 0),
    formatCurrency(order.laborCost || 0),
    formatCurrency(calcActualProfitByPolicy(order)),
  ])
  const nl = '\n'
  const headerLine = headers.map((h) => escapeCsv(h)).join(',')
  const csv = [headerLine, ...rows.map((row) => row.map((v) => escapeCsv(v)).join(','))].join(nl)
  const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = '对账单_' + month + '.xlsx'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
