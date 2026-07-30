import { ReactNode, useState, useCallback } from 'react'
import { Copy } from 'lucide-react'
import './InfoSection.css'

interface InfoSectionProps {
  title: string
  children: ReactNode
  className?: string
}

interface InfoItemProps {
  label: string
  value: string | ReactNode
  copyable?: boolean
  onClick?: () => void
  className?: string
}

export function InfoSection({ title, children, className = '' }: InfoSectionProps) {
  return (
    <div className={`info-section ${className}`}>
      <h3 className="info-section__title">{title}</h3>
      <div className="info-section__content">
        {children}
      </div>
    </div>
  )
}

export function InfoItem({ label, value, copyable, onClick, className = '' }: InfoItemProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    if (typeof value !== 'string') return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }, [value])

  const isString = typeof value === 'string'
  const showCopy = copyable && isString

  return (
    <div
      className={`info-section__item ${showCopy ? 'info-section__item--copyable' : ''} ${className}`}
      onClick={onClick}
    >
      <span className="info-section__label">{label}</span>
      <span className={`info-section__value ${copyable ? 'info-section__value--copyable' : ''}`}>
        {value}
      </span>
      {showCopy && (
        <>
          <Copy size={14} className="info-section__copy-icon" />
          {copied && <span className="info-section__copy-toast">已复制</span>}
        </>
      )}
    </div>
  )
}
