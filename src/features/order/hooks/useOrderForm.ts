import { useState, useEffect, useCallback } from 'react'
import { useOrderStore } from '@/stores/orderStore'
import type { Order, Platform, OrderStatus, InstallType } from '@/types'

export interface FormData {
  customerName: string
  phone: string
  address: string
  platform: Platform
  status: OrderStatus
  installType: InstallType
  appointmentDate: string
  appointmentTime: string
  materialCost: number
  laborCost: number
  platformFee: number
  actualProfit: number
  notes: string
  meterStatus: '已安装' | '未安装'
  meterNumber: string
}

const DEFAULT_FORM: FormData = {
  customerName: '',
  phone: '',
  address: '',
  platform: '其他',
  status: '待办',
  installType: '其他',
  appointmentDate: '',
  appointmentTime: '',
  materialCost: 0,
  laborCost: 0,
  platformFee: 0,
  actualProfit: 0,
  notes: '',
  meterStatus: '未安装',
  meterNumber: '',
}

export function useOrderForm(orderId?: string) {
  const isEdit = !!orderId
  const existingOrder = useOrderStore((state) =>
    state.orders.find((o: any) => o.id === orderId)
  )
  const addOrder = useOrderStore((state) => state.addOrder)
  const updateOrder = useOrderStore((state) => state.updateOrder)

  const [form, setForm] = useState<FormData>(DEFAULT_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isEdit && existingOrder) {
      setForm({
        customerName: existingOrder.customerName || '',
        phone: existingOrder.phone || '',
        address: existingOrder.address || '',
        platform: existingOrder.platform || '其他',
        status: existingOrder.status || '待办',
        installType: existingOrder.installType || '其他',
        appointmentDate: existingOrder.appointmentDate || '',
        appointmentTime: existingOrder.appointmentTime || '',
        materialCost: existingOrder.materialCost || 0,
        laborCost: existingOrder.laborCost || 0,
        platformFee: existingOrder.platformFee || 0,
        actualProfit: existingOrder.actualProfit || 0,
        notes: existingOrder.notes || '',
        meterStatus: existingOrder.meterStatus || '未安装',
        meterNumber: existingOrder.meterNumber || '',
      })
    }
  }, [isEdit, existingOrder])

  const updateField = useCallback(<K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      // 自动计算实际利润
      if (field === 'materialCost' || field === 'laborCost' || field === 'platformFee') {
        const mat = field === 'materialCost' ? (value as number) : next.materialCost
        const lab = field === 'laborCost' ? (value as number) : next.laborCost
        const fee = field === 'platformFee' ? (value as number) : next.platformFee
        next.actualProfit = Math.round((mat + lab - fee) * 100) / 100
      }
      return next
    })
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }, [])

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}
    if (!form.customerName.trim()) newErrors.customerName = '请输入客户姓名'
    if (!form.phone.trim()) newErrors.phone = '请输入电话'
    else if (!new RegExp('^1\\d{10}$').test(form.phone)) newErrors.phone = '手机号格式错误'
    if (!form.address.trim()) newErrors.address = '请输入地址'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [form])

  const submit = useCallback((): Order | null => {
    if (!validate()) return null
    const order: Order = {
      id: isEdit ? orderId! : String(Date.now()),
      ...form,
      createdAt: isEdit ? (existingOrder?.createdAt || Date.now()) : Date.now(),
      updatedAt: Date.now(),
    } as Order

    if (isEdit) {
      updateOrder(orderId!, form)
    } else {
      addOrder(order)
    }
    return order
  }, [form, isEdit, orderId, existingOrder, addOrder, updateOrder, validate])

  return {
    form,
    errors,
    isEdit,
    updateField,
    submit,
    validate,
  }
}
