import { ReactNode } from 'react'
import './ShimmerSkeleton.css'

type ShimmerType = 'card' | 'list' | 'detail'

interface ShimmerSkeletonProps {
  type?: ShimmerType
  count?: number
  className?: string
}

export function ShimmerSkeleton({
  type = 'card',
  count = 3,
  className = '',
}: ShimmerSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => (
    <div key={i} className={`shimmer-skeleton shimmer-skeleton--${type}`} />
  ))

  return <div className={`shimmer-skeleton-container ${className}`}>{items}</div>
}

export function ShimmerLine({ width = '100%', className = '' }: { width?: string; className?: string }) {
  return (
    <div
      className={`shimmer-skeleton-line ${className}`}
      style={{ width }}
    />
  )
}
