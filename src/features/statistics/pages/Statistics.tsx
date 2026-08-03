import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { useOrderStore } from '@/stores/orderStore'
import PlatformBreakdown from '../components/PlatformBreakdown'
import ProfitDetailModal from '../components/ProfitDetailModal'
import { exportReconciliationCsv } from '@/shared/utils/exportExcel'

function getOrderMonth(order: { completeDate?: string; createdAt: number }) {
  if (order.completeDate) return order.completeDate.slice(0, 7)
  const date = new Date(order.createdAt)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getAmountFontClass(value: number) {
  const len = Math.floor(Math.abs(value)).toString().length
  if (len <= 3) return 'text-2xl'
  if (len <= 5) return 'text-xl'
  return 'text-lg'
}

function formatMonth(month: string) {
  const [year, value] = month.split('-')
  return `${year}年${value}月`
}

function Metric({ label, value, color, onClick, amount = true }: { label: string; value: number; color: string; onClick?: () => void; amount?: boolean }) {
  const valueClass = amount ? getAmountFontClass(value) : 'text-2xl'
  return <button type="button" onClick={onClick} disabled={!onClick} className={`min-w-0 overflow-hidden text-center ${onClick ? 'cursor-pointer' : 'cursor-default'}`}><div className={`mb-1 text-xs text-gray-500 ${onClick ? 'whitespace-nowrap text-[11px]' : ''}`}>{label}</div><div className={`${valueClass} truncate font-bold ${color}`}>{amount ? `¥${value.toFixed(2)}` : value}</div></button>
}

export default function Statistics() {
  const orders = useOrderStore((s) => s.orders)
  const navigate = useNavigate()
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [detailType, setDetailType] = useState<'reconciliation' | 'actual' | null>(null)

  const months = useMemo(() => Array.from(new Set([currentMonth, ...orders.map(getOrderMonth)])).sort((a, b) => b.localeCompare(a)), [currentMonth, orders])
  const selectedOrders = useMemo(() => orders.filter((order) => getOrderMonth(order) === selectedMonth), [orders, selectedMonth])
  const completedOrders = useMemo(() => selectedOrders.filter((order) => order.status === '已完成'), [selectedOrders])
  const stats = useMemo(() => selectedOrders.reduce((total, order) => ({
    orderCount: total.orderCount + 1,
    customerPay: total.customerPay + (order.customerPrice || 0),
    netIncome: total.netIncome + (order.customerPrice || 0) - (order.platformFee || 0),
    reconciliationProfit: total.reconciliationProfit + (order.actualProfit || 0) + (order.platformFee || 0),
    actualProfit: total.actualProfit + (order.actualProfit || 0),
    addonCost: total.addonCost + (order.materialCost || 0) + (order.laborCost || 0),
  }), { orderCount: 0, customerPay: 0, netIncome: 0, reconciliationProfit: 0, actualProfit: 0, addonCost: 0 }), [selectedOrders])
  const averageProfit = stats.orderCount ? stats.actualProfit / stats.orderCount : 0
  const averageAddon = stats.orderCount ? stats.addonCost / stats.orderCount : 0

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <h1 className="px-4 pb-2 pt-4 text-xl font-bold">数据统计</h1>
      <main className="space-y-4">
        <div className="mx-4 flex justify-center">
          <select aria-label="选择统计月份" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm">
            {months.map((month) => <option key={month} value={month}>{formatMonth(month)}</option>)}
          </select>
        </div>
        <div className="mx-4 space-y-4 rounded-2xl bg-white p-4 shadow-sm">
          <div className="grid grid-cols-3 gap-4">
            <Metric label="当月完成" value={stats.orderCount} color="text-blue-600" amount={false} />
            <Metric label="客户总付费" value={stats.customerPay} color="text-purple-600" />
            <Metric label="扣点后收入" value={stats.netIncome} color="text-purple-600" />
          </div>
          <div className="flex justify-between px-2 text-xs text-gray-400"><span>安装0/维修0</span><span>已扣平台点</span></div>
          <div className="grid grid-cols-2 gap-4">
            <Metric label="对账利润（点击查看）" value={stats.reconciliationProfit} color="text-green-600" onClick={() => setDetailType('reconciliation')} />
            <Metric label="实际利润（点击查看）" value={stats.actualProfit} color="text-green-600" onClick={() => setDetailType('actual')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Metric label="平均利润" value={averageProfit} color="text-green-600" />
            <Metric label="台均增项" value={averageAddon} color="text-blue-600" />
          </div>
          <div className="flex justify-between px-2 text-xs text-gray-400"><span>维修0台 ¥0.00</span><span>勘测0台 ¥0.00</span></div>
          <button type="button" onClick={() => exportReconciliationCsv(selectedOrders, selectedMonth)} className="w-full rounded-xl bg-green-600 py-3 text-sm font-medium text-white">导出Excel对账单</button>
        </div>

        <div className="mx-4"><PlatformBreakdown orders={selectedOrders} /></div>
        <div className="mx-4"><button onClick={() => navigate('/finance')} className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50"><span className="flex items-center gap-2 text-sm font-medium text-gray-800"><FileText size={16} className="text-blue-600" />查看财务对账</span><span className="text-xs font-medium text-blue-600">进入 →</span></button></div>

      </main>
      {detailType && <ProfitDetailModal month={selectedMonth} orders={completedOrders} type={detailType} onClose={() => setDetailType(null)} />}
    </div>
  )
}
