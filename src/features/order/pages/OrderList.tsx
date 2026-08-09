import { useNavigate } from 'react-router-dom'
import { useOrderList } from '../hooks/useOrderList'
import OrderCard from '../components/OrderCard'
import SurveyModal from '../components/SurveyModal'
import ScriptEditorModal from '../components/ScriptEditorModal'
import { useState, useMemo } from 'react'
import type { Order } from '@/types'
import { ORDER_STATUSES } from '@/constants/order'
import { Search, Plus, FileText } from 'lucide-react'
import { EmptyState } from '@/shared/components/EmptyState'
import { useOrderStore } from '@/stores/orderStore'
import { getKnownPlatforms } from '@/shared/storage/platformStorage'
import '../../../shared/components/OrderList.css'

interface Props {
  fixedStatus?: string
  allowTrash?: boolean
}

export default function OrderList({ fixedStatus, allowTrash = false }: Props) {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<string>(fixedStatus ?? '全部')
  const [searchKw, setSearchKw] = useState('')
  const [showCount, setShowCount] = useState(50)
  const [surveyOrder, setSurveyOrder] = useState<Order | null>(null)
  const [scriptOrder, setScriptOrder] = useState<Order | null>(null)
  const [editPlatformOrder, setEditPlatformOrder] = useState<Order | null>(null)

  const filter = activeFilter === '全部' ? undefined : { status: activeFilter as Order['status'] }
  const { orders } = useOrderList(filter)
  const deleteOrder = useOrderStore((state) => state.deleteOrder)
  const updateOrder = useOrderStore((state) => state.updateOrder)
  const knownPlatforms = getKnownPlatforms()

  const today = new Date().toISOString().slice(0, 10)

  const displayOrders = useMemo(() => {
    const filtered = searchKw
      ? orders.filter((o) =>
          o.customerName?.includes(searchKw) ||
          o.phone?.includes(searchKw) ||
          o.address?.includes(searchKw)
        )
      : orders
    const todayOrders = filtered.filter((o) => o.appointmentDate === today)
    const otherOrders = filtered.filter((o) => o.appointmentDate !== today)
    return [...todayOrders, ...otherOrders]
  }, [orders, searchKw, today])

  const filterOptions = fixedStatus
    ? [fixedStatus, ...(allowTrash ? ['回收站'] : [])]
    : ['全部', ...ORDER_STATUSES]

  const emptyText = activeFilter === '全部' ? '暂无订单' : `暂无${activeFilter}订单`

  return (
    <div className="order-list-page">
      {/* 搜索栏 + 操作按钮 */}
      <div className="order-list__toolbar">
        <div className="order-list__search">
          <Search size={16} className="order-list__search-icon" />
          <input
            type="text"
            placeholder="搜索客户/电话/地址"
            value={searchKw}
            onChange={(e) => setSearchKw(e.target.value)}
            className="order-list__search-input"
          />
        </div>
        <div className="order-list__actions">
          <button
            onClick={() => navigate('/order/new')}
            className="order-list__btn order-list__btn--primary"
          >
            <Plus size={16} />
            新增订单
          </button>
          <button
            onClick={() => navigate('/batch-parser')}
            className="order-list__btn order-list__btn--secondary"
          >
            <FileText size={16} />
            批量解析
          </button>
        </div>
      </div>

      {/* 状态筛选 */}
      <div className="order-list__filters">
        {filterOptions.map((s) => (
          <button
            key={s}
            onClick={() => setActiveFilter(s)}
            className={`order-list__filter ${activeFilter === s ? 'active' : ''}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* 订单列表 */}
      <div className="order-list__content">
        {displayOrders.length === 0 ? (
          <EmptyState
            type="orders"
            title={emptyText}
            action={
              activeFilter !== '回收站' && (
                <button
                  onClick={() => navigate('/order/new')}
                  className="order-list__empty-btn"
                >
                  新增第一单
                </button>
              )
            }
          />
        ) : (
          <>
            {displayOrders.slice(0, showCount).map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                showMenu={fixedStatus === '待办' || fixedStatus === '已预约'}
                isToday={order.appointmentDate === today}
                onClick={() => navigate(`/orders/${order.id}`)}
                onSurvey={setSurveyOrder}
                onGenerateScript={setScriptOrder}
                onDelete={(item) => deleteOrder(item.id)}
                onEditPlatform={setEditPlatformOrder}
              />
            ))}
            {displayOrders.length > showCount && (
              <button
                onClick={() => setShowCount((n) => n + 50)}
                className="order-list__load-more"
              >
                加载更多（剩余 {displayOrders.length - showCount} 条）
              </button>
            )}
          </>
        )}
      </div>
      {surveyOrder && (
        <SurveyModal
          order={surveyOrder}
          onClose={() => setSurveyOrder(null)}
        />
      )}
      {scriptOrder && <ScriptEditorModal order={scriptOrder} onClose={() => setScriptOrder(null)} />}
      {editPlatformOrder && (
        <div className="modal-overlay" onClick={() => setEditPlatformOrder(null)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">选择平台</h3></div>
            <div className="modal-body">
              {knownPlatforms.length ? knownPlatforms.map((platform) => (
                <button
                  key={platform}
                  className="modal-btn modal-btn--secondary w-full mb-2"
                  onClick={() => { updateOrder(editPlatformOrder.id, { platformName: platform }); setEditPlatformOrder(null) }}
                >
                  {platform}
                </button>
              )) : <p className="text-sm text-gray-500">暂无已知平台</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
