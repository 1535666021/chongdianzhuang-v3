import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { Order } from '@/types'
import { useDailyBreakdown } from '../hooks/useDailyBreakdown'
import { formatCurrency } from '@/shared/utils/format'

/** P0-153-R1：盈亏着色（正绿/负红/零灰）与金额格式 */
const profitColor = (v: number) => (v > 0 ? 'text-green-600' : v < 0 ? 'text-red-500' : 'text-gray-400')
const fmt = (v: number) => `${v < 0 ? '-' : ''}${formatCurrency(Math.abs(v))}`
const nameOf = (o: Order) => o.customerName || '未命名'

/** 按天明细：默认展开最近3天，其余折叠单行（日期+单数+当天利润合计） */
export function DailyBreakdownSection({ orders }: { orders: Order[] }) {
  const { days, expandedKeys, toggle } = useDailyBreakdown(orders)
  // P0-185：当月合计（客户付费=ΣcustomerPrice，利润=ΣactualProfit）
  const monthCustomerTotal = Math.round(days.reduce((sum, d) => sum + d.customerPriceTotal, 0) * 100) / 100
  const monthProfitTotal = Math.round(days.reduce((sum, d) => sum + d.total, 0) * 100) / 100
  return (
    <section className="mx-4 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-bold text-gray-800">按天明细</h2>
      {days.length === 0 ? (
        <p className="text-xs text-gray-400">该月暂无完成订单</p>
      ) : (
        <div className="space-y-2">
          {days.map((d) => {
            const open = expandedKeys.has(d.key)
            return (
              <div key={d.key} className="rounded-xl border border-gray-100">
                <button type="button" onClick={() => toggle(d.key)} className="flex w-full items-center justify-between px-3 py-2 text-sm">
                  <span>
                    <span className="font-medium text-gray-800">
                      {d.label} <span className="text-xs text-gray-400">({d.orders.length}单)</span>
                    </span>
                    <span className="block text-[10px] text-gray-400">客户付费 {fmt(d.customerPriceTotal)}</span>
                  </span>
                  <span className={`flex items-center gap-1 font-semibold ${profitColor(d.total)}`}>
                    {fmt(d.total)}
                    {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </button>
                {open && (
                  <ul className="border-t border-gray-50 px-3 py-1">
                    {d.orders.map((o) => (
                      <li key={o.id} className="flex items-center justify-between py-1.5 text-sm">
                        <span className="text-gray-700">
                          {nameOf(o)}{o.isBusinessTrip === true && <span className="ml-1 rounded bg-orange-500 px-1 text-[10px] text-white">出差</span>} <span className="text-xs text-gray-400">{o.platform || '未知平台'}</span>
                          <span className="ml-1 text-xs text-gray-500">客户付费 {fmt(o.customerPrice || 0)}</span>
                          {o.payment?.paid
                            ? <span className="ml-1 rounded bg-green-500 px-1 text-[10px] text-white">已收</span>
                            : <span className="ml-1 rounded bg-gray-300 px-1 text-[10px] text-white">未收</span>}
                        </span>
                        <span className={`font-medium ${profitColor(o.actualProfit || 0)}`}>{fmt(o.actualProfit || 0)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
          <div className="mt-3 flex items-center justify-between border-t border-gray-100 px-1 pt-2 text-sm">
            <span className="font-medium text-gray-700">当月合计</span>
            <span className="text-gray-600">客户付费 {fmt(monthCustomerTotal)} · 利润 <span className={`font-semibold ${profitColor(monthProfitTotal)}`}>{fmt(monthProfitTotal)}</span></span>
          </div>
        </div>
      )}
    </section>
  )
}

/** 逐单盈亏榜：赚/亏/全部筛选，金额绝对值倒序 */
export function ProfitBoardSection({ orders }: { orders: Order[] }) {
  const [filter, setFilter] = useState<'all' | 'win' | 'loss'>('all')
  const rows = useMemo(
    () =>
      orders
        .filter((o) => (filter === 'all' ? true : filter === 'win' ? (o.actualProfit || 0) > 0 : (o.actualProfit || 0) < 0))
        .sort((a, b) => Math.abs(b.actualProfit || 0) - Math.abs(a.actualProfit || 0)),
    [orders, filter],
  )
  return (
    <section className="mx-4 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-bold text-gray-800">逐单盈亏榜</h2>
      <div className="mb-3 flex gap-2">
        {([['all', '全部'], ['win', '赚单'], ['loss', '亏单']] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${filter === k ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-400">该月暂无完成订单</p>
      ) : (
        <ul className="space-y-1">
          {rows.map((o) => (
            <li key={o.id} className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-gray-700">
                {nameOf(o)} <span className="text-xs text-gray-400">{o.platform || '未知平台'}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{o.actualInstallDate || '未填日期'}</span>
                <span className={`font-medium ${profitColor(o.actualProfit || 0)}`}>{fmt(o.actualProfit || 0)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
