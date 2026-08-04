import { Ruler, ShoppingCart, Tag, Zap } from 'lucide-react'
import type { Order } from '@/types'
import { INSTALL_TYPE_COLORS } from '@/constants/order'
import { getBrandLabel } from '@/constants/brands'
import { getPlatformLabel } from '@/constants/platforms'
import { getPowerLabel, POWER_OPTIONS } from '@/constants/power'

interface OrderCardTagsProps {
  order: Order
  onEditPlatform?: (order: Order) => void
  onPowerChange: (powerKw: string) => void
}

export default function OrderCardTags({ order, onEditPlatform, onPowerChange }: OrderCardTagsProps) {
  const powerKw = order.powerKw?.toString().match(/\d+(?:\.\d+)?/)?.[0]
  const installType = order.installType || '其他'
  const typeColors = INSTALL_TYPE_COLORS[installType] || INSTALL_TYPE_COLORS['其他']
  const isPileReplacement = order.serviceType?.includes('补桩') || order.remark?.includes('补桩') || order.notes?.includes('补桩') || order.rawText?.includes('补桩')

  return (
    <div className="order-card__tags">
      {isPileReplacement && <span className="order-card__tag order-card__tag--pile">补桩</span>}
      <PlatformTag order={order} onEditPlatform={onEditPlatform} />
      <BrandTag brand={order.brandName} />
      <PowerTag powerKw={powerKw} onPowerChange={onPowerChange} />
      {order.packageMeters && <span className="order-card__tag order-card__tag--meters"><Ruler size={10} />{order.packageMeters}米</span>}
      {installType !== '其他' && <span className="order-card__tag" style={{ backgroundColor: typeColors.bg, color: typeColors.text }}><Tag size={10} />{installType}</span>}
    </div>
  )
}

function PlatformTag({ order, onEditPlatform }: Pick<OrderCardTagsProps, 'order' | 'onEditPlatform'>) {
  const platform = order.platformName || order.platform
  if (!platform) return null
  const label = getPlatformLabel(platform)
  return <span className="order-card__tag order-card__tag--platform" style={{ cursor: 'pointer' }} onClick={(event) => { event.stopPropagation(); onEditPlatform?.(order) }}><ShoppingCart size={10} />{label}{label === '其他' && <span style={{ marginLeft: 2, fontSize: 10 }}>✎</span>}</span>
}

function BrandTag({ brand }: { brand?: string }) {
  if (!brand) return null
  return <span className="order-card__tag order-card__tag--brand"><Tag size={10} />{getBrandLabel(brand)}</span>
}

function PowerTag({ powerKw, onPowerChange }: { powerKw?: string; onPowerChange: (powerKw: string) => void }) {
  if (powerKw) return <span className="order-card__tag order-card__tag--power"><Zap size={10} />{getPowerLabel(powerKw)}</span>
  return <span className="order-card__tag order-card__tag--power"><Zap size={10} /><select aria-label="选择功率" className="bg-transparent outline-none" defaultValue="" onClick={(event) => event.stopPropagation()} onChange={(event) => onPowerChange(event.target.value)}><option value="" disabled>选择功率</option>{POWER_OPTIONS.map((value) => <option key={value} value={value}>{getPowerLabel(value)}</option>)}</select></span>
}
