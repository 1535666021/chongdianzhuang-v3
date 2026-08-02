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
import { STATUS_COLORS, INSTALL_TYPE_COLORS } from '@/constants/order'
import { Calendar, MapPin, Phone, User, Tag, Zap, Ruler, ShoppingCart, MoreVertical, ClipboardList, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { calcMaterialCost, calcProfit, calcPlatformFee, getServiceFee } from '@/shared/utils/orderCalc'
import { toast } from '@/shared/hooks/useToast'
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
  const platformFee = calcPlatformFee(customerPrice, platformRate)
  const profit = calcProfit(customerPrice, materialCost, platformFee, serviceFee)
  const materials = order.materials || []
  const installType = order.installType || '其他'
  const typeColors = INSTALL_TYPE_COLORS[installType] || INSTALL_TYPE_COLORS['其他']
  const displayAddress = dedupeAddress(order.address || '')
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
        className={`order-card ${isToday ? 'order-card--today' : ''}`}
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

        {/* 标签行 */}
        <div className="order-card__tags">
          {(order.serviceType?.includes('补桩') || order.remark?.includes('补桩') || order.notes?.includes('补桩') || order.rawText?.includes('补桩')) && (
            <span className="order-card__tag order-card__tag--pile">
              补桩
            </span>
          )}
          {order.platformName && (
            <span
              className="order-card__tag order-card__tag--platform"
              style={{ cursor: 'pointer' }}
              onClick={(event) => { event.stopPropagation(); onEditPlatform?.(order) }}
            >
              <ShoppingCart size={10} />
              {order.platformName}
              {order.platformName === '其他' && <span style={{ marginLeft: 2, fontSize: 10 }}>✎</span>}
            </span>
          )}
          {order.brandName && (
            <span className="order-card__tag order-card__tag--brand">
              <Tag size={10} />
              {order.brandName}
            </span>
          )}
          {order.powerKw && (
            <span className="order-card__tag order-card__tag--power">
              <Zap size={10} />
              {order.powerKw.toString().replace(/(?:kW)+$/i, '')}kW
            </span>
          )}
          {order.packageMeters && (
            <span className="order-card__tag order-card__tag--meters">
              <Ruler size={10} />
              {order.packageMeters}米
            </span>
          )}
          {installType !== '其他' && (
            <span
              className="order-card__tag"
              style={{ backgroundColor: typeColors.bg, color: typeColors.text }}
            >
              <Tag size={10} />
              {installType}
            </span>
          )}
        </div>

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
                  <InfoItem label="客户应收" value={`+¥${customerPrice.toFixed(2)}`} />
                  <InfoItem label="车企服务费" value={`+¥${serviceFee.toFixed(2)}`} />
                </InfoSection>
                <InfoSection title="计算费用（成本）">
                  <InfoItem label={`平台扣点 (${(platformRate * 100).toFixed(0)}%)`} value={`-¥${platformFee.toFixed(2)}`} />
                  <InfoItem label="材料成本" value={`-¥${materialCost.toFixed(2)}`} />
                </InfoSection>
                <div className="order-card__profit-formula">
                  <div className="order-card__profit-formula-label">计算方式</div>
                  <div className="order-card__profit-formula-text">
                    利润 = 客户应收 + 车企服务费 - 材料成本 - 平台扣点
                  </div>
                  <div className="order-card__profit-formula-calc">
                    ¥{customerPrice.toFixed(2)} + ¥{serviceFee.toFixed(2)} - ¥{materialCost.toFixed(2)} - ¥{platformFee.toFixed(2)} = ¥{profit.toFixed(2)}
                  </div>
                </div>
              </div>
            </CollapsePanel>
            <button className="order-card__appointment-btn" onClick={(e) => { e.stopPropagation(); onGenerateScript?.(order) }}>
              <span>生成话术</span>
            </button>
          </>
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
          title="确认删除"
          message={`确定删除【${order.customerName}】的订单吗？`}
          danger
          confirmText="删除"
          onConfirm={() => { onDelete?.(order) ?? deleteOrder(order.id); setShowConfirmDelete(false) }}
          onCancel={() => setShowConfirmDelete(false)}
        />
      )}
    </>
  )
}
