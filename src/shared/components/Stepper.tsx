import { useState, useCallback, useEffect } from 'react'
import { Minus, Plus } from 'lucide-react'
import './Stepper.css'

interface StepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  disabled = false,
  className = '',
}: StepperProps) {
  const [longPress, setLongPress] = useState(false)
  const [direction, setDirection] = useState<'inc' | 'dec' | null>(null)

  const handleChange = useCallback((delta: number) => {
    const next = Math.min(max, Math.max(min, value + delta))
    if (next !== value) {
      onChange(next)
    }
  }, [value, onChange, min, max])

  const startLongPress = useCallback((dir: 'inc' | 'dec') => {
    setLongPress(true)
    setDirection(dir)
    handleChange(dir === 'inc' ? step : -step)
  }, [step, handleChange])

  const stopLongPress = useCallback(() => {
    setLongPress(false)
    setDirection(null)
  }, [])

  useEffect(() => {
    if (!longPress || !direction) return
    const timer = setInterval(() => {
      handleChange(direction === 'inc' ? step : -step)
    }, 200)
    return () => clearInterval(timer)
  }, [longPress, direction, step, handleChange])

  return (
    <div className={`stepper ${className}`}>
      <button
        type="button"
        className="stepper__button"
        disabled={disabled || value <= min}
        onMouseDown={() => startLongPress('dec')}
        onMouseUp={stopLongPress}
        onMouseLeave={stopLongPress}
        onTouchStart={() => startLongPress('dec')}
        onTouchEnd={stopLongPress}
      >
        <Minus size={14} />
      </button>
      <input
        type="number"
        className="stepper__input"
        value={value}
        onChange={(e) => {
          const next = parseInt(e.target.value) || 0
          handleChange(next - value)
        }}
        disabled={disabled}
        min={min}
        max={max}
      />
      <button
        type="button"
        className="stepper__button"
        disabled={disabled || value >= max}
        onMouseDown={() => startLongPress('inc')}
        onMouseUp={stopLongPress}
        onMouseLeave={stopLongPress}
        onTouchStart={() => startLongPress('inc')}
        onTouchEnd={stopLongPress}
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
