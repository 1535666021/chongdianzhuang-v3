import type { ChangeEvent } from 'react'
import type { OrderFilter } from '@/types'
import { INSTALL_TYPES } from '@/constants/order'

export type GroupMode = 'region' | 'time' | 'smart'

interface FilterOption {
  value: string
  count: number
  label?: string
}

interface OrderFiltersProps {
  filter: OrderFilter
  onFilterChange: (changes: Partial<OrderFilter>) => void
  groupMode: GroupMode
  onGroupModeChange: (mode: GroupMode) => void
  options: {
    installTypes: FilterOption[]
    brands: FilterOption[]
    platforms: FilterOption[]
  }
}

function selectValue(event: ChangeEvent<HTMLSelectElement>) {
  return event.target.value || undefined
}

function OptionSelect({ label, value, options, onChange }: {
  label: string
  value?: string
  options: FilterOption[]
  onChange: (value?: string) => void
}) {
  const visibleOptions = value && !options.some((option) => option.value === value)
    ? [{ value, count: 0 }, ...options]
    : options

  return (
    <label className="order-list__control">
      <span>{label}</span>
      <select value={value || ''} onChange={(event) => onChange(selectValue(event))}>
        <option value="">全部</option>
        {visibleOptions.map((option) => <option key={option.value} value={option.value}>{option.label || option.value}{option.count > 0 ? ` (${option.count})` : ''}</option>)}
      </select>
    </label>
  )
}

export default function OrderFilters({ filter, onFilterChange, groupMode, onGroupModeChange, options }: OrderFiltersProps) {
  const installTypes = INSTALL_TYPES
    .map((value) => options.installTypes.find((option) => option.value === value) || { value, count: 0 })
    .filter((option) => option.count > 0 || option.value === filter.installType)

  return (
    <section className="order-list__advanced-filters" aria-label="订单筛选和分组">
      <div className="order-list__filter-row">
        <label className="order-list__control">
          <span>预约日期</span>
          <input type="date" value={filter.dateRange?.[0] || ''} onChange={(event) => onFilterChange({ dateRange: event.target.value ? [event.target.value, filter.dateRange?.[1] || event.target.value] : undefined })} />
        </label>
        <label className="order-list__control">
          <span>至</span>
          <input type="date" value={filter.dateRange?.[1] || ''} onChange={(event) => onFilterChange({ dateRange: event.target.value ? [filter.dateRange?.[0] || event.target.value, event.target.value] : undefined })} />
        </label>
        <OptionSelect label="安装类型" value={filter.installType} options={installTypes} onChange={(installType) => onFilterChange({ installType: installType as OrderFilter['installType'] })} />
        <OptionSelect label="品牌" value={filter.brand} options={options.brands} onChange={(brand) => onFilterChange({ brand })} />
        <OptionSelect label="平台" value={filter.platform} options={options.platforms} onChange={(platform) => onFilterChange({ platform })} />
      </div>
      <div className="order-list__filter-row">
        <OptionSelect label="排序" value={filter.sortBy || 'createdAt'} options={[
          { value: 'createdAt', label: '创建时间', count: 0 },
          { value: 'appointmentDate', label: '预约日期', count: 0 },
          { value: 'completeDate', label: '完成日期', count: 0 },
          { value: 'customerName', label: '客户姓名', count: 0 },
        ]} onChange={(sortBy) => onFilterChange({ sortBy: sortBy as OrderFilter['sortBy'] })} />
        <label className="order-list__control">
          <span>顺序</span>
          <select value={filter.sortOrder || 'desc'} onChange={(event) => onFilterChange({ sortOrder: event.target.value as OrderFilter['sortOrder'] })}>
            <option value="desc">降序</option>
            <option value="asc">升序</option>
          </select>
        </label>
        <div className="order-list__group-toggle" role="group" aria-label="分组方式">
          {([['region', '地区'], ['time', '时间'], ['smart', '智能']] as const).map(([mode, label]) => (
            <button key={mode} type="button" className={groupMode === mode ? 'active' : ''} onClick={() => onGroupModeChange(mode)}>{label}</button>
          ))}
        </div>
      </div>
    </section>
  )
}
