import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Order } from '@/types'
import { useOrderStore } from '@/stores/orderStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { CollapsePanel } from '@/shared/components/CollapsePanel'
import { InfoSection, InfoItem } from '@/shared/components/InfoSection'
import AppointmentModal from './AppointmentModal'
import OrderCardMenu from './OrderCardMenu'
import ConfirmModal from './ConfirmModal'
import { STATUS_COLORS } from '@/constants/order'
import { Calendar, MapPin, Phone, User, MoreVertical, ClipboardList, CheckCircle, ChevronDown, ChevronUp, Copy } from 'lucide-react'
import { calcMaterialCost, calcOrderFinancials, getServiceFee } from '@/shared/utils/orderCalc'
import { getPlatformLabel } from '@/constants/platforms'
import { toast } from '@/shared/hooks/useToast'
import OrderCardTags from './OrderCardTags'
import '../../../shared/components/OrderCard.css'
import '../../../shared/components/Modal.css'

interface OrderCardProps {
  order: Order
  onClick?: () => void
  onSurvey?: (order: Order) => void
  onGenerateScript?: (order: Order) => void
  onDelete?: (order: Order) => void
  onEditPlatform?: (order: Order) => void
  showMenu?: boolean
  isToday?: boolean
}

function dedupeAddress(address: string) {
  return address.replace(/^(.+?市)\1/, '$1')
}

