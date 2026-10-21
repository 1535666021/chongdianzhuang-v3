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
import { isGeelyBrand, calcActualProfitByPolicy, calcFullMaterialCost, buildFullMaterialCostInput, getOrderServiceFee, resolveDoneDate } from '@/shared/utils/orderCalc'
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
  const { total: materialCost } = calcFullMaterialCost(buildFullMaterialCostInput(order)) // P0-210 G1：与详情页同源输入同出口实时重算，两屏同数
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
          onMouseLeave={clearLongPress