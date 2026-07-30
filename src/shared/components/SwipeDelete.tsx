import { ReactNode, useState, useRef, useCallback, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import './SwipeDelete.css'

interface SwipeDeleteProps {
  children: ReactNode
  onSwipeDelete: () => void
  threshold?: number
  className?: string
}

export function SwipeDelete({
  children,
  onSwipeDelete,
  threshold = 80,
  className = '',
}: SwipeDeleteProps) {
  const [translateX, setTranslateX] = useState(0)
  const [startX, setStartX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleStart = useCallback((clientX: number) => {
    setStartX(clientX)
    setIsDragging(true)
  }, [])

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging) return
    const diff = startX - clientX
    if (diff > 0) {
      setTranslateX(Math.min(diff, threshold + 20))
    }
  }, [isDragging, startX, threshold])

  const handleEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)

    if (translateX >= threshold) {
      setIsDeleting(true)
      setTranslateX(threshold)
      setTimeout(() => {
        onSwipeDelete()
      }, 200)
    } else {
      setTranslateX(0)
    }
  }, [isDragging, translateX, threshold, onSwipeDelete])

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent | React.TouchEvent) => {
      handleStart(e.touches[0].clientX)
    }
    const handleTouchMove = (e: TouchEvent | React.TouchEvent) => {
      handleMove(e.touches[0].clientX)
    }
    const handleTouchEnd = () => handleEnd()

    const handleMouseStart = (e: MouseEvent) => {
      handleStart(e.clientX)
    }
    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX)
    }
    const handleMouseEnd = () => handleEnd()

    const el = contentRef.current
    if (el) {
      el.addEventListener('touchstart', handleTouchStart, { passive: true })
      el.addEventListener('touchmove', handleTouchMove, { passive: true })
      el.addEventListener('touchend', handleTouchEnd)
      el.addEventListener('mousedown', handleMouseStart)
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseEnd)
    }

    return () => {
      if (el) {
        el.removeEventListener('touchstart', handleTouchStart)
        el.removeEventListener('touchmove', handleTouchMove)
        el.removeEventListener('touchend', handleTouchEnd)
        el.removeEventListener('mousedown', handleMouseStart)
      }
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseEnd)
    }
  }, [handleStart, handleMove, handleEnd])

  const contentStyle: React.CSSProperties = {
    transform: `translateX(-${translateX}px)`,
    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
  }

  return (
    <div className={`swipe-delete-container ${className} ${isDeleting ? 'deleting' : ''}`}>
      <div className="swipe-delete__background">
        <button
          className="swipe-delete__delete-btn"
          onClick={onSwipeDelete}
          disabled={isDeleting}
        >
          <Trash2 size={18} />
          删除
        </button>
      </div>
      <div
        ref={contentRef}
        className="swipe-delete__content"
        style={contentStyle}
        onClick={() => {
          if (translateX > 0 && !isDragging) {
            setTranslateX(0)
          }
        }}
      >
        {children}
      </div>
    </div>
  )
}
