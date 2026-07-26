import type { Order } from '@/types'
import ProfitBadge from './ProfitBadge'
import { STATUS_COLORS } from '@/constants/order'
import { Calendar, MapPin, Phone, User, Tag, Zap, Ruler, ShoppingCart, DollarSign, Package, Wrench, Receipt } from 'lucide-react'

interface OrderCardProps {
  order: Order
  onClick?: () => void
}

/** 从 notes 中提取标签信息 */
function extractTags(notes: string): { platform?: string; brand?: string; power?: string; meters?: string } {
  const tags: { platform?: string; brand?: string; power?: string; meters?: string } = {}

  const platformMatch = notes.match(/平台[:：]([^|]+)/)
  if (platformMatch) tags.platform = platformMatch[1].trim()

  const brandMatch = notes.match(/品牌[:：]([^|]+)/)
  if (brandMatch) tags.brand = brandMatch[1].trim()

  const powerMatch = notes.match(/功率[:：]([^|]+)/)
  if (powerMatch) tags.power = powerMatch[1].trim()

  const metersMatch = notes.match(/米数[:：]([^|]+)/)
  if (metersMatch) tags.meters = metersMatch[1].trim()

  return tags
}

export default function OrderCard({ order, onClick }: OrderCardProps) {
  const statusColor = STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] || '#6b7280'
  const tags = extractTags(order.notes || '')
  const isCompleted = order.status === '已完成'

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer"
    >
      {/* 第一行：姓名 + 状态 */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <User size={16} className="text-gray-400" />
          <span className="font-semibold text-gray-900">{order.customerName}</span>
        </div>
        <span
          className="text-xs px-2 py-1 rounded-full text-white"
          style={{ backgroundColor: statusColor }}
        >
          {order.status}
        </span>
      </div>

      {/* 第二行：电话 */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
        <Phone size={14} className="text-gray-400" />
        <span>{order.phone}</span>
      </div>

      {/* 第三行：地址 */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
        <MapPin size={14} className="text-gray-400" />
        <span className="truncate">{order.address}</span>
      </div>

      {/* 第四行：标签（平台/品牌/功率/米数） */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.platform && (
          <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
            <ShoppingCart size={10} />
            {tags.platform}
          </span>
        )}
        {tags.brand && (
          <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded">
            <Tag size={10} />
            {tags.brand}
          </span>
        )}
        {tags.power && (
          <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded">
            <Zap size={10} />
            {tags.power}
          </span>
        )}
        {tags.meters && (
          <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">
            <Ruler size={10} />
            {tags.meters}
          </span>
        )}
      </div>

      {/* 第五行：预约日期 */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <Calendar size={14} />
        <span>{order.appointmentDate || '未预约'}</span>
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
        <div className="bg-amber-50 rounded-lg p-2 text-center">
          <span className="text-xs text-amber-600 font-medium">待完成</span>
        </div>
      )}
    </div>
  )
}
