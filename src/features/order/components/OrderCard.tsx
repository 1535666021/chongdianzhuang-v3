import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Order } from '@/types'
import { useOrderStore } from '@/stores/orderStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { CollapsePanel } from '@/shared/components/CollapsePanel'
import { InfoSection, InfoItem } from '@/shared/components/InfoSection'
import AppointmentModal from './AppointmentModal'
import ConfirmModal from './ConfirmModal'
import { STATUS_COLORS } from '@/constants/order'
import { Calendar, MapPin, Phone, User, ClipboardList, Check, CheckCircle, ChevronDown, ChevronUp, Copy, StickyNote, FileText, X } from 'lucide-react'
import { isGeelyBrand, calcActualProfitByPolicy, calcMaterialCost, getOrderServiceFee, resolveDoneDate } from '@/shared/utils/orderCalc'
import { getPlatformLabel } from '@/constants/platforms'
import { toast } from '@/shared/hooks/useToast'
import SwipeActionRow from './SwipeActionRow'
import { getAppointmentCountdown } from '@/features/appointment/repository'
import { useAppointment } from '@/features/appointment/hooks/useAppointment'
import { hapticVibrate } from '@/shared/utils/haptics'
import OrderRawModals from './OrderRawModals'
import RawTextModal from '@/shared/components/RawTextModal'
import OrderCardTags from './OrderCardTags'
import { PLATFORM_FEE_RATE, TRIP_SUBSIDY_PER_UNIT } from '@/constants/policy'
import '../../../shared/components/OrderCard.css'
import '../../../shared/components/Modal.css'
import { formatCurrency, formatNumber } from '@/shared/utils/format'

interface OrderCardProps {

  order: Order
  onClick?: () => void
  onSurvey?: (order: Order) => void
  onGenerateScript?: (order: Order) => void
  onDelete?: (order: Order) => void
  onEditPlatform?: (order: Order) => void
  /** P0-201-R2：品牌缺失槽点击编辑 */
  onEditBrand?: (order: Order) => void
  isToday?: boolean
}

const dedupeAddress = (address: string) => address.replace(/^(.+?市)\1/, '$1')

