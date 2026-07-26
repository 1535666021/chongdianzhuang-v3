/* ============================================================
 * 解析层核心：类型定义 + 常量 + 工具函数 + 文本切块
 * ============================================================ */

import type { Order } from '@/types';

/* --------------------------------------------------------------
 * 一、类型定义（新系统适配）
 * -------------------------------------------------------------- */

/** 标准订单字段：识别不到的字段为空字符串 */
export interface ParsedOrderItem {
  /** 订单号 */
  orderNo: string;
  /** 客户姓名 */
  customerName: string;
  /** 手机号 */
  phone: string;
  /** 安装地址 */
  address: string;
  /** 服务品牌 */
  brandName: string;
  /** 功率（kW 数值字符串，如 "7" / "3.5"） */
  powerKw: string;
  /** 套包米数（数值字符串，如 "30"） */
  packageMeters: string;
  /** 车架号（VIN） */
  vin: string;
  /** 服务类型 */
  serviceType: string;
  /** 平台原始文本 */
  platformName: string;
  /** 备注 */
  remark: string;
  /** 原始报单块文本 */
  rawText?: string;
}

/** 批量解析详细结果 */
export interface ParseTextResult {
  /** 解析成功的订单 */
  items: ParsedOrderItem[];
  /** 原文中疑似订单块数量（与 items.length 对不上时预览层必须显著告警） */
  blockCount: number;
}

/* --------------------------------------------------------------
 * 二、基础正则（模块内统一维护）
 * -------------------------------------------------------------- */

/** 大陆 11 位手机号（带边界） */
export const PHONE_RE = /(^|[^A-Za-z0-9])(1[3-9]\d{9})(?!\d)/;

/** VIN：整 token 17 位且至少含一个字母 */
export const VIN_FULL_RE = /^(?=[A-HJ-NPR-Z0-9]*[A-HJ-NPR-Z])[A-HJ-NPR-Z0-9]{17}$/;
/** VIN：全文搜索用 */
export const VIN_SEARCH_RE = /(?=[A-HJ-NPR-Z0-9]*[A-HJ-NPR-Z])[A-HJ-NPR-Z0-9]{17}/g;
/** 功率：数字 + kW/千瓦 */
export const POWER_RE = /(\d+(?:\.\d+)?)\s*(?:kw|千瓦)/i;
/** 米数：数字 + 米 */
export const METERS_RE = /(\d+)\s*米/;
/** 日期 token */
export const DATE_TOKEN_RE = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/;
/** 时间 token */
export const TIME_TOKEN_RE = /^\d{1,2}:\d{2}(:\d{2})?$/;
/** 行首时间戳前缀 */
export const TIMESTAMP_PREFIX_RE = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}[ T]\d{1,2}:\d{2}(:\d{2})?\s*/;
/** 键值行 */
export const KEY_VALUE_RE = /^([\u4e00-\u9fa5A-Za-z]{2,10})[:：]\s*(.*)$/;

/** 地址片段特征词 */
export const ADDRESS_HINTS = /(省|市|区|县|镇|乡|村|路|街|巷|道|小区|花园|苑|栋|幢|座|单元|室|号|车位|车库)/;
/** 强地址特征 */
export const STRONG_ADDRESS_HINTS = /(小区|栋|幢|单元|室|车位|车库|路|街|花园|苑|\d)/;

/** 品牌词表（按词长降序） */
export const BRAND_WORDS = [
  '长城欧拉', '长城坦克', '长城皮卡',
  '鸿蒙智行', '广汽埃安', '特来电', '比亚迪', '特斯拉', '零跑', '埃安',
  '五菱', '公牛', '捷途', '吉利', '长城', '坦克', '欧拉', '奇瑞', 'icar',
  '理想', '蔚来', '小鹏', '长安', '深蓝', '极氪', '问界', '小米', '传祺',
  '华境', '奔驰', '宝马', '奥迪', '大众', '丰田', '本田', '日产', '皮卡',
];

