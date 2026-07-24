import { useNavigate } from 'react-router-dom'
import { useOrderList } from '../hooks/useOrderList'
import OrderCard from '../components/OrderCard'
import { useState } from 'react'
import { ORDER_STATUSES } from '@/constants/order'
import { Search, Filter } from 'lucide-react'

export default function OrderList() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<string>('全部')
  const [searchKw, setSearchKw] = useState('')

  const filter = activeFilter === '全部' ? undefined : { status: activeFilter as any }
  const { orders, stats } = useOrderList(filter)

  const displayOrders = searchKw
    ? orders.filter((o: any) =>
        o.customerName?.includes(searchKw) ||
        o.phone?.includes(searchKw) ||
        o.address?.includes(searchKw)
      )
    : orders

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 统计栏 */}
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="flex justify-around text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500">全部</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-500">{stats.pending}</div>
            <div className="text-xs text-gray-500">待办</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-500">{stats.scheduled}</div>
            <div className="text-xs text-gray-500">已预约</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-500">{stats.completed}</div>
            <div className="text-xs text-gray-500">已完成</div>
          </div>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="p-3 bg-white border-b border-gray-200">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索客户/电话/地址"
              value={searchKw}
              onChange={(e) => setSearchKw(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 状态筛选 */}
      <div className="flex gap-2 p-3 overflow-x-auto bg-white border-b border-gray-200">
        {['全部', ...ORDER_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setActiveFilter(s)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
              activeFilter === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* 订单列表 */}
      <div className="p-3">
        {displayOrders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Filter size={48} className="mx-auto mb-4 opacity-30" />
            <p>暂无订单</p>
          </div>
        ) : (
          displayOrders.map((order: any) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() => navigate(`/orders/${order.id}`)}
            />
          ))
        )}
      </div>
    </div>
  )
}
