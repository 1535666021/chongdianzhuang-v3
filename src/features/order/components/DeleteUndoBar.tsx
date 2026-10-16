import { useEffect, useRef } from 'react'
import { Undo2 } from 'lucide-react'
import type { Order } from '@/types'

interface Props {
  deleted: Order[]
  onUndo: (orders: Order[]) => void
  onClose: () => void
}

/** P0-144：删除撤销浮条——删除后底部浮出"已删除 · [撤销]"，3秒超时自动消失（删除已生效），点撤销立即恢复 */
export default function DeleteUndoBar({ deleted, onUndo, onClose }: Props) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose // 回调装ref，避免父组件重渲染重置计时器

  useEffect(() => {
    const timer = setTimeout(() => onCloseRef.current(), 3000)
    return () => clearTimeout(timer)
  }, [deleted])

  if (deleted.length === 0) return null
  return (
    <div className="delete-undo-bar" role="status">
      <span>已删除 {deleted.length} 单</span>
      <button
        className="delete-undo-bar__btn"
        onClick={() => onUndo(deleted)}
      >
        <Undo2 size={14} />
        撤销
      </button>
    </div>
  )
}
