import { useNavigate } from 'react-router-dom'
import { useState, useMemo, useEffect } from 'react'
import type { Order, OrderFilter, OrderStatus } from '@/types'
import { useOrderList } from '../hooks/useOrderList'
import OrderCard from '../components/OrderCard'
import SurveyModal from '../components/SurveyModal'
import ScriptEditorModal from '../components/ScriptEditorModal'
import RestockDialog from '../components/RestockDialog'
import BatchAppointmentDialog from '../components/BatchAppointmentDialog'
import OrderFilterBar from '../components/OrderFilterBar'
import { groupOrdersByTag } from '../components/OrderFilterBar/utils'
import { isInstallOrder } from '../restock'
import { Plus, FileText, PackagePlus, CalendarPlus } from 'lucide-react'
import { EmptyState } from '@/shared/components/EmptyState'
import { useOrderStore } from '@/stores/orderStore'
import { getKnownPlatforms } from '@/shared/storage/platformStorage'
import '../../../shared/components/OrderList.css'

interface Props {
  fixedStatus?: string
  allowTrash?: boolean
}

export default function OrderList({ fixedStatus }: Props) {
  const navigate = useNavigate()
  const initialStatus: OrderStatus | 'all' =
    fixedStatus === '待办' || fixedStatus === '已预约' || fixedStatus === '已完成' ? fixedStatus : 'all'
  const [filter, setFilter] = useState<OrderFilter>({
    // P0-099：已完成页首帧即按完工时间倒序，与 OrderFilterBar 初始值一致；其他 Tab 创建时间不变
    sortBy: fixedStatus === '已完成' ? 'completeDate' : 'createdAt',
    sortOrder: 'desc',
    status: initialStatus === 'all' ? undefined : initialStatus,
    // P0-095：已完成页首帧即按时间分组，与 OrderFilterBar 初始值一致
    groupMode: fixedStatus === '已完成' ? 'time' : undefined,
  })
  const [showCount, setShowCount] = useState(50)
  const [resetKey, setResetKey] = useState(0)
  const [surveyOrder, setSurveyOrder] = useState<Order | null>(null)
  const [scriptOrder, setScriptOrder] = useState<Order | null>(null)
  const [editPlatformOrder, setEditPlatformOrder] = useState<Order | null>(null)
  const [showRestock, setShowRestock] = useState(false)
  const [showBatchAppointment, setShowBatchAppointment] = useState(false)

  const allOrders = useOrderStore((state) => state.orders)
  const deleteOrder = useOrderStore((state) => state.deleteOrder)
  const updateOrder = useOrderStore((state) => state.updateOrder)
  const { orders } = useOrderList(filter)
  const knownPlatforms = getKnownPlatforms()

  const today = new Date().toISOString().slice(0, 10)

  const displayOrders = useMemo(() => orders.slice(0, showCount), [orders, showCount])
  const groupMode = filter.groupMode ?? 'region'
  const orderGroups = useMemo(() => groupOrdersByTag(displayOrders, groupMode), [displayOrders, groupMode])

  useEffect(() => {
    setShowCount(50)
  }, [filter])

  const hasAnyOrder = allOrders.length > 0
  const resetFilters = () => setResetKey((key) => key + 1)
  const restockCount = useMemo(
    () => allOrders.filter((o) => o.restockStatus === 'needed' && o.status !== '回收站' && o.status !== '已完成' && isInstallOrder(o)).length,
    [allOrders],
  )
  const appointableOrders = useMemo(() => orders.filter((o) => o.status === '待办'), [orders])

  return (
    <div className="order-list-page">
      {/* 操作按钮 */}
      <div className="order-list__toolbar">
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
          <button
            onClick={() => setShowRestock(true)}
            className="order-list__btn order-list__btn--secondary"
          >
            <PackagePlus size={16} />
            一键补桩
            {restockCount > 0 && <span className="order-list__badge">{restockCount}</span>}
          </button>
          <button
            onClick={() => setShowBatchAppointment(true)}
            className="order-list__btn order-list__btn--secondary"
            disabled={appointableOrders.length === 0}
            style={appointableOrders.length === 0 ? { opacity: 0.5 } : undefined}
          >
            <CalendarPlus size={16} />
            批量预约
            {appointableOrders.length > 0 && <span className="order-list__badge">{appointableOrders.length}</span>}
          </button>
        </div>
      </div>

      {/* 多维筛选与分组 */}
      <OrderFilterBar
        key={resetKey}
        orders={allOrders}
        initialStatus={initialStatus}
        initialGroupMode={fixedStatus === '已完成' ? 'time' : 'region'}
        initialSortBy={fixedStatus === '已完成' ? 'completeDate' : 'createdAt'}
        onFilterChange={setFilter}
      />

      {/* 订单列表 */}
      <div className="order-list__content">
        {orders.length === 0 ? (
          hasAnyOrder ? (
            <EmptyState
              type="search"
              title="没有符合筛选条件的订单"
              action={
                <button onClick={resetFilters} className="order-list__empty-btn">
                  清空筛选条件
                </button>
              }
            />
          ) : (
            <EmptyState
              type="orders"
              title="还没有订单"
              action={
                <button onClick={() => navigate('/order/new')} className="order-list__empty-btn">
                  新增第一单
                </button>
              }
            />
          )
        ) : (
          <>
            {orderGroups.map((group) => (
              <section className="order-list__group" key={group.label}>
                <h2 className="order-list__group-title">{group.label} ({group.orders.length})</h2>
                {group.orders.map((order) => (
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
              </section>
            ))}
            {orders.length > showCount && (
              <button
                onClick={() => setShowCount((n) => n + 50)}
                className="order-list__load-more"
              >
                加载更多（剩余 {orders.length - showCount} 条）
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
      <RestockDialog open={showRestock} onClose={() => setShowRestock(false)} />
      {showBatchAppointment && (
        <BatchAppointmentDialog orders={appointableOrders} onClose={() => setShowBatchAppointment(false)} />
      )}
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
