import { useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import './PullUpLoad.css'

interface PullUpLoadProps {
  onLoadMore: () => Promise<void> | void
  children: ReactNode
  threshold?: number
  hasMore?: boolean
  className?: string
}

export function PullUpLoad({
  onLoadMore,
  children,
  threshold = 100,
  hasMore = true,
  className = '',
}: PullUpLoadProps) {
  const [loading, setLoading] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const handleIntersect = useCallback(async (entries: IntersectionObserverEntry[]) => {
    const [entry] = entries
    if (entry.isIntersecting && !loading && hasMore) {
      setLoading(true)
      try {
        await onLoadMore()
      } finally {
        setLoading(false)
      }
    }
  }, [loading, hasMore, onLoadMore])

  useEffect(() => {
    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: `0px 0px ${threshold}px 0px`,
      threshold: 0,
    }

    const element = sentinelRef.current

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [threshold])

  useEffect(() => {
    if (!sentinelRef.current || loading || !hasMore) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && !loading && hasMore) {
          setLoading(true)
          Promise.resolve(onLoadMore()).finally(() => setLoading(false))
        }
      },
      {
        root: null,
        rootMargin: `0px 0px ${threshold}px 0px`,
        threshold: 0,
      }
    )

    observerRef.current.observe(sentinelRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loading, hasMore, threshold, onLoadMore])

  return (
    <div className={`pull-up-load ${className}`}>
      <div className="pull-up-load__content">
        {children}
      </div>
      {hasMore && (
        <div ref={sentinelRef} className="pull-up-load__sentinel">
          {loading && (
            <div className="pull-up-load__loading">
              <div className="pull-up-load__spinner" />
              <span>加载中...</span>
            </div>
          )}
        </div>
      )}
      {!hasMore && (
        <div className="pull-up-load__end">没有更多了</div>
      )}
    </div>
  )
}
