import { useParams, useNavigate } from 'react-router-dom'
import { useOrderStore } from '@/stores/orderStore'
import { STATUS_COLORS } from '@/constants/order'
import { ArrowLeft, Phone, MapPin, Calendar, User, FileText, Zap } from 'lucide-react'

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const order = useOrderStore((state) =>
    state.orders.find((o: any) => o.id === id)
  )

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p>订单不存在</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-blue-600 text-sm"
          >
            返回
          </button>
        </div>
      </div>
    )
  }

  const statusColor = STATUS_COLORS[order.status as any] || '#6b7280'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部栏 */}
      <div className="bg-white p-4 border-b border-gray-200 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-semibold text-lg">订单详情</h1>
        <span
          className="ml-auto text-xs px-2 py-1 rounded-full text-white"
          style={{ backgroundColor: statusColor }}
        >
          {order.status}
        </span>
      </div>

      {/* 客户信息 */}
      <div className="bg-white m-3 rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-3">客户信息</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <User size={16} className="text-gray-400" />
            <span className="text-gray-600">{order.customerName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={16} className="text-gray-400" />
            <a href={`tel:${order.phone}`} className="text-blue-600">{order.phone}</a>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-gray-400" />
            <span className="text-gray-600">{order.address}</span>
          </div>
        </div>
      </div>

      {/* 预约信息 */}
      <div className="bg-white m-3 rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-3">预约信息</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <span className="text-gray-600">
              {order.appointmentDate || '未预约'} {order.appointmentTime || ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-gray-400" />
            <span className="text-gray-600">
              电表: {order.meterStatus} {order.meterNumber ? `(${order.meterNumber})` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* 费用信息 */}
      <div className="bg-white m-3 rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-3">费用明细</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">平台</span>
            <span>{order.platform}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">材料费</span>
            <span>¥{order.materialCost?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">人工费</span>
            <span>¥{order.laborCost?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">平台扣点</span>
            <span className="text-red-500">-¥{order.platformFee?.toFixed(2)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>实际利润</span>
            <span className="text-blue-600">¥{order.actualProfit?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 备注 */}
      {order.notes && (
        <div className="bg-white m-3 rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">备注</h2>
          <div className="flex items-start gap-2 text-sm">
            <FileText size={16} className="text-gray-400 mt-0.5" />
            <span className="text-gray-600">{order.notes}</span>
          </div>
        </div>
      )}
    </div>
  )
}
