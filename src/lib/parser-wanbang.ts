/* ============================================================
 * 万帮吉利工单解析
 * ============================================================ */

import type { ParsedOrderItem } from './parser-core';
import {
  KEY_VALUE_RE,
  VIN_SEARCH_RE,
  emptyItem,
  extractBrandName,
  extractPhone,
  fillFallbacks,
} from './parser-core';
import { REGIONS } from '@/constants/order';

export function isWanbangBlock(block: string): boolean {
  const hasHeader =
    /外联单号\s*[:：]/.test(block) ||
    /服务品牌\s*[:：]/.test(block) ||
    /工单描述\s*[:：]/.test(block);
  const hasContact = /联系人\s*[:：]/.test(block) || /车主姓名\s*[:：]/.test(block);
  const hasAddress = /详细地址\s*[:：]/.test(block);
  const hasDesc = /工单描述\s*[:：]/.test(block);
  return hasHeader && hasContact && hasAddress && hasDesc;
}

function collectKv(block: string): Map<string, string> {
  const kv = new Map<string, string>();
  for (const raw of block.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(KEY_VALUE_RE);
    if (m) kv.set(m[1], m[2].trim());
  }
  return kv;
}

function extractDescFields(block: string): Map<string, string> {
  const fields = new Map<string, string>();
  const lines = block.split('\n');
  let inDesc = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^工单描述\s*[:：]/.test(line)) {
      inDesc = true;
      const rest = line.replace(/^工单描述\s*[:：]\s*/, '');
      const nested = rest.match(KEY_VALUE_RE);
      if (nested) fields.set(nested[1], nested[2].trim());
      continue;
    }
    if (!inDesc) continue;
    const m = line.match(KEY_VALUE_RE);
    if (m) {
      fields.set(m[1], m[2].trim());
      continue;
    }
    if (/万帮/.test(line) && /(\d{1,2})\.(\d{1,2})-(\d{1,2})\.(\d{1,2})号?/.test(line)) break;
  }
  return fields;
}

export function parseWanbangRegion(address: string): string {
  const head = (address || '').trim().split(/\s+/)[0] || '';
  const cityRaw = head.split('-')[1] || '';
  const city = cityRaw.replace(/市$/, '');
  const matched = REGIONS.find((r) => r === city || city.includes(r));
  return matched || '其他';
}

function parseFooter(block: string): { platformName: string; appointmentDate: string } {
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
  let platformName = '';
  let appointmentDate = '';
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    const m = line.match(/(\d{1,2})\.(\d{1,2})(?:-(\d{1,2})\.(\d{1,2}))?号?/);
    if (!m) continue;
    if (line.includes('万帮')) platformName = '万帮';
    const year = new Date().getFullYear();
    appointmentDate = `${year}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
    break;
  }
  if (!platformName && /万帮/.test(block)) platformName = '万帮';
  return { platformName, appointmentDate };
}

function pickMeters(text: string): string {
  const m = text.match(/(\d+)\s*米/);
  return m ? m[1] : '';
}

export function parseWanbangBlock(block: string): ParsedOrderItem {
  const item = emptyItem();
  const kv = collectKv(block);
  const desc = extractDescFields(block);
  const footer = parseFooter(block);

  item.orderNo = kv.get('外联单号') || '';
  item.customerName = kv.get('联系人') || kv.get('车主姓名') || '';
  item.phone = kv.get('联系人电话') || kv.get('车主电话') || extractPhone(block);
  item.address = kv.get('详细地址') || '';
  item.vin = kv.get('车架号') || '';
  if (!item.vin) {
    const found = block.match(VIN_SEARCH_RE);
    if (found) item.vin = found[0];
  }

  item.brandName = desc.get('品牌') || extractBrandName(kv.get('服务品牌') || '') || '';
  item.packageMeters = pickMeters(desc.get('套包类型') || '');
  const delivery = desc.get('配送方式') || '';
  if (delivery) item.serviceType = delivery;
  if (delivery.includes('带桩上门')) item.installType = '带桩上门';

  item.platformName = footer.platformName;
  item.appointmentDate = footer.appointmentDate;
  item.region = parseWanbangRegion(item.address);

  const descRaw = kv.get('工单描述') || '';
  item.remark = descRaw ? `工单描述: ${descRaw}` : '';

  fillFallbacks(item, block);
  if (!item.platformName) item.platformName = footer.platformName || '万帮';
  if (!item.appointmentDate) item.appointmentDate = footer.appointmentDate;
  if (!item.region) item.region = parseWanbangRegion(item.address);
  if (!item.brandName) item.brandName = desc.get('品牌') || extractBrandName(kv.get('服务品牌') || '') || '';
  return item;
}
