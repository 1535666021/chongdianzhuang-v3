import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useOrderStore } from '@/stores/orderStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { STATUS_COLORS } from '@/constants/order'
import { ArrowLeft, Phone, MapPin, Calendar, User, FileText, Zap, Edit3, Trash2, CheckCircle, ClipboardList, Map as MapIcon, X } from 'lucide-react'
import { useGeocode } from '../hooks/useGeocode'
import OrderMap from '../components/OrderMap'
import NavigateButton from '../components/NavigateButton'

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
    navigate(`/order/survey/${id}`)
  }

  const handleDelete = () => {
    if (window.confirm('确定要删除这条订单吗？')) {
      deleteOrder(id!)
      navigate('/')
    }
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
          className="ml-auto text-xs px-2 py-1 rounded-full text-white"
          style={{ backgroundColor: statusColor }}
        >
          {order.status}
        </span>
      </div>

      <div className="flex gap-2 p-3">
        {order.status === '待办' && (
          <button
            onClick={handleSurvey}
            className="flex-1 flex items-center justify-center gap-1 bg-amber-500 text-white py-2 rounded-lg text-sm"
          >
            <ClipboardList size={16} />
            {order.survey ? '查看勘察' : '勘察'}
          </button>
        )}
        {order.status !== '已完成' && (
          <button
            onClick={handleComplete}
            className="flex-1 flex items-center justify-center gap-1 bg-green-500 text-white py-2 rounded-lg text-sm"
          >
            <CheckCircle size={16} />
            标记完成
          </button>
        )}
        <button
          onClick={() => navigate(`/order/edit/${id}`)}
          className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white py-2 rounded-lg text-sm"
        >
          <Edit3 size={16} />
          编辑
        </button>
        <button
          onClick={handleDelete}
          className="flex-1 flex items-center justify-center gap-1 bg-red-500 text-white py-2 rounded-lg text-sm"
        >
          <Trash2 size={16} />
          删除
        </button>
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
            <div>勘察日期: {order.survey.surveyDate}</div>
            <div>电表位置: {order.survey.meterLocation}</div>
            <div>线路走向: {order.survey.cableRoute}</div>
            <div>施工难度: {order.survey.difficulty}</div>
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
            {order.survey.photosDesc && <div>照片描述: {order.survey.photosDesc}</div>}
            {order.survey.notes && <div>备注: {order.survey.notes}</div>}
          </div>
        </div>
      )}

      <div className="bg-white p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <FileText size={16} />
          费用明细
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>平台</span>
            <span>{order.platform}</span>
          </div>
          <div className="flex justify-between">
            <span>材料费</span>
            <span>¥{order.materialCost?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>人工费</span>
            <span>¥{order.laborCost?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-red-500">
            <span>平台扣点</span>
            <span>-¥{order.platformFee?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-medium text-green-600 pt-2 border-t">
            <span>实际利润</span>
            <span>¥{order.actualProfit?.toFixed(2)}</span>
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
    </div>
  )
}
