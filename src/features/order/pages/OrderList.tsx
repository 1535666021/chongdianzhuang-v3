import { useNavigate } from 'react-router-dom'
import { useOrderList } from '../hooks/useOrderList'
import OrderCard from '../components/OrderCard'
import { useState, useMemo } from 'react'
import { ORDER_STATUSES } from '@/constants/order'
import { Search, Filter, Plus, FileText } from 'lucide-react'

interface Props {
  /** 固定状态：传入后页面锁定该状态（首页=待办/已预约页/已完成页） */
  fixedStatus?: string
  /** 锁定状态下是否附带回收站入口（仅首页待办页使用） */
  allowTrash?: boolean
}

export default function OrderList({ fixedStatus, allowTrash = false }: Props) {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<string>(fixedStatus ?? '全部')
  const [searchKw, setSearchKw] = useState('')
  const [showCount, setShowCount] = useState(50)

  const filter = activeFilter === '全部' ? undefined : { status: activeFilter as any }
  const { orders, stats } = useOrderList(filter)

  const today = new Date().toISOString().slice(0, 10)

  const displayOrders = useMemo(() => {
    const filtered = searchKw
      ? orders.filter((o: any) =>
          o.customerName?.includes(searchKw) ||
          o.phone?.includes(searchKw) ||
          o.address?.includes(searchKw)
        )
      : orders
    const todayOrders = filtered.filter((o: any) => o.appointmentDate === today)
    const otherOrders = filtered.filter((o: any) => o.appointmentDate !== today)
    return [...todayOrders, ...otherOrders]
  }, [orders, searchKw])

  // 状态筛选选项：锁定页面只显示固定状态（首页待办页附带回收站），未锁定页面显示全部
  const filterOptions = fixedStatus
    ? [fixedStatus, ...(allowTrash ? ['回收站'] : [])]
    : ['全部', ...ORDER_STATUSES]

  const emptyText = activeFilter === '全部' ? '暂无订单' : `暂无${activeFilter}订单`

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 统计栏（全局数据，便于一眼看全盘） */}
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

      {/* 搜索栏 + 操作按钮 */}
      <div className="p-3 bg-white border-b border-gray-200">
        <div className="flex gap-2 mb-2">
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
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/order/new')}
            className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white py-2 rounded-lg text-sm"
          >
            <Plus size={16} />
            新增订单
          </button>
          <button
            onClick={() => navigate('/batch-parser')}
            className="flex-1 flex items-center justify-center gap-1 bg-green-600 text-white py-2 rounded-lg text-sm"
          >
            <FileText size={16} />
            批量解析
          </button>
        </div>
      </div>

      {/* 状态筛选：锁定页面只显示锁定项（首页待办附回收站） */}
      <div className="flex gap-2 p-3 overflow-x-auto bg-white border-b border-gray-200">
        {filterOptions.map((s) => (
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

      {/* 订单列表（分页渲染：首屏50条防卡顿） */}
      <div className="p-3">
        {displayOrders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Filter size={48} className="mx-auto mb-4 opacity-30" />
            <p>{emptyText}</p>
            {activeFilter !== '回收站' && (
              <button
                onClick={() => navigate('/order/new')}
                className="mt-4 text-blue-600 text-sm"
              >
                点击新增订单
              </button>
            )}
          </div>
        ) : (
          <>
            {displayOrders.slice(0, showCount).map((order: any) => (
              <OrderCard
                key={order.id}
                order={order}
                showMenu={fixedStatus === '已预约'}
                isToday={order.appointmentDate === today}
                onClick={() => navigate(`/orders/${order.id}`)}
              />
            ))}
            {displayOrders.length > showCount && (
              <button
                onClick={() => setShowCount((n) => n + 50)}
                className="w-full py-3 text-sm text-blue-600 bg-white rounded-lg border border-gray-200"
              >
                加载更多（剩余 {displayOrders.length - showCount} 条）
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
