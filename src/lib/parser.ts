/* ============================================================
 * 解析层入口：对外 API + 转换 + 去重
 * ============================================================ */

import type { Order } from '@/types';
import type { ParsedOrderItem, ParseTextResult } from './parser-core';
import { splitOrderBlocks, emptyItem } from './parser-core';
import { parseBlock, hasAnyField } from './parser-engines';

/* --------------------------------------------------------------
 * 八、对外入口
 * -------------------------------------------------------------- */

export function parseOrderTextDetailed(rawText: string): ParseTextResult {
  const blocks = splitOrderBlocks(rawText);
  const items: ParsedOrderItem[] = [];
  for (const block of blocks) {
    const item = parseBlock(block);
    if (hasAnyField(item)) {
      item.rawText = block;
      items.push(item);
    }
  }
  return { items, blockCount: blocks.length };
}

export function parseOrderText(rawText: string): ParsedOrderItem[] {
  return parseOrderTextDetailed(rawText).items;
}

/* --------------------------------------------------------------
 * 九、转换：ParsedOrderItem[] → Order[]
 * -------------------------------------------------------------- */

export function parsedItemsToOrders(items: ParsedOrderItem[]): Order[] {
  const now = Date.now();
  return items.map((it, idx) => ({
    id: `parsed_${now}_${idx}`,
    customerName: it.customerName || '',
    phone: it.phone || '',
    address: it.address || '',
    brandName: it.brandName || '',
    powerKw: it.powerKw || '',
    packageMeters: it.packageMeters || '',
    vin: it.vin || '',
    serviceType: it.serviceType || '',
    platformName: it.platformName || '',
    remark: it.remark || '',
    orderNo: it.orderNo || '',
    status: 'todo',
    createdAt: now,
    updatedAt: now,
    totalAmount: 0,
    actualProfit: 0,
    materialCost: 0,
    laborCost: 0,
    platformFee: 0,
    materials: [],
    rawText: it.rawText || '',
  }));
}

/* --------------------------------------------------------------
 * 十、去重：过滤已存在的解析项
 * -------------------------------------------------------------- */

export function filterNewParsedItems(
  items: ParsedOrderItem[],
  existingOrders: Order[]
): { fresh: ParsedOrderItem[]; duplicated: ParsedOrderItem[] } {
  const fresh: ParsedOrderItem[] = [];
  const duplicated: ParsedOrderItem[] = [];
  for (const item of items) {
    const isDup = existingOrders.some(
      (o) =>
        (item.phone && o.phone === item.phone) ||
        (item.orderNo && o.orderNo === item.orderNo) ||
        (item.vin && o.vin === item.vin)
    );
    if (isDup) duplicated.push(item);
    else fresh.push(item);
  }
  return { fresh, duplicated };
}

/* 兼容老系统：重新导出核心类型 */
export type { ParsedOrderItem, ParseTextResult } from './parser-core';
