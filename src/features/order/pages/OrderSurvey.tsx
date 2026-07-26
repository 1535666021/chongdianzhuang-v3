import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useSurvey } from '../hooks/useSurvey'
import { SurveyForm } from '../components/SurveyForm'

export default function OrderSurvey() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    order,
    form,
    initFromOrder,
    updateForm,
    addMaterial,
    updateMaterial,
    removeMaterial,
    save,
  } = useSurvey(id!)

  useEffect(() => {
    initFromOrder()
  }, [initFromOrder])

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p>订单不存在</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 text-sm">
            返回
          </button>
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
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white p-4 border-b border-gray-200 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold">勘察录入</h1>
      </div>

      <div className="bg-white p-4 border-b border-gray-200">
        <div className="text-sm text-secondary">客户</div>
        <div className="font-medium">{order.customerName}</div>
        <div className="text-sm text-secondary mt-1">{order.address}</div>
      </div>

      <div className="p-4">
        <SurveyForm
          form={form}
          onUpdate={updateForm}
          onAddMaterial={addMaterial}
          onUpdateMaterial={updateMaterial}
          onRemoveMaterial={removeMaterial}
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <button
          onClick={handleSave}
          className="btn btn--primary w-full flex items-center justify-center gap-2"
        >
          <Save size={16} />
          保存勘察记录
        </button>
      </div>
    </div>
  )
}
