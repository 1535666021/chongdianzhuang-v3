import { Calendar, ClipboardList } from 'lucide-react'
import type { Order } from '@/types'

export function OrderDetailInfoSections({ order }: { order: Order }) {
  return (
    <>
      <div className="bg-white p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Calendar size={16} />预约信息</h2>
        <div className="space-y-2 text-sm">
          <div>预约时间: {order.appointmentDate || '未预约'} {order.appointmentTime || ''}</div>
          <div>电表: {order.meterStatus} {order.meterNumber ? `(${order.meterNumber})` : ''}</div>
        </div>
      </div>
      {order.survey && <SurveyDetail survey={order.survey} />}
    </>
  )
}

function SurveyDetail({ survey }: { survey: NonNullable<Order['survey']> }) {
  return (
    <div className="bg-white p-4 border-b border-gray-200">
      <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><ClipboardList size={16} />勘察记录</h2>
      <div className="space-y-2 text-sm">
        {survey.powerSource && <div>取电方式: {survey.powerSource}</div>}
        {survey.cableSpec && <div>线缆规格: {survey.cableSpec}</div>}
        {survey.cableDistance !== undefined && survey.cableDistance > 0 && <div>电缆距离: {survey.cableDistance}米</div>}
        {survey.estimatedCableCost !== undefined && survey.estimatedCableCost > 0 && <div>预估线缆费: ¥{survey.estimatedCableCost.toFixed(2)}</div>}
        {survey.installMethod && <div>安装方式: {survey.installMethod}</div>}
        {survey.meterStatus && <div>电表状态: {survey.meterStatus}</div>}
        {survey.needBlueprint && <div>物业方案图: {survey.needBlueprint}</div>}
        {survey.surveyResult && <div>勘测结果: {survey.surveyResult}</div>}
        {survey.locationInfo && <div>位置信息: {survey.locationInfo}</div>}
        {survey.estimatedMaterials && survey.estimatedMaterials.length > 0 && (
          <div>
            预估材料:
            <div className="mt-1 space-y-1">
              {survey.estimatedMaterials.map((material, index) => <div key={index} className="text-xs text-gray-600">{material.name} {material.spec ? `(${material.spec})` : ''} × {material.quantity}{material.unit}</div>)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
