import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Search, X } from 'lucide-react'
import type { OrderFilter } from '@/types'
import { SORT_OPTIONS } from './utils'

interface SearchSortBarProps {
  keyword: string
  onKeywordChange: (keyword: string) => void
  sortBy: NonNullable<OrderFilter['sortBy']>
  sortOrder: NonNullable<OrderFilter['sortOrder']>
  onSortByChange: (sortBy: NonNullable<OrderFilter['sortBy']>) => void
  onSortOrderChange: (sortOrder: NonNullable<OrderFilter['sortOrder']>) => void
}

export default function SearchSortBar({
  keyword,
  onKeywordChange,
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
}: SearchSortBarProps) {
  const [input, setInput] = useState(keyword)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const handleChange = (value: string) => {
    setInput(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onKeywordChange(value), 300)
  }

  const handleClear = () => {
    setInput('')
    if (timerRef.current) clearTimeout(timerRef.current)
    onKeywordChange('')
  }

  return (
    <div className="ofb-search-sort">
      <div className="ofb-search">
        <Search size={18} className="ofb-search__icon" />
        <input
          type="search"
          placeholder="搜索姓名、电话或地址..."
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          className="ofb-search__input"
        />
        {input ? (
          <button type="button" className="ofb-search__clear" onClick={handleClear} aria-label="清空搜索">
            <X size={16} />
          </button>
        ) : null}
      </div>
      <div className="ofb-sort">
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as NonNullable<OrderFilter['sortBy']>)}
          aria-label="排序方式"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <button
          type="button"
          className="ofb-sort__dir"
          onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
          aria-label="切换排序方向"
        >
          {sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
        </button>
      </div>
    </div>
  )
}
