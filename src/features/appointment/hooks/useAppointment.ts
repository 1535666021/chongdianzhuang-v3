/**
 * P0-160：组件侧唯一消费 hook——组件读预约信息一律走本 hook（模块读出口），
 * 禁止裸读订单预约字段（appointmentDate/appointmentFrom/appointmentTo/appointmentTime 等）。
 */
import { useMemo } from 'react'
import type { Order } from '@/types'
import { readAppointment } from '../repository'
import type { AppointmentInfo } from '../types'

export function useAppointment(order: Order): AppointmentInfo {
  return useMemo(() => readAppointment(order), [order])
}
