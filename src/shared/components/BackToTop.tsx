import { useState, useEffect, useCallback } from 'react'
import { ChevronUp } from 'lucide-react'
import './BackToTop.css'

interface BackToTopProps {
  threshold?: number
  className?: string
}

export function BackToTop({ threshold = 0.8, className = '' }: BackToTopProps) {
  const [visible, setVisible] = useState(false)

  const checkScroll = useCallback(() => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight
    const ratio = scrollTop / height
    setVisible(ratio > threshold)
  }, [threshold])

  useEffect(() => {
    window.addEventListener('scroll', checkScroll, { passive: true })
    checkScroll()
    return () => window.removeEventListener('scroll', checkScroll)
  }, [checkScroll])

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!visible) return null

  return (
    <button
      className={`back-to-top ${className}`}
      onClick={handleClick}
      aria-label="返回顶部"
    >
      <ChevronUp size={20} />
    </button>
  )
}
