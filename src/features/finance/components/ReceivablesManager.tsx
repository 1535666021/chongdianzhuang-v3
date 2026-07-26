import { useState } from 'react'
import { useFinance } from '../hooks/useFinance'
import type { ReceivableFilter } from '../types/finance'
import { CheckCircle, Circle, DollarSign } from 'lucide-react'

const FILTERS: { key: ReceivableFilter; label: string }[] = [
  { key: 'all', label: '全部' }, { key: 'unpaid', label: '未回款' }, { key: 'paid', label: '已回款' },
]
function fmt(n: number): string { return n.toFixed(2) }

export default function ReceivablesManager() {
  const { receivableOrders, getFilteredReceivables, togglePaymentStatus } = useFinance()
  const [filter, setFilter] = useState<ReceivableFilter>('all')
  const filtered = getFilteredReceivables(filter)
  const unpaidCount = receivableOrders.filter((o) => !o.paid).length
  const paidCount = receivableOrders.filter((o) => o.paid).length
  const unpaidAmount = receivableOrders.filter((o) => !o.paid).reduce((sum, o) => sum + o.revenue, 0)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm text-center"><div className="text-lg font-bold text-gray-800">{receivableOrders.length}</div><div className="text-[10px] text-gray-400">总订单</div></div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center"><div className="text-lg font-bold text-orange-500">{unpaidCount}</div><div className="text-[10px] text-gray-400">未回款</div></div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center"><div className="text-lg font-bold text-green-600">{paidCount}</div><div className="text-[10px] text-gray-400">已回款</div></div>
      </div>
      {unpaidAmount > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2"><DollarSign size={16} className="text-orange-500" /><span className="text-sm font-medium text-orange-700">未回款总额</span></div>
          <span className="text-lg font-bold text-orange-600">¥{fmt(unpaidAmount)}</span>
        </div>
      )}
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`flex-1 py-2 text-xs rounded-lg font-medium ${filter === f.key ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>{f.label}</button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.length === 0 && <div className="text-center text-gray-400 py-8 text-sm">暂无订单</div>}
        {filtered.map((order) => (
          <div key={order.id} className={`bg-white rounded-xl p-3 shadow-sm border ${order.paid ? 'border-green-200' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{order.customerName}</div>
                <div className="text-xs text-gray-400 mt-0.5">{order.platform} · ¥{fmt(order.revenue)}</div>
              </div>
              <button onClick={() => togglePaymentStatus(order.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${order.paid ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                {order.paid ? <CheckCircle size={14} /> : <Circle size={14} />}{order.paid ? '已回款' : '未回款'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
