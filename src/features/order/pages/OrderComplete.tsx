import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, User, Calendar, FileText } from 'lucide-react'
import { useCompletion } from '../hooks/useCompletion'
import { MaterialPicker } from '../components/MaterialPicker'
import { ProfitPreview } from '../components/ProfitPreview'

export default function OrderComplete() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { order, form, profit, updateForm, addMaterial, updateMaterial, removeMaterial, updateFixedAux, save } = useCompletion(id || '')

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
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-blue-600">客户</span><span className="font-medium">{order.customerName}</span></div>
            <div className="flex justify-between"><span className="text-blue-600">平台</span><span>{order.platform}</span></div>
            <div className="flex justify-between"><span className="text-blue-600">地址</span><span className="text-right max-w-[200px] truncate">{order.address}</span></div>
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
            <label className="flex items-center gap-1 text-xs text-gray-500 mb-1.5"><FileText size={12} />备注</label>
            <textarea value={form.notes} onChange={(e) => updateForm({ notes: e.target.value })} placeholder="完工备注..." rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none" />
          </div>
        </div>

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

        {/* 利润区 */}
        <ProfitPreview data={profit} />

        {/* 确认按钮 */}
        <button onClick={handleSave} className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-600">
          <CheckCircle size={18} />确认完成
        </button>
      </div>
    </div>
  )
}
