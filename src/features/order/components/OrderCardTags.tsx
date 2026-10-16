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
}

export default function OrderCardTags({ order, onEditPlatform, onPowerChange, onRestockToggle, onPackageMetersSave, onTripToggle }: OrderCardTagsProps) {
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
      {/* P0-165-R8：出差就地切换标签（橙态=出差/灰虚线态=不出差，同米数标签交互） */}
      <span
        className={`order-card__tag ${order.isBusinessTrip === true ? '' : 'order-card__tag--meters'}`}
        style={order.isBusinessTrip === true ? { backgroundColor: '#f97316', color: '#fff', cursor: 'pointer' } : { cursor: 'pointer', borderStyle: 'dashed' }}
        title={order.isBusinessTrip === true ? '点击切回不出差' : '点击标记出差（免扣点+补助30/台）'}
        onClick={(event) => { event.stopPropagation(); onTripToggle?.(order.isBusinessTrip !== true) }}
      >{order.isBusinessTrip === true ? '出差' : '不出差'}</span>
      {/* P0-175-B：米数标签恒渲染——有值"N米"零变化，无值灰虚线"未填米数"占位（点进编辑，保存语义同P0-156） */}
      <PackageMetersTag value={order.packageMeters ?? ''} onSave={onPackageMetersSave} />
      {installType !== '其他' && <span className="order-card__tag" style={{ backgroundColor: typeColors.bg, color: typeColors.text }}><Tag size={10} />{installType}</span>}
    </div>
  )
}

// P0-156：套餐米数标签就地编辑——点击标签变小型输入框，✓确认/✗取消/Enter保存/Esc取消，
// 焦点移出整组视为取消。校验与保存语义同 P0-155（仅空或正数；清空=删字段回落品牌默认），
// 保存由 OrderCard 走 orderStore.updateOrder 标准通道，详情/统计/超米计费自动联动
function PackageMetersTag({ value, onSave }: { value: string; onSave?: (value: string) => void }) {
  const [editing, setEditing] = useState(false)
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
