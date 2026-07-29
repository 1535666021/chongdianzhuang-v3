import { useEffect, useRef } from 'react'
import { Calendar, CheckCircle, MessageCircle, MapPin, Trash2, X } from 'lucide-react'
import type { Order } from '@/types'

interface Props {
  order: Order
  onClose: () => void
  onEditAppointment: (order: Order) => void
  onComplete: (order: Order) => void
  onScript: (order: Order) => void
  onNavigate: (order: Order) => void
  onDelete: (order: Order) => void
}

export default function OrderCardMenu({
  order,
  onClose,
  onEditAppointment,
  onComplete,
  onScript,
  onNavigate,
  onDelete,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const items = [
    { icon: Calendar, label: '修改预约', action: () => onEditAppointment(order) },
    { icon: CheckCircle, label: '标记完工', action: () => onComplete(order) },
    { icon: MessageCircle, label: '发送话术', action: () => onScript(order) },
    { icon: MapPin, label: '导航', action: () => onNavigate(order) },
    { icon: Trash2, label: '删除', action: () => onDelete(order), danger: true },
  ]

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        ref={ref}
        className="absolute right-4 bottom-20 w-44 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-700">操作菜单</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => { item.action(); onClose() }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
              item.danger ? 'text-red-500 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
