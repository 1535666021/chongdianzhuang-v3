import { useEffect, useState } from 'react'
import { BellRing, X } from 'lucide-react'
import { useOrderStore } from '@/stores/orderStore'
import { todayLocal, daysRemaining } from '@/constants/availableWindow'
import { readAppointment } from '@/features/appointment/repository'

const shownKey = () => `cdz_appt_eve_${todayLocal()}`

/**
 * P0-142-R3：预约区间到期前夜提醒——今天 = appointmentTo - 1 且仍"已预约"（未完工）。
 * 进入首页当天首次触发一次（localStorage 按日记标记）；Notification 权限已授才顺带
 * 系统通知（绝不申请权限）；提醒条可手动关闭。
 */
export default function AppointmentExpiryBanner() {
  const orders = useOrderStore((s) => s.orders)
  const [dismissed, setDismissed] = useState(false)
  const today = todayLocal()
  // P0-160：止日前夜橙条走模块读出口（按 To，口径照旧）
  const reminders = orders.filter((o) => {
    const appt = readAppointment(o)
    return appt.isAppointed && !!appt.to && daysRemaining(appt.to, today) === 1
  })

  useEffect(() => {
    if (reminders.length === 0) return
    try {
      if (localStorage.getItem(shownKey())) return
      localStorage.setItem(shownKey(), '1') // 当天首次触发标记
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        reminders.forEach((o) => new Notification(`【${o.customerName}】预约区间明天到期`, { body: '还没定具体哪天' }))
      }
    } catch {
      /* 静默 */
    }
  }, [reminders])

  if (dismissed || reminders.length === 0) return null
  return (
    <div className="appt-expire-banner" role="alert">
      <BellRing size={16} className="appt-expire-banner__icon" />
      <div className="appt-expire-banner__text">
        {reminders.map((o) => (
          <span key={o.id}>【{o.customerName}】预约区间明天到期，还没定具体哪天</span>
        ))}
      </div>
      <button type="button" className="appt-expire-banner__close" onClick={() => setDismissed(true)} aria-label="关闭">
        <X size={16} />
      </button>
    </div>
  )
}
