import { ReactNode, useState, useCallback, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import './FormField.css'

interface FormFieldProps {
  label?: string
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'tel' | 'email' | 'number' | 'date' | 'time'
  required?: boolean
  error?: string
  prefix?: ReactNode
  suffix?: ReactNode
  clearable?: boolean
  disabled?: boolean
  className?: string
  onBlur?: () => void
}

export function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  error,
  prefix,
  suffix,
  clearable = false,
  disabled = false,
  className = '',
  onBlur,
}: FormFieldProps) {
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (error) {
      setShake(true)
      const timer = setTimeout(() => setShake(false), 600)
      return () => clearTimeout(timer)
    }
  }, [error])

  const handleClear = useCallback(() => {
    onChange('')
    inputRef.current?.focus()
  }, [onChange])

  return (
    <div className={`form-field ${className} ${error ? 'form-field--error' : ''} ${shake ? 'form-field--shake' : ''}`}>
      {label && (
        <label className="form-field__label">
          {label}
          {required && <span className="form-field__required">*</span>}
        </label>
      )}
      <div className={`form-field__wrapper ${isFocused ? 'form-field__wrapper--focused' : ''}`}>
        {prefix && <div className="form-field__prefix">{prefix}</div>}
        <input
          ref={inputRef}
          type={type}
          className="form-field__input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false)
            onBlur?.()
          }}
        />
        {clearable && value && !disabled && (
          <button
            type="button"
            className="form-field__clear"
            onClick={handleClear}
          >
            <X size={14} />
          </button>
        )}
        {suffix && <div className="form-field__suffix">{suffix}</div>}
      </div>
      {error && <div className="form-field__error">{error}</div>}
    </div>
  )
}
