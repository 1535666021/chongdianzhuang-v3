import { useEffect, useRef } from 'react'
import { Calendar, MapPin, Trash2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface OrderActionMenuProps {
  orderId: string
  onClose: () => void
  onEditAppointment?: () => void
  onNavigate?: () => void
  onDelete?: () => void
}

export default function OrderActionMenu({ orderId, onClose, onEditAppointment, onNavigate, onDelete }: OrderActionMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const handleNavigate = () => {
    onNavigate?.()
    onClose()
  }

  const handleDelete = () => {
    onDelete?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        ref={ref}
        className="absolute right-4 bottom-20 w-48 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
          <span className="text-sm font-medium text-gray-700">操作</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
        
        <button
          onClick={() => { onEditAppointment?.(); onClose() }}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Calendar size={16} />
          改约
        </button>
        
        <button
          onClick={handleNavigate}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <MapPin size={16} />
          导航
        </button>
        
        <div className="h-px bg-gray-200 my-1" />
        
        <button
          onClick={handleDelete}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={16} />
          删除
        </button>
      </div>
    </div>
  )
}
