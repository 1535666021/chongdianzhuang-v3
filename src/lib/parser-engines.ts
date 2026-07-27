/* ============================================================
 * 解析引擎：键值块解析 + 流式块解析 + 分发器
 * ============================================================ */

import type { ParsedOrderItem } from './parser-core';
import {
  PHONE_RE, VIN_SEARCH_RE, POWER_RE, METERS_RE,
  TIMESTAMP_PREFIX_RE, KEY_VALUE_RE,
  ADDRESS_HINTS, STRONG_ADDRESS_HINTS, NAME_EXCLUDE_RE,
  BRAND_WORDS, PLATFORM_HINT_WORDS,
  KV_FIELD_KEYS, KV_REMARK_KEYS, KV_DISCARD_KEYS, STANDALONE_DISCARD,
  emptyItem, extractPhone, pickKv, cleanAddressText,
  extractBrandName, extractPlatformName, stripWordFromText, fillFallbacks,
} from './parser-core';

/* --------------------------------------------------------------
 * 五、键值块解析
 * -------------------------------------------------------------- */

export function parseKeyValueBlock(block: string): ParsedOrderItem {
  const item = emptyItem();
  const kv = new Map<string, string>();
  const lines = block.split('\n');
  let userInfo = '';
  for (const rawLine of lines) {
    const line = rawLine.replace(TIMESTAMP_PREFIX_RE, '').trim();
    if (!line) continue;
    const m = line.match(KEY_VALUE_RE);
    if (m) {
      const key = m[1];
      let value = m[2].trim();
      if (KV_DISCARD_KEYS.has(key)) continue;
      if (key === '用户信息' || key === '真实号码') {
        userInfo = value;
        const phoneInInfo = extractPhone(value);
        if (phoneInInfo) {
          const namePart = value.replace(phoneInInfo, '').trim();
          if (namePart) {
            const isChineseOnly = /^[\u4e00-\u9fa5]+$/.test(namePart);
            if (!isChineseOnly || !NAME_EXCLUDE_RE.test(namePart)) {
              kv.set('_userinfo_name', namePart);
            }
          }
        } else {
          const trimmed = value.trim();
          if (trimmed) {
            const isChineseOnly = /^[\u4e00-\u9fa5]+$/.test(trimmed);
            if (!isChineseOnly || !NAME_EXCLUDE_RE.test(trimmed)) {
              kv.set('_userinfo_name', trimmed);
            }
          }
        }
        continue;
      }
      if (STANDALONE_DISCARD.has(key) && value.length <= 3) continue;
      if (key === '安装地址') {
        const pm = userInfo.match(PHONE_RE);
        if (pm) {
          const phone = pm[2];
          if (value.startsWith(phone)) value = value.slice(phone.length).trim();
        }
      }
      if (key === '客户姓名' && NAME_EXCLUDE_RE.test(value)) continue;
      if (key === '联系人' && NAME_EXCLUDE_RE.test(value)) continue;
      kv.set(key, value);
      continue;
    }
    if (PHONE_RE.test(line) && !kv.has('联系电话') && !kv.has('客户手机')) {
      kv.set('联系电话', extractPhone(line));
      continue;
    }
    if (VIN_SEARCH_RE.test(line) && !kv.has('车架号')) {
      const all = line.match(VIN_SEARCH_RE) ?? [];
      const found = all.find((v) => v !== item.orderNo);
      if (found) kv.set('车架号', found);
      continue;
    }
    if (item.remark) item.remark += '\n';
    item.remark += line;
  }
  item.orderNo = pickKv(kv, KV_FIELD_KEYS.orderNo);
  item.customerName = pickKv(kv, KV_FIELD_KEYS.customerName);
  if (!item.customerName && kv.has('_userinfo_name')) {
    item.customerName = kv.get('_userinfo_name')!;
  }
  item.phone = pickKv(kv, KV_FIELD_KEYS.phone);
  item.address = cleanAddressText(pickKv(kv, KV_FIELD_KEYS.address));
  item.brandName = pickKv(kv, KV_FIELD_KEYS.brandName);
  item.powerKw = pickKv(kv, KV_FIELD_KEYS.powerKw);
  item.packageMeters = pickKv(kv, KV_FIELD_KEYS.packageMeters);
  item.vin = pickKv(kv, KV_FIELD_KEYS.vin);
  item.serviceType = pickKv(kv, KV_FIELD_KEYS.serviceType);
  item.platformName = pickKv(kv, KV_FIELD_KEYS.platformName);
  if (userInfo && !item.phone) {
    const pm = userInfo.match(PHONE_RE);
    if (pm) item.phone = pm[2];
  }
  const rawRemark = pickKv(kv, KV_REMARK_KEYS);
  if (rawRemark) {
    if (item.remark) item.remark = rawRemark + '\n' + item.remark;
    else item.remark = rawRemark;
  }
  if (item.remark) item.remark = item.remark.trim();
  fillFallbacks(item, block);
  return item;
}