export default function OrderCard({ order, onClick, isToday = false, onSurvey, onGenerateScript, onDelete, onEditPlatform, onEditBrand }: OrderCardProps) {
  const statusColor = STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] || '#6b7280'
  const isCompleted = order.status === '已完成'
  const isScheduled = order.status === '已预约'
  const appt = useAppointment(order) // P0-160：预约信息唯一读出口
  const countdown = getAppointmentCountdown(order) // P0-145：预约倒计时徽章（每次渲染按当天动态算；P0-160起由预约模块承载）

  const customerPrice = order.customerPrice || 0
  const platformRate = isGeelyBrand(order.brandName || '') ? 0 : PLATFORM_FEE_RATE // P0-204：费率唯一来源
  const serviceFee = getOrderServiceFee(order)
  const { total: materialCost } = calcMaterialCost(order.materials || [])
  // P0-177-A：展示利润唯一化——只读 orderCalc 新政策出口（存储字段驱动），删除旧费率模型现算
  const profit = calcActualProfitByPolicy(order)
  const platformFee = order.platformFee || 0
  const displayAddress = dedupeAddress(order.address || '')
  const platformDisplay = order.platformName || order.platform
  const updateOrder = useOrderStore((s) => s.updateOrder)
  const deleteOrder = useOrderStore((s) => s.deleteOrder)
  const navigate = useNavigate()
  const [showProfitDetail, setShowProfitDetail] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editRawText, setEditRawText] = useState('')
  const [showAppointment, setShowAppointment] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [showFullRemark, setShowFullRemark] = useState(false)
  const [showRawView, setShowRawView] = useState(false)
  const longPressFiredRef = useRef(false)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null)

  // P0-096/P0-101：复制格式"品牌 姓名"；空品牌补"未知"，空姓名退化为品牌或单号，绝不复制空串
  const customerPart = (order.customerName || '').trim()
  const brandPart = (order.brandName || '').trim()
  const identityText = customerPart ? `${brandPart || '未知'} ${customerPart}` : brandPart || order.orderNo || ''

  const copyToClipboard = useCallback(async (text: string | undefined, successMessage: string) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      try {
        const input = document.createElement('input')
        input.value = text
        document.body.appendChild(input)
        input.select()
        const copied = document.execCommand('copy')
        document.body.removeChild(input)
        if (!copied) return
      } catch {
        return
      }
    }
    toast.success(successMessage)
    hapticVibrate() // P0-146：复制成功轻震
  }, [])

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = null
  }, [])

  // P0-101：长按统一走 copyToClipboard（带toast）；定时器存 ref，避免 state 闭包清不掉导致长按误触发
  const handleLongPressStart = useCallback((text: string | undefined) => {
    if (!text) return
    longPressFiredRef.current = false
    clearLongPressTimer()
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null
      longPressFiredRef.current = true
      void copyToClipboard(text, `已复制：${text}`)
    }, 500)
  }, [clearLongPressTimer, copyToClipboard])

  // P0-144：点按拨号/长按复制的滑动区分阈值，沿用 P0-143 规范（滑动超10px取消长按，触摸统一起点记录）
  const handleTouchMoveCancel = useCallback((event: React.TouchEvent) => {
    const st = touchStartPosRef.current, t = event.touches[0]
    if (st && t && (Math.abs(t.clientX - st.x) > 10 || Math.abs(t.clientY - st.y) > 10)) clearLongPressTimer()
  }, [clearLongPressTimer])
  const startPhoneTouch = useCallback((phone: string | undefined) => (e: React.TouchEvent) => {
    const t = e.touches[0]; if (t) touchStartPosRef.current = { x: t.clientX, y: t.clientY }; if (phone) handleLongPressStart(phone)
  }, [handleLongPressStart])

  const openRawModal = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setEditRawText(order.rawText || '')
    setShowModal(true)
  }, [order.rawText])

  const handleSaveRaw = useCallback(() => {
    updateOrder(order.id, { rawText: editRawText })
    setShowModal(false)
  }, [order.id, editRawText, updateOrder])

  return (
    <>
      <SwipeActionRow order={order} onEditAppointment={() => setShowAppointment(true)} onDelete={() => setShowConfirmDelete(true)}>
      <div
        onClick={() => onClick?.()}
        className={`order-card ${isToday ? 'order-card--today' : ''} ${isCompleted ? 'order-card--completed' : ''}`}
        data-status={order.status}
      >
        {/* 第一行：姓名 + 状态 —— P0-118：复制热区扩至整行（姓名+状态标签横条）；状态标签为纯展示无独立点击，随热区一并覆盖 */}
        <div
          className="order-card__header"
          onClick={(event) => {
            event.stopPropagation() // 防冒泡到卡片根onClick（不进详情）
            if (longPressFiredRef.current) { longPressFiredRef.current = false; return } // 长按已复制，跳过点按
            void copyToClipboard(identityText, `已复制：${identityText}`)
          }}
          onMouseDown={() => handleLongPressStart(identityText)}
          onMouseUp={clearLongPressTimer}
          onMouseLeave={clearLongPressTimer}
          onTouchStart={(event) => {
            const t = event.touches[0]
            if (t) { touchStartPosRef.current = { x: t.clientX, y: t.clientY } }
            handleLongPressStart(identityText)
          }}
          onTouchMove={(event) => {
            const s = touchStartPosRef.current, t = event.touches[0]
            if (s && t && (Math.abs(t.clientX - s.x) > 10 || Math.abs(t.clientY - s.y) > 10)) clearLongPressTimer() // 移动超10px取消长按
          }}
          onTouchEnd={clearLongPressTimer}
          onTouchCancel={clearLongPressTimer}
        >
          <div className="order-card__name">
            <User size={16} className="order-card__icon" />
            <span>{order.customerName || '未填写姓名'}</span>
          </div>
          <span
            className="order-card__status"
            style={{ backgroundColor: statusColor }}
          >
            {order.status}
          </span>
        </div>

        <OrderCardTags
          order={order}
          onEditPlatform={onEditPlatform}
          onEditBrand={onEditBrand}
          onPowerChange={(powerKw) => updateOrder(order.id, { powerKw })}
          onRestockToggle={(restockStatus) => updateOrder(order.id, { restockStatus })}
          // P0-156：米数标签就地编辑——与 P0-155 同通道同语义；''=清字段（undefined 合并后 JSON 持久化键丢弃）
          onPackageMetersSave={(value) => updateOrder(order.id, { packageMeters: value || undefined })}
          onTripToggle={(isTrip) => updateOrder(order.id, { isBusinessTrip: isTrip, tripSubsidy: isTrip ? TRIP_SUBSIDY_PER_UNIT : 0 })}
        />

        {order.contacts && order.contacts.length > 1 ? (
          <div className="order-card__phone-group" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {order.contacts.map((c) => (
              <div
                key={c.relation}
                className="order-card__phone"
                onClick={(event) => { event.stopPropagation(); if (c.phone) window.location.href = `tel:${c.phone}` }}
                onMouseDown={() => c.phone && handleLongPressStart(c.phone)}
                onTouchStart={startPhoneTouch(c.phone)}
                onTouchMove={handleTouchMoveCancel}
                onTouchEnd={clearLongPressTimer}
              >
                <Phone size={14} className="order-card__icon" />
                <span>{c.relation}：{c.name} {c.phone}</span>
              </div>
            ))}
          </div>
        ) : (
        <div
          className="order-card__phone"
          onClick={(event) => { event.stopPropagation(); window.location.href = `tel:${order.phone}` }}
          onMouseDown={() => handleLongPressStart(order.phone)}
          onMouseUp={clearLongPressTimer}
          onMouseLeave={clearLongPressTimer}
          onTouchStart={startPhoneTouch(order.phone)}
          onTouchMove={handleTouchMoveCancel}
          onTouchEnd={clearLongPressTimer}
        >
          <Phone size={14} className="order-card__icon" />
          <span>{order.phone}</span>
        </div>
        )}

        <div
          className="order-card__address"
          onClick={(event) => { event.stopPropagation(); window.open(`https://uri.amap.com/search?keyword=${encodeURIComponent(displayAddress)}&callnative=1`, '_blank') }}
          onMouseDown={() => handleLongPressStart(displayAddress)}
          onMouseUp={clearLongPressTimer}
          onMouseLeave={clearLongPressTimer}
          onTouchStart={() => handleLongPressStart(displayAddress)}
          onTouchEnd={clearLongPressTimer}
        >
          <MapPin size={16} className="order-card__icon order-card__icon--top" />
          <span>{displayAddress}</span>
        </div>

        {/* 订单备注：单行截断，点击展开/收起 */}
        {order.remark && (
          <div
            className="order-card__remark"
            onClick={(event) => { event.stopPropagation(); setShowFullRemark((v) => !v) }}
          >
            <StickyNote size={14} className="order-card__icon order-card__icon--top" />
            <span className={showFullRemark ? 'order-card__remark-text--full' : 'order-card__remark-text--clamp'}>{order.remark}</span>
          </div>
        )}

        {/* P0-178-R1：已完成单日期行就地改"实际安装日期"（甲方指令：仅已完成单可改；已预约/待办等分支原样不动） */}
        {isCompleted ? (
          <CardDoneDateRow order={order} />
        ) : (
        <div className="order-card__appointment">
          {appt.isMissingDate ? (
            <div className="order-card__appointment-info" style={{ color: '#f59e0b', fontWeight: 600 }}>
              <Calendar size={14} />
              <span>已预约·日期待补</span>
            </div>
          ) : appt.to ? (
            <div className="order-card__appointment-info">
              <Calendar size={14} />
              <span>{appt.displayText}</span>
              {countdown && <span className={`order-card__countdown order-card__countdown--${countdown.tone}`}>{countdown.text}</span>}
            </div>
          ) : (
            <div
              className="order-card__appointment-placeholder"
              onClick={openRawModal}
            >
              <Calendar size={14} />
              <span>未预约</span>
            </div>
          )}
        </div>
        )}

        {/* 原始记录查看入口（只读，与编辑通道互不冲突） */}
        <button
          type="button"
          className="order-card__rawview"
          onClick={(e) => { e.stopPropagation(); setShowRawView(true) }}
        >
          <FileText size={14} />
          <span>查看原始记录</span>
        </button>

        {/* 底部按钮区 */}
        {isScheduled ? (
          <div className="order-card__actions">
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (onSurvey) {
                  onSurvey(order)
                } else {
                  navigate(`/orders/${order.id}?survey=true`)
                }
              }}
              className="order-card__btn order-card__btn--survey"
            >
              <ClipboardList size={14} />
              勘测
            </button>
            <button onClick={(event) => { event.stopPropagation(); void copyToClipboard([platformDisplay ? getPlatformLabel(platformDisplay) : '', order.brandName, order.customerName].filter(Boolean).join(' '), '水印已复制') }} className="order-card__btn order-card__btn--watermark"><Copy size={14} />复制水印</button>
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/order/complete/${order.id}`) }}
              className="order-card__btn order-card__btn--complete"
            >
              <CheckCircle size={14} />
              安装完成
            </button>
          </div>
        ) : isCompleted ? (
          <>
            <CollapsePanel
              title={
                <div className="order-card__profit-header">
                  <span>利润详情</span>
                  {showProfitDetail ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              }
              defaultExpanded={false}
              onToggle={setShowProfitDetail}
            >
              <div className="order-card__profit-detail space-y-2 text-xs">
                <InfoSection title="收了多少钱">
                  <InfoItem label="客户应付总额" value={`+${formatCurrency(customerPrice)}`} />
                  <InfoItem label="服务费" value={`+${formatCurrency(serviceFee)}`} />
                </InfoSection>
                <InfoSection title="计算费用（成本）">
                  <InfoItem label={`平台扣点 (${formatNumber(platformRate * 100)}%)`} value={`-${formatCurrency(platformFee)}`} />
                  <InfoItem label="材料成本" value={`-${formatCurrency(materialCost)}`} />
                  <InfoItem label="实际利润" value={`${formatCurrency(profit)}`} />
                </InfoSection>
                <div className="order-card__profit-formula">
                  <div className="order-card__profit-formula-label">计算方式</div>
                  <div className="order-card__profit-formula-text">利润 = 客户应付总额 + 服务费 - 材料成本 - 平台扣点</div>
                  <div className="order-card__profit-formula-calc">{formatCurrency(customerPrice)} + {formatCurrency(serviceFee)} - {formatCurrency(materialCost)} - {formatCurrency(platformFee)} = {formatCurrency(profit)}</div>
                </div>
                </div>
              </CollapsePanel>
            <button className="order-card__appointment-btn" onClick={(e) => { e.stopPropagation(); onGenerateScript?.(order) }}>
              <span>生成话术</span>
            </button>
          </>
        ) : order.status === '回收站' ? (
          <button className="order-card__appointment-btn order-card__appointment-btn--delete" onClick={(e) => { e.stopPropagation(); setShowConfirmDelete(true) }}>
            <span>彻底删除</span>
          </button>
        ) : (
          <>
            <div
              className="order-card__appointment-btn"
              onClick={(e) => { e.stopPropagation(); setShowAppointment(true) }}
            >
              <span>预约</span>
            </div>
          </>
        )}

      </div>
      </SwipeActionRow>

      <OrderRawModals
        order={order}
        showModal={showModal}
        editRawText={editRawText}
        onEditRawTextChange={setEditRawText}
        onCloseModal={() => setShowModal(false)}
        onSaveRaw={handleSaveRaw}
      />
      {showRawView && (
        <RawTextModal rawText={order.rawText || ''} onClose={() => setShowRawView(false)} />
      )}

      {showAppointment && <AppointmentModal order={order} onClose={() => setShowAppointment(false)} />}


      {showConfirmDelete && (
        <ConfirmModal
          title={order.status === '回收站' ? '确认彻底删除' : '确认删除'}
          message={order.status === '回收站' ? `确定彻底删除【${order.customerName}】的订单吗？删除后无法恢复。` : `确定删除【${order.customerName}】的订单吗？`}
          danger
          confirmText={order.status === '回收站' ? '彻底删除' : '删除'}
          onConfirm={() => { onDelete?.(order) ?? deleteOrder(order.id); setShowConfirmDelete(false) }}
          onCancel={() => setShowConfirmDelete(false)}
        />
      )}
    </>
  )
}

// P0-178-R1：已完成单"实际安装日期"就地编辑——交互照P0-156米数标签同款：
// 点击→行内date输入+✓/✗；✓或失焦保存；✗/Esc取消；stopPropagation防卡片跳转详情；
// 预填=当前显示值（resolveDoneDate：actualInstallDate优先）。保存走 orderStore.updateOrder
// 标准通道写 actualInstallDate；列表分组/统计按天明细经 resolveDoneDate 自动联动归位（P0-167）。
// 甲方指令（2026-10-16）：仅已完成单可改安装时间，已预约/待办单不动。
function CardDoneDateRow({ order }: { order: Order }) {
  const updateOrder = useOrderStore((s) => s.updateOrder)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const doneDate = resolveDoneDate(order) || ''

  const commit = () => {
    const value = draft.trim()
    if (value && value !== doneDate) {
      updateOrder(order.id, { actualInstallDate: value })
      toast.success(`安装日期已改为 ${value.replace(/-/g, '/')}`)
    }
    setEditing(false)
  }
  const cancel = () => setEditing(false)

  if (!editing) {
    return (
      <div
        className="order-card__appointment"
        title="点击修改实际安装日期"
        onClick={(event) => { event.stopPropagation(); setDraft(doneDate); setEditing(true) }}
      >
        <div className="order-card__appointment-info" style={{ cursor: 'pointer' }}>
          <Calendar size={14} />
          <span>{doneDate ? doneDate.replace(/-/g, '/') : '无安装日期'}</span>
        </div>
      </div>
    )
  }
  return (
    <div className="order-card__appointment" onClick={(event) => event.stopPropagation()}>
      <div
        className="order-card__appointment-info"
        onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) cancel() }}
      >
        <Calendar size={14} />
        <input
          type="date"
          autoFocus
          aria-label="修改实际安装日期"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') commit(); if (event.key === 'Escape') cancel() }}
          className="order-card__tag-input"
        />
        <button type="button" aria-label="确认安装日期" title="确认" className="order-card__tag-btn" onClick={commit}><Check size={12} /></button>
        <button type="button" aria-label="取消安装日期编辑" title="取消" className="order-card__tag-btn" onClick={cancel}><X size={12} /></button>
      </div>
    </div>
  )
}
