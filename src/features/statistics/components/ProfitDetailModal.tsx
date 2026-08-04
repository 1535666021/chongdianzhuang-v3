import { useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import type { Order } from '@/types'
import { getPlatformLabel } from '@/constants/platforms'
import '@/shared/components/Modal.css'

type ProfitType = 'reconciliation' | 'actual'

interface Props {
  month: string
  orders: Order[]
  type: ProfitType
  onClose: () => void
}

const formatMoney = (value: number) => `¥${value.toFixed(2)}`

export default function ProfitDetailModal({ month, orders, type, onClose }: Props) {
  useEffect(() => {
    document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [])

  const totals = useMemo(() => orders.reduce((sum, order) => ({
    amount: sum.amount + (order.customerPrice || 0),
    cost: sum.cost + (order.materialCost || 0) + (order.laborCost || 0),
    profit: sum.profit + (type === 'reconciliation' ? (order.actualProfit || 0) + (order.platformFee || 0) : (order.actualProfit || 0)),
  }), { amount: 0, cost: 0, profit: 0 }), [orders, type])
  const title = type === 'reconciliation' ? '对账利润明细' : '实际利润明细'

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-content" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <div><h2 className="modal-title">{title}</h2><p className="text-xs text-gray-400">{month} 已完成订单</p></div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭"><X size={20} /></button>
        </div>
        <div className="modal-body p-0">
          {orders.length === 0 ? <p className="py-10 text-center text-sm text-gray-400">暂无已完成订单</p> : (
            <div className="min-w-[560px] text-xs">
              <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr] gap-2 bg-gray-50 px-4 py-3 font-medium text-gray-500"><span>客户名</span><span>平台</span><span className="text-right">金额</span><span className="text-right">成本</span><span className="text-right">利润</span></div>
              {orders.map((order) => {
                const profit = type === 'reconciliation' ? (order.actualProfit || 0) + (order.platformFee || 0) : order.actualProfit || 0
                return <div key={order.id} className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr] gap-2 border-t border-gray-100 px-4 py-3 text-gray-700"><span className="truncate">{order.customerName}</span><span className="truncate">{getPlatformLabel(order.platformName || order.platform)}</span><span className="text-right">{formatMoney(order.customerPrice || 0)}</span><span className="text-right">{formatMoney((order.materialCost || 0) + (order.laborCost || 0))}</span><span className="text-right text-green-600">{formatMoney(profit)}</span></div>
              })}
            </div>
          )}
        </div>
        <div className="modal-footer grid grid-cols-3 gap-2 text-center text-xs text-gray-600"><span>合计金额<br /><b>{formatMoney(totals.amount)}</b></span><span>合计成本<br /><b>{formatMoney(totals.cost)}</b></span><span>合计利润<br /><b className="text-green-600">{formatMoney(totals.profit)}</b></span></div>
      </div>
    </div>
  )
}
