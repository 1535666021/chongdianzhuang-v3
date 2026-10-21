import { getServiceFee, calcFullMaterialCost, isBusinessTripOrder, getOrderBusinessDate, isFreeQuotaMaterial, calcActualProfitByPolicy, getOrderPlatformFee } from '@/shared/utils/orderCalc'
import { POLICY_FIX_TRIP_START, POLICY_FIX_TRIP_END, PLATFORM_FEE_RATE } from '@/constants/policy'
import { CostItemsTable } from '@/shared/components/CostItemsTable'
import type { Order } from '@/types'
import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useOrderStore } from '@/stores/orderStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { STATUS_COLORS, STATUS_BG_COLORS } from '@/constants/order'
import { ArrowLeft, Phone, MapPin, Calendar, User, FileText, Zap, ClipboardList, CheckCircle, X, ChevronDown, ChevronUp, Map as MapIcon } from 'lucide-react'
import { useGeocode } from '../hooks/useGeocode'
import OrderMap from '../components/OrderMap'
import SurveyModal from '../components/SurveyModal'
import ConfirmModal from '../components/ConfirmModal'
import { OrderDetailInfoSections } from '../components/OrderDetailInfoSections'
import { formatCurrency } from '@/shared/utils/format'

// P0-194：出差判定来源标注（展示只读，镜像 isBusinessTripOrder 优先级：人工>窗口>启发式，禁改判定链）
function tripSourceLabel(order: Order): string | null {
  if (!isBusinessTripOrder(order)) return null
  if (typeof order.isBusinessTrip === 'boolean') return '出差·手动标记'
  const d = getOrderBusinessDate(order)
  if (d >= POLICY_FIX_TRIP_START && d <= POLICY_FIX_TRIP_END) return '出差·9-10月窗口'
  return '出差·扣点0判定'
}

