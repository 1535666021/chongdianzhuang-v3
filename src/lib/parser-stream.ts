/* ============================================================
 * 流式表格行解析器（自 parser-engines.ts 拆出）
 * 挚达/万帮吉利等表格单：D/HW订单号 + 制表符/多空格/单空格分隔 + 行内键值子字段
 * P0-089 新增 / P0-090 地址备注归位加固 / P0-090-R2 锚点切分+单号保护+姓名清洗
 * ============================================================ */

import type { ParsedOrderItem } from './parser-core';
import {
  PHONE_RE, VIN_SEARCH_RE, VIN_FULL_RE, TIME_TOKEN_RE,
  NAME_EXCLUDE_RE, emptyItem, extractPhone, extractBrandName, fillFallbacks,
} from './parser-core';

const STREAM_HEAD_ORDER_RE = /^(?:D|HW)[A-Za-z0-9]{10,}/;
const STREAM_TOKEN_SPLIT_RE = /\t+| {2,}|　+/;
const STREAM_CAR_MODEL_RE = /^[一-龥]{2,3}\d{1,2}$/;
const STREAM_DATETIME_TOKEN_RE = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}(?:[ T]\d{1,2}:\d{2}(?::\d{2})?)?/;
const STREAM_PILE_NAME_RE = /桩产品名称[:：]\s*([^\s:：]+)/;
const STREAM_PILE_POWER_RE = /桩产品功率[:：]\s*(\d+(?:\.\d+)?)/;
const STREAM_PACKAGE_RE = /套包信息[:：]\s*(\d+)\s*米/;
const STREAM_PLATFORM_RE = /(西安领充|领充|挚达|万帮|京东|天猫|拼多多|抖音|淘宝|苏宁|苏宁易购|均胜|妍伟|空灵|美团|苹果)/;
export const STREAM_PILE_ANY_KV_RE = /桩产品名称[:：]|桩产品功率[:：]|套包信息[:：]/;
const STREAM_REMARK_HINT_RE = /已安装|漏保|彩打/;
/* 平台词终止信号：必须以平台词开头且紧跟品牌词边界或括号/结尾，
 * 防止"京东苑小区"这类地址被"包含匹配"误截 */
