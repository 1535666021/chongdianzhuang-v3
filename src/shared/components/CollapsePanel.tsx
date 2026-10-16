import { ReactNode, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import './CollapsePanel.css'

interface CollapsePanelProps {
  title: ReactNode
  children: ReactNode
  defaultExpanded?: boolean
  onToggle?: (expanded: boolean) => void
  accentColor?: 'green' | 'orange' | 'red' | 'blue'
  className?: string
}

export function CollapsePanel({
  title,
  children,
  defaultExpanded = false,
  onToggle,
  accentColor,
  className = '',
}: CollapsePanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const handleToggle = () => {
    const next = !expanded
    setExpanded(next)
    onToggle?.(next)
  }

  const accentClass = accentColor ? `collapse-panel-${accentColor}` : ''

  return (
    <div className={`collapse-panel ${accentClass} ${className}`}>
      <button className="collapse-panel__header" onClick={handleToggle}>
        <span className="collapse-panel__title">{title}</span>
        <ChevronDown
          size={16}
          className={`collapse-panel__arrow ${expanded ? 'expanded' : ''}`}
        />
      </button>
      <div
        className={`collapse-panel__content ${expanded ? 'expanded' : ''}`}
      >
        {children}
      </div>
    </div>
  )
}
