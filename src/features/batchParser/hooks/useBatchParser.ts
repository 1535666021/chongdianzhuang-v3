import { useState, useCallback } from 'react'
import type { Order } from '@/types'
import {
  parseOrderText,
  parseOrderTextDetailed,
  parsedItemsToOrders,
  filterNewParsedItems,
  type ParsedOrderItem,
} from '@/lib/parser'

export function useBatchParser() {
  const [rawText, setRawText] = useState('')
  const [parsedOrders, setParsedOrders] = useState<ParsedOrderItem[]>([])
  const [blockCount, setBlockCount] = useState(0)
  const [isParsing, setIsParsing] = useState(false)

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
    return parsedItemsToOrders(parsedOrders)
  }, [parsedOrders])

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