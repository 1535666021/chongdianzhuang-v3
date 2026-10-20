import { useState, useEffect, useCallback } from 'react'
import { useOrderStore } from '@/stores/orderStore'
import { orderExists } from '@/features/order/utils/orderGuard'
import { TRIP_SUBSIDY_PER_UNIT } from '@/constants/policy'
import { calcActualProfitByPolicy } from '@/shared/utils/orderCalc'
import type { Order, Platform, OrderStatus, InstallType } from '@/types'

export interface FormData {
  customerName: string
  phone: string
  address: string
  platform: Platform
  /** P0-133-R2：子品牌/型号 */
  subBrand: string
  /** P0-155：套餐米数（字符串原样保存；空=清字段回落品牌默认） */
  packageMeters: string
  status: OrderStatus
  installType: InstallType
  appointmentDate: string
  appointmentTime: string
  materialCost: number
  platformFee: number
  actualProfit: number
  /** P0-165-R7 出差安装开关（人工标记，优先于启发式判定） */
  isBusinessTrip: boolean
  notes: string
  meterStatus: '已安装' | '未安装'
  meterNumber: string
}

const DEFAULT_FORM: FormData = {
  customerName: '',
  phone: '',
  address: '',
  platform: '其他',
  subBrand: '',
  packageMeters: '',
  status: '待办',
  installType: '其他',
  appointmentDate: '',
  appointmentTime: '',
  materialCost: 0,
  platformFee: 0,
  actualProfit: 0,
  isBusinessTrip: false,
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
        subBrand: existingOrder.subBrand || '',
        packageMeters: existingOrder.packageMeters || '',
        status: existingOrder.status || '待办',
        installType: existingOrder.installType || '其他',
        appointmentDate: existingOrder.appointmentDate || '',
        appointmentTime: existingOrder.appointmentTime || '',
        materialCost: existingOrder.materialCost || 0,
        platformFee: existingOrder.platformFee || 0,
        actualProfit: existingOrder.actualProfit || 0,
        isBusinessTrip: !!existingOrder.isBusinessTrip,
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
      if (field === 'materialCost' || field === 'platformFee') {
        // P0-177-R3：表单预览改道新政策出口（与完工/修正器同口径）
        next.actualProfit = calcActualProfitByPolicy({
          customerPrice: 0,
          materialCost: next.materialCost,
          platformFee: next.platformFee,
          tripSubsidy: next.isBusinessTrip ? TRIP_SUBSIDY_PER_UNIT : 0,
          notes: next.notes,
        })
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
    // P0-155：套餐米数仅接受空或正数（>0）；负数/0/非法字符阻断保存并提示
    const pkg = form.packageMeters.trim()
    if (pkg) {
      const n = Number(pkg)
      if (!Number.isFinite(n) || n <= 0) newErrors.packageMeters = '套餐米数须为正数，或留空按品牌默认'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [form])

  const submit = useCallback((): Order | null => {
    if (!validate()) return null
    // P0-196-R2：手动新增防重（编辑模式不过防重，禁误伤改单）；铁命中禁保存，疑命中确认制
    if (!isEdit) {
      const allOrders = useOrderStore.getState().orders
      // P0-196-R2 说明：手动新增表单不录单号/VIN（FormData 无此两字段），故只能电话疑检；
      // 铁级拦截由批量导入路径承担（单号/VIN 唯批量解析可得）。
      const guard = orderExists({ orderNo: '', vin: '', phone: form.phone }, allOrders.filter((o) => o.id !== orderId))
      if (guard.exists && guard.matchBy === 'phone') {
        if (!confirm(`电话 ${form.phone} 已有单在【${guard.where}】（${guard.existing?.orderNo || ''}）\n确认真双桩可继续保存，取消则拦截。继续？`)) return null
      }
    }
    const order: Order = {
      id: isEdit ? orderId! : String(Date.now()),
      ...form,
      createdAt: isEdit ? (existingOrder?.createdAt || Date.now()) : Date.now(),
      updatedAt: Date.now(),
    } as Order

    // P0-155：套餐米数保存语义——有值写字符串原样；空则清字段（resolve 自动回落品牌默认）
    const pkg = form.packageMeters.trim()
    if (pkg) order.packageMeters = pkg
    else delete order.packageMeters

    // P0-165-R7：出差开关驱动出差补助（写既有字段，对账/实际口径随动）
    order.tripSubsidy = form.isBusinessTrip ? TRIP_SUBSIDY_PER_UNIT : 0

    if (isEdit) {
      // updateOrder 为合并更新：空值置 undefined，JSON 持久化时键被丢弃=字段清除
      const updates: Partial<Order> = { ...form }
      if (pkg) updates.packageMeters = pkg
      else updates.packageMeters = undefined
      updates.tripSubsidy = form.isBusinessTrip ? TRIP_SUBSIDY_PER_UNIT : 0
      updateOrder(orderId!, updates)
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
