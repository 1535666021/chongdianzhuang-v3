import { useState } from 'react'
import type { Order } from '@/types'
import { useOrderStore } from '@/stores/orderStore'
import { Calendar, Clock, X, User, MapPin, FileText } from 'lucide-react'

interface Props {
  order: Order
  onClose: () => void
}

const TIME_SLOTS = ['上午', '下午'] as const

export default function AppointmentModal({ order, onClose }: Props) {
  const updateOrder = useOrderStore((s) => s.updateOrder)
  const [date, setDate] = useState(order.appointmentDate || new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState<string>(order.appointmentTime || '')
  const [note, setNote] = useState(order.appointmentNote || '')

  const handleSubmit = () => {
    if (!date || !time) return
    updateOrder(order.id, {
      status: '已预约',
      appointmentDate: date,
      appointmentTime: time,
      appointmentNote: note || undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Calendar size={18} className="text-blue-500" />
            设置预约时间
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <User size={14} className="text-gray-400 shrink-0" />
            <span className="font-medium">{order.customerName}</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-500">
            <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
            <span className="break-words">{order.address}</span>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">预约日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-2 block flex items-center gap-1">
              <Clock size={12} />时间段
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTime(slot)}
                  className={`py-2.5 text-sm rounded-lg border font-medium transition-colors ${
                    time === slot
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
              <FileText size={12} />备注（可选）
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="添加备注信息..."
              className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!date || !time}
            className="flex-1 py-2.5 text-sm rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            确认预约
          </button>
        </div>
      </div>
    </div>
  )
}