/* --------------------------------------------------------------
 * 六、流式块解析
 * -------------------------------------------------------------- */

export function parseFlowBlock(block: string): ParsedOrderItem {
  const item = emptyItem();
  const lines = block.split('\n');
  const remarks: string[] = [];
  let phoneLine = '';
  let addressLine = '';
  let nameCandidates: string[] = [];
  let brandCandidates: string[] = [];
  let platformCandidates: string[] = [];
  let vinCandidates: string[] = [];
  let orderNoCandidates: string[] = [];
  let serviceTypeCandidates: string[] = [];
  for (const rawLine of lines) {
    const line = rawLine.replace(TIMESTAMP_PREFIX_RE, '').trim();
    if (!line) continue;
    if (PHONE_RE.test(line)) {
      const p = extractPhone(line);
      if (p && !phoneLine) phoneLine = p;
      continue;
    }
    if (VIN_SEARCH_RE.test(line)) {
      const all = line.match(VIN_SEARCH_RE) ?? [];
      for (const v of all) {
        if (!vinCandidates.includes(v)) vinCandidates.push(v);
      }
      continue;
    }
    if (/^\d{10,20}$/.test(line) && !orderNoCandidates.includes(line)) {
      orderNoCandidates.push(line);
      continue;
    }
    if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(line) || /^\d{1,2}:\d{2}$/.test(line)) continue;
    if (line.length <= 4 && /^(kw|千瓦|米|套|包|安装|维修|勘察|服务)$/i.test(line)) continue;
    if (line.length < 2) continue;
    if (line.length >= 2 && line.length <= 6 && !NAME_EXCLUDE_RE.test(line) && !/\d/.test(line)) {
      if (!nameCandidates.includes(line)) nameCandidates.push(line);
    }
    if (ADDRESS_HINTS.test(line) && STRONG_ADDRESS_HINTS.test(line)) {
      if (!addressLine || line.length > addressLine.length) addressLine = line;
    }
    for (const word of BRAND_WORDS) {
      if (line.includes(word) && !brandCandidates.includes(word)) brandCandidates.push(word);
    }
    for (const word of PLATFORM_HINT_WORDS) {
      if (line.includes(word) && !platformCandidates.includes(word)) platformCandidates.push(word);
    }
    if (/(安装|维修|勘察|勘测|检测|拆桩|移机)/.test(line) && !serviceTypeCandidates.includes(line)) {
      serviceTypeCandidates.push(line);
    }
    remarks.push(line);
  }
  item.phone = phoneLine;
  item.address = addressLine;
  if (nameCandidates.length > 0) item.customerName = nameCandidates[0];
  if (brandCandidates.length > 0) item.brandName = brandCandidates[0];
  if (platformCandidates.length > 0) item.platformName = platformCandidates[0];
  if (vinCandidates.length > 0) item.vin = vinCandidates[0];
  if (orderNoCandidates.length > 0) item.orderNo = orderNoCandidates[0];
  if (serviceTypeCandidates.length > 0) item.serviceType = serviceTypeCandidates[0];
  if (remarks.length > 0) item.remark = remarks.join('\n');
  fillFallbacks(item, block);
  return item;
}

/* --------------------------------------------------------------
 * 七、分发器
 * -------------------------------------------------------------- */

export function parseBlock(block: string): ParsedOrderItem {
  const kvLineCount = block.split('\n').filter((l) => KEY_VALUE_RE.test(l.trim())).length;
  if (kvLineCount >= 2) return parseKeyValueBlock(block);
  return parseFlowBlock(block);
}

export function hasAnyField(item: ParsedOrderItem): boolean {
  return !!(item.orderNo || item.customerName || item.phone || item.address || item.brandName || item.vin);
}
