import type { Order } from '@/types'

export type RestockStatus = 'needed' | 'done'

/** 安装单判定：补桩标签仅安装单可挂（带桩上门 / 仅安装） */
const INSTALL_TYPES = new Set(['带桩上门', '仅安装'])
const NON_INSTALL_KEYWORDS = ['维修', '勘察', '勘测', '检测', '拆桩', '移机']

export function isInstallOrder(order: Order): boolean {
  if (order.installType) return INSTALL_TYPES.has(order.installType)
  const text = order.serviceType || ''
  return text.includes('安装') && !NON_INSTALL_KEYWORDS.some((k) => text.includes(k))
}

export interface RestockMaterialRow {
  name: string
  quantity: string
}

export function platformNameOf(order: Order): string {
  return (order.platformName || order.platform || '').trim()
}

/**
 * 生成发货单纯文本（微信粘贴用）：
 *   第1行：X月X日发货明细
 *   桩明细行：平台 品牌 功率 N台（同平台同品牌同功率合并计数，按平台/品牌/功率排序）
 *   辅材区（有可填行才出现）：每行「名称 数量」
 *   落款：工程师收货地址（有值才出现）
 */
export function buildRestockShipmentText(
  date: Date,
  orders: Order[],
  materials: RestockMaterialRow[],
  receiveAddr: string,
): string {
  const lines: string[] = [`${date.getMonth() + 1}月${date.getDate()}日发货明细`]

  const groups = new Map<string, number>()
  for (const order of orders) {
    const key = [platformNameOf(order), order.brandName || '未知品牌', `${order.powerKw || '?'}kW`].join('|')
    groups.set(key, (groups.get(key) ?? 0) + 1)
  }
  const rows = [...groups.entries()]
    .map(([key, count]) => {
      const [platform, brand, power] = key.split('|')
      return { platform, brand, power, count }
    })
    .sort((a, b) =>
      `${a.platform}${a.brand}${a.power}`.localeCompare(`${b.platform}${b.brand}${b.power}`, 'zh-Hans-CN'),
    )
  for (const row of rows) {
    lines.push(`${row.platform} ${row.brand} ${row.power} ${row.count}台`)
  }

  const materialLines = materials
    .filter((m) => m.name.trim() !== '' && m.quantity.trim() !== '')
    .map((m) => `${m.name.trim()} ${m.quantity.trim()}`)
  if (materialLines.length > 0) {
    lines.push('辅材：')
    lines.push(...materialLines)
  }

  const addr = receiveAddr.trim()
  if (addr !== '') {
    lines.push(addr)
  }

  return lines.join('\n')
}
