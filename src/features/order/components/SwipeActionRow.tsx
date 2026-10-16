import { useRef, useState, useCallback } from 'react'
import { Phone, Calendar, Trash2 } from 'lucide-react'
import type { Order } from '@/types'

/** P0-145：左滑交互参数（禁魔法数） */
const SWIPE_TRIGGER_PX = 56 // 触发滑出/收回的水平位移阈值（与P0-143滑分规范同量级）
const SWIPE_AXIS_RATIO = 1.5 // 水平位移需大于垂直位移×1.5，防下拉/上滑滚动误触发
const ACTIONS_WIDTH = 162 // 钮组总宽（3钮×54px）

interface Props {
  order: Order
  /** P0-145：批量模式下禁用左滑 */
  disabled?: boolean
  onEditAppointment: () => void
  onDelete: () => void
  children: React.ReactNode
}

/**
 * P0-145+P0-150：卡片左滑露出操作钮组（拨号/改约/删除，与⋮菜单同路径）；
 * 滑出后点卡片空白或右滑收回；水平阈值+轴向比双重判定，滚动不误触发。
 */
export default function SwipeActionRow({ order, disabled = false, onEditAppointment, onDelete, children }: Props) {
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const horizontalRef = useRef(false)
  const [open, setOpen] = useState(false)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    if (t) startRef.current = { x: t.clientX, y: t.clientY }
    horizontalRef.current = false
  }, [])
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || !startRef.current) return
    const t = e.touches[0]
    if (!t) return
    const dx = t.clientX - startRef.current.x
    const dy = t.clientY - startRef.current.y
    if (!horizontalRef.current) {
      if (Math.abs(dx) <= 10 || Math.abs(dx) <= Math.abs(dy) * SWIPE_AXIS_RATIO) return // 垂直滚动不接管
      horizontalRef.current = true
    }
    if (dx < -SWIPE_TRIGGER_PX) setOpen(true) // 左滑露出
    else if (dx > SWIPE_TRIGGER_PX) setOpen(false) // 右滑收回
  }, [disabled])
  const handleTouchEnd = useCallback(() => { startRef.current = null; horizontalRef.current = false }, [])

  const displayAddress = (order.address || '').replace(/^(.+?市)/, '$1')
  const nav = () => window.open(`https://uri.amap.com/search?keyword=${encodeURIComponent(displayAddress)}&callnative=1`, '_blank')
  const closeAnd = (fn: () => void) => (e: React.MouseEvent) => { e.stopPropagation(); setOpen(false); fn() }

  return (
    <div className="swipe-row">
      <div className="swipe-row__actions" style={{ width: ACTIONS_WIDTH }}>
        <button onClick={closeAnd(() => { window.location.href = `tel:${order.phone}` })}><Phone size={16} /><span>拨号</span></button>
        <button className="swipe-row__btn--reschedule" onClick={closeAnd(onEditAppointment)}><Calendar size={16} /><span>改约</span></button>
        <button className="swipe-row__btn--danger" onClick={closeAnd(onDelete)}><Trash2 size={16} /><span>删除</span></button>
      </div>
      <div
        className={`swipe-row__front ${open ? 'swipe-row__front--open' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => { if (open) { e.stopPropagation(); setOpen(false) } }} // 滑出后点空白收回
      >
        {children}
      </div>
    </div>
  )
}