export default function OrderCard({ order, onClick, showMenu = false, isToday = false, onSurvey, onGenerateScript, onDelete, onEditPlatform }: OrderCardProps) {
  const statusColor = STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] || '#6b7280'
  const isCompleted = order.status === '已完成'
  const isScheduled = order.status === '已预约'
  const getPlatformFeeRate = useSettingsStore((s) => s.getPlatformFeeRate)

  const customerPrice = order.customerPrice || 0
  const platformRate = getPlatformFeeRate(order.platform)
  const serviceFee = getServiceFee(order.notes || '')
  const { total: materialCost } = calcMaterialCost(order.materials || [])
  const { platformFee, actualProfit: profit } = calcOrderFinancials(customerPrice, materialCost, platformRate, serviceFee)
  const materials = order.materials || []
  const displayAddress = dedupeAddress(order.address || '')
  const platformDisplay = order.platformName || order.platform
  const updateOrder = useOrderStore((s) => s.updateOrder)
  const deleteOrder = useOrderStore((s) => s.deleteOrder)
  const navigate = useNavigate()
  const [showProfitDetail, setShowProfitDetail] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editRawText, setEditRawText] = useState('')
  const [showAppointment, setShowAppointment] = useState(false)
  const [showMenuPanel, setShowMenuPanel] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [copyTimer, setCopyTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const handleLongPressStart = useCallback((text: string | undefined) => {
    if (!text) return
    const timer = setTimeout(async () => {
      try {
        await navigator.clipboard.writeText(text)
      } catch {
        // ignore
      }
    }, 500)
    setCopyTimer(timer)
  }, [])

  const handleLongPressEnd = useCallback(() => {
    if (copyTimer) {
      clearTimeout(copyTimer)
      setCopyTimer(null)
    }
  }, [copyTimer])

  const copyToClipboard = useCallback(async (text: string | undefined, label: string) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const input = document.createElement('input')
      input.value = text
      document.body.appendChild(input)
      input.select()
      const copied = document.execCommand('copy')
      document.body.removeChild(input)
      if (!copied) return
    }
    toast.success(`${label}已复制`)
  }, [])

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
      <div
        onClick={onClick}
        className={`order-card ${isToday ? 'order-card--today' : ''} ${isCompleted ? 'order-card--completed' : ''}`}
        data-status={order.status}
      >
        {/* 第一行：姓名 + 状态 */}
        <div className="order-card__header">
          <div
            className="order-card__name"
            onClick={(event) => { event.stopPropagation(); void copyToClipboard(order.customerName, '姓名') }}
            onMouseDown={() => handleLongPressStart(order.customerName)}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
            onTouchStart={() => handleLongPressStart(order.customerName)}
            onTouchEnd={handleLongPressEnd}
          >
            <User size={16} className="order-card__icon" />
            <span>{order.customerName}</span>
          </div>
          <span
            className="order-card__status"
            style={{ backgroundColor: statusColor }}
          >
            {order.status}
          </span>
        </div>

        <OrderCardTags order={order} onEditPlatform={onEditPlatform} onPowerChange={(powerKw) => updateOrder(order.id, { powerKw })} />

        {/* 电话和地址 */}
        <div
          className="order-card__phone"
          onClick={(event) => { event.stopPropagation(); void copyToClipboard(order.phone, '电话') }}
          onMouseDown={() => handleLongPressStart(order.phone)}
          onMouseUp={handleLongPressEnd}
          onMouseLeave={handleLongPressEnd}
          onTouchStart={() => handleLongPressStart(order.phone)}
          onTouchEnd={handleLongPressEnd}
        >
          <Phone size={14} className="order-card__icon" />
          <span>{order.phone}</span>
        </div>

        <div
          className="order-card__address"
          onClick={(event) => { event.stopPropagation(); void copyToClipboard(displayAddress, '地址') }}
          onMouseDown={() => handleLongPressStart(displayAddress)}
          onMouseUp={handleLongPressEnd}
          onMouseLeave={handleLongPressEnd}
          onTouchStart={() => handleLongPressStart(displayAddress)}
          onTouchEnd={handleLongPressEnd}
        >
          <MapPin size={16} className="order-card__icon order-card__icon--top" />
          <span>{displayAddress}</span>
        </div>

        {/* 预约信息 */}
        <div className="order-card__appointment">
          {order.appointmentDate ? (
            <div className="order-card__appointment-info">
              <Calendar size={14} />
              <span>{order.appointmentDate} {order.appointmentTime}</span>
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
            <button onClick={(event) => { event.stopPropagation(); void copyToClipboard([platformDisplay ? getPlatformLabel(platformDisplay) : '', order.brandName, order.customerName].filter(Boolean).join(' '), '水印') }} className="order-card__btn order-card__btn--watermark"><Copy size={14} />复制水印</button>
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
                  <InfoItem label="客户应付总额" value={`+¥${customerPrice.toFixed(2)}`} />
                  <InfoItem label="服务费" value={`+¥${serviceFee.toFixed(2)}`} />
                </InfoSection>
                <InfoSection title="计算费用（成本）">
                  <InfoItem label={`平台扣点 (${(platformRate * 100).toFixed(0)}%)`} value={`-¥${platformFee.toFixed(2)}`} />
                  <InfoItem label="材料成本" value={`-¥${materialCost.toFixed(2)}`} />
                  <InfoItem label="实际利润" value={`¥${profit.toFixed(2)}`} />
                </InfoSection>
                <div className="order-card__profit-formula">
                  <div className="order-card__profit-formula-label">计算方式</div>
                  <div className="order-card__profit-formula-text">利润 = 客户应付总额 + 服务费 - 材料成本 - 平台扣点</div>
                  <div className="order-card__profit-formula-calc">¥{customerPrice.toFixed(2)} + ¥{serviceFee.toFixed(2)} - ¥{materialCost.toFixed(2)} - ¥{platformFee.toFixed(2)} = ¥{profit.toFixed(2)}</div>
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
          <div
            className="order-card__appointment-btn"
            onClick={(e) => { e.stopPropagation(); setShowAppointment(true) }}
          >
            <span>预约</span>
          </div>
        )}

        {showMenu && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenuPanel(true) }}
            className="order-card__menu-btn"
          >
            <MoreVertical size={16} />
          </button>
        )}
      </div>

      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">订单原文</h2>
              <button onClick={() => setShowModal(false)} className="modal-close">
                <ChevronUp size={20} className="rotate-180" />
              </button>
            </div>
            <div className="modal-body">
              <textarea
                value={editRawText}
                onChange={(e) => setEditRawText(e.target.value)}
                className="modal-textarea"
                placeholder="暂无订单原文"
              />
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="modal-btn modal-btn--secondary">
                取消
              </button>
              <button onClick={handleSaveRaw} className="modal-btn modal-btn--primary">
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showAppointment && (
        <AppointmentModal order={order} onClose={() => setShowAppointment(false)} />
      )}

      {showMenuPanel && (
        <OrderCardMenu
          order={order}
          onClose={() => setShowMenuPanel(false)}
          onEditAppointment={() => setShowAppointment(true)}
          onNavigate={() => { window.open(`https://uri.amap.com/marker?position=${encodeURIComponent(order.address)}`, '_blank') }}
          onDelete={() => { setShowMenuPanel(false); setShowConfirmDelete(true) }}
        />
      )}

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