/** 平台提示词表（按词长降序） */
export const PLATFORM_HINT_WORDS = [
  '西安领充', '苏宁易购', '上汽通用', '拼多多',
  '京东', '苏宁', '天猫', '淘宝', '领充', '万帮', '挚达',
  '妍伟', '空灵', '美团', '苹果',
];

/** 姓名排除词 */
export const NAME_EXCLUDE_RE = /(地下|地面|壁挂|立柱|电表|安装|申请|到货|加急|预约|京东|苏宁|挚达|维修|服务|套包|套餐|预排|上门|检测|拆桩|充电桩|联系)/;

/** 键值块字段映射 */
export const KV_FIELD_KEYS = {
  orderNo: ['订单号', '安装订单号', '安装工单号', '服务编号', '服务单号', '外联单号'],
  customerName: ['订单姓名', '客户姓名', '联系人', '车主姓名'],
  phone: ['真实号码', '客户手机', '用户电话', '联系电话', '联系人电话', '车主电话'],
  address: ['安装地址', '用户地址', '收件地址', '详细地址'],
  brandName: ['服务品牌'],
  powerKw: ['功率'],
  packageMeters: ['套包米数'],
  vin: ['车架号'],
  serviceType: ['服务类型', '购买套包'],
  platformName: ['运营商', '平台', '信息来源', '渠道', '来源', '工单来源'],
} as const;

/** 键值块中归入备注的键 */
export const KV_REMARK_KEYS = ['备注', '首联信息', '安装备注', '用户需求', '工单描述', '服务说明', '备注信息', '需求说明', '客户要求', '特殊要求', '安装要求', '服务备注', '工单备注', '需求备注', '客户备注', '安装说明', '服务需求', '工单信息', '补充说明', '其他说明', '备注说明', '客户描述', '需求描述', '服务描述', '工单要求', '安装需求', '特殊说明', '补充信息', '附加信息', '附加说明'];

/** 已知但无需保留的键 */
export const KV_DISCARD_KEYS = new Set([
  '服务商', '接件时间', '单据类型', '服务性质',
  '创建人', '工单状态', '客户ID', '安装城市', '用户购车信息',
  '关联车辆订单号', '车型', '家充权益', '车辆订单状态', '交付时间',
  '剩余积分', '工单关键节点', '工单创建', '创建类型', '反馈结果',
]);

/** 独立行丢弃词 */
export const STANDALONE_DISCARD = new Set([
  ...KV_DISCARD_KEYS,
  '运营商', '信息来源', '工单来源', '平台', '渠道',
]);

/* --------------------------------------------------------------
 * 三、工具函数
 * -------------------------------------------------------------- */

export function emptyItem(): ParsedOrderItem {
  return {
    orderNo: '',
    customerName: '',
    phone: '',
    address: '',
    brandName: '',
    powerKw: '',
    packageMeters: '',
    vin: '',
    serviceType: '',
    platformName: '',
    remark: '',
  };
}

export function extractPhone(text: string): string {
  const m = text.match(PHONE_RE);
  return m ? m[2] : '';
}

export function pickKv(kv: Map<string, string>, keys: readonly string[]): string {
  for (const key of keys) {
    const value = kv.get(key);
    if (value) return value;
  }
  return '';
}

export function cleanAddressText(addr: string): string {
  let text = addr.trim();
  text = text.replace(/^安装地址[:：]\s*/, '');
  text = text.replace(/^[\u4e00-\u9fa5]{2,4}省\s+[\u4e00-\u9fa5]{2,4}市\s+/, '');
  return text.trim();
}

export function extractBrandName(text: string): string {
  const lower = text.toLowerCase();
  for (const word of BRAND_WORDS) {
    if (lower.includes(word.toLowerCase())) return word;
  }
  return '';
}

export function extractPlatformName(text: string): string {
  for (const word of PLATFORM_HINT_WORDS) {
    if (text.includes(word)) return word;
  }
  return '';
}

