import type { Order } from '@/types'
import { STATUS_COLORS } from '@/constants/order'
import { Calendar, MapPin, Phone, User } from 'lucide-react'

interface OrderCardProps {
  order: Order
  onClick?: () => void
}

export default function OrderCard({ order, onClick }: OrderCardProps) {
  const statusColor = STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] || '#6b7280'

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer"
    >
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

      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
        <Phone size={14} className="text-gray-400" />
        <span>{order.phone}</span>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
        <MapPin size={14} className="text-gray-400" />
        <span className="truncate">{order.address}</span>
      </div>

      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-2 text-gray-500">
          <Calendar size={14} />
          <span>{order.appointmentDate || '未预约'}</span>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-400">{order.platform}</span>
          <div className="font-semibold text-blue-600">
            ¥{order.actualProfit?.toFixed(2) || '0.00'}
          </div>
        </div>
      </div>
    </div>
  )
}
