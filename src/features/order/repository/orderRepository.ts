import type { Order } from '@/types'
import { useOrderStore } from '@/stores/orderStore'

export class OrderRepository {
  static getAll(): Order[] {
    return useOrderStore.getState().orders
  }

  static getById(id: string): Order | undefined {
    return useOrderStore.getState().orders.find((o: Order) => o.id === id)
  }

  static add(order: Order): void {
    useOrderStore.getState().addOrder(order)
  }

  static update(id: string, updates: Partial<Order>): void {
    useOrderStore.getState().updateOrder(id, updates)
  }

  static delete(id: string): void {
    useOrderStore.getState().deleteOrder(id)
  }

  static filterByStatus(status: string): Order[] {
    return this.getAll().filter((o: Order) => o.status === status)
  }
}
