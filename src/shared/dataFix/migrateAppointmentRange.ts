import { useOrderStore } from '@/stores/orderStore'

/** P0-142-R3：已下线可约行字段的残留读取宽类型（仅迁移期使用，非业务对象强转） */
type LegacyAvailableFields = { availableFrom?: string; availableTo?: string }

/**
 * P0-142-R3：预约字段区间化一次性轻迁移（幂等双保险：条件天然幂等 + localStorage 标记）。
 * ① 老 appointmentDate 单日期 → 补 appointmentFrom=appointmentTo=appointmentDate（同日区间）
 * ② 下线可约行残留字段 availableFrom/availableTo（置 undefined，持久化时自动剔除）
 */
const MIGRATION_KEY = 'cdz_migrate_appt_range_v1'

export function runAppointmentRangeMigration() {
  try {
    if (localStorage.getItem(MIGRATION_KEY) === 'done') return
  } catch {
    /* 继续按条件迁移 */
  }
  const store = useOrderStore.getState()
  // P0-217 G1d：逐单写回改批量（一次全量序列化；迁移标记语义不变）
  const patch = new Map<string, Parameters<typeof store.updateOrder>[1]>()
  for (const raw of store.orders) {
    const o = raw as typeof raw & LegacyAvailableFields // 读旧库残留字段必须宽类型（字段已下线）
    const needRange = !o.appointmentFrom && !!o.appointmentDate
    const needClean = o.availableFrom !== undefined || o.availableTo !== undefined
    if (!needRange && !needClean) continue
    patch.set(o.id, {
      ...(needRange ? { appointmentFrom: o.appointmentDate!, appointmentTo: o.appointmentDate! } : {}),
      ...(needClean ? { availableFrom: undefined, availableTo: undefined } : {}),
    })
  }
  if (patch.size > 0) {
    try {
      useOrderStore.getState().setOrders(useOrderStore.getState().orders.map((o) => (patch.has(o.id) ? { ...o, ...patch.get(o.id)! } : o)))
    } catch (error) {
      console.warn('[预约迁移] 批量写回失败', error)
    }
  }
  try { localStorage.setItem(MIGRATION_KEY, 'done') } catch { /* 静默 */ }
}
