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

export function useFilterState(initialStatus: OrderStatus | 'all' = 'all') {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>(initialStatus)
  const [groupMode, setGroupMode] = useState<GroupMode>('region')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [installType, setInstallType] = useState<InstallType | null>(null)
  const [brand, setBrand] = useState<string | null>(null)
  const [platform, setPlatform] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [sortBy, setSortBy] = useState<NonNullable<OrderFilter['sortBy']>>('createdAt')
  const [sortOrder, setSortOrder] = useState<NonNullable<OrderFilter['sortOrder']>>('desc')
  const prevModeRef = useRef<'region' | 'time'>('region')

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
