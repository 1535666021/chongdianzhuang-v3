import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useOrderStore } from '@/stores/orderStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { STATUS_COLORS, STATUS_BG_COLORS } from '@/constants/order'
import { ArrowLeft, Phone, MapPin, Calendar, User, FileText, Zap, ClipboardList, CheckCircle, X, ChevronDown, ChevronUp, Map as MapIcon, MoreVertical } from 'lucide-react'
import { useGeocode } from '../hooks/useGeocode'
import OrderMap from '../components/OrderMap'
import NavigateButton from '../components/NavigateButton'
import SurveyModal from '../components/SurveyModal'
import ConfirmModal from '../components/ConfirmModal'
import OrderActionMenu from '../components/OrderActionMenu'

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
  const [showActionMenu, setShowActionMenu] = useState(false)
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

  const statusColor = STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] || '#6b7280'

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
        <h1 className="font-semibold text-lg">订单详情</h1>
        <span
          className="ml-auto text-xs px-2 py-1 rounded-full"
          style={{
            backgroundColor: STATUS_BG_COLORS[order.status as keyof typeof STATUS_BG_COLORS] || '#f3f4f6',
            color: STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] || '#6b7280'
          }}
        >
          {order.status}
        </span>
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

          {/* 地图/导航区域 */}
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
              {location && (
                <NavigateButton
                  lat={location.lat}
                  lng={location.lng}
                  address={order.address}
                />
              )}
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
              <div className="h-24 bg-gray-100 rounded-xl flex items-center justify-center text-xs text-gray-400">
                暂无地图位置，请先配置高德Key或检查地址
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Calendar size={16} />
          预约信息
        </h2>
        <div className="space-y-2 text-sm">
          <div>
            预约时间: {order.appointmentDate || '未预约'} {order.appointmentTime || ''}
          </div>
          <div>
            电表: {order.meterStatus} {order.meterNumber ? `(${order.meterNumber})` : ''}
          </div>
        </div>
      </div>

      {order.survey && (
        <div className="bg-white p-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <ClipboardList size={16} />
            勘察记录
          </h2>
          <div className="space-y-2 text-sm">
            {order.survey.powerSource && <div>取电方式: {order.survey.powerSource}</div>}
            {order.survey.cableSpec && <div>线缆规格: {order.survey.cableSpec}</div>}
            {order.survey.cableDistance !== undefined && order.survey.cableDistance > 0 && (
              <div>电缆距离: {order.survey.cableDistance}米</div>
            )}
            {order.survey.estimatedCableCost !== undefined && order.survey.estimatedCableCost > 0 && (
              <div>预估线缆费: ¥{order.survey.estimatedCableCost.toFixed(2)}</div>
            )}
            {order.survey.installMethod && <div>安装方式: {order.survey.installMethod}</div>}
            {order.survey.meterStatus && <div>电表状态: {order.survey.meterStatus}</div>}
            {order.survey.needBlueprint && <div>物业方案图: {order.survey.needBlueprint}</div>}
            {order.survey.surveyResult && <div>勘测结果: {order.survey.surveyResult}</div>}
            {order.survey.locationInfo && <div>位置信息: {order.survey.locationInfo}</div>}
            {order.survey.estimatedMaterials && order.survey.estimatedMaterials.length > 0 && (
              <div>
                预估材料:
                <div className="mt-1 space-y-1">
                  {order.survey.estimatedMaterials.map((m, i) => (
                    <div key={i} className="text-xs text-gray-600">
                      {m.name} {m.spec ? `(${m.spec})` : ''} × {m.quantity}{m.unit}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
                <span className="text-sm font-semibold">¥{order.customerPrice?.toFixed(2) || '0.00'}</span>
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
              <span className="text-sm font-medium text-gray-700">平台扣点</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-red-600">-¥{order.platformFee?.toFixed(2) || '0.00'}</span>
                {expandedSections.platformFee ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>
            {expandedSections.platformFee && (
              <div className="px-3 py-2 text-sm text-gray-600 border-t border-gray-200">
                平台收取的服务费（{order.platform}）
              </div>
            )}
          </div>

          {/* 车企服务费 - 默认收起 */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedSections(prev => ({ ...prev, serviceFee: !prev.serviceFee }))}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">车企服务费</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">
                  ¥{(order.notes?.includes('维修') ? 60 : order.notes?.includes('勘察') || order.notes?.includes('勘测') ? 0 : 300).toFixed(2)}
                </span>
                {expandedSections.serviceFee ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>
            {expandedSections.serviceFee && (
              <div className="px-3 py-2 text-sm text-gray-600 border-t border-gray-200">
                车企支付的服务费（安装 300 元，维修 60 元，勘察/勘测 0 元）
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
                <span className="text-sm font-semibold text-gray-700">¥{order.materialCost?.toFixed(2) || '0.00'}</span>
                {expandedSections.materialCost ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>
            {expandedSections.materialCost && (
              <div className="px-3 py-2 text-sm text-gray-600 border-t border-gray-200">
                材料采购成本（含增项材料和固定辅材）
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
                <span className="text-sm font-semibold text-green-700">¥{order.actualProfit?.toFixed(2) || '0.00'}</span>
                {expandedSections.profit ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>
            {expandedSections.profit && (
              <div className="px-3 py-2 text-sm text-green-700 border-t border-green-200">
                计算公式：客户应收 - 平台扣点 + 车企服务费 - 材料成本
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

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-3 py-3 z-20">
        {order.status === '待办' && (
          <button
            onClick={handleEdit}
            className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white py-3 rounded-lg text-sm font-medium"
            style={{ height: '48px' }}
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
              style={{ height: '48px' }}
            >
              <ClipboardList size={16} />
              {order.survey ? '查看勘测' : '勘测'}
            </button>
            <button
              onClick={handleComplete}
              className="flex-1 flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white py-3 rounded-lg text-sm font-medium"
              style={{ height: '48px' }}
            >
              <CheckCircle size={16} />
              标记完成
            </button>
          </div>
        )}
        {order.status === '已完成' && (
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="flex-1 flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white py-3 rounded-lg text-sm font-medium"
              style={{ height: '48px' }}
            >
              <FileText size={16} />
              查看报告
            </button>
          </div>
        )}
      </div>

      {/* 右上角操作菜单按钮 */}
      <button
        onClick={() => setShowActionMenu(true)}
        className="fixed bottom-24 right-4 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center z-20"
      >
        <MoreVertical size={20} className="text-gray-600" />
      </button>

      {showActionMenu && (
        <OrderActionMenu
          orderId={id!}
          onClose={() => setShowActionMenu(false)}
          onEditAppointment={handleEdit}
          onNavigate={() => {
            if (order.address) {
              window.open(`https://uri.amap.com/marker?position=${encodeURIComponent(order.address)}`, '_blank')
            }
          }}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
