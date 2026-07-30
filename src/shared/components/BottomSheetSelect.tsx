import { ReactNode, useState, useCallback } from 'react'
import { X, Search } from 'lucide-react'
import './BottomSheetSelect.css'

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
}

export function BottomSheetSelect({
  title,
  options,
  value,
  onChange,
  onClose,
  searchable = false,
  placeholder = '搜索...',
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
            filtered.map((option) => (
              <div
                key={option.value}
                className={`bottom-sheet-select__option ${value === option.value ? 'selected' : ''}`}
                onClick={() => handleSelect(option)}
              >
                <div className="bottom-sheet-select__option-main">
                  <span className="bottom-sheet-select__option-label">{option.label}</span>
                  {option.subtitle && (
                    <span className="bottom-sheet-select__option-subtitle">{option.subtitle}</span>
                  )}
                </div>
                {option.cost !== undefined && (
                  <span className="bottom-sheet-select__option-cost">¥{option.cost.toFixed(2)}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
