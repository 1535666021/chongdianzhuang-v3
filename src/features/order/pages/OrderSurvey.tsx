import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useOrderStore } from '@/stores/orderStore'
import { useSurvey } from '../hooks/useSurvey'
import { SurveyForm } from '../components/SurveyForm'

export default function OrderSurvey() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const order = useOrderStore((s) => s.orders.find((o) => o.id === id))

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

  return <OrderSurveyContent order={order} />
}

function OrderSurveyContent({ order }: { order: NonNullable<ReturnType<typeof useOrderStore.getState>['orders'][number]> }) {
  const navigate = useNavigate()
  const {
    form,
    updateForm,
    toggleAddon,
    removeAddon,
    save,
  } = useSurvey(order)

  const handleSave = () => {
    save()
    navigate('/')
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
          onAddMaterial={toggleAddon as any}
          onUpdateMaterial={() => {}}
          onRemoveMaterial={removeAddon as any}
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
