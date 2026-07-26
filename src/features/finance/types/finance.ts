export interface MonthlyReconciliation {
  month: string
  orderCount: number
  totalReceivable: number
  totalDeduction: number
  totalActual: number
  totalMaterial: number
  totalLabor: number
  totalProfit: number
}

export interface ReceivableOrder {
  id: string
  customerName: string
  amount: number
  paid: boolean
  completeDate?: string
}

export interface OrderMaterialDetail {
  name: string
  spec?: string
  quantity: number
  unit: string
  unitPrice: number
  subtotal: number
}

export interface OrderCostDetail {
  orderId: string
  customerName: string
  materials: OrderMaterialDetail[]
  materialCost: number
  laborCost: number
  platformDeduction: number
  actualProfit: number
}
