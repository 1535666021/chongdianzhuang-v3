/* ============================================================
 * 解析层：多格式订单文本批量解析（基于老系统 v32.1 完整迁移）
 * 规范：全部解析逻辑只此一处，页面/组件禁止手写正则与拆分逻辑
 * ============================================================ */

import type { Order } from '@/types';

/* ------------------------------------------------------------
 * 一、类型定义（新系统适配）
 * ------------------------------------------------------------ */

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

/* ------------------------------------------------------------
 * 二、基础正则（模块内统一维护）
 * ------------------------------------------------------------ */

/** 大陆 11 位手机号（带边界） */
const PHONE_RE = /(^|[^A-Za-z0-9])(1[3-9]\d{9})(?!\d)/;

/** VIN：整 token 17 位且至少含一个字母 */
const VIN_FULL_RE = /^(?=[A-HJ-NPR-Z0-9]*[A-HJ-NPR-Z])[A-HJ-NPR-Z0-9]{17}$/;
/** VIN：全文搜索用 */
const VIN_SEARCH_RE = /(?=[A-HJ-NPR-Z0-9]*[A-HJ-NPR-Z])[A-HJ-NPR-Z0-9]{17}/g;
/** 功率：数字 + kW/千瓦 */
const POWER_RE = /(\d+(?:\.\d+)?)\s*(?:kw|千瓦)/i;
/** 米数：数字 + 米 */
const METERS_RE = /(\d+)\s*米/;
/** 日期 token */
const DATE_TOKEN_RE = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/;
/** 时间 token */
const TIME_TOKEN_RE = /^\d{1,2}:\d{2}(:\d{2})?$/;
/** 行首时间戳前缀 */
const TIMESTAMP_PREFIX_RE = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}[ T]\d{1,2}:\d{2}(:\d{2})?\s*/;
/** 键值行 */
const KEY_VALUE_RE = /^([\u4e00-\u9fa5A-Za-z]{2,10})[:：]\s*(.*)$/;

/** 地址片段特征词 */
const ADDRESS_HINTS = /(省|市|区|县|镇|乡|村|路|街|巷|道|小区|花园|苑|栋|幢|座|单元|室|号|车位|车库)/;
/** 强地址特征 */
const STRONG_ADDRESS_HINTS = /(小区|栋|幢|单元|室|车位|车库|路|街|花园|苑|\d)/;

/** 品牌词表（按词长降序） */
const BRAND_WORDS = [
  '长城欧拉', '长城坦克', '长城皮卡',
  '鸿蒙智行', '广汽埃安', '特来电', '比亚迪', '特斯拉', '零跑', '埃安',
  '五菱', '公牛', '捷途', '吉利', '长城', '坦克', '欧拉', '奇瑞', 'icar',
  '理想', '蔚来', '小鹏', '长安', '深蓝', '极氪', '问界', '小米', '传祺',
  '华境', '奔驰', '宝马', '奥迪', '大众', '丰田', '本田', '日产', '皮卡',
];

/** 平台提示词表（按词长降序） */
const PLATFORM_HINT_WORDS = [
  '西安领充', '苏宁易购', '上汽通用', '拼多多',
  '京东', '苏宁', '天猫', '淘宝', '领充', '万帮', '挚达',
  '妍伟', '空灵', '美团', '苹果',
];

/** 姓名排除词 */
const NAME_EXCLUDE_RE = /(地下|地面|壁挂|立柱|电表|安装|申请|到货|加急|预约|京东|苏宁|挚达|维修|服务|套包|套餐|预排|上门|检测|拆桩|充电桩|联系)/;

