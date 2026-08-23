import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import type { Order } from '@/types'
import { useOrderStore } from '@/stores/orderStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { toast } from '@/shared/hooks/useToast'
import '../../../shared/components/Modal.css'

const TIME_SLOTS = ['09:00-12:00', '14:00-18:00', '18:00-21:00']

interface BatchAppointmentDialogProps {
  orders: Order[]
  onClose: () => void
}

export default function BatchAppointmentDialog({ orders, onClose }: BatchAppointmentDialogProps) {
  const updateOrder = useOrderStore((s) => s.updateOrder)
  const engineerName = useSettingsStore((s) => s.engineerName)
  const targets = useMemo(() => orders.filter((o) => o.status === '待办'), [orders])

  const today = new Date().toISOString().slice(0, 10)
  const [appointmentDate, setAppointmentDate] = useState(today)
  const [appointmentTime, setAppointmentTime] = useState(TIME_SLOTS[0])
  const [installer, setInstaller] = useState(engineerName || '')

  const installerOptions = useMemo(() => {
    const set = new Set<string>()
    if (engineerName) set.add(engineerName)
    for (const o of orders) {
      if (o.installer?.trim()) set.add(o.installer.trim())
    }
    return [...set]
  }, [orders, engineerName])

  if (targets.length === 0) return null

  const handleConfirm = () => {
    const date = appointmentDate || today
    targets.forEach((o) =>
      updateOrder(o.id, {
        appointmentDate: date,
        appointmentTime,
        installer: installer || o.installer,
        status: '已预约',
        appointmentNote: '',
      }),
    )
    toast.success(`${targets.length} 单已批量预约`)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">批量预约</h2>
          <button onClick={onClose} className="modal-close"><X size={20} /></button>
        </div>
        <div className="modal-body">
          <p className="text-sm text-gray-600 mb-2">
            本次将对 {targets.length} 单待办订单统一预约。
          </p>

          <div className="modal-section">
            <label className="modal-label">预约日期</label>
            <input
              className="modal-input"
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
            />
          </div>

          <div className="modal-section">
            <label className="modal-label">预约时段</label>
            <div className="flex gap-2 flex-wrap">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={`modal-btn ${appointmentTime === slot ? 'modal-btn--primary' : 'modal-btn--secondary'}`}
                  style={{ flex: '1 1 auto' }}
                  onClick={() => setAppointmentTime(slot)}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-section">
            <label className="modal-label">安装师傅</label>
            <select className="modal-input" value={installer} onChange={(e) => setInstaller(e.target.value)}>
              <option value="">请选择师傅</option>
              {installerOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="modal-btn modal-btn--secondary">取消</button>
          <button type="button" className="modal-btn modal-btn--primary" onClick={handleConfirm}>
            确认批量预约
          </button>
        </div>
      </div>
    </div>
  )
}
