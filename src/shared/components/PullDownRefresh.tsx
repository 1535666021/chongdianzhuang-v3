import { useState, useCallback, useEffect, useRef, ReactNode } from 'react'
import './PullDownRefresh.css'

interface PullDownRefreshProps {
  onRefresh: () => Promise<void> | void
  children: ReactNode
  threshold?: number
  max?: number
  className?: string
}

type PullState = 'idle' | 'pulling' | 'ready' | 'refreshing' | 'completed'

export function PullDownRefresh({
  onRefresh,
  children,
  threshold = 60,
  max = 80,
  className = '',
}: PullDownRefreshProps) {
  const [state, setState] = useState<PullState>('idle')
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (state === 'refreshing' || (containerRef.current && containerRef.current.scrollTop > 0)) {
      return
    }
    startY.current = e.touches[0].clientY
    setState('pulling')
  }, [state])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (state !== 'pulling') return
    const currentY = e.touches[0].clientY
    const diff = currentY - startY.current
    if (diff > 0) {
      e.preventDefault()
      const distance = diff * 0.5
      setPullDistance(Math.min(distance, max))
      if (distance >= threshold) {
        setState('ready')
      }
    }
  }, [state, threshold, max])

  const handleTouchEnd = useCallback(async () => {
    if (state !== 'pulling' && state !== 'ready') return

    if (state === 'ready') {
      setState('refreshing')
      setPullDistance(threshold)
      try {
        await onRefresh()
        setState('completed')
        setTimeout(() => {
          setState('idle')
          setPullDistance(0)
        }, 500)
      } catch {
        setState('idle')
        setPullDistance(0)
      }
    } else {
      setState('idle')
      setPullDistance(0)
    }
  }, [state, threshold, onRefresh])

  const height = Math.min(pullDistance, threshold)
  const opacity = Math.min(pullDistance / threshold, 1)
  const rotation = Math.min((pullDistance / threshold) * 180, 180)

  return (
    <div
      ref={containerRef}
      className={`pull-down-refresh ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="pull-down-refresh__indicator"
        style={{
          height: `${height}px`,
          opacity: opacity,
        }}
      >
        {state === 'pulling' && (
          <span>下拉刷新</span>
        )}
        {state === 'ready' && (
          <span style={{ transform: `rotate(${rotation}deg)` }}>松开刷新</span>
        )}
        {state === 'refreshing' && (
          <span className="pull-down-refresh__spinner" />
        )}
        {state === 'completed' && (
          <span>刷新完成</span>
        )}
      </div>
      <div className="pull-down-refresh__content">
        {children}
      </div>
    </div>
  )
}
