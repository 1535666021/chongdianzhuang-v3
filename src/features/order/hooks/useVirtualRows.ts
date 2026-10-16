import { useState, useEffect, useMemo, useRef, useCallback } from 'react'

/**
 * P0-146：窗口化渲染——超阈值列表只渲染视口内 ± 缓冲的行（DOM 节点数可证）。
 * 行高先按估值占位，渲染后回调实测回写；prefix offsets 每帧重算。
 * 与滚动记忆（P0-144，window.scrollY 语义）天然兼容；低于阈值由调用方走原全渲染。
 */
export interface VirtualFlatRow {
  key: string
  type: 'header' | 'card'
  /** header 行：分组标题；card 行：订单引用（渲染零回查） */
  label?: string
  order?: import('@/types').Order
}
export interface VirtualRow extends VirtualFlatRow { height: number; top: number }

/** 禁魔法数：行高估值 / 视口外缓冲 / 分组标题估值 */
export const CARD_ROW_ESTIMATE = 260
export const HEADER_ROW_ESTIMATE = 44
export const VIRTUAL_ROW_GAP = 12
export const VIRTUAL_OVERSCAN_PX = 600
export const VIRTUAL_THRESHOLD = 100 // 订单超此数启用窗口化

export function useVirtualRows(flat: VirtualFlatRow[], enabled: boolean) {
  const heightsRef = useRef(new Map<string, number>())
  const [version, setVersion] = useState(0)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // 实测行高回写（ResizeObserver 不必要——卡片高度仅随展开态变化，重渲染时重测）
  const measure = useCallback((key: string, type: 'header' | 'card') => (el: HTMLElement | null) => {
    if (!el) return
    const estimate = type === 'header' ? HEADER_ROW_ESTIMATE : CARD_ROW_ESTIMATE
    const h = el.offsetHeight || estimate
    if (Math.abs(h - (heightsRef.current.get(key) ?? estimate)) > 1) {
      heightsRef.current.set(key, h)
      setVersion((v) => v + 1)
    }
  }, [])

  const rows = useMemo<VirtualRow[]>(() => {
    void version
    const hs = heightsRef.current
    let top = 0
    return flat.map((f) => {
      const height = hs.get(f.key) ?? (f.type === 'header' ? HEADER_ROW_ESTIMATE : CARD_ROW_ESTIMATE)
      const row: VirtualRow = { ...f, height, top }
      top += height + VIRTUAL_ROW_GAP
      return row
    })
  }, [flat, version])

  const [win, setWin] = useState({ start: 0, end: 40 })
  useEffect(() => {
    if (!enabled) return
    let raf = 0
    const update = () => {
      const el = containerRef.current
      if (!el) return
      const listTop = el.getBoundingClientRect().top + window.scrollY
      const scrollTop = window.scrollY - listTop
      const startY = scrollTop - VIRTUAL_OVERSCAN_PX
      const endY = scrollTop + window.innerHeight + VIRTUAL_OVERSCAN_PX
      let start = rows.findIndex((r) => r.top + r.height >= startY)
      let end = rows.findIndex((r) => r.top > endY)
      if (start < 0) start = 0
      if (end < 0) end = rows.length
      setWin((w) => (w.start === start && w.end === end ? w : { start, end }))
    }
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [enabled, rows])

  const totalHeight = rows.length ? rows[rows.length - 1].top + rows[rows.length - 1].height : 0
  return {
    containerRef,
    rows,
    start: enabled ? win.start : 0,
    end: enabled ? win.end : rows.length,
    totalHeight,
    measure,
  }
}
