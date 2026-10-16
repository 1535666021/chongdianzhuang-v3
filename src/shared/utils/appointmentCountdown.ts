/**
 * P0-160：实现已迁入预约模块（@/features/appointment/repository），
 * 本文件仅为兼容旧 import 路径的转发壳；新代码请直接引用预约模块。
 */
export { getAppointmentCountdown, formatAppointmentRange } from '@/features/appointment/repository'
export type { CountdownBadge } from '@/features/appointment/types'
