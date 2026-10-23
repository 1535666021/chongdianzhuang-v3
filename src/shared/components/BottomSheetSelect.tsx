import { useState, useCallback } from 'react'
import { X, Search } from 'lucide-react'
import './BottomSheetSelect.css'
import { formatCurrency } from '@/shared/utils/format'

interface SelectOption {
  value: string | number
  label: string
  subtitle?: string
  cost?: number
}

interface BottomSheetSelectProps {
  title: string
  options: SelectOption[]
  value?: string | number
  onChange: (option: SelectOption) => void
  onClose: () => void
  searchable?: boolean
  placeholder?: string
  // P0-215 多选模式（新增分支；单选逻辑原样保留，即选即关零回退）
  multiple?: boolean
  values?: string[]
  onToggle?: (value: string) => void
  onConfirm?: () => void
}

export function BottomSheetSelect({
  title,
  options,
  value,
  onChange,
  onClose,
  searchable = false,
  placeholder = '搜索...',
  multiple = false,
  values,
  onToggle,
  onConfirm,
}: BottomSheetSelectProps) {
  const [query, setQuery] = useState('')

  const filtered = searchable && query
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(query.toLowerCase())
      )
    : options

  const handleSelect = useCallback((option: SelectOption) => {
    onChange(option)
    onClose()
  }, [onChange, onClose])

  // P0-215 多选：点击行只触发 onToggle，不收起（连续勾选）；底部"完成"统一关闭
  const handleToggle = useCallback((option: SelectOption) => {
    onToggle?.(String(option.value))
  }, [onToggle])

  return (
    <div className="bottom-sheet-select" onClick={onClose}>
      <div className="bottom-sheet-select__content" onClick={(e) => e.stopPropagation()}>
        <div className="bottom-sheet-select__header">
          <h3 className="bottom-sheet-select__title">{title}</h3>
          <button className="bottom-sheet-select__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {searchable && (
          <div className="bottom-sheet-select__search">
            <Search size={16} className="bottom-sheet-select__search-icon" />
            <input
              type="text"
              className="bottom-sheet-select__search-input"
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        )}
        <div className="bottom-sheet-select__options">
          {filtered.length === 0 ? (
            <div className="bottom-sheet-select__empty">暂无结果</div>
          ) : (
            filtered.map((option) => {
              const checked = multiple
                ? (values ?? []).includes(String(option.value))
                : value === option.value
              return (
                <div
                  key={option.value}
                  className={`bottom-sheet-select__option ${checked ? 'selected' : ''}`}
                  onClick={() => (multiple ? handleToggle(option) : handleSelect(option))}
                >
                  <div className="bottom-sheet-select__option-main">
                    <span className="bottom-sheet-select__option-label">{option.label}</span>
                    {option.subtitle && (
                      <span className="bottom-sheet-select__option-subtitle">{option.subtitle}</span>
                    )}
                  </div>
                  <div className="bottom-sheet-select__option-side">
                    {option.cost !== undefined && (
                      <span className="bottom-sheet-select__option-cost">{formatCurrency(option.cost)}</span>
                    )}
                    {multiple && (
                      <input
                        type="checkbox"
                        readOnly
                        checked={checked}
                        className="bottom-sheet-select__checkbox"
                      />
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
        {multiple && (
          <div className="bottom-sheet-select__footer">
            <button
              type="button"
              className="bottom-sheet-select__confirm"
              onClick={() => {
                onConfirm?.()
                onClose()
              }}
            >
              完成（已选{(values ?? []).length}项）
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