const STREAM_PLATFORM_LEAD_RE = /^(?:挚达|万帮|京东|天猫|拼多多|抖音|淘宝)[一-龥]{0,4}(?:[（(]|$)/;
/* R2-B 单号保护：D/HW 开头的字母数字串是订单号，不得入 VIN */
const ORDER_NO_PREFIX_RE = /^(?:D|HW)/;

/** R2-A 锚点计数：VIN / 桩产品键值组 / 平台词 各计1个锚点 */
function countStreamAnchors(block: string): number {
  let n = 0;
  if ((block.match(VIN_SEARCH_RE) ?? []).some((v) => !ORDER_NO_PREFIX_RE.test(v))) n++;
  if (STREAM_PILE_ANY_KV_RE.test(block)) n++;
  if (/(?:挚达|万帮|京东|天猫|拼多多|抖音|淘宝)/.test(block)) n++;
  return n;
}

export function isStreamTableRow(block: string): boolean {
  const head = block.trimStart();
  if (!STREAM_HEAD_ORDER_RE.test(head)) return false;
  if (extractPhone(block) === '') return false;
  // 明确分隔符（tab/2+空格/全角空格）+ 桩产品键值：直接命中
  if ((block.includes('\t') || / {2,}/.test(block) || block.includes('　')) && STREAM_PILE_ANY_KV_RE.test(block)) return true;
  // R2-A 锚点门槛：微信复制退化为单空格时，锚点≥2 同样命中 stream 路径
  return countStreamAnchors(block) >= 2;
}

/**
 * A2 兜底加固：地址候选行若疑似未命中的流式表格行（含桩产品键值），
 * 先剥离非地址子段再入地址，剥离部分并入备注。
 * 仅对含桩产品键值的行启用，普通微信流式地址行原样返回，零误伤。
 */
export function sanitizeStreamLikeAddress(line: string, remarks: string[]): string {
  if (!line || !STREAM_PILE_ANY_KV_RE.test(line)) return line;
  let text = line;
  const kvStart = text.search(STREAM_PILE_ANY_KV_RE);
  const kvSeg = text.slice(kvStart);
  const pkgEnd = kvSeg.match(/套包信息[:：][\s\S]*?套包/);
  const kvEnd = pkgEnd ? kvStart + (pkgEnd.index ?? 0) + pkgEnd[0].length : text.length;
  remarks.push(text.slice(kvStart, kvEnd).trim());
  text = `${text.slice(0, kvStart)} ${text.slice(kvEnd)}`;
  text = text.replace(VIN_SEARCH_RE, ' ');
  text = text.replace(/\d{4}[-/]\d{1,2}[-/]\d{1,2}([ T]\d{1,2}:\d{2}(:\d{2})?)?/g, ' ');
  const pm = text.match(PHONE_RE);
  if (pm && pm.index !== undefined) text = text.slice(pm.index + pm[0].length);
  const addr: string[] = [];
  const extras: string[] = [];
  let open = true;
  for (const t of text.split(/\s+/).filter(Boolean)) {
    if (open && STREAM_CAR_MODEL_RE.test(t)) { open = false; continue; }
    if (open && addr.length > 0 && (STREAM_REMARK_HINT_RE.test(t) || STREAM_PLATFORM_LEAD_RE.test(t))) open = false;
    (open ? addr : extras).push(t);
  }
  remarks.push(...extras);
  return addr.join(' ').trim();
}

/** R2-D 姓名清洗：乱码token跳过；剥离尾部粘连车型词（如 荣光v/星耀8） */
function cleanNameToken(token: string): string {
  if (!/^[一-龥]/.test(token)) return '';
  if (NAME_EXCLUDE_RE.test(token)) return '';
  const m = token.match(/^([一-龥]{2,4}?)([一-龥]{1,2}[A-Za-z0-9]{1,2})$/);
  const name = m ? m[1] : token;
  return /^[一-龥]{2,4}$/.test(name) && !NAME_EXCLUDE_RE.test(name) ? name : '';
}

/** 品牌提取：桩产品名称值优先走品牌词表精修，无匹配再取 "-" 前缀 */
function brandFromPileName(raw: string): string {
  return extractBrandName(raw) || raw.split('-')[0].trim();
}

export function parseStreamTableRow(block: string): ParsedOrderItem {
  const item = emptyItem();
  let tokens = block.trim().split(STREAM_TOKEN_SPLIT_RE).map((t) => t.trim()).filter(Boolean);
  // 单空格降级：切分后token过少且首token内仍含手机号/桩产品键值，
  // 说明真实分隔符退化为单空格，按单空格再切（地址完整性靠终止信号保证）
  if (tokens.length > 0 && tokens.length < 6 && (PHONE_RE.test(tokens[0]) || STREAM_PILE_ANY_KV_RE.test(tokens[0]))) {
    tokens = tokens.flatMap((t) => t.split(/\s+/)).filter(Boolean);
  }
  const remarks: string[] = [];
  const addressTokens: string[] = [];
  let phoneIndex = -1;
  let addressOpen = false;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (i === 0) { item.orderNo = token; continue; }
    if (phoneIndex === -1) {
      if (PHONE_RE.test(token)) {
        item.phone = extractPhone(token);
        phoneIndex = i;
        addressOpen = true;
        // R2-D：姓名取电话前最近的有效中文token，乱码/粘连token经清洗
        for (let j = i - 1; j >= 1; j--) {
          const cand = cleanNameToken(tokens[j]);
          if (cand) { item.customerName = cand; break; }
        }
      }
      continue;
    }
    if (addressOpen) {
      // 误截断防护：平台词类终止信号仅在地址已收集到省/市/区/县锚点后才生效
      const hasRegionAnchor = addressTokens.some((t) => /(省|市|区|县)/.test(t));
      const isStopSignal = STREAM_CAR_MODEL_RE.test(token) || VIN_FULL_RE.test(token)
        || STREAM_PILE_ANY_KV_RE.test(token) || STREAM_DATETIME_TOKEN_RE.test(token)
        || STREAM_REMARK_HINT_RE.test(token)
        || (hasRegionAnchor && STREAM_PLATFORM_LEAD_RE.test(token));
      if (!isStopSignal) { addressTokens.push(token); continue; }
      addressOpen = false;
    }
    if (STREAM_CAR_MODEL_RE.test(token)) continue; // 车型token：终止地址且不入备注
    if (!item.vin && VIN_FULL_RE.test(token) && !ORDER_NO_PREFIX_RE.test(token)) { item.vin = token; continue; }
    const pileName = token.match(STREAM_PILE_NAME_RE);
    if (pileName) {
      if (!item.brandName) item.brandName = brandFromPileName(pileName[1]);
      const power = token.match(STREAM_PILE_POWER_RE);
      if (power && !item.powerKw) item.powerKw = power[1];
      const pkg = token.match(STREAM_PACKAGE_RE);
      if (pkg && !item.packageMeters) item.packageMeters = pkg[1];
      continue;
    }
    const powerOnly = token.match(STREAM_PILE_POWER_RE);
    if (powerOnly) {
      if (!item.powerKw) item.powerKw = powerOnly[1];
      const pkg0 = token.match(STREAM_PACKAGE_RE);
      if (pkg0 && !item.packageMeters) item.packageMeters = pkg0[1];
      continue;
    }
    const pkgOnly = token.match(STREAM_PACKAGE_RE);
    if (pkgOnly) { if (!item.packageMeters) item.packageMeters = pkgOnly[1]; continue; }
    if (STREAM_DATETIME_TOKEN_RE.test(token)) {
      const d = token.match(/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/);
      if (d && !item.appointmentDate) item.appointmentDate = d[0].replace(/\//g, '-');
      continue;
    }
    if (TIME_TOKEN_RE.test(token)) continue; // 裸时间token：日期已取其日期部分，不污染备注
    remarks.push(token.replace(/\s{2,}/g, ' ').trim());
  }
  item.address = addressTokens.join(' ').trim();
  const tail = remarks.join(' ');
  if (!item.brandName && tail.includes('吉利')) item.brandName = '吉利';
  const platformMatch = tail.match(STREAM_PLATFORM_RE);
  if (platformMatch) {
    item.platformName = platformMatch[1];
  } else {
    const fb = (remarks[0] ?? '').match(/^[一-龥]{2}/);
    if (fb) item.platformName = fb[0];
  }
  if (tail.includes('安装')) item.installType = '安装';
  if (remarks.length > 0) item.remark = remarks.join('\n');
  fillFallbacks(item, block);
  return item;
}
