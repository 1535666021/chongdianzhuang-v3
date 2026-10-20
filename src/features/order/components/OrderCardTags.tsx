import { useState } from 'react'
import { Check, Ruler, ShoppingCart, Tag, X, Zap } from 'lucide-react'
import type { Order } from '@/types'
import { toast } from '@/shared/hooks/useToast'
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
  /** P0-156：套餐米数就地编辑保存（''=清字段回落品牌默认） */
  onPackageMetersSave?: (value: string) => void
  /** P0-165-R8：出差就地切换（true=出差橙态/false=不出差灰态） */
  onTripToggle?: (isTrip: boolean) => void
  /** P0-201-R2：品牌缺失槽点击编辑（OrderList 层品牌选择器） */
  onEditBrand?: (order: Order) => void
}

export default function OrderCardTags({ order, onEditPlatform, onPowerChange, onRestockToggle, onPackageMetersSave, onTripToggle, onEditBrand }: OrderCardTagsProps) {
  const powerKw = order.powerKw?.toString().match(/\d+(?:\.\d+)?/)?.[0]
  const installType = order.installType || '其他'
  const typeColors = INSTALL_TYPE_COLORS[installType]
  // P0-201-R2：五固定槽缺失判定；米数红胶囊点击唤就地编辑（initialEditing swap）
  const slots = tagSlotStates(order)
  const [metersEditing, setMetersEditing] = useState(false)
  const missingStyle: React.CSSProperties = { background: '#fff', color: '#dc2626', border: '1px solid #dc2626', cursor: 'pointer' }
  return (
    <div className="order-card__tags">
      {/* ===== 固定槽位顺序：品牌｜功率｜米数｜平台｜已补桩；缺失=白底红字红框胶囊，点击唤同槽既有编辑入口 ===== */}
      {slots.brand ? (
        <BrandTag brand={order.brandName} />
      ) : (
        <span className="order-card__tag" style={missingStyle} title="缺品牌，点击选择"
          onClick={(event) => { event.stopPropagation(); onEditBrand?.(order) }}>缺 品牌</span>
      )}
      {slots.power ? (
        <PowerTag powerKw={powerKw} geelyDefault={!powerKw && isWanbangGeelyOrder(order.brandName, order.platformName || order.platform, order.rawText)} onPowerChange={onPowerChange} />
      ) : (
        <span className="order-card__tag" style={missingStyle} title="缺功率，点击选择"
          onClick={(event) => { event.stopPropagation(); onPowerChange?.(order.powerKw || '') }}>缺 功率</span>
      )}
      {metersEditing ? (
        <PackageMetersTag value={order.packageMeters ?? ''} initialEditing onSave={(v) => { setMetersEditing(false); onPackageMetersSave?.(v) }} />
      ) : slots.meters ? (
        <PackageMetersTag value={order.packageMeters ?? ''} onSave={onPackageMetersSave} />
      ) : (
        <span className="order-card__tag" style={missingStyle} title="缺米数，点击填写"
          onClick={(event) => { event.stopPropagation(); setMetersEditing(true) }}>缺 米数</span>
      )}
      {slots.platform ? (
        <PlatformTag order={order} onEditPlatform={onEditPlatform} />
      ) : (
        <span className="order-card__tag" style={missingStyle} title="缺平台，点击选择"
          onClick={(event) => { event.stopPropagation(); onEditPlatform?.(order) }}>缺 平台</span>
      )}
      {order.status === '待办' && (effectiveRestock(order) === 'needed' ? (
        <span className="order-card__tag order-card__tag--pile" title="点击标记为已补桩"
          onClick={(event) => { event.stopPropagation(); onRestockToggle?.('done') }}>需补桩</span>
      ) : effectiveRestock(order) === 'done' ? (
        <span className="order-card__tag order-card__tag--restock-done" title="点击打回需补桩"
          onClick={(event) => { event.stopPropagation(); onRestockToggle?.('needed') }}>已补桩</span>
      ) : (
        <span className="order-card__tag" style={missingStyle} title="缺补桩标记，点击标记已补桩"
          onClick={(event) => { event.stopPropagation(); onRestockToggle?.('done') }}>缺 已补桩</span>
      ))}
      {/* 出差/安装类型=固定槽位表外，保持原渲染（尾附） */}
      <span
        className={`order-card__tag ${order.isBusinessTrip === true ? '' : 'order-card__tag--meters'}`}
        style={order.isBusinessTrip === true ? { backgroundColor: '#f97316', color: '#fff', cursor: 'pointer' } : { cursor: 'pointer', borderStyle: 'dashed' }}
        title={order.isBusinessTrip === true ? '点击切回不出差' : '点击标记出差（免扣点+补助30/台）'}
        onClick={(event) => { event.stopPropagation(); onTripToggle?.(order.isBusinessTrip !== true) }}
      >{order.isBusinessTrip === true ? '出差' : '不出差'}</span>
      {installType !== '其他' && <span className="order-card__tag" style={{ backgroundColor: typeColors.bg, color: typeColors.text }}><Tag size={10} />{installType}</span>}
    </div>
  )
}
/** P0-201-R2：五固定槽缺失判定（品牌/功率/米数/平台/已补桩）。geelyDefault 功率显示默认标签=非缺失；非待办无补桩槽。 */
export function tagSlotStates(order: Order): { brand: boolean; power: boolean; meters: boolean; platform: boolean; restock: boolean } {
  const brand = !!order.brandName
  const power = !!(order.powerKw || (order.brandName ? DEFAULT_GEELY_POWER_KW : ''))
  const meters = !!(order.packageMeters ?? '')
  const platform = !!(order.platformName || order.platform)
  const restock = order.status !== '待办' || !!order.restockStatus
  return { brand, power, meters, platform, restock }
}

