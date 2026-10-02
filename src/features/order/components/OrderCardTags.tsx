import { useState } from 'react'
import { Ruler, ShoppingCart, Tag, Zap } from 'lucide-react'
import type { Order } from '@/types'
import { INSTALL_TYPE_COLORS } from '@/constants/order'
import { getBrandLabel } from '@/constants/brands'
import { getPlatformLabel } from '@/constants/platforms'
import { getPowerLabel, POWER_OPTIONS } from '@/constants/power'
import { effectiveRestock, isInstallOrder } from '../restock'
import { isWanbangGeelyOrder } from '@/constants/addonPrice_wanbang_geely'
import { DEFAULT_GEELY_POWER_KW } from '@/constants/brands'

interface OrderCardTagsProps {
  order: Order
  onEditPlatform?: (order: Order) => void
  onPowerChange: (powerKw: string) => void
  onRestockToggle?: (status: 'needed' | 'done') => void
}

export default function OrderCardTags({ order, onEditPlatform, onPowerChange, onRestockToggle }: OrderCardTagsProps) {
  const powerKw = order.powerKw?.toString().match(/\d+(?:\.\d+)?/)?.[0]
  const installType = order.installType || '其他'
  const typeColors = INSTALL_TYPE_COLORS[installType] || INSTALL_TYPE_COLORS['其他']
  const isInstall = isInstallOrder(order)

  return (
    <div className="order-card__tags">
      {order.status === '待办' && effectiveRestock(order) === 'needed' && (
        <span
          className="order-card__tag order-card__tag--pile"
          title="点击标记为已补桩"
          onClick={(event) => { event.stopPropagation(); onRestockToggle?.('done') }}
        >
          需补桩
        </span>
      )}
      {order.status === '待办' && effectiveRestock(order) === 'done' && (
        <span
          className="order-card__tag order-card__tag--restock-done"
          title="点击打回需补桩"
          onClick={(event) => { event.stopPropagation(); onRestockToggle?.('needed') }}
        >
          已补桩
        </span>
      )}
      <PlatformTag order={order} onEditPlatform={onEditPlatform} />
      <BrandTag brand={order.brandName} />
      <PowerTag powerKw={powerKw} geelyDefault={!powerKw && isWanbangGeelyOrder(order.brandName, order.platformName || order.platform, order.rawText)} onPowerChange={onPowerChange} />
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

// P0-135：吉利系空功率默认7kW标签（样式同有功率），点击可展开下拉改选；有功率标签同样点击可改
function PowerTag({ powerKw, geelyDefault, onPowerChange }: { powerKw?: string; geelyDefault?: boolean; onPowerChange: (powerKw: string) => void }) {
  const [editing, setEditing] = useState(false)
  const shown = powerKw || (geelyDefault ? DEFAULT_GEELY_POWER_KW : '')
  if (shown && !editing) {
    return (
      <span
        className="order-card__tag order-card__tag--power"
        style={{ cursor: 'pointer' }}
        title={geelyDefault ? '吉利默认7kW，点击改选' : '点击改选功率'}
        onClick={(event) => { event.stopPropagation(); setEditing(true) }}
      >
        <Zap size={10} />{getPowerLabel(shown)}
      </span>
    )
  }
  return <span className="order-card__tag order-card__tag--power"><Zap size={10} /><select aria-label="选择功率" className="bg-transparent outline-none" defaultValue="" autoFocus onClick={(event) => event.stopPropagation()} onBlur={() => setEditing(false)} onChange={(event) => { onPowerChange(event.target.value); setEditing(false) }}><option value="" disabled>选择功率</option>{POWER_OPTIONS.map((value) => <option key={value} value={value}>{getPowerLabel(value)}</option>)}</select></span>
}
