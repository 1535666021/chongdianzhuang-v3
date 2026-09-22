import { useState, useCallback } from 'react'
import type { Order } from '@/types'
import { useOrderStore } from '@/stores/orderStore'
import { addKnownPlatform } from '@/shared/storage/platformStorage'
import { getBrandLabel } from '@/constants/brands'
import { getPlatformLabel } from '@/constants/platforms'
import { getPowerLabel } from '@/constants/power'
import {
  parseOrderTextDetailed,
  parsedItemsToOrders,
  type ParsedOrderItem,
} from '@/lib/parser'
import {
  matchExistingDuplicate,
  findBatchDuplicates,
  type ExistingDupMatch,
  type BatchDupMatch,
} from './batchDedupe'

type ParsedOrderWithNature = ParsedOrderItem & { nature?: string }

/** 预览条目：订单 + 判重状态（新增 / 库内重复 / 批内重复） */
export interface PreviewEntry {
  order: Order
  status: 'new' | 'existing-dup' | 'batch-dup'
  existingMatch?: ExistingDupMatch
  batchMatch?: BatchDupMatch
}

export function useBatchParser() {
  const [rawText, setRawText] = useState('')
  const [previewEntries, setPreviewEntries] = useState<PreviewEntry[]>([])
  const [checked, setChecked] = useState<boolean[]>([])
  const [blockCount, setBlockCount] = useState(0)
  const [isParsing, setIsParsing] = useState(false)
  const existingOrders = useOrderStore((state) => state.orders)

  const parse = useCallback(() => {
    setIsParsing(true)
    const text = rawText.trim()
    if (!text) {
      setPreviewEntries([])
      setChecked([])
      setBlockCount(0)
      setIsParsing(false)
      return []
    }

    const result = parseOrderTextDetailed(text)
    result.items.forEach((item) => {
      if (item.brandName) item.brandName = getBrandLabel(item.brandName)
      if (item.powerKw) item.powerKw = getPowerLabel(item.powerKw).replace(/kW$/, '')
      if (item.platformName && item.platformName !== '其他') {
        item.platformName = getPlatformLabel(item.platformName)
        addKnownPlatform(item.platformName)
      }
      if (!item.platformName) item.platformName = '其他'
    })
    const orders = parsedItemsToOrders(result.items).map((order, index) => ({
      ...order,
      nature: (result.items[index] as ParsedOrderWithNature).nature || '安装',
    }))
    // P0-093：批内自查优先（同批重复只保留首条），首条再查库内重复
    const batchDups = findBatchDuplicates(orders)
    const entries: PreviewEntry[] = orders.map((order, index) => {
      const batchMatch = batchDups[index]
      if (batchMatch) return { order, status: 'batch-dup' as const, batchMatch }
      const existingMatch = matchExistingDuplicate(order, existingOrders)
      if (existingMatch) return { order, status: 'existing-dup' as const, existingMatch }
      return { order, status: 'new' as const }
    })
    setPreviewEntries(entries)
    // 重复项默认不勾选，允许手动勾选强制导入（老客户再装场景）
    setChecked(entries.map((e) => e.status === 'new'))
    setBlockCount(result.blockCount)
    setIsParsing(false)
    return result.items
  }, [rawText, existingOrders])

  const clear = useCallback(() => {
    setRawText('')
    setPreviewEntries([])
    setChecked([])
    setBlockCount(0)
  }, [])

  const toggleChecked = useCallback((index: number) => {
    setChecked((prev) => prev.map((v, i) => (i === index ? !v : v)))
  }, [])

  const checkedCount = checked.filter(Boolean).length

  /** 仅导出勾选项；重复项未勾选即跳过，与 importOrders 统计联动 */
  const getCheckedOrders = useCallback((): Order[] => {
    return previewEntries.filter((_, i) => checked[i]).map((e) => e.order)
  }, [previewEntries, checked])

  return {
    rawText,
    setRawText,
    previewEntries,
    checked,
    checkedCount,
    blockCount,
    isParsing,
    parse,
    clear,
    toggleChecked,
    getCheckedOrders,
  }
}