function PackageMetersTag({ value, onSave, initialEditing = false }: { value: string; onSave?: (value: string) => void; initialEditing?: boolean }) {
  const [editing, setEditing] = useState(initialEditing)
  const [draft, setDraft] = useState('')
  const [invalid, setInvalid] = useState(false)

  const commit = () => {
    const pkg = draft.trim()
    if (pkg) {
      const n = Number(pkg)
      if (!Number.isFinite(n) || n <= 0) {
        setInvalid(true)
        toast.error('套餐米数须为正数，或留空按品牌默认')
        return
      }
    }
    onSave?.(pkg)
    setEditing(false)
    setInvalid(false)
  }
  const cancel = () => { setEditing(false); setInvalid(false) }

  if (!editing) {
    return (
      <span
        className="order-card__tag order-card__tag--meters"
        style={value ? { cursor: 'pointer' } : { cursor: 'pointer', opacity: 0.7, borderStyle: 'dashed' }}
        title={value ? '点击修改套餐米数（留空=按品牌默认）' : '未填米数：点击直接填写（留空=按品牌默认）'}
        onClick={(event) => { event.stopPropagation(); setDraft(value); setInvalid(false); setEditing(true) }}
      >
        <Ruler size={10} />{value ? `${value}米` : '未填米数'}
      </span>
    )
  }
  return (
    <span
      className="order-card__tag order-card__tag--meters"
      onClick={(event) => event.stopPropagation()}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) cancel() }}
    >
      <Ruler size={10} />
      <input
        type="text"
        inputMode="decimal"
        autoFocus
        aria-label="修改套餐米数"
        aria-invalid={invalid}
        placeholder="留空=默认"
        className={`order-card__tag-input${invalid ? ' order-card__tag-input--error' : ''}`}
        value={draft}
        onChange={(event) => { setDraft(event.target.value); setInvalid(false) }}
        onKeyDown={(event) => { if (event.key === 'Enter') commit(); if (event.key === 'Escape') cancel() }}
      />
      <button type="button" aria-label="确认米数" title="确认" className="order-card__tag-btn" onClick={commit}><Check size={12} /></button>
      <button type="button" aria-label="取消米数编辑" title="取消" className="order-card__tag-btn" onClick={cancel}><X size={12} /></button>
    </span>
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
