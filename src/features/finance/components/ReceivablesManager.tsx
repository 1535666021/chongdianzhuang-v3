import { useState, useMemo } from 'react'
import { CheckCircle, Circle, Wallet } from 'lucide-react'
import { useFinance } from '../hooks/useFinance'

type FilterType = 'all' | 'unpaid' | 'paid'

export function ReceivablesManager() {
  const { getReceivables, togglePaid } = useFinance()
  const [filter, setFilter] = useState<FilterType>('all')

  const list = useMemo(() => {
    const all = getReceivables()
    if (filter === 'unpaid') return all.filter(r => !r.paid)
    if (filter === 'paid') return all.filter(r => r.paid)
    return all
  }, [getReceivables, filter])

  const stats = useMemo(() => {
    const all = getReceivables()
    const unpaid = all.filter(r => !r.paid)
    return {
      total: all.length,
      unpaidCount: unpaid.length,
      unpaidAmount: unpaid.reduce((s, r) => s + r.amount, 0),
    }
  }, [getReceivables])

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Wallet size={48} className="mb-4 opacity-30" />
        <p>暂无回款记录</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">回款概览</h3>
        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-gray-400">未回款 {stats.unpaidCount} 笔</span>
          <span className="text-lg font-bold text-red-500">¥{stats.unpaidAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex gap-2">
        {(['all', 'unpaid', 'paid'] as FilterType[]).map(f => (
          <button
            key={f}
            className={`flex-1 py-2 text-xs rounded-lg font-medium ${
              filter === f ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? '全部' : f === 'unpaid' ? '未回款' : '已回款'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {list.map(item => (
          <div key={item.id} className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800">{item.customerName}</div>
              <div className="text-xs text-gray-400">{item.completeDate || '无日期'}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-gray-800">¥{item.amount.toFixed(2)}</span>
              <button
                className={`px-3 py-1.5 text-xs rounded-lg font-medium border ${
                  item.paid
                    ? 'bg-green-50 text-green-600 border-green-200'
                    : 'bg-orange-50 text-orange-600 border-orange-200'
                }`}
                onClick={() => togglePaid(item.id)}
              >
                {item.paid ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle size={14} /> 已回款
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Circle size={14} /> 标记回款
                  </span>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
