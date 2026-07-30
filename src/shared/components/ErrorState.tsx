import { AlertCircle } from 'lucide-react'
import './ErrorState.css'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = '出错了',
  message = '请稍后重试',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div className={`error-state ${className}`}>
      <AlertCircle size={48} className="error-state__icon" />
      <h3 className="error-state__title">{title}</h3>
      <p className="error-state__message">{message}</p>
      {onRetry && (
        <button className="error-state__retry" onClick={onRetry}>
          重试
        </button>
      )}
    </div>
  )
}
