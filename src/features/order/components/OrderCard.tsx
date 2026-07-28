import { useState } from 'react'
import type { Order } from '@/types'
import { useOrderStore } from '@/stores/orderStore'
import ProfitBadge from './ProfitBadge'
import AppointmentModal from './AppointmentModal'
import { STATUS_COLORS, INSTALL_TYPE_COLORS } from '@/constants/order'
import { Calendar, MapPin, Phone, User, Tag, Zap, Ruler, ShoppingCart, DollarSign, Package, Wrench, Receipt, Copy, X, Save } from 'lucide-react'

interface OrderCardProps {
  order: Order
  onClick?: () => void
}

export default function OrderCard({ order, onClick }: OrderCardProps) {
  const statusColor = STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] || '#6b7280'
  const isCompleted = order.status === '已完成'
  const installType = order.installType || '其他'
  const typeColors = INSTALL_TYPE_COLORS[installType] || INSTALL_TYPE_COLORS['其他']
  const updateOrder = useOrderStore((s) => s.updateOrder)

  const [copiedName, setCopiedName] = useState(false)
  const [copiedPhone, setCopiedPhone] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editRawText, setEditRawText] = useState('')
  const [copiedRaw, setCopiedRaw] = useState(false)
  const [showAppointment, setShowAppointment] = useState(false)

  const copyToClipboard = async (text: string, setter: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text)
      setter(true)
      setTimeout(() => setter(false), 1500)
    } catch {
      setter(true)
      setTimeout(() => setter(false), 1500)
    }
  }

  const handleCopyName = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (order.customerName) copyToClipboard(order.customerName, setCopiedName)
  }
  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (order.phone) copyToClipboard(order.phone, setCopiedPhone)
  }
  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (order.address) copyToClipboard(order.address, setCopiedAddress)
  }

  const openRawModal = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditRawText(order.rawText || '')
    setCopiedRaw(false)
    setShowModal(true)
  }

  const handleSaveRaw = () => {
    updateOrder(order.id, { rawText: editRawText })
    setShowModal(false)
  }

  const handleCopyRaw = () => {
    if (editRawText) copyToClipboard(editRawText, setCopiedRaw)
  }

  return (
    <>
      <div
        onClick={onClick}
        className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer"
      >
        {/* 第一行：姓名 + 状态 */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <User size={16} className="text-gray-400 shrink-0" />
            <span
              onClick={handleCopyName}
              className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors select-none"
            >
              {copiedName ? '已复制' : order.customerName}
            </span>
          </div>
          <span
            className="text-xs px-2 py-1 rounded-full text-white shrink-0"
            style={{ backgroundColor: statusColor }}
          >
            {order.status}
          </span>
        </div>

        {/* 标签行：平台 → 品牌 → 功率 → 米数 → 安装类型 */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {order.platformName && (
            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
              <ShoppingCart size={10} />
              {order.platformName}
            </span>
          )}
          {order.brandName && (
            <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded">
              <Tag size={10} />
              {order.brandName}
            </span>
          )}
          {order.powerKw && (
            <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded">
              <Zap size={10} />
              {order.powerKw}kW
            </span>
          )}
          {order.packageMeters && (
            <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">
              <Ruler size={10} />
              {order.packageMeters}米
            </span>
          )}
          {installType !== '其他' && (
            <span
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium"
              style={{ backgroundColor: typeColors.bg, color: typeColors.text }}
            >
              <Tag size={10} />
              {installType}
            </span>
          )}
        </div>

        {/* 第二行：电话 */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
          <Phone size={14} className="text-gray-400 shrink-0" />
          <span
            onClick={handleCopyPhone}
            className="cursor-pointer hover:text-blue-600 transition-colors select-none"
          >
            {copiedPhone ? '已复制' : order.phone}
          </span>
        </div>

        {/* 第三行：地址 */}
        <div className="flex items-start gap-2 text-base text-gray-600 mb-2">
          <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
          <span
            onClick={handleCopyAddress}
            className="break-words cursor-pointer hover:text-blue-600 transition-colors select-none"
          >
            {copiedAddress ? '已复制' : order.address}
          </span>
        </div>

        {/* 预约信息 */}
        <div className="mb-2">
          {order.appointmentDate ? (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <Calendar size={14} />
              <span>{order.appointmentDate} {order.appointmentTime}</span>
            </div>
          ) : (
            <div
              onClick={openRawModal}
              className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-blue-600 transition-colors"
            >
              <Calendar size={14} />
              <span>未预约</span>
            </div>
          )}
        </div>

        {/* 第六行：利润区（仅已完成显示） */}
        {isCompleted ? (
          <div className="bg-gray-50 rounded-lg p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-gray-500">
                <Package size={12} />材料
              </div>
              <span className="text-gray-700">¥{(order.materialCost || 0).toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-gray-500">
                <Wrench size={12} />人工
              </div>
              <span className="text-gray-700">¥{(order.laborCost || 0).toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-gray-500">
                <Receipt size={12} />扣点
              </div>
              <span className="text-red-400">-¥{(order.platformFee || 0).toFixed(0)}</span>
            </div>
            <div className="border-t border-gray-200 pt-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <DollarSign size={12} />利润
              </div>
              <ProfitBadge profit={order.actualProfit || 0} />
            </div>
          </div>
        ) : (
          <div
            onClick={(e) => { e.stopPropagation(); setShowAppointment(true) }}
            className="bg-blue-50 rounded-lg p-2 text-center cursor-pointer hover:bg-blue-100 transition-colors"
          >
            <span className="text-xs text-blue-600 font-medium">预约</span>
          </div>
        )}
      </div>

      {/* 订单原文编辑弹框 */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">订单原文</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 p-4 overflow-hidden">
              <textarea
                value={editRawText}
                onChange={(e) => setEditRawText(e.target.value)}
                className="w-full h-64 p-3 bg-gray-50 rounded-lg text-sm font-mono resize-none outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="暂无订单原文"
              />
            </div>
            <div className="flex gap-2 p-4 border-t border-gray-100">
              <button
                onClick={handleCopyRaw}
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Copy size={14} />
                {copiedRaw ? '已复制' : '复制'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveRaw}
                className="flex items-center gap-1.5 flex-1 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Save size={14} />
                保存
              </button>
            </div>
          </div>
        </div>
      )}
      {showAppointment && (
        <AppointmentModal order={order} onClose={() => setShowAppointment(false)} />
      )}
    </>
  )
}
