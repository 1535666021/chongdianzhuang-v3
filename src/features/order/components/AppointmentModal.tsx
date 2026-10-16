import { useState, useEffect } from 'react'
import type { Order } from '@/types'
import { hapticVibrate } from '@/shared/utils/haptics'
import { readAppointment, writeAppointment } from '@/features/appointment/repository'
import { toast } from '@/shared/hooks/useToast'
import { daysRemaining } from '@/constants/availableWindow'
import { Calendar, Clock, X, User, MapPin, FileText } from 'lucide-react'
import '../../../shared/components/Modal.css'

interface Props {
  order: Order
  onClose: () => void
}

const TIME_SLOTS = ['上午', '下午'] as const

/** P0-106：本地时区当日 YYYY-MM-DD（禁用UTC toISOString——北京时间0-8点会跨日偏差一天） */
function getTodayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function AppointmentModal({ order, onClose }: Props) {
  // P0-160：预约读写统一走预约模块（features/appointment），组件不再直触预约裸字段
  const appt = readAppointment(order)
  // P0-116-R1：按订单状态判定——已预约单改约保留原日期；待办/其他状态（含残留脏数据）一律默认当天系统日期
  // P0-142-R3：单日期升级为区间（起~止，区间内任选一天上门）
  const initDate = appt.isAppointed ? appt.to || appt.from : getTodayLocal()
  const [from, setFrom] = useState(appt.from || initDate || getTodayLocal())
  const [to, setTo] = useState(appt.to || initDate || getTodayLocal())
  const [time, setTime] = useState<string>(appt.time)
  const [note, setNote] = useState(appt.note || '')

  useEffect(() => {
    document.body.classList.add('modal-open')
    return () => { document.body.classList.remove('modal-open') }
  }, [])

  const handleSubmit = () => {
    // P0-157-158：止日允许留空，留空=与开始同日（finalTo 语义由模块写入口承载）
    if (!from || (to !== '' && to < from) || !time) return
    // P0-160：写预约走模块唯一写入口（内置联动校验：已预约必须有日期，失败拒绝+提示）
    const result = writeAppointment(order.id, { from, to, time, note })
    if (!result.ok) {
      toast.error(result.reason)
      return
    }
    hapticVibrate() // P0-146：预约成功轻震
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
            <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>预约日期（起 ~ 止，区间内任选一天）</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="date" value={from} min={getTodayLocal()} onChange={(e) => setFrom(e.target.value)} className="modal-input" style={{ flex: 1 }} />
              <span style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }}>~</span>
              <input type="date" value={to} min={from || getTodayLocal()} onChange={(e) => setTo(e.target.value)} className="modal-input" style={{ flex: 1 }} />
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-aux)', marginTop: 4 }}>止日留空=与开始同日（单日预约）</p>
            {from && to && to >= from && (
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6 }}>共 {daysRemaining(to, from) + 1} 天（{from} ~ {to} + 所选时段 = 这几天里任选一天上门）</p>
            )}
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
            disabled={!from || (to !== '' && to < from) || !time}
            className="modal-btn modal-btn--primary"
          >
            确认预约
          </button>
        </div>
      </div>
    </div>
  )
}
