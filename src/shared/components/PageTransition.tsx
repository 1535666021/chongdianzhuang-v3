import { ReactNode, useEffect, useState } from 'react'
import './PageTransition.css'

interface PageTransitionProps {
  children: ReactNode
  direction: 'push' | 'pop' | 'modal'
}

export function PageTransition({ children, direction }: PageTransitionProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const isSmallScreen = window.innerWidth < 375
  const duration = isSmallScreen ? 200 : 300

  const getClasses = () => {
    if (direction === 'modal') {
      return `page-transition modal ${mounted ? 'enter' : 'exit'}`
    }
    if (direction === 'pop') {
      return `page-transition pop ${mounted ? 'enter' : 'exit'}`
    }
    return `page-transition push ${mounted ? 'enter' : 'exit'}`
  }

  return (
    <div
      className={getClasses()}
      style={{
        '--transition-duration': `${duration}ms`,
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
}
