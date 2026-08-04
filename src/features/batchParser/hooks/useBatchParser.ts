import { useState, useCallback } from 'react'
import type { Order } from '@/types'
import { useOrderStore } from '@/stores/orderStore'
import { addKnownPlatform, getKnownPlatforms } from '@/shared/storage/platformStorage'
import { getBrandLabel } from '@/constants/brands'
import { getPlatformLabel, PLATFORM_NAMES } from '@/constants/platforms'
import { getPowerLabel } from '@/constants/power'
import {
  parseOrderTextDetailed,
  parsedItemsToOrders,
  type ParsedOrderItem,
} from '@/lib/parser'

type ParsedOrderWithNature = ParsedOrderItem & { nature?: string }

function isDuplicate(order: Order, existingOrders: Order[]): boolean {
  const currentMonth = new Date().toISOString().slice(0, 7)
  return existingOrders.some((existing) => {
    const createdAt = new Date(existing.createdAt)
    const existingMonth = Number.isNaN(createdAt.getTime()) ? '' : createdAt.toISOString().slice(0, 7)
    return existing.status !== '已完成' && existingMonth === currentMonth &&
      (existing.customerName === order.customerName || (order.phone && existing.phone === order.phone)) &&
      (existing.nature || '安装') === order.nature
  })
}

export function useBatchParser() {
  const [rawText, setRawText] = useState('')
  const [parsedOrders, setParsedOrders] = useState<ParsedOrderItem[]>([])
  const [blockCount, setBlockCount] = useState(0)
  const [isParsing, setIsParsing] = useState(false)
  const existingOrders = useOrderStore((state) => state.orders)

  const parse = useCallback(() => {
    setIsParsing(true)
    const text = rawText.trim()
    if (!text) {
      setParsedOrders([])
      setBlockCount(0)
      setIsParsing(false)
      return []
    }

    const result = parseOrderTextDetailed(text)
    const knownPlatforms = [...new Set([...PLATFORM_NAMES.filter((name) => name !== '其他'), ...getKnownPlatforms()])]
    result.items.forEach((item) => {
      const platform = item.platformName.trim()
      if (item.brandName) item.brandName = getBrandLabel(item.brandName)
      if (item.powerKw) item.powerKw = getPowerLabel(item.powerKw).replace(/kW$/, '')
      if (platform && platform !== '其他') {
        item.platformName = getPlatformLabel(platform)
        addKnownPlatform(item.platformName)
        return
      }
      if (item.brandName && knownPlatforms.includes(item.brandName)) {
        item.platformName = item.brandName
      } else if (knownPlatforms.length === 1) {
        item.platformName = knownPlatforms[0]
      } else if (knownPlatforms.length > 1) {
        const choice = window.prompt(`请选择平台：${knownPlatforms.join('、')}`)
        if (choice && knownPlatforms.includes(choice)) item.platformName = choice
      }
    })
    setParsedOrders(result.items)
    setBlockCount(result.blockCount)
    setIsParsing(false)
    return result.items
  }, [rawText])

  const clear = useCallback(() => {
    setRawText('')
    setParsedOrders([])
    setBlockCount(0)
  }, [])

  const convertToOrders = useCallback((): Order[] => {
    const orders = parsedItemsToOrders(parsedOrders).map((order, index) => ({
      ...order,
      nature: (parsedOrders[index] as ParsedOrderWithNature).nature || '安装',
    }))
    const duplicates = orders.filter((order) => isDuplicate(order, existingOrders))
    if (duplicates.length && !window.confirm(`本月已有 ${duplicates.length} 条同客户同性质订单，是否仍要导入？`)) {
      return orders.filter((order) => !isDuplicate(order, existingOrders))
    }
    return orders
  }, [existingOrders, parsedOrders])

  return {
    rawText,
    setRawText,
    parsedOrders,
    blockCount,
    isParsing,
    parse,
    clear,
    convertToOrders,
  }
}