/** P0-194：材料成本逐项重算（存值 survey.cableDistance/materials 经 calcFullMaterialCost 唯一出口；老单缺字段由出口兜底显"—"） */
function MaterialCostDetail({ order }: { order: Order }) {
  const detailCost = useMemo(() => calcFullMaterialCost({
    brandName: order.brandName,
    powerKw: order.powerKw,
    cableMeters: order.survey?.cableDistance ?? 0,
    extraItems: (order.materials || []).filter((m) => !isFreeQuotaMaterial(m.name)).map((m) => ({ name: m.name, quantity: m.quantity })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [order])
  return <CostItemsTable fullCostResult={detailCost} />
}

/** P0-197-R1：出差误判单条纠正——确认→单条备份→人工开关覆盖(false)→扣点按客户应收重算→补助0→实际利润重算落库 */
function correctTripMisjudge(order: Order): void {
  if (!confirm(`将本单纠正为不出差：\n平台扣点重算 = 客户应收 × ${Math.round(PLATFORM_FEE_RATE * 100)}%，出差补助归 0，实际利润重算。\n执行前单条备份到 localStorage，确认继续？`)) return
  // P0-202（§1.6 增补裁定2）：扣点唯一走 getOrderPlatformFee（吉利免扣判定不丢），禁手写乘法
  const newFee = getOrderPlatformFee(order, order.customerPrice || 0)
  const newProfit = calcActualProfitByPolicy({
    customerPrice: order.customerPrice,
    platformFee: -newFee,
    serviceFee: order.serviceFee,
    tripSubsidy: 0,
    materialCost: order.materialCost,
    laborCost: order.laborCost,
  })
  const backupKey = `cdz_v3_trip_correct_backup_${order.id}_${Date.now()}`
  localStorage.setItem(backupKey, JSON.stringify(order))
  useOrderStore.getState().updateOrder(order.id, {
    isBusinessTrip: false,
    platformFee: -newFee,
    tripSubsidy: 0,
    actualProfit: newProfit,
  })
  alert(`已纠正为不出差：扣点 ${newFee}、补助 0、新实际利润 ${newProfit}（备份键 ${backupKey}）`)
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const order = useOrderStore((state) =>
    state.orders.find((o) => o.id === id)
  )
  const deleteOrder = useOrderStore((state) => state.deleteOrder)
  const amapKey = useSettingsStore((s) => s.amapKey)
  const amapZoom = useSettingsStore((s) => s.amapZoom ?? 15)

  const { geocode, loading: geoLoading, error: geoError } = useGeocode()
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [showSurvey, setShowSurvey] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    revenue: true,
    profit: true,
    materialCost: false,
    platformFee: false,
    serviceFee: false,
  })

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

  const handleComplete = () => {
    navigate(`/order/complete/${id}`)
  }

  const handleSurvey = () => {
    setShowSurvey(true)
  }

  const handleEdit = () => {
    navigate(`/order/edit/${id}`)
  }

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const handleToggleMap = async () => {
    if (showMap) {
      setShowMap(false)
      return
    }
    if (!location && order.address) {
      const res = await geocode(order.address, amapKey)
      if (res) {
        setLocation({ lat: res.lat, lng: res.lng })
      }
    }
    setShowMap(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white p-4 border-b border-gray-200 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-semibold text-lg flex-1 truncate">订单详情</h1>
        {/* P0-169-A：原悬浮⋮菜单拆为顶栏三钮（390px小屏等距自适应，无悬浮遮挡） */}
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <button type="button" onClick={handleEdit} className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 whitespace-nowrap">编辑</button>
          <button type="button" onClick={handleEdit} className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 whitespace-nowrap">改约</button>
          <button type="button" onClick={handleDelete} className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 whitespace-nowrap">删除</button>
          <span
            className="text-xs px-2 py-1 rounded-full whitespace-nowrap"
            style={{
              backgroundColor: STATUS_BG_COLORS[order.status as keyof typeof STATUS_BG_COLORS] || '#f3f4f6',
              color: STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] || '#6b7280'
            }}
          >
            {order.status}
          </span>
        </div>
      </div>

      <div className="bg-white p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <User size={16} />
          客户信息
        </h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-gray-400" />
            <span className="font-medium">{order.customerName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-gray-400" />
            <span>{order.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-gray-400" />
            <span className="text-sm text-gray-600 flex-1">{order.address}</span>
          </div>

          {/* 地图区域 */}
          <div className="pt-2 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={handleToggleMap}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm border transition-colors ${
                  showMap
                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                    : 'bg-white border-gray-200 text-gray-600 active:bg-gray-50'
                }`}
              >
                {showMap ? <X size={14} /> : <MapIcon size={14} />}
                {showMap ? '收起地图' : '查看地图'}
              </button>
            </div>

            {geoLoading && (
              <div className="text-xs text-gray-400 flex items-center gap-1 py-1">
                <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                正在解析地址...
              </div>
            )}
            {geoError && (
              <div className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
                {geoError}
              </div>
            )}

            {showMap && location && (
              <OrderMap
                location={{ ...location, address: order.address }}
                amapKey={amapKey}
                zoom={amapZoom}
              />
            )}
            {showMap && !location && !geoLoading && (
              <div className="h-24 bg-amber-100 rounded-xl flex items-center justify-center text-xs text-gray-400">
                暂无地图位置，请先配置高德Key或检查地址
              </div>
            )}
          </div>
        </div>
      </div>

      <OrderDetailInfoSections order={order} />

      <div className="bg-white p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <FileText size={16} />
          费用明细
        </h2>
        <div className="space-y-2">
          {/* 客户应收 - 默认展开 */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedSections(prev => ({ ...prev, revenue: !prev.revenue }))}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">客户应收</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{formatCurrency(order.customerPrice || 0)}</span>
                {expandedSections.revenue ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>
            {expandedSections.revenue && (
              <div className="px-3 py-2 text-sm text-gray-600 border-t border-gray-200">
                客户支付的总费用（含材料费和服务费）
              </div>
            )}
          </div>

          {/* 平台扣点 - 默认收起 */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedSections(prev => ({ ...prev, platformFee: !prev.platformFee }))}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                平台扣点
                {/* P0-194：出差判定来源标注（仅 isBusinessTripOrder=true 时显示，只读不改判定） */}
                {tripSourceLabel(order) && (
                  <span className="text-xs text-gray-400 font-normal">{tripSourceLabel(order)}</span>
                )}
                {/* P0-197-R1：出差误判单条纠正（仅出差单且未人工纠正过；判定链不动，人工开关覆盖生效） */}
                {tripSourceLabel(order) && order.isBusinessTrip !== false && (
                  <button
                    type="button"
                    className="text-xs text-blue-600 underline"
                    onClick={() => correctTripMisjudge(order)}
                  >纠正为不出差</button>
                )}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-red-600">-{formatCurrency(Math.abs(order.platformFee || 0))}</span>
                {expandedSections.platformFee ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>
            {expandedSections.platformFee && (
              <div className="px-3 py-2 text-sm text-gray-600 border-t border-gray-200">
                平台收取的服务费（{order.platform}）{tripSourceLabel(order) ? ` · ${tripSourceLabel(order)}：出差单扣点为0、补助+¥30已计入利润` : ''}
              </div>
            )}
          </div>

          {/* 安装费 - 默认收起 */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedSections(prev => ({ ...prev, serviceFee: !prev.serviceFee }))}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">安装费</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">
                  {formatCurrency(getServiceFee(order.notes || ''))}
                </span>
                {expandedSections.serviceFee ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>
            {expandedSections.serviceFee && (
              <div className="px-3 py-2 text-sm text-gray-600 border-t border-gray-200">
                安装费按套餐：20米200元/30米300元；维修60元；勘测50元
              </div>
            )}
          </div>

          {/* 材料成本 - 默认收起 */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedSections(prev => ({ ...prev, materialCost: !prev.materialCost }))}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">材料成本</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">{formatCurrency(order.materialCost || 0)}</span>
                {expandedSections.materialCost ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>
            {expandedSections.materialCost && (
              <div className="px-3 py-2 text-sm text-gray-600 border-t border-gray-200">
                材料采购成本（含增项材料和固定辅材）

                {/* P0-194：材料成本逐项明细（存值字段经 calcFullMaterialCost 唯一出口重算，金额读 amount 禁自算） */}
                <div className="mt-1">
                  <MaterialCostDetail order={order} />
                </div>
              </div>
            )}
          </div>

          {/* 实际利润 - 默认展开 */}
          <div className="border border-green-200 rounded-lg overflow-hidden bg-green-50">
            <button
              onClick={() => setExpandedSections(prev => ({ ...prev, profit: !prev.profit }))}
              className="w-full flex items-center justify-between px-3 py-2 bg-green-100 hover:bg-green-200 transition-colors"
            >
              <span className="text-sm font-medium text-green-800">实际利润</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-green-700">{formatCurrency(order.actualProfit || 0)}</span>
                {expandedSections.profit ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>
            {expandedSections.profit && (
              <div className="px-3 py-2 text-sm text-green-700 border-t border-green-200">
                {/* P0-197-R1：实际利润逐项明细——全部读存值字段，禁自算 */}
                <div className="space-y-0.5">
                  <div className="flex justify-between"><span>客户应收</span><span>+{formatCurrency(order.customerPrice || 0)}</span></div>
                  <div className="flex justify-between"><span>平台扣点</span><span>-{formatCurrency(Math.abs(order.platformFee || 0))}</span></div>
                  <div className="flex justify-between"><span>安装费</span><span>+{formatCurrency(order.serviceFee || 0)}</span></div>
                  {(order.tripSubsidy || 0) !== 0 && (
                    <div className="flex justify-between"><span>出差补助</span><span>+{formatCurrency(order.tripSubsidy || 0)}</span></div>
                  )}
                  <div className="flex justify-between"><span>材料成本</span><span>-{formatCurrency(order.materialCost || 0)}</span></div>
                  <div className="flex justify-between"><span>工资</span><span>-{formatCurrency(order.laborCost || 0)}</span></div>
                  <div className="flex justify-between font-semibold border-t border-green-200 mt-1 pt-1"><span>= 实际利润</span><span>{formatCurrency(order.actualProfit || 0)}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {order.notes && (
        <div className="bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Zap size={16} />
            备注
          </h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}
      {showSurvey && <SurveyModal order={order} onClose={() => setShowSurvey(false)} />}

      {showDeleteConfirm && (
        <ConfirmModal
          title="删除订单"
          message="确定要删除这条订单吗？"
          confirmText="删除"
          danger
          onConfirm={() => { deleteOrder(id!); navigate('/') }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      <div className="fixed left-0 right-0 bg-white border-t border-gray-200 px-3 py-3 z-20" style={{ bottom: 'calc(56px + env(safe-area-inset-bottom))' }}>
        {order.status === '待办' && (
          <button
            onClick={handleEdit}
            className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white py-3 rounded-lg text-sm font-medium"
            style={{ height: '48px' }
          >
            <Calendar size={16} />
            预约
          </button>
        )}
        {order.status === '已预约' && (
          <div className="flex gap-2">
            <button
              onClick={handleSurvey}
              className="flex-1 flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white py-3 rounded-lg text-sm font-medium"
              style={{ height: '48px' }
            >
              <ClipboardList size={16} />
              {order.survey ? '查看勘测' : '勘测'}
            </button>
            <button
              onClick={handleComplete}
              className="flex-1 flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white py-3 rounded-lg text-sm font-medium"
              style={{ height: '48px' }
            >
              <CheckCircle size={16} />
              标记完成
            </button>
          </div>
        )}
        {order.status === '已完成' && (
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/order/complete/${id}`)}
              className="flex-1 flex items-center justify-center gap-2 bg-orange-500 text-white py-3 rounded-lg text-sm font-medium"
              style={{ height: '48px' }
            >
              <FileText size={16} />
              修改结算
            </button>
            <button
              onClick={handleEdit}
              className="flex-1 flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white py-3 rounded-lg text-sm font-medium"
              style={{ height: '48px' }
            >
              <FileText size={16} />
              查看报告
            </button>
          </div>
        )}
      </div>

    </div>
  )
}
