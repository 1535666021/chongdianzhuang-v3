import { useMemo, useState } from 'react'
import type { Order } from '@/types'
import { buildRegionTree, matchRegionPath, nodesAtPath } from './regionTreeModel'

// P0-268-B：市→区县→乡镇三级下钻；点市显该市总数+按区县分组列订单；点区县显区县总数+按乡镇分组列订单；计数去重
function OrderLines({ orders }: { orders: Order[] }) {
  return (
    <div className="pl-3 pt-1 space-y-0.5">
      {orders.slice(0, 50).map((o) => (
        <p key={String(o.id)} className="text-gray-600">
          {o.orderNo || o.id} · {o.customerName || '（无姓名）'} · {o.phone || '（无电话）'}
        </p>
      ))}
      {orders.length > 50 && <p className="text-gray-400">…共 {orders.length} 单</p>}
    </div>
  )
}

export default function RegionTree({
  orders,
  onSelectRegion,
}: {
  orders: Order[]
  onSelectRegion?: (path: string[] | null) => void
}) {
  const [selCity, setSelCity] = useState<string | null>(null)
  const [selDistrict, setSelDistrict] = useState<string | null>(null)
  const tree = useMemo(() => buildRegionTree(orders), [orders])
  const cities = useMemo(() => nodesAtPath(tree, []), [tree])
  const report = (city: string | null, district: string | null) => {
    onSelectRegion?.(city ? [city, ...(district ? [district] : [])] : null)
  }
  const ordersOf = (path: string[]) => orders.filter((o) => matchRegionPath(o, path))

  return (
    <div className="mx-3 mt-2 border border-gray-200 rounded-lg bg-white text-xs">
      {!selCity && (
        <div className="flex flex-wrap gap-1.5 p-2">
          <span className="text-gray-400 py-1">市</span>
          {cities.map((c) => (
            <button
              key={c.name}
              onClick={() => { setSelCity(c.name); report(c.name, null) }}
              className="px-2.5 py-1 border border-blue-200 bg-blue-50 text-blue-700 rounded-full"
            >
              {c.name}<span className="text-[10px] text-blue-500 ml-0.5">{c.count}</span>
            </button>
          ))}
          {cities.length === 0 && <span className="text-gray-400 py-1">（无可识别区域）</span>}
        </div>
      )}

      {selCity && !selDistrict && (() => {
        const cityNode = tree.children.get(selCity)
        const districts = nodesAtPath(tree, [selCity])
        const cityOrders = ordersOf([selCity])
        return (
          <div className="p-2 space-y-2">
            <p className="font-medium text-gray-700">
              {selCity}（{cityOrders.length}）
              <button onClick={() => { setSelCity(null); report(null, null) }} className="ml-2 text-blue-600 underline">返回全部</button>
            </p>
            {districts.map((d) => (
              <div key={d.name}>
                <button
                  onClick={() => { setSelDistrict(d.name); report(selCity, d.name) }}
                  className="font-medium text-blue-700"
                >
                  {d.name}（{d.count}）→
                </button>
                <OrderLines orders={ordersOf([selCity, d.name])} />
              </div>
            ))}
          </div>
        )
      })()}

      {selCity && selDistrict && (() => {
        const townships = nodesAtPath(tree, [selCity, selDistrict])
        const distOrders = ordersOf([selCity, selDistrict])
        return (
          <div className="p-2 space-y-2">
            <p className="font-medium text-gray-700">
              {selCity} / {selDistrict}（{distOrders.length}）
              <button onClick={() => { setSelDistrict(null); report(selCity, null) }} className="ml-2 text-blue-600 underline">← 返回区县</button>
            </p>
            {townships.map((t) => (
              <div key={t.name}>
                <p className="font-medium text-gray-600">{t.name}（{t.count}）</p>
                <OrderLines orders={ordersOf([selCity, selDistrict, t.name])} />
              </div>
            ))}
            {townships.length === 0 && <OrderLines orders={distOrders} />}
          </div>
        )
      })()}
    </div>
  )
}
