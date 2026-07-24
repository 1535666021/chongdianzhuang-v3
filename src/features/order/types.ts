import type { Order } from '@/types'

export interface OrderCardProps {
  order: Order
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onComplete: (id: string) => void
}

export interface OrderListProps {
  orders: Order[]
  filter: any
}
