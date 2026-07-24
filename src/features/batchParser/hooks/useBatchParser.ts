import { useState, useCallback } from 'react'
import type { Order } from '@/types'

export interface ParsedOrder {
  customerName: string
  phone: string
  address: string
  platform: string
  appointmentDate?: string
  appointmentTime?: string
  rawText: string
}

export function useBatchParser() {
  const [rawText, setRawText] = useState('')
  const [parsedOrders, setParsedOrders] = useState<ParsedOrder[]>([])
  const [isParsing, setIsParsing] = useState(false)

  const parse = useCallback(() => {
    setIsParsing(true)
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean)
    const results: ParsedOrder[] = []

    for (const line of lines) {
      const nameMatch = line.match(/姓名[：:]\s*([^\s,，]+)/)
      const phoneMatch = line.match(/(1\d{10})/)
      const addrMatch = line.match(/地址[：:]\s*(.+?)(?:[,，]|$)/)
      const platformMatch = line.match(/平台[：:]\s*([^\s,，]+)/)
      const dateMatch = line.match(/(\d{4}-\d{2}-\d{2})/)
      const timeMatch = line.match(/(\d{2}:\d{2})/)

      if (nameMatch || phoneMatch) {
        results.push({
          customerName: nameMatch?.[1] || '',
          phone: phoneMatch?.[1] || '',
          address: addrMatch?.[1] || '',
          platform: platformMatch?.[1] || '其他',
          appointmentDate: dateMatch?.[1],
          appointmentTime: timeMatch?.[1],
          rawText: line,
        })
      }
    }

    setParsedOrders(results)
    setIsParsing(false)
    return results
  }, [rawText])

  const clear = useCallback(() => {
    setRawText('')
    setParsedOrders([])
  }, [])

  const convertToOrders = useCallback((): Order[] => {
    return parsedOrders.map((po) => ({
      id: String(Date.now() + Math.random()),
      customerName: po.customerName,
      phone: po.phone,
      address: po.address,
      platform: po.platform as any,
      status: '待办',
      region: '其他',
      appointmentDate: po.appointmentDate,
      appointmentTime: po.appointmentTime,
      materialCost: 0,
      laborCost: 0,
      platformFee: 0,
      actualProfit: 0,
      notes: po.rawText,
      meterStatus: '未安装',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as Order))
  }, [parsedOrders])

  return {
    rawText,
    setRawText,
    parsedOrders,
    isParsing,
    parse,
    clear,
    convertToOrders,
  }
}