/** 键值块字段映射 */
const KV_FIELD_KEYS = {
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
const KV_REMARK_KEYS = ['备注', '首联信息', '安装备注', '用户需求', '工单描述', '服务说明', '备注信息', '需求说明', '客户要求', '特殊要求', '安装要求', '服务备注', '工单备注', '需求备注', '客户备注', '安装说明', '服务需求', '工单信息', '补充说明', '其他说明', '备注说明', '客户描述', '需求描述', '服务描述', '工单要求', '安装需求', '特殊说明', '补充信息', '附加信息', '附加说明'];

/** 已知但无需保留的键 */
const KV_DISCARD_KEYS = new Set([
  '服务商', '接件时间', '单据类型', '服务性质',
  '创建人', '工单状态', '客户ID', '安装城市', '用户购车信息',
  '关联车辆订单号', '车型', '家充权益', '车辆订单状态', '交付时间',
  '剩余积分', '工单关键节点', '工单创建', '创建类型', '反馈结果',
]);

/** 独立行丢弃词 */
const STANDALONE_DISCARD = new Set([
  ...KV_DISCARD_KEYS,
  '运营商', '信息来源', '工单来源', '平台', '渠道',
]);

/* ------------------------------------------------------------
 * 三、工具函数
 * ------------------------------------------------------------ */

function emptyItem(): ParsedOrderItem {
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

function extractPhone(text: string): string {
  const m = text.match(PHONE_RE);
  return m ? m[2] : '';
}

function pickKv(kv: Map<string, string>, keys: readonly string[]): string {
  for (const key of keys) {
    const value = kv.get(key);
    if (value) return value;
  }
  return '';
}

function cleanAddressText(addr: string): string {
  let text = addr.trim();
  text = text.replace(/^安装地址[:：]\s*/, '');
  text = text.replace(/^[\u4e00-\u9fa5]{2,4}省\s+[\u4e00-\u9fa5]{2,4}市\s+/, '');
  return text.trim();
}

function extractBrandName(text: string): string {
  const lower = text.toLowerCase();
  for (const word of BRAND_WORDS) {
    if (lower.includes(word.toLowerCase())) return word;
  }
  return '';
}

function extractPlatformName(text: string): string {
  for (const word of PLATFORM_HINT_WORDS) {
    if (text.includes(word)) return word;
  }
  return '';
}

function stripWordFromText(text: string, word: string): string {
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

function fillFallbacks(item: ParsedOrderItem, blockText: string): void {
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

/* ------------------------------------------------------------
 * 四、文本切块
 * ------------------------------------------------------------ */

const DATE_SEP_RE = /^[—\-–=\s]*\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?\s*[—\-–=\s]*$/;

function isSpeakerLine(line: string): boolean {
  if (line.length > 25) return false;
  if (!/\s\d{1,2}:\d{2}$/.test(line)) return false;
  if (PHONE_RE.test(line)) return false;
  if (KEY_VALUE_RE.test(line)) return false;
  if (/[【】]/.test(line)) return false;
  return true;
}

function isBlockMarker(line: string): boolean {
  return line === '【订单信息】' || line === '公告' || line === '群公告' || /^【.*(订单|公告).*】$/.test(line);
}

const SEPARATOR_LINE_RE = /^[-—–=＊*·•~#\s]{3,}$/;
const ORDER_INDEX_LINE_RE = /^第\s*\d+\s*[单条笔]\s*$/;

const ORDER_START_KEYS = new Set([
  '订单号', '安装订单号', '安装工单号', '服务编号', '服务单号', '外联单号',
  '用户信息', '订单姓名', '客户姓名', '联系人', '车主姓名',
]);
const PHONE_START_KEYS = new Set(['用户信息', '真实号码', '客户手机', '用户电话']);
const ORDER_NO_KEYS = new Set([
  '订单号', '安装订单号', '安装工单号', '服务编号', '服务单号', '外联单号',
]);

function looksLikeOrderStart(line: string): boolean {
  const kv = line.match(KEY_VALUE_RE);
  if (kv) return ORDER_NO_KEYS.has(kv[1]);
  if (/^【.+】$/.test(line)) return true;
  return extractPhone(line) !== '';
}

function isOrderLikeBlock(block: string): boolean {
  if (extractPhone(block)) return true;
  return block.split('\n').some((line) => {
    const m = line.match(KEY_VALUE_RE);
    return m ? ORDER_START_KEYS.has(m[1]) : false;
  });
}

function splitRepeatedKeyBlock(block: string): string[] {
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
      seenStartKeys = new Set<string>();
      seenPhones = new Set<string>();
    }
    cur.push(line);
    if (kv && ORDER_START_KEYS.has(kv[1])) seenStartKeys.add(kv[1]);
    if (phone) seenPhones.add(phone);
  }
  flush();
  return result;
}

function splitFlowBlockByPhone(block: string): string[] {
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

function splitOrderBlocks(rawText: string): string[] {
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

/* ------------------------------------------------------------
 * 五、键值块解析
 * ------------------------------------------------------------ */

function parseKeyValueBlock(block: string): ParsedOrderItem {
  const item = emptyItem();
  const kv = new Map<string, string>();
  const freeLines: string[] = [];
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(KEY_VALUE_RE);
    if (m) {
      const key = m[1];
      let value = m[2].trim();
      if (!value && i + 1 < lines.length && !KEY_VALUE_RE.test(lines[i + 1])) {
        value = lines[i + 1].trim();
        i++;
      }
      if (value && !kv.has(key)) kv.set(key, value);
    } else {
      freeLines.push(line);
    }
  }

  const userInfo = kv.get('用户信息') ?? '';
  let userInfoName = '';
  let userInfoPhone = '';
  if (userInfo) {
    const pm = userInfo.match(PHONE_RE);
    if (pm) {
      userInfoPhone = pm[2];
      userInfoName = userInfo.replace(pm[2], '').trim();
    } else {
      userInfoName = userInfo;
    }
  }

  item.orderNo = pickKv(kv, KV_FIELD_KEYS.orderNo);
  item.customerName = pickKv(kv, KV_FIELD_KEYS.customerName) || userInfoName;
  item.phone = pickKv(kv, KV_FIELD_KEYS.phone) || userInfoPhone;
  item.address = cleanAddressText(pickKv(kv, KV_FIELD_KEYS.address));
  item.brandName = pickKv(kv, KV_FIELD_KEYS.brandName) || extractBrandName(freeLines.join('\n'));
  item.powerKw = pickKv(kv, KV_FIELD_KEYS.powerKw);
  item.packageMeters = pickKv(kv, KV_FIELD_KEYS.packageMeters);
  item.vin = pickKv(kv, KV_FIELD_KEYS.vin);
  item.serviceType = pickKv(kv, KV_FIELD_KEYS.serviceType);
  item.platformName = pickKv(kv, KV_FIELD_KEYS.platformName);

  const remarkParts: string[] = [];
  for (const key of KV_REMARK_KEYS) {
    const value = kv.get(key);
    if (value && value !== '--') remarkParts.push(value);
  }
  for (const rawLine of freeLines) {
    if (STANDALONE_DISCARD.has(rawLine)) continue;
    const line = rawLine.replace(TIMESTAMP_PREFIX_RE, '').trim();
    if (!line || STANDALONE_DISCARD.has(line)) continue;
    remarkParts.push(line);
  }
  item.remark = remarkParts.join(' ');

  fillFallbacks(item, block);
  return item;
}

/* ------------------------------------------------------------
 * 六、流式块解析
 * ------------------------------------------------------------ */

function parseFlowBlock(block: string): ParsedOrderItem {
  const item = emptyItem();
  const protectedText = block.replace(/（[^）]*）|\([^)]*\)/g, (s) =>
    s.replace(/\s/g, '\u0001').replace(/[，,。；;]/g, '\u0002'),
  );
  const tokens = protectedText
    .split(/[\n，,。；;]+|\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.replace(/\u0001/g, ' ').replace(/\u0002/g, '，'));

  const remarkTokens: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (/^[（(]/.test(token)) {
      remarkTokens.push(token);
      continue;
    }
    if (/^\d{1,2}[.、)]?$/.test(token)) continue;
    if (DATE_TOKEN_RE.test(token)) {
      if (i + 1 < tokens.length && TIME_TOKEN_RE.test(tokens[i + 1])) i++;
      continue;
    }
    const tokenPhone = extractPhone(token);
    if (tokenPhone) {
      if (!item.phone) {
        item.phone = tokenPhone;
        if (token === tokenPhone && i > 0) {
          const prev = tokens[i - 1];
          if (/^[\u4e00-\u9fa5]{2,20}$/.test(prev) && !STRONG_ADDRESS_HINTS.test(prev) && !NAME_EXCLUDE_RE.test(prev)) {
            item.customerName = prev;
            const ri = remarkTokens.indexOf(prev);
            if (ri >= 0) remarkTokens.splice(ri, 1);
          }
        }
      } else {
        remarkTokens.push(token);
      }
      continue;
    }
    if (VIN_FULL_RE.test(token)) {
      if (!item.vin) item.vin = token;
      continue;
    }
    if (/服务|套包|套餐/.test(token)) {
      if (token.length > item.serviceType.length) item.serviceType = token;
      continue;
    }
    const powerToken = token.match(/^(\d+(?:\.\d+)?)\s*(?:kw|千瓦)$/i);
    if (powerToken) {
      if (!item.powerKw) item.powerKw = powerToken[1];
      continue;
    }
    if (token.length >= 6 && !/[（(]/.test(token) && ADDRESS_HINTS.test(token)) {
      if (token.length > item.address.length) item.address = token;
      continue;
    }
    if (/^\d{9,20}$/.test(token) || (/^[A-Za-z0-9]{10,30}$/.test(token) && /[A-Za-z]/.test(token))) {
      if (!item.orderNo) item.orderNo = token;
      else remarkTokens.push(token);
      continue;
    }
    remarkTokens.push(token);
  }

  if (!item.customerName) {
    const idx = remarkTokens.findIndex(
      (t) => /^[\u4e00-\u9fa5]{2,4}$/.test(t) && !NAME_EXCLUDE_RE.test(t) && extractBrandName(t) === '',
    );
    if (idx >= 0) {
      item.customerName = remarkTokens[idx];
      remarkTokens.splice(idx, 1);
    }
  }

  item.remark = remarkTokens.join(' ');
  fillFallbacks(item, block);
  return item;
}

/* ------------------------------------------------------------
 * 七、对外入口
 * ------------------------------------------------------------ */

function parseBlock(block: string): ParsedOrderItem {
  const kvLineCount = block.split('\n').filter((l) => KEY_VALUE_RE.test(l.trim())).length;
  return kvLineCount >= 2 ? parseKeyValueBlock(block) : parseFlowBlock(block);
}

function hasAnyField(item: ParsedOrderItem): boolean {
  return Boolean(item.phone || item.orderNo || item.address || item.customerName);
}

export function parseOrderTextDetailed(rawText: string): ParseTextResult {
  const blocks = splitOrderBlocks(rawText);
  const items: ParsedOrderItem[] = [];
  let blockCount = 0;
  for (const block of blocks) {
    if (isOrderLikeBlock(block)) blockCount += 1;
    try {
      const item = parseBlock(block);
      if (hasAnyField(item)) {
        item.rawText = block;
        items.push(item);
      }
    } catch {
      // 单条失败不影响整体
    }
  }
  return { items, blockCount };
}

export function parseOrderText(rawText: string): ParsedOrderItem[] {
  return parseOrderTextDetailed(rawText).items;
}

/* ------------------------------------------------------------
 * 八、解析结果 → Order 转换（新系统适配）
 * ------------------------------------------------------------ */

export function parsedItemsToOrders(items: ParsedOrderItem[]): Order[] {
  return items.map((item) => ({
    id: String(Date.now() + Math.random()),
    customerName: item.customerName || '未识别',
    phone: item.phone || '未识别',
    address: item.address || '未识别',
    platform: item.platformName || '其他',
    status: '待办' as const,
    region: '其他',
    appointmentDate: '',
    appointmentTime: '',
    materialCost: 0,
    laborCost: 0,
    platformFee: 0,
    actualProfit: 0,
    notes: [
      item.orderNo ? `单号:${item.orderNo}` : '',
      item.serviceType ? `服务:${item.serviceType}` : '',
      item.packageMeters ? `米数:${item.packageMeters}m` : '',
      item.powerKw ? `功率:${item.powerKw}kW` : '',
      item.vin ? `VIN:${item.vin}` : '',
      item.brandName ? `品牌:${item.brandName}` : '',
      item.remark,
    ].filter(Boolean).join(' | '),
    meterStatus: '未安装',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  } as Order));
}

/* ------------------------------------------------------------
 * 九、去重辅助
 * ------------------------------------------------------------ */

export function filterNewParsedItems(
  items: ParsedOrderItem[],
  existingOrders: Order[],
): { fresh: ParsedOrderItem[]; duplicated: number } {
  const existingNamePhone = new Set(
    existingOrders.map((o) => `${(o as any).customerName}|${(o as any).phone}`),
  );
  const seenNamePhone = new Set<string>();
  const fresh: ParsedOrderItem[] = [];
  let duplicated = 0;

  for (const item of items) {
    const key = `${item.customerName}|${item.phone}`;
    if (existingNamePhone.has(key) || seenNamePhone.has(key)) {
      duplicated += 1;
      continue;
    }
    seenNamePhone.add(key);
    fresh.push(item);
  }
  return { fresh, duplicated };
}
