import { useMemo } from 'react'
import type { Order, OrderFilter } from '@/types'
import { extractRegionTags, extractTypeCounts, filterOrders } from '../../hooks/useOrderList'
import type { FilterState } from './useFilterState'

export function useTagCounts(orders: Order[], state: FilterState) {
  const tagCounts = useMemo(() => {
    const baseFilter: OrderFilter = {
      status: state.statusFilter === 'all' ? undefined : state.statusFilter,
      installType: state.installType,
      brand: state.brand,
      platform: state.platform,
      keyword: state.keyword || undefined,
    }
    const base = filterOrders(orders, baseFilter)
    return extractRegionTags(base, state.groupMode === 'time' ? 'time' : 'region')
  }, [orders, state.statusFilter, state.groupMode, state.installType, state.brand, state.platform, state.keyword])

  const typeCounts = useMemo(() => {
    const baseFilter: OrderFilter = {
      status: state.statusFilter === 'all' ? undefined : state.statusFilter,
      areaTag: state.selectedTag,
      brand: state.brand,
      platform: state.platform,
      keyword: state.keyword || undefined,
    }
    const base = filterOrders(orders, baseFilter)
    return extractTypeCounts(base)
  }, [orders, state.statusFilter, state.selectedTag, state.brand, state.platform, state.keyword])

  return { tagCounts, typeCounts }
}
