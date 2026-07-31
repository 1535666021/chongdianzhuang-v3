import { useState, useEffect } from 'react'
import type { Order } from '@/types'
import { useOrderStore } from '@/stores/orderStore'
import { Calendar, Clock, X, User, MapPin, FileText } from 'lucide-react'
import '../../../shared/components/Modal.css'

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

  useEffect(() => {
    document.body.classList.add('modal-open')
    return () => { document.body.classList.remove('modal-open') }
  }, [])

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title flex items-center gap-2">
            <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
            设置预约时间
          </h3>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-primary)' }}>
            <User size={14} className="text-gray-400 shrink-0" style={{ color: 'var(--color-text-aux)' }} />
            <span className="font-medium">{order.customerName}</span>
          </div>
          <div className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <MapPin size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--color-text-aux)' }} />
            <span className="break-words">{order.address}</span>
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>预约日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="modal-input"
            />
          </div>

          <div>
            <label className="text-xs mb-2 block flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
              <Clock size={12} />时间段
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTime(slot)}
                  style={{
                    fontSize: 'var(--fs-body)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    fontWeight: 500,
                    transition: 'background 150ms',
                    backgroundColor: time === slot ? 'var(--color-primary)' : 'var(--color-bg-muted)',
                    color: time === slot ? '#fff' : 'var(--color-text-secondary)',
                    borderColor: time === slot ? 'var(--color-primary)' : 'var(--color-border)',
                  }}
                  className="px-3 py-2.5 text-sm rounded-lg border font-medium transition-colors"
                  onMouseEnter={(e) => {
                    if (time !== slot) {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (time !== slot) {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-muted)'
                    }
                  }}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs mb-1 block flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
              <FileText size={12} />备注（可选）
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="添加备注信息..."
              className="modal-input"
              style={{ color: 'var(--color-text-primary)' }}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="modal-btn modal-btn--secondary">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!date || !time}
            className="modal-btn modal-btn--primary"
          >
            确认预约
          </button>
        </div>
      </div>
    </div>
  )
}
