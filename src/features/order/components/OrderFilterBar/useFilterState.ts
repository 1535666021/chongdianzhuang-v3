import { useCallback, useMemo, useRef, useState } from 'react'
import type { GroupMode, InstallType, OrderFilter, OrderStatus } from '@/types'

export interface FilterState {
  statusFilter: OrderStatus | 'all'
  groupMode: GroupMode
  selectedTag: string | null
  installType: InstallType | null
  brand: string | null
  platform: string | null
  keyword: string
  sortBy: NonNullable<OrderFilter['sortBy']>
  sortOrder: NonNullable<OrderFilter['sortOrder']>
}

export function useFilterState(
  initialStatus: OrderStatus | 'all' = 'all',
  initialGroupMode: GroupMode = 'region',
  initialSortBy: NonNullable<OrderFilter['sortBy']> = 'createdAt',
) {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>(initialStatus)
  // P0-095：已完成页由调用方传入 'time'，首页/已预约默认 'region' 不变
  const [groupMode, setGroupMode] = useState<GroupMode>(initialGroupMode)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [installType, setInstallType] = useState<InstallType | null>(null)
  const [brand, setBrand] = useState<string | null>(null)
  const [platform, setPlatform] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  // P0-099：已完成页由调用方传入 'completeDate'，其他 Tab 默认 'createdAt' 不变
  const [sortBy, setSortBy] = useState<NonNullable<OrderFilter['sortBy']>>(initialSortBy)
  const [sortOrder, setSortOrder] = useState<NonNullable<OrderFilter['sortOrder']>>('desc')
  const prevModeRef = useRef<'region' | 'time'>(initialGroupMode === 'time' ? 'time' : 'region')

  const isSmart = groupMode === 'smart'

  const toggleDimension = useCallback(() => {
    setGroupMode((mode) => (mode === 'time' ? 'region' : 'time'))
    setSelectedTag(null)
  }, [])

  const toggleSmart = useCallback(() => {
    if (groupMode === 'smart') {
      setGroupMode(prevModeRef.current)
    } else {
      prevModeRef.current = groupMode
      setGroupMode('smart')
    }
  }, [groupMode])

  const filter = useMemo<OrderFilter>(() => ({
    status: statusFilter === 'all' ? undefined : statusFilter,
    areaTag: selectedTag,
    installType,
    brand,
    platform,
    keyword: keyword || undefined,
    sortBy,
    sortOrder,
    groupMode,
  }), [statusFilter, selectedTag, installType, brand, platform, keyword, sortBy, sortOrder, groupMode])

  return {
    state: {
      statusFilter, groupMode, selectedTag, installType, brand, platform, keyword, sortBy, sortOrder,
    } satisfies FilterState,
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
  }
}