export function stripWordFromText(text: string, word: string): string {
  if (!word) return text;
  let result = text;
  let idx = result.indexOf(word);
  while (idx >= 0) {
    const before = idx === 0 ? '' : result.charAt(idx - 1);
    const after = idx + word.length >= result.length ? '' : result.charAt(idx + word.length);
    const isBoundary = (ch: string) => ch === '' || !/[\u4e00-\u9fa5A-Za-z0-9]/.test(ch);
    if (isBoundary(before) && isBoundary(after)) {
      result = `${result.slice(0, idx)} ${result.slice(idx + word.length)}`;
      idx = result.indexOf(word, idx + 1);
    } else {
      idx = result.indexOf(word, idx + word.length);
    }
  }
  return result.replace(/\s{2,}/g, ' ').trim();
}

export function fillFallbacks(item: ParsedOrderItem, blockText: string): void {
  if (!item.phone) item.phone = extractPhone(blockText);
  if (!item.vin) {
    const all = blockText.match(VIN_SEARCH_RE) ?? [];
    const found = all.find((v) => v !== item.orderNo);
    if (found) item.vin = found;
  }
  if (item.powerKw) {
    const m = item.powerKw.match(/(\d+(?:\.\d+)?)/);
    if (m) item.powerKw = m[1];
  } else {
    const m = (item.serviceType + ' ' + item.remark).match(POWER_RE) ?? blockText.match(POWER_RE);
    if (m) item.powerKw = m[1];
  }
  if (item.packageMeters) {
    const m = item.packageMeters.match(/(\d+)/);
    if (m) item.packageMeters = m[1];
  } else {
    const m = (item.serviceType + ' ' + item.remark).match(METERS_RE);
    if (m) item.packageMeters = m[1];
  }
  if (!item.brandName) {
    item.brandName = extractBrandName(item.serviceType + ' ' + blockText);
  }
  if (!item.platformName) {
    item.platformName = extractPlatformName(item.serviceType + ' ' + item.remark) || extractPlatformName(blockText);
  }
  if (item.platformName && item.remark.includes(item.platformName)) {
    item.remark = stripWordFromText(item.remark, item.platformName);
  }
}

/* --------------------------------------------------------------
 * 四、文本切块
 * -------------------------------------------------------------- */

export const DATE_SEP_RE = /^[—\-–=\s]*\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?\s*[—\-–=\s]*$/;

export function isSpeakerLine(line: string): boolean {
  if (line.length > 25) return false;
  if (!/\s\d{1,2}:\d{2}$/.test(line)) return false;
  if (PHONE_RE.test(line)) return false;
  if (KEY_VALUE_RE.test(line)) return false;
  if (/[【】]/.test(line)) return false;
  return true;
}

export function isBlockMarker(line: string): boolean {
  return line === '【订单信息】' || line === '公告' || line === '群公告' || /^【.*(订单|公告).*】$/.test(line);
}

