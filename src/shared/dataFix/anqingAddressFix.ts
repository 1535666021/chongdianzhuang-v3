/**
 * P0-250 件3：导入地址缺省市存量修（安庆区县短名归一）
 * 范围：order.address 缺「省」或「市」层级 ∧ 命中安庆十区县 → 自动补前缀「安徽省安庆市」（只补缺层，不动既有省市/其余地址）
 * 保险：plan/run 分离+执行前备份+幂等（RUN_AT_KEY）+日志文件；首进自动执行一次+toast 报数
 */
import type { Order } from '@/types'
import { useOrderStore } from '@/stores/orderStore'

export const AQ_ADDR_FIX_BACKUP_PREFIX = 'cdz_v3_aqaddr_backup_'
export const AQ_ADDR_FIX_RUN_AT_KEY = 'cdz_aqaddr_p0250_run_at'
export const AQ_ADDR_FIX_LOG_KEY = 'cdz_aqaddr_fix_log'

/** 与 parser-engines P0-249 AQ_COUNTIES 同源 */
export const AQ_COUNTIES_FIX = ['怀宁县', '迎江区', '大观区', '宜秀区', '潜山市', '桐城市', '太湖县', '宿松县', '望江县', '岳西县']

/** 命中且缺省市层级 → 返回补前缀后的地址；否则 null（不修） */
export function detectAqAddressGap(address: string | undefined): string | null {
  if (!address) return null
  if (address.includes('省') && address.includes('市')) return null // 层级齐
  const hit = AQ_COUNTIES_FIX.find((c) => address.includes(c))
  if (!hit) return null
  // 只补缺层：已有省或市不重复补
  const hasProv = address.includes('省')
  const hasCity = address.includes('市')
  if (hasProv && !hasCity) {
    // 有省缺市：安庆市插入省 token 之后（安徽省怀宁县…→安徽省安庆市怀宁县…）
    const m = address.match(/^[^省]*省/)
    const prov = m ? m[0] : '安徽省'
    return prov + '安庆市' + address.slice(prov.length)
  }
  if (!hasProv && hasCity) return '安徽省' + address
  return '安徽省安庆市' + address
}

export function planAqAddressFix(orders: Order[]): { order: Order; from: string; to: string }[] {
  return orders
    .map((o) => ({ o, to: detectAqAddressGap(o.address) }))
    .filter((x): x is { o: Order; to: string } => x.to !== null)
    .map(({ o, to }) => ({ order: o, from: o.address!, to }))
}

export function runAqAddressFix(orders: Order[]): number {
  if (localStorage.getItem(AQ_ADDR_FIX_RUN_AT_KEY)) return 0
  const targets = planAqAddressFix(orders)
  const runAt = Date.now()
  if (targets.length > 0) {
    localStorage.setItem(`${AQ_ADDR_FIX_BACKUP_PREFIX}${runAt}`, JSON.stringify(targets.map(({ order, from }) => ({ id: order.id, address: from }))))
    const log = JSON.parse(localStorage.getItem(AQ_ADDR_FIX_LOG_KEY) || '[]')
    const { updateOrder } = useOrderStore.getState()
    for (const { order, to } of targets) {
      updateOrder(order.id, { address: to })
      log.push({ id: order.id, from: order.address, to, at: new Date().toISOString() })
    }
    localStorage.setItem(AQ_ADDR_FIX_LOG_KEY, JSON.stringify(log))
  }
  localStorage.setItem(AQ_ADDR_FIX_RUN_AT_KEY, String(runAt))
  return targets.length
}
