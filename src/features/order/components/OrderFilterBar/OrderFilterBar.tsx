import { useEffect, useMemo } from 'react'
import type { Order, OrderFilter, OrderStatus } from '@/types'
import { extractBrandOptions, extractPlatformOptions, filterOrders } from '../../hooks/useOrderList'
import { useFilterState } from './useFilterState'
import { useTagCounts } from './useTagCounts'
import StatusOverview from './StatusOverview'
import GroupToggle from './GroupToggle'
import TagCloud from './TagCloud'
import TypeFilter from './TypeFilter'
import BrandPlatformSelect from './BrandPlatformSelect'
import SearchSortBar from './SearchSortBar'
import './OrderFilterBar.css'

export interface OrderFilterBarProps {
  orders: Order[]
  initialStatus?: OrderStatus | 'all'
  onFilterChange?: (filter: OrderFilter) => void
}

export default function OrderFilterBar({ orders, initialStatus = 'all', onFilterChange }: OrderFilterBarProps) {
  const {
    state,
    filter,
    isSmart,
    setStatusFilter,
    setSelectedTag,
    setInstallType,
    setBrand,
    setPlatform,
    setKeyword,
    setSortBy,
    setSortOrder,
    toggleDimension,
    toggleSmart,
  } = useFilterState(initialStatus)

  const { tagCounts, typeCounts } = useTagCounts(orders, state)

  const brands = useMemo(
    () => extractBrandOptions(filterOrders(orders, { ...filter, brand: undefined })),
    [orders, filter],
  )
  const platforms = useMemo(
    () => extractPlatformOptions(filterOrders(orders, { ...filter, platform: undefined })),
    [orders, filter],
  )

  const stats = useMemo(() => {
    const total = orders.length
    const pending = orders.filter((o) => o.status === '待办').length
    const scheduled = orders.filter((o) => o.status === '已预约').length
    const completed = orders.filter((o) => o.status === '已完成').length
    return { total, pending, scheduled, completed }
  }, [orders])

  useEffect(() => {
    onFilterChange?.(filter)
  }, [filter, onFilterChange])

  return (
    <div className="ofb">
      <StatusOverview stats={stats} value={state.statusFilter} onChange={setStatusFilter} />
      <GroupToggle
        groupMode={state.groupMode}
        isSmart={isSmart}
        onToggleDimension={toggleDimension}
        onToggleSmart={toggleSmart}
      />
      <TagCloud tags={tagCounts} selected={state.selectedTag} onSelect={setSelectedTag} />
      <TypeFilter types={typeCounts} selected={state.installType} onSelect={setInstallType} />
      <BrandPlatformSelect
        brands={brands}
        platforms={platforms}
        brand={state.brand}
        platform={state.platform}
        onBrandChange={setBrand}
        onPlatformChange={setPlatform}
      />
      <SearchSortBar
        keyword={state.keyword}
        onKeywordChange={setKeyword}
        sortBy={state.sortBy}
        sortOrder={state.sortOrder}
        onSortByChange={setSortBy}
        onSortOrderChange={setSortOrder}
      />
    </div>
  )
}
