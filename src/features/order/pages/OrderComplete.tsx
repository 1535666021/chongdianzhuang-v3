import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, User, Phone, Calendar, FileText, Ruler, Copy, MessageCircle } from 'lucide-react'
import { useCompletion } from '../hooks/useCompletion'
import { MaterialPicker } from '../components/MaterialPicker'
import { ProfitPreview } from '../components/ProfitPreview'
import { useOrderStore } from '@/stores/orderStore'
import { useSettingsStore } from '@/stores/settingsStore'
import CostBindModal from '@/features/material/components/CostBindModal'
import { scriptStorage } from '@/shared/storage/scriptStorage'
import { buildScriptVarsFromCompletionForm, renderScript } from '../hooks/useScript'
import { useState, useEffect } from 'react'

export default function OrderComplete() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { order, form, profit, packageMeters, setPackageMeters, packageBreakdown, updateForm, addMaterial, updateMaterial, removeMaterial, updateFixedAux, save, pendingCostBind, handleCostBound, handleCostBindClose } = useCompletion(id || '')
  const updateOrder = useOrderStore((s) => s.updateOrder)
  const settings = useSettingsStore()
  const [copiedScript, setCopiedScript] = useState(false)
  const [engineerPhone, setEngineerPhone] = useState(settings.engineerPhone || '')

  useEffect(() => {
    if (!form.installer && settings.engineerName) {
      updateForm({ installer: settings.engineerName })
    }
    if (!engineerPhone && settings.engineerPhone) {
      setEngineerPhone(settings.engineerPhone)
    }
  }, [])

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p>订单不存在</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 text-sm">返回</button>
        </div>
      </div>
    )
  }

  const handleSave = () => {
    updateOrder(order.id, { completionNotes: form.notes })
    if (save()) {
      navigate(`/orders/${id}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white p-4 border-b border-gray-200 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft size={20} /></button>
        <h1 className="font-semibold text-lg">标记完成</h1>
      </div>

      <div className="p-3 space-y-4">
        {/* 订单基本信息 */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <h2 className="text-sm font-semibold text-blue-800 mb-2">订单信息</h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 shrink-0">客户</span>
              <span className="font-medium text-gray-800">{order.customerName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600 shrink-0">平台</span>
              <span className="text-gray-800">{order.platform}</span>
              {order.platformName && (
                <span className="text-xs text-gray-500">({order.platformName})</span>
              )}
            </div>
            {order.brandName && (
              <div className="flex items-center gap-2">
                <span className="text-blue-600 shrink-0">品牌</span>
                <span className="text-gray-800">{order.brandName}</span>
                {order.powerKw && (
                  <span className="text-xs text-gray-500">{order.powerKw}kW</span>
                )}
              </div>
            )}
            <div className="flex items-start gap-2">
              <span className="text-blue-600 shrink-0">地址</span>
              <span className="text-gray-800 break-words">{order.address}</span>
            </div>
          </div>
        </div>

        {/* 表单区 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">完成信息</h3>

          <div>
            <label className="flex items-center gap-1 text-xs text-gray-500 mb-1.5"><Calendar size={12} />完成日期</label>
            <input type="date" value={form.completeDate} onChange={(e) => updateForm({ completeDate: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
          </div>

          <div>
            <label className="flex items-center gap-1 text-xs text-gray-500 mb-1.5"><User size={12} />安装工</label>
            <input type="text" value={form.installer} onChange={(e) => updateForm({ installer: e.target.value })} placeholder="输入安装工姓名" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
          </div>

          <div>
            <label className="flex items-center gap-1 text-xs text-gray-500 mb-1.5"><Phone size={12} />安装工电话</label>
            <input type="tel" value={engineerPhone} onChange={(e) => setEngineerPhone(e.target.value)} placeholder="输入安装工电话" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
          </div>

          <div>
            <label className="flex items-center gap-1 text-xs text-gray-500 mb-1.5"><Ruler size={12} />套餐米数（电缆/PVC免费额）</label>
            <input
              type="number"
              value={packageMeters}
              onChange={(e) => setPackageMeters(parseFloat(e.target.value) || 0)}
              placeholder="默认30米"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
            />
            <p className="text-[10px] text-gray-400 mt-1">电缆和PVC在{packageMeters}米内不计费</p>
          </div>

          <div>
            <label className="flex items-center gap-1 text-xs text-gray-500 mb-1.5"><FileText size={12} />备注</label>
            <textarea value={form.notes} onChange={(e) => updateForm({ notes: e.target.value })} placeholder="完工备注（会带入话术，允许为空）" rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none" />
          </div>
        </div>

        {/* 勘测信息 */}
        {order.survey && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">勘测信息</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500 text-xs">取电方式</span><p className="text-gray-800 mt-0.5">{order.survey.powerSource || '-'}</p></div>
              <div><span className="text-gray-500 text-xs">线缆规格</span><p className="text-gray-800 mt-0.5">{order.survey.cableSpec || '-'}</p></div>
              <div><span className="text-gray-500 text-xs">电缆距离</span><p className="text-gray-800 mt-0.5">{order.survey.cableDistance || 0}米</p></div>
              <div><span className="text-gray-500 text-xs">安装方式</span><p className="text-gray-800 mt-0.5">{order.survey.installMethod || '-'}</p></div>
              <div><span className="text-gray-500 text-xs">电表状态</span><p className="text-gray-800 mt-0.5">{order.survey.meterStatus || '-'}</p></div>
              <div><span className="text-gray-500 text-xs">勘测结果</span><p className="text-gray-800 mt-0.5">{order.survey.surveyResult || '-'}</p></div>
            </div>
          </div>
        )}

        {/* 材料区 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <MaterialPicker
            materials={form.materials}
            fixedAux={form.fixedAux}
            onAdd={addMaterial}
            onUpdate={updateMaterial}
            onRemove={removeMaterial}
            onUpdateFixedAux={updateFixedAux}
          />
        </div>

        {/* 套餐明细 */}
        {packageBreakdown.freeAmount > 0 && (
          <div className="bg-green-50 rounded-xl border border-green-100 p-4">
            <h3 className="text-sm font-semibold text-green-800 mb-2">套餐优惠</h3>
            <div className="space-y-1 text-xs">
              {packageBreakdown.items.filter((i) => i.freeQuantity > 0).map((item) => (
                <div key={item.materialName} className="flex justify-between">
                  <span className="text-green-600">{item.materialName}</span>
                  <span className="text-green-700">
                    免费{item.freeQuantity}米 / 超{item.overQuantity}米
                  </span>
                </div>
              ))}
              <div className="border-t border-green-200 pt-1 flex justify-between font-medium">
                <span className="text-green-700">合计优惠</span>
                <span className="text-green-800">¥{packageBreakdown.freeAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* 利润区 */}
        <ProfitPreview data={profit} />

        {/* 话术生成 */}
        <button
          onClick={() => {
            const brandName = order.brandName || '通用'
            const all = scriptStorage.getAll()
            const template = all.find(t => t.brand === brandName && t.scene === '安装完成') || all.find(t => t.id === 'default-install-complete')
            if (template) {
              const vars = buildScriptVarsFromCompletionForm(
                { ...form, customerReceivable: profit.customerReceivable, actualProfit: profit.actualProfit },
                order,
                { engineerName: settings.engineerName || '谢责强', engineerPhone: engineerPhone || '' }
              )
              const text = renderScript(template.content, vars)
              navigator.clipboard.writeText(text)
              setCopiedScript(true)
              setTimeout(() => setCopiedScript(false), 1500)
            }
          }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-green-200 text-green-600 text-sm font-medium bg-white hover:bg-green-50 transition-colors"
        >
          {copiedScript ? (
            <>
              <CheckCircle size={16} /> 话术已复制
            </>
          ) : (
            <>
              <MessageCircle size={16} /> 生成完工话术
            </>
          )}
        </button>

        {/* 确认按钮 */}
        <button onClick={handleSave} className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-600">
          <CheckCircle size={18} />确认完成
        </button>
      </div>

      {pendingCostBind && (
        <CostBindModal
          materialName={pendingCostBind}
          onClose={handleCostBindClose}
          onBound={handleCostBound}
        />
      )}
    </div>
  )
}
