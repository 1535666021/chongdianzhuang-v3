import { useMemo } from 'react'
import { useOrderStore } from '@/stores/orderStore'
import type { Order, OrderFilter } from '@/types'

export function useOrderList(filter?: OrderFilter) {
  const orders = useOrderStore((state) => state.orders)

  const filteredOrders = useMemo(() => {
    let result = [...orders]
    if (filter?.status) {
      result = result.filter((o: any) => o.status === filter.status)
    }
    if (filter?.platform) {
      result = result.filter((o: any) => o.platform === filter.platform)
    }
    if (filter?.region) {
      result = result.filter((o: any) => o.region === filter.region)
    }
    if (filter?.keyword) {
      const kw = filter.keyword.toLowerCase()
      result = result.filter((o: any) =>
        o.customerName?.toLowerCase().includes(kw) ||
        o.phone?.includes(kw) ||
        o.address?.toLowerCase().includes(kw)
      )
    }
    return result.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
  }, [orders, filter])

  const stats = useMemo(() => {
    const total = orders.length
    const pending = orders.filter((o: any) => o.status === '待办').length
    const scheduled = orders.filter((o: any) => o.status === '已预约').length
    const completed = orders.filter((o: any) => o.status === '已完成').length
    return { total, pending, scheduled, completed }
  }, [orders])

  return { orders: filteredOrders, stats }
}