export const SEPARATOR_LINE_RE = /^[-—–=＊*·•~#\s]{3,}$/;
export const ORDER_INDEX_LINE_RE = /^第\s*\d+\s*[单条笔]\s*$/;

export const ORDER_START_KEYS = new Set([
  '订单号', '安装订单号', '安装工单号', '服务编号', '服务单号', '外联单号',
  '用户信息', '订单姓名', '客户姓名', '联系人', '车主姓名',
]);
export const PHONE_START_KEYS = new Set(['用户信息', '真实号码', '客户手机', '用户电话']);
export const ORDER_NO_KEYS = new Set([
  '订单号', '安装订单号', '安装工单号', '服务编号', '服务单号', '外联单号',
]);

export function looksLikeOrderStart(line: string): boolean {
  const kv = line.match(KEY_VALUE_RE);
  if (kv) return ORDER_NO_KEYS.has(kv[1]);
  if (/^【.+】$/.test(line)) return true;
  return extractPhone(line) !== '';
}

export function isOrderLikeBlock(block: string): boolean {
  if (extractPhone(block)) return true;
  return block.split('\n').some((line) => {
    const m = line.match(KEY_VALUE_RE);
    return m ? ORDER_START_KEYS.has(m[1]) : false;
  });
}

export function splitRepeatedKeyBlock(block: string): string[] {
  const lines = block.split('\n');
  const kvCount = lines.filter((l) => KEY_VALUE_RE.test(l)).length;
  if (kvCount < 2) return [block];
  const result: string[] = [];
  let cur: string[] = [];
  let seenStartKeys = new Set<string>();
  let seenPhones = new Set<string>();
  const flush = () => {
    if (cur.length > 0) {
      result.push(cur.join('\n'));
      cur = [];
    }
  };
  for (const line of lines) {
    const kv = line.match(KEY_VALUE_RE);
    const phone = extractPhone(line);
    let startNew = false;
    if (kv) {
      if (ORDER_START_KEYS.has(kv[1]) && seenStartKeys.has(kv[1])) startNew = true;
      if (PHONE_START_KEYS.has(kv[1]) && phone !== '' && seenPhones.size > 0 && !seenPhones.has(phone)) startNew = true;
    }
    if (startNew) {
      flush();
      seenStartKeys = new Set();
      seenPhones = new Set();
    }
    cur.push(line);
    if (kv && ORDER_START_KEYS.has(kv[1])) seenStartKeys.add(kv[1]);
    if (phone) seenPhones.add(phone);
  }
  flush();
  return result;
}

export function splitFlowBlockByPhone(block: string): string[] {
  const lines = block.split('\n');
  const kvCount = lines.filter((l) => KEY_VALUE_RE.test(l)).length;
  if (kvCount >= 2) return [block];
  const phones = new Set<string>();
  for (const line of lines) {
    const p = extractPhone(line);
    if (p) phones.add(p);
  }
  if (phones.size < 2) return [block];
  const result: string[] = [];
  let cur: string[] = [];
  for (const line of lines) {
    const hasPhone = extractPhone(line) !== '';
    if (hasPhone && cur.some((l) => extractPhone(l) !== '')) {
      result.push(cur.join('\n'));
      cur = [];
    }
    cur.push(line);
  }
  if (cur.length > 0) result.push(cur.join('\n'));
  return result;
}

export function splitOrderBlocks(rawText: string): string[] {
  const lines = rawText.split(/\r?\n/);
  const rough: string[] = [];
  let current: string[] = [];
  const flush = () => {
    if (current.length > 0) {
      rough.push(current.join('\n'));
      current = [];
    }
  };
  const nextStartsOrder = (from: number): boolean => {
    for (let j = from; j < lines.length; j++) {
      const t = lines[j].trim();
      if (!t) continue;
      if (isSpeakerLine(t) || isBlockMarker(t) || SEPARATOR_LINE_RE.test(t) || ORDER_INDEX_LINE_RE.test(t)) return true;
      return looksLikeOrderStart(t);
    }
    return false;
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (current.length > 0 && nextStartsOrder(i + 1)) flush();
      continue;
    }
    if (DATE_SEP_RE.test(line) || /微信群上的聊天记录|请查收/.test(line) || /^Dear[:：]?$/i.test(line)) {
      if (current.length > 0 && nextStartsOrder(i + 1)) flush();
      continue;
    }
    if (isSpeakerLine(line) || isBlockMarker(line) || SEPARATOR_LINE_RE.test(line) || ORDER_INDEX_LINE_RE.test(line)) {
      flush();
      continue;
    }
    current.push(line);
  }
  flush();
  const blocks: string[] = [];
  for (const block of rough) {
    for (const sub of splitRepeatedKeyBlock(block)) {
      blocks.push(...splitFlowBlockByPhone(sub));
    }
  }
  return blocks;
}
