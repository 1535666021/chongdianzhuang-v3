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

/** 导入结果条目：订单 + 判重结论（新增 / 库内重复 / 批内重复），只读回显 */
export interface PreviewEntry {
  order: Order
  status: 'new' | 'existing-dup' | 'batch-dup'
  existingMatch?: ExistingDupMatch
  batchMatch?: BatchDupMatch
}

/** P0-106 一键解析+入库结果汇总 */
export interface ParseOutcome {
  /** 解析识别出的订单总数 */
  total: number
  /** 实际入库新增 */
  added: number
  /** 同id金额对齐更新 */
  updated: number
  /** 重复跳过总数（批内重复 + 库内重复 + 库内同id跳过） */
  skipped: number
  blockCount: number
}

export function useBatchParser() {
  const [rawText, setRawText] = useState('')
  const [previewEntries, setPreviewEntries] = useState<PreviewEntry[]>([])
  const [blockCount, setBlockCount] = useState(0)
  const [isParsing, setIsParsing] = useState(false)
  const existingOrders = useOrderStore((state) => state.orders)
  const importOrders = useOrderStore((state) => state.importOrders)

  /**
   * P0-106 一键流程：解析 → 去重（P0-093全部规则原样）→ 新单自动入库。
   * 全程单次点击，无需二次确认；返回汇总供页面 toast；空文本返回 null。
   */
  const parse = useCallback((): ParseOutcome | null => {
    const text = rawText.trim()
    if (!text) {
      setPreviewEntries([])
      setBlockCount(0)
      return null
    }
    setIsParsing(true)
    try {
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

      // 单条解析异常跳过不阻塞整体：整体转换失败时逐条降级
      let orders: Order[] = []
      let natures: string[] = []
      try {
        orders = parsedItemsToOrders(result.items)
        natures = result.items.map(
          (item) => (item as ParsedOrderWithNature).nature || '安装'
        )
      } catch {
        result.items.forEach((item, index) => {
          try {
            const single = parsedItemsToOrders([item])
            if (single.length > 0) {
              // 降级路径逐条生成唯一id，避免同毫秒idx冲突
              orders.push({ ...single[0], id: `parsed_${Date.now()}_${index}` })
              natures.push((item as ParsedOrderWithNature).nature || '安装')
            }
          } catch {
            // 单条异常：跳过该条
          }
        })
      }
      const ordersWithNature = orders.map((order, index) => ({
        ...order,
        nature: natures[index],
      }))

      if (ordersWithNature.length === 0) {
        setPreviewEntries([])
        setBlockCount(result.blockCount)
        return { total: 0, added: 0, updated: 0, skipped: 0, blockCount: result.blockCount }
      }

      // P0-093：批内自查优先（同批重复只保留首条），首条再查库内重复，规则原样
      const batchDups = findBatchDuplicates(ordersWithNature)
      const entries: PreviewEntry[] = ordersWithNature.map((order, index) => {
        const batchMatch = batchDups[index]
        if (batchMatch) return { order, status: 'batch-dup' as const, batchMatch }
        const existingMatch = matchExistingDuplicate(order, existingOrders)
        if (existingMatch) return { order, status: 'existing-dup' as const, existingMatch }
        return { order, status: 'new' as const }
      })
      setPreviewEntries(entries)
      setBlockCount(result.blockCount)

      // 一键入库：仅新增项直推，重复项自动跳过
      const newOrders = entries.filter((e) => e.status === 'new').map((e) => e.order)
      const res = importOrders(newOrders)
      const skippedTotal = entries.length - newOrders.length + res.skipped
      return {
        total: entries.length,
        added: res.added,
        updated: res.updated,
        skipped: skippedTotal,
        blockCount: result.blockCount,
      }
    } finally {
      setIsParsing(false)
    }
  }, [rawText, existingOrders, importOrders])

  const clear = useCallback(() => {
    setRawText('')
    setPreviewEntries([])
    setBlockCount(0)
  }, [])

  return {
    rawText,
    setRawText,
    previewEntries,
    blockCount,
    isParsing,
    parse,
    clear,
  }
}
